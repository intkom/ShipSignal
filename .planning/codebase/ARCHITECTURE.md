# Architecture

**Analysis Date:** 2026-04-21

## Pattern Overview

**Overall:** Next.js 15 App Router + Supabase BaaS + Zustand client state

**Key Characteristics:**

- Server Components for auth-gated page rendering; Client Components for interactive UI
- All data mutations go through typed REST API routes (`src/app/api/`)
- Zustand stores own all client-side state; they call API routes, never Supabase directly from the browser
- Supabase Row Level Security (RLS) enforces ownership at the DB layer; API routes add a second ownership check via `requireAuth()` + `.eq('user_id', userId)`
- Self-hosted mode is a runtime toggle (`SELF_HOSTED=true`); no separate build or code fork

---

## Layers

**Pages (App Router):**

- Purpose: Render UI and handle initial auth redirects
- Location: `src/app/(dashboard)/`, `src/app/(auth)/`, `src/app/(public)/`
- Contains: Server Components (data fetching, auth check), Client Component imports
- Depends on: Supabase server client, `src/lib/auth.ts`
- Used by: End users via browser

**API Routes:**

- Purpose: All data mutations and reads from client-side code
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts`) — always call `requireAuth()` first, then Supabase, then transform and return JSON
- Depends on: `src/lib/auth.ts`, `src/lib/supabase/server.ts`, `src/lib/utils.ts` transforms
- Used by: Zustand stores (client fetch), cron jobs (internal HTTP), external API key callers

**Zustand Stores:**

- Purpose: Client-side state management; own all API fetch/mutate logic
- Location: `src/lib/*.ts` (campaigns, projects, launchPosts, blogDrafts, analyticsStore, planStore, calendarStore, etc.)
- Contains: `{ items, loading, error, initialized }` state + CRUD actions wrapped in `dedup()`
- Depends on: `fetch('/api/...')`, `src/lib/requestDedup.ts`
- Used by: Client Components across `src/app/(dashboard)/`

**Lib Utilities:**

- Purpose: Shared logic not tied to rendering
- Location: `src/lib/`
- Key files documented in section below

**Publishers:**

- Purpose: Platform-specific post publishing logic
- Location: `src/lib/publishers/` (`index.ts`, `twitter.ts`, `linkedin.ts`, plus media helpers)
- Contains: `publishPost()` orchestrator + per-platform implementations
- Depends on: `src/lib/tokenRefresh.ts`, Supabase client, platform REST APIs
- Used by: `/api/cron/publish/route.ts`, `/api/posts/[id]/publish/route.ts`

---

## Data Flow: Post Creation → Scheduling → Publishing

### Creation

1. User fills form at `/new` (`src/app/(dashboard)/new/page.tsx`)
2. Client Component calls `POST /api/posts` via the posts Zustand store
3. `POST /api/posts` calls `requireAuth()`, enforces plan limits via `enforceResourceLimit()`, inserts into `posts` table with `status = 'draft'`
4. Store updates local state optimistically

### Scheduling

1. User sets a `scheduled_at` datetime and saves — `PATCH /api/posts/[id]` sets `status = 'scheduled'`
2. Post sits in DB with `status = 'scheduled'` and a future `scheduled_at`

### Publishing (SaaS — Free tier)

1. Cron job `GET /api/cron/publish` fires every 5 min (Vercel Cron in SaaS mode)
2. Queries `posts` where `status = 'scheduled'` AND `scheduled_at <= now` AND `scheduled_at >= now - 1h`, excludes Reddit
3. Free-tier posts (no auto-publish): status updated to `'ready'`, push notification + email sent to user
4. User sees "ready" post, manually triggers `POST /api/posts/[id]/publish`
5. `publishPost()` in `src/lib/publishers/index.ts` refreshes token if needed, calls platform API, updates `status = 'published'` or `'failed'` + stores `publish_result` JSONB

### Publishing (SaaS — Pro tier / Self-hosted)

1. Same cron fires every 5 min
2. Posts with `social_account_id` and user on Pro plan (or `SELF_HOSTED=true`): status set to `'publishing'` (optimistic lock), then `publishPost()` called immediately
3. On success: `status = 'published'`, `publish_result` updated, `social_accounts.last_used_at` updated
4. On failure: `status = 'failed'`, `publish_result` stores error + retry count

### Recurrence

- After a recurring post publishes, cron calls `scheduleNextRecurrence()` which inserts a new `posts` row using the `recurrence_rule` (RRULE string) via `src/lib/rrule.ts`

---

## Auth Architecture

### User Auth (Supabase Auth)

- Email/password sign-up: `POST /api/auth/pre-signup-check` validates allowlist → Supabase creates user → `on_auth_user_created` trigger auto-creates `user_profiles` row
- Email/password login: Supabase handles session cookie
- Google OAuth: Supabase OAuth flow → redirects to `/api/auth/callback` (`src/app/(auth)/auth/callback/route.ts`) → exchanges code for session, redirects to `/dashboard`
- Session validation in API routes: `requireAuth()` in `src/lib/auth.ts` calls `supabase.auth.getUser()`
- Dashboard layout guard: `src/app/(dashboard)/layout.tsx` checks `supabase.auth.getSession()`, redirects to `/login` if missing

### API Key Auth

- Keys prefixed `bh_`, stored as HMAC-SHA256 hashes in `api_keys` table
- `requireAuth()` checks `Authorization: Bearer bh_*` header first, falls back to session cookie
- `requireSessionAuth()` (used by sensitive routes like account deletion and key management) explicitly rejects API key auth
- Scopes validated with `validateScopes()` — routes declare required scopes explicitly

### Twitter OAuth (Social Accounts)

- PKCE flow: `GET /api/social-accounts/twitter/auth` generates `code_verifier` + `code_challenge`, stores in HTTP-only cookie
- Redirect: `GET /api/social-accounts/twitter/callback` exchanges code for tokens, stores in `social_accounts` table

### LinkedIn OAuth (Social Accounts)

- Standard authorization_code flow via `GET /api/social-accounts/linkedin/auth` → `GET /api/social-accounts/linkedin/callback`

### Reddit OAuth (Self-Hosted)

- Password grant instead of browser redirect
- `POST /api/social-accounts/reddit/connect` accepts username/password, exchanges for access token
- `refreshRedditViaPasswordGrant()` in `src/lib/tokenRefresh.ts` handles token refresh without user interaction

### E2E Test Mode

- `isTestMode()` in `src/lib/auth.ts` returns `true` only when `E2E_TEST_MODE=true` AND `CI=true` AND `VERCEL !== '1'`
- In test mode, `requireAuth()` returns fixed `TEST_USER_ID = '00000000-0000-0000-0000-000000000001'`
- Dashboard layout detects same condition and skips session check

---

## API Route Pattern

Every route follows this exact structure:

```typescript
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { transformXFromDb } from '@/lib/utils'

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase.from('table_name').select('*').eq('user_id', userId)

    if (error) throw error

    return Response.json({ items: data.map(transformXFromDb) })
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Error status codes used:**

- 401: Unauthorized (from `requireAuth()` throw)
- 403: Forbidden (plan limit, scope check)
- 400: Bad request (validation failure)
- 404: Not found (ownership validation)
- 500: Internal server error

**Ownership validators** in `src/lib/auth.ts`:

- `validateProjectOwnership(projectId, userId)`
- `validateCampaignOwnership(campaignId, userId)`
- `validatePostOwnership(postId, userId)`
- `validateBlogDraftOwnership(draftId, userId)`

---

## Zustand Store Pattern

```typescript
export const useXStore = create<XState & XActions>()((set, get) => ({
  items: [],
  loading: false,
  error: null,
  initialized: false,

  fetchItems: async () => {
    const key = createDedupKey('fetchItems')
    return dedup(key, async () => {
      set({ loading: true, error: null })
      try {
        const res = await fetch('/api/items')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        set({ items: data.items, loading: false, initialized: true })
      } catch (error) {
        set({ error: (error as Error).message, loading: false })
      }
    })
  },
}))
```

**Deduplication:** `dedup()` + `createDedupKey()` from `src/lib/requestDedup.ts` prevent duplicate in-flight requests when multiple components call the same store action simultaneously. Uses an in-memory `Map` of in-flight promises.

**All stores follow this shape:**

- `src/lib/campaigns.ts` → `useCampaignsStore`
- `src/lib/projects.ts` → `useProjectsStore`
- `src/lib/blogDrafts.ts` → `useBlogDraftsStore`
- `src/lib/launchPosts.ts` → `useLaunchPostsStore`
- `src/lib/analyticsStore.ts` → `useAnalyticsStore`
- `src/lib/planStore.ts` → `usePlanStore`
- `src/lib/calendarStore.ts` → `useCalendarStore`
- `src/lib/communityEvents.ts` → community events store
- `src/lib/reminders.ts` → reminders store
- `src/lib/githubProjects.ts` → GitHub projects store

---

## Self-Hosted vs SaaS Mode

The single function `isSelfHosted()` in `src/lib/selfHosted.ts` gates all behavioral differences:

```typescript
export function isSelfHosted(): boolean {
  return process.env.SELF_HOSTED === 'true'
}
```

| Concern                  | SaaS                                   | Self-Hosted                                              |
| ------------------------ | -------------------------------------- | -------------------------------------------------------- |
| Plan type                | `free` or `pro` from DB                | `selfHosted` (hardcoded, `getUserPlan()` skips DB query) |
| Resource limits          | Enforced (50/500 posts, etc.)          | All `Number.MAX_SAFE_INTEGER`                            |
| DB-level quota triggers  | Active                                 | Bypassed (plan = `'selfHosted'` short-circuits)          |
| Auto-publish             | Pro only, no Reddit                    | All platforms including Reddit                           |
| Reddit auth              | OAuth (browser redirect)               | Script auth / password grant — no browser redirect       |
| Cron execution           | Vercel Cron (external HTTP)            | `node-cron` in-process via `src/instrumentation.ts`      |
| Token refresh for Reddit | Skips accounts without `refresh_token` | `refreshRedditViaPasswordGrant()` fallback               |

**Plan enforcement flow:**

1. App-level fast fail: `enforceResourceLimit()` in `src/lib/planEnforcement.ts`
2. DB-level true boundary: BEFORE INSERT trigger `enforce_resource_limit()` raises `check_violation` (SQLSTATE 23514)
3. `isPlanLimitError()` detects DB-level rejections for user-friendly error messages

---

## Cron / Scheduler Architecture

### SaaS Mode (Vercel Cron)

Cron jobs are HTTP endpoints called by Vercel Cron on schedule. All secured by `verifyCronSecret()` in `src/lib/cronAuth.ts` (timing-safe HMAC comparison against `CRON_SECRET` env var).

| Endpoint                        | Schedule    | Purpose                                                 |
| ------------------------------- | ----------- | ------------------------------------------------------- |
| `GET /api/cron/publish`         | Every 5 min | Find due posts, auto-publish (Pro) or mark ready (Free) |
| `GET /api/cron/refresh-tokens`  | Every 5 min | Rotate expiring OAuth tokens for Twitter/LinkedIn       |
| `GET /api/cron/retry-failed`    | Periodic    | Retry failed posts with `retryable: true`               |
| `GET /api/cron/cleanup-media`   | Periodic    | Remove orphaned media from storage                      |
| `GET /api/cron/calendar-nudges` | Periodic    | Send reminders for calendar events                      |

### Self-Hosted Mode (node-cron)

`src/instrumentation.ts` (Next.js instrumentation hook) runs on server startup:

```typescript
if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SELF_HOSTED === 'true') {
  const { startScheduler } = await import('./lib/scheduler')
  startScheduler()
}
```

`src/lib/scheduler.ts` starts two `node-cron` jobs at `*/5 * * * *`, each making a local HTTP fetch to `/api/cron/publish` and `/api/cron/refresh-tokens` with `Authorization: Bearer {CRON_SECRET}`. Requires `CRON_SECRET` to be set.

---

## Error Handling

**Strategy:** Try/catch in every route handler. Errors surface as typed JSON responses.

**Patterns:**

- `requireAuth()` throws `'Unauthorized'` string — routes catch and return 401
- `validateXOwnership()` throws specific strings (`'Post not found'`) — routes catch and return 404
- `enforceResourceLimit()` returns `{ allowed: false }` — routes return 403 without throwing
- DB plan limit errors detected by `isPlanLimitError()` checking `error.code === '23514'`
- `parseJsonBody()` in `src/lib/auth.ts` wraps `request.json()` to return 400 on malformed JSON

---

## Cross-Cutting Concerns

**Error monitoring:** Sentry via `@sentry/nextjs`. Initialized in `src/instrumentation.ts` (server) and `sentry.client.config.ts` (browser). `onRequestError` hook scrubs sensitive headers before sending to Sentry.

**Rate limiting:** Upstash Redis (`src/lib/rateLimit.ts`) — 10 req/10sec per IP. Optional; disabled with warning if not configured.

**Analytics:** PostHog (`src/lib/posthog.tsx`) — event tracking client-side.

**Data transforms:** All Supabase responses are snake_case; frontend uses camelCase. Transform functions in `src/lib/utils.ts`:

- `transformPostFromDb()` / `transformPostToDb()`
- `transformCampaignFromDb()`
- `transformProjectFromDb()` / `transformProjectToDb()`
- `transformAnalyticsConnectionFromDb()` / `transformAnalyticsConnectionToDb()`
- Generic: `snakeToCamel()` / `camelToSnake()`

**Notifications:** Push (web: `src/lib/webPushSender.ts`, iOS APNS: `src/lib/apnsSender.ts`) + email (`src/lib/emailSender.ts`) sent from cron after post status transitions.

---

_Architecture analysis: 2026-04-21_
