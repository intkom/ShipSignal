# Codebase Concerns

**Analysis Date:** 2026-04-21

---

## Tech Debt

**Newsletter post uses LinkedIn as platform type:**

- Issue: `generate-posts` route creates a "newsletter" post but stores it with `platform: 'linkedin'`. There is no `newsletter` platform type; the post will appear as a regular LinkedIn post with no visual distinction from the actual LinkedIn post generated in the same batch.
- Files: `src/app/api/generate-posts/route.ts` (lines 119-126)
- Impact: Users receive two apparently identical LinkedIn drafts with no clear labeling beyond a notes string. The newsletter summary content is never exposed as a first-class object.
- Fix approach: Add a `newsletter` platform type or store the newsletter content as a blog draft, not a LinkedIn post.

**Post `content` field is untyped at the API boundary:**

- Issue: All create/update/import routes accept `content` as `z.record(z.string(), z.unknown())` — any JSON object passes validation. Platform-specific content shape (e.g., tweet character limit, LinkedIn `visibility`) is not enforced server-side.
- Files: `src/app/api/posts/route.ts` (line 12), `src/app/api/posts/[id]/route.ts` (line 11), `src/app/api/import/route.ts` (line 10)
- Impact: Malformed content that cannot be published can be stored and only fails at publish time, causing confusing errors.
- Fix approach: Add platform-specific Zod discriminated unions for content validation at the API layer.

**Reddit posts handled via per-field exclusions instead of a platform gate:**

- Issue: Reddit posts are excluded by hardcoded `.neq('platform', 'reddit')` filters scattered across API routes and checked via string comparison in individual handlers, rather than a single authoritative platform allowlist.
- Files: `src/app/api/posts/route.ts` (line 61), `src/app/api/posts/[id]/route.ts` (lines 74, 136), `src/app/api/cron/publish/route.ts` (line 192), `src/app/api/social-accounts/route.ts` (line 31)
- Impact: Adding a new route that omits the filter accidentally exposes Reddit posts through the standard API. Already happened once with the social-accounts listing.
- Fix approach: Centralise platform allowlist in `src/lib/posts.ts` and validate at the route level using a shared guard function.

**`github_projects` migration applied without RLS (needed a hotfix):**

- Issue: `supabase/migrations/20260420120000_github_projects.sql` created the table with RLS, but the table was pre-created manually in production so the migration's RLS block never ran. A follow-up `20260420005733_github_projects_rls_fix.sql` re-applied it with idempotent guards.
- Files: `supabase/migrations/20260420120000_github_projects.sql`, `supabase/migrations/20260420005733_github_projects_rls_fix.sql`
- Impact: The pattern of manually pre-creating tables before running migrations is fragile — any future table could be silently missing RLS in production until discovered.
- Fix approach: Never pre-create tables outside of migrations; enforce this in the contributing guide.

**Debug logging leaks at module-init time in `aiTransformer.ts`:**

- Issue: `src/lib/aiTransformer.ts` logs `ANTHROPIC_API_KEY present: true | first 4 chars: sk-a` to stdout at module load time (not at request time). This appears in server logs on every cold start.
- Files: `src/lib/aiTransformer.ts` (lines 3-7)
- Impact: Partial API key prefix is emitted to server/Vercel logs on every cold start. Low-severity information disclosure.
- Fix approach: Remove or gate behind `NODE_ENV !== 'production'`.

**Publish cron processes only 8 posts per run:**

- Issue: `src/app/api/cron/publish/route.ts` fetches at most 8 scheduled posts per 5-minute cron invocation (`.limit(8)`). With many users, posts can queue up and not be published in time.
- Files: `src/app/api/cron/publish/route.ts` (line 196)
- Impact: Under load, scheduled posts may be delayed or missed if more than 8 fall due in a 5-minute window.
- Fix approach: Increase limit or add pagination with continuation tokens; add an observability metric for queue depth.

**Retry-failed cron retries all `failed` posts regardless of user plan:**

- Issue: `src/app/api/cron/retry-failed/route.ts` retries failed posts for all users, including free-tier users who cannot auto-publish. This re-attempts platform API calls for users who will fail again because they have no linked social account at the time of retry.
- Files: `src/app/api/cron/retry-failed/route.ts`
- Impact: Wastes cron budget; failed posts for free users keep retrying until exhausted.
- Fix approach: Check `social_account_id` and/or user plan before retrying.

---

## Security Concerns

**Rate limiting is opt-in and covers only 3 of 73 API routes:**

- Risk: The `rateLimit()` helper exists in `src/lib/rateLimit.ts` but is applied to only `src/app/api/auth/pre-signup-check/route.ts`, `src/app/api/export/route.ts`, and `src/app/api/import/route.ts`. All other routes (including AI generation, GitHub sync, social account OAuth callbacks) are unprotected from abuse.
- Files: `src/lib/rateLimit.ts`, all route files listed above
- Current mitigation: Supabase anon key limits apply at the DB layer; Vercel may impose its own DDoS protection.
- Recommendations: Apply `rateLimit(userId)` to at minimum the AI generate-posts route and all OAuth callback routes to prevent cost abuse.

**AI generation route has no rate limit — direct Anthropic cost exposure:**

- Risk: Any authenticated user can call `POST /api/generate-posts` repeatedly, triggering Anthropic API calls with no per-user throttling.
- Files: `src/app/api/generate-posts/route.ts`
- Current mitigation: None beyond Anthropic account-level limits.
- Recommendations: Add `rateLimit()` per user or per project; add a daily/monthly quota check against user plan.

**GitHub sync route has no rate limit — unauthenticated GitHub API calls:**

- Risk: `POST /api/github-projects/[id]/sync` fetches from `api.github.com` with no auth token and no per-user rate limit. GitHub unauthenticated API allows only 60 requests/hour per IP — a busy Vercel function shares one IP pool.
- Files: `src/app/api/github-projects/[id]/sync/route.ts`, `src/lib/githubImporter.ts`
- Current mitigation: None.
- Recommendations: Configure `GITHUB_TOKEN` as an optional env var and pass it as an `Authorization` header; add per-user rate limiting.

**OAuth tokens stored in plain text in `social_accounts` table:**

- Risk: The comment in `supabase/migrations/20260226141429_social_accounts.sql` says "encrypted at rest by Supabase", but this refers to Supabase's disk-level encryption — not column-level encryption. Access tokens and refresh tokens are readable by any query using the service role key.
- Files: `supabase/migrations/20260226141429_social_accounts.sql`
- Current mitigation: Supabase disk encryption; RLS restricts user-facing access; service role is server-only.
- Recommendations: Document the encryption boundary clearly; consider application-level encryption for token columns if compliance is required.

**`CRON_SECRET` is marked optional in env validation:**

- Risk: `src/lib/envValidation.ts` lists `CRON_SECRET` as `required: false`. Without it, `verifyCronSecret()` in `src/lib/cronAuth.ts` returns a 500 (misconfigured) rather than silently passing, but the warning is easy to miss in logs. Self-hosted deployments may omit it.
- Files: `src/lib/envValidation.ts`, `src/lib/cronAuth.ts`
- Current mitigation: `verifyCronSecret` blocks all cron calls if `CRON_SECRET` is absent.
- Recommendations: Upgrade `CRON_SECRET` to required in `envValidation.ts` for self-hosted mode; add startup assertion.

**`API_KEY_HMAC_SECRET` falls back to plain SHA-256:**

- Risk: If `API_KEY_HMAC_SECRET` is not configured, `hashApiKey()` falls back to plain SHA-256. A database breach would expose reversible (rainbow-table) API key hashes.
- Files: `src/lib/auth.ts` (lines 93-100)
- Current mitigation: Code comment documents the fallback; dual-read migration path exists.
- Recommendations: Mark `API_KEY_HMAC_SECRET` as required in env validation; log a startup error if missing in production.

---

## Performance Concerns

**Publish cron N+1 plan lookups:**

- Problem: `src/app/api/cron/publish/route.ts` loops over unique user IDs and calls `getUserPlan(uid)` sequentially (lines where `userPlans` is built), which issues one DB query per user.
- Files: `src/app/api/cron/publish/route.ts`
- Cause: Sequential `for...of` loop over `uniqueUserIds` with an `await` inside.
- Improvement path: Batch-fetch `user_profiles` for all affected users in one query, then build the plan map in memory.

**`enforceResourceLimit` issues two queries per check:**

- Problem: `enforceResourceLimit()` in `src/lib/planEnforcement.ts` calls `getUserPlan()` (one query) then `COUNT(*)` on the target table (second query). Every create endpoint calls this before inserting, so three queries run for each resource creation (plan + count + insert).
- Files: `src/lib/planEnforcement.ts`
- Cause: No plan caching within a request; no combined query.
- Improvement path: The DB-level `enforce_resource_limit()` trigger is the true enforcement boundary — the app-level check exists for better error messages. Consider accepting the small risk of stale plan reads in exchange for removing the pre-check, or cache the plan in the request context.

**Dashboard page loads data from multiple independent stores:**

- Problem: `src/app/(dashboard)/dashboard/page.tsx` (516 lines) calls `fetchPosts`, `fetchCampaigns`, and `fetchProjects` on mount — three separate API round-trips at page load.
- Files: `src/app/(dashboard)/dashboard/page.tsx`
- Cause: Zustand stores are initialised independently; no aggregated dashboard endpoint exists.
- Improvement path: Add a `/api/dashboard` endpoint that batches the three queries server-side.

**Memory rate-limiter state is not shared across serverless instances:**

- Problem: `src/lib/rateLimit.ts` uses an in-memory `Map` as fallback when Upstash is absent. In Vercel's serverless model, each function instance has its own map, so the effective rate limit per user scales up with the number of instances.
- Files: `src/lib/rateLimit.ts`
- Cause: Serverless statelessness; in-memory fallback is documented as best-effort.
- Improvement path: Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production; the fallback should only be used in local dev.

---

## Scalability Concerns

**Cron jobs process fixed small batches without pagination:**

- Issue: All cron routes use hard-coded `LIMIT` clauses (8 for publish, 20 for retry-failed, 100 for cleanup-media, 100 for refresh-tokens). No cursor-based pagination or fan-out exists. At scale, the backlog grows unboundedly.
- Files: `src/app/api/cron/publish/route.ts`, `src/app/api/cron/retry-failed/route.ts`, `src/app/api/cron/cleanup-media/route.ts`, `src/app/api/cron/refresh-tokens/route.ts`
- Scaling path: Introduce a queue (e.g., Upstash QStash) or cursor-based pagination with multiple cron triggers.

**All social publishing is synchronous within the cron HTTP request:**

- Issue: The publish cron uses `Promise.allSettled()` over all candidates, but this runs within the same HTTP request that must complete before the cron timeout. A large batch or slow platform API (e.g., LinkedIn) risks timeout.
- Files: `src/app/api/cron/publish/route.ts`
- Scaling path: Offload publishing to a background queue; use Vercel's background functions or Upstash QStash.

**Plan limit checks are eventually consistent:**

- Issue: The app-level `enforceResourceLimit()` check and the DB-level trigger both run independently. Under high concurrency, two simultaneous requests can pass the app-level check before either triggers the DB constraint — the DB trigger then catches the second insert, but the error surfaces as a raw `check_violation` rather than a clean plan-limit response.
- Files: `src/lib/planEnforcement.ts`, `supabase/migrations/20260315002716_atomic_quota_enforcement.sql`
- Scaling path: The DB trigger is the correct enforcement point; ensure the API layer correctly maps `SQLSTATE 23514` to a user-friendly 403 everywhere it can appear. Currently `isPlanLimitError()` exists but is not applied in all create paths.

---

## Missing Features / Gaps

**Reddit auto-publishing not available in SaaS mode:**

- Problem: Reddit posts are excluded from the publish cron and the standard posts list API in SaaS mode. Users who connect a Reddit account in SaaS mode cannot auto-publish; the feature is only available in self-hosted mode.
- Blocks: Any SaaS user expecting Reddit scheduling to work end-to-end.

**No per-user AI generation quota:**

- Problem: There is no daily or monthly cap on how many times a user can call `/api/generate-posts`. The Anthropic SDK is initialized at module load with the server's API key.
- Files: `src/app/api/generate-posts/route.ts`, `src/lib/aiTransformer.ts`

**GitHub Importer is public-repos only, no way to connect private repos:**

- Problem: `src/lib/githubImporter.ts` explicitly uses unauthenticated GitHub API calls. Private repositories silently return no activity.
- Files: `src/lib/githubImporter.ts`

**Dark theme has a known rendering bug in production:**

- Problem: CLAUDE.md "Known Issues" notes: "Dark theme: May not render correctly in production."
- Files: `src/lib/theme.tsx`

**`health/schema` endpoint requires manual `TABLES` constant maintenance:**

- Problem: `src/app/api/health/schema/route.ts` contains a hardcoded `TABLES` array that must be kept in sync with migrations manually. The comment states "KEEP IN SYNC". Missing a table means schema drift goes undetected.
- Files: `src/app/api/health/schema/route.ts`

---

## Fragile Areas

**`edit/[id]/page.tsx` has 9 suppressed `react-hooks/exhaustive-deps` warnings:**

- Files: `src/app/(dashboard)/edit/[id]/page.tsx`
- Why fragile: Suppressed exhaustive-deps rules mean effects may capture stale closures over `platformAccounts`, `state.post.socialAccountId`, and `state.existingPost?.id`. A future refactor of those values risks introducing subtle race conditions.
- Safe modification: Any change to the hooks consumed by the editor must audit all suppressed `useEffect` calls for stale closure bugs.
- Test coverage: E2E covered by `e2e/create-post.spec.ts` and `e2e/scheduling.spec.ts`; no unit tests for the editor page itself.

**`campaigns/[id]/page.tsx` suppresses `react-hooks/set-state-in-effect`:**

- Files: `src/app/(dashboard)/campaigns/[id]/page.tsx` (line 77)
- Why fragile: Setting state inside effects without the exhaustive-deps lint rule can cause infinite re-render loops if dependencies change.

**Self-hosted trigger bypass depends on plan column sync timing:**

- Files: `src/lib/planEnforcement.ts` (`getUserPlan`), `supabase/migrations/20260417195438_self_hosted_trigger_bypass.sql`
- Why fragile: `getUserPlan()` issues an UPDATE to set `plan = 'selfHosted'` on first call, but between the HTTP response and the DB write there is a window where the DB trigger still applies free-tier limits. A race condition under concurrent inserts on a freshly configured self-hosted instance could cause unexpected `check_violation` errors.
- Safe modification: When modifying self-hosted plan logic, ensure the plan column is pre-populated at user-creation time, not lazily on first request.

**`verifyCronSecret` length check before `timingSafeEqual`:**

- Files: `src/lib/cronAuth.ts`
- Why fragile: The early `authHeader.length !== expected.length` check is a fast-fail that leaks length information. While this is standard practice and unlikely to be exploitable, it diverges from a pure timing-safe implementation. Any change to the header format must keep this check consistent.

---

## Test Coverage Gaps

**31 of 73 API routes have no unit test file:**

- What's not tested: All analytics routes (`/api/analytics/**`), community events routes, GitHub sync route, AI generate-posts route, media routes (`/api/media/**`), push subscription routes, calendar route, and several others.
- Files: `src/app/api/analytics/`, `src/app/api/generate-posts/route.ts`, `src/app/api/github-projects/[id]/sync/route.ts`, `src/app/api/community-events/`, `src/app/api/media/`, `src/app/api/push-subscriptions/`, `src/app/api/calendar/`
- Risk: Regressions in OAuth callback logic, AI generation failures, and media upload edge cases go undetected until E2E or production.
- Priority: High for `generate-posts` (cost risk), medium for analytics and community events.

**AI transformer has no unit tests:**

- What's not tested: `generatePostsFromActivity()`, prompt construction, JSON parsing fallback, and error handling.
- Files: `src/lib/aiTransformer.ts`
- Risk: Malformed Anthropic responses (e.g., model wraps JSON in markdown fences) can silently break with no regression signal.
- Priority: High.

**GitHub importer has no unit tests:**

- What's not tested: `fetchGithubActivity()`, fallback chain (release → PRs → commits), and URL parsing.
- Files: `src/lib/githubImporter.ts`
- Risk: GitHub API shape changes or edge cases (empty repos, no merged PRs) break silently.
- Priority: Medium.

**Cron calendar-nudges route has no unit test:**

- What's not tested: Recurrence rule evaluation, draft post creation timing, notification dispatch.
- Files: `src/app/api/cron/calendar-nudges/route.ts`
- Risk: Silent breakage of the community calendar nudge feature.
- Priority: Low.

---

## Dependencies at Risk

**`zustand` at `^4.4.7` while 5.x is released:**

- Risk: Zustand 5 introduces breaking changes to the store API (no more `immer` default, changed `createStore` signature). Staying on v4 means accumulating a larger future migration.
- Impact: All 6 Zustand stores in `src/lib/` would need updates.
- Migration plan: Migrate stores to Zustand 5 using the official codemods; low urgency but worth scheduling.

**`date-fns` pinned to `^3.2.0`:**

- Risk: `date-fns` v3.x has been in stable release for over a year. No urgent risk, but the minor version cap means security fixes in 3.x are automatically included.
- Impact: Low; no known vulnerabilities.

**`rrule ^2.8.1` — last major release in 2022:**

- Risk: `rrule` is used for recurring post scheduling (`src/lib/rrule.ts`). The package is lightly maintained and has open issues around DST handling and edge-case RRULE strings.
- Impact: Incorrect next-occurrence calculations for recurring posts near DST transitions.
- Migration plan: Add test cases for DST boundaries; consider `temporal-polyfill`-based replacement in future.

**`web-push ^3.6.7` — unmaintained upstream:**

- Risk: The `web-push` npm package has had minimal maintenance activity since 2023. VAPID key generation and push dispatch are critical for push notifications.
- Impact: Push notifications (`sendPushToUser` in `src/lib/webPushSender.ts`) silently break if VAPID endpoints change.
- Migration plan: Monitor for alternatives; consider migrating to Vercel's native push or a managed provider.

---

_Concerns audit: 2026-04-21_
