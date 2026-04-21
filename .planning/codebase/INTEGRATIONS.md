# External Integrations

**Analysis Date:** 2026-04-21

## APIs & External Services

**Social Platforms:**

- Twitter/X — Post scheduling + OAuth 2.0 with PKCE
  - SDK/Client: native `fetch` calls to `https://api.x.com/2/`
  - OAuth authorize: `https://x.com/i/oauth2/authorize`
  - Token refresh: `https://api.x.com/2/oauth2/token`
  - Auth routes: `src/app/api/social-accounts/twitter/auth/route.ts`, `src/app/api/social-accounts/twitter/callback/route.ts`
  - Scopes: `tweet.read tweet.write users.read media.write offline.access`
  - Env vars: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`

- LinkedIn — Post scheduling + OAuth 2.0
  - SDK/Client: native `fetch` calls to `https://api.linkedin.com/`
  - OAuth authorize: `https://www.linkedin.com/oauth/v2/authorization`
  - Token refresh: `https://www.linkedin.com/oauth/v2/accessToken`
  - Auth routes: `src/app/api/social-accounts/linkedin/auth/route.ts`, `src/app/api/social-accounts/linkedin/callback/route.ts`
  - Scopes: `openid profile email w_member_social`
  - Env vars: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

- Reddit — Post scheduling
  - SaaS mode: OAuth (authorization_code grant)
  - Self-hosted mode: Script auth (password grant, no browser redirect)
  - Env vars: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME` (self-hosted), `REDDIT_PASSWORD` (self-hosted), `REDDIT_USER_AGENT` (self-hosted)
  - Note: Reddit is excluded from the auto-publish cron in SaaS mode (hardcoded `.neq('platform', 'reddit')` filter in `src/app/api/cron/publish/route.ts`)

**AI:**

- Anthropic Claude — Content generation and social post transformation
  - SDK: `@anthropic-ai/sdk` 0.90.0
  - Implementation: `src/lib/aiTransformer.ts`
  - Env var: `ANTHROPIC_API_KEY`

**Analytics:**

- PostHog — Product analytics and event tracking
  - SDK: `posthog-js` 1.360.2
  - Implementation: `src/lib/posthog.tsx`, `src/app/(dashboard)/components/PostHogIdentify.tsx`
  - Configured at: `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`
  - Env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://us.i.posthog.com`)

- Vercel Analytics — Web analytics
  - SDK: `@vercel/analytics` 1.6.1, `@vercel/speed-insights` 1.3.1
  - No additional env vars (automatic on Vercel)

**Email:**

- Resend — Transactional email notifications
  - SDK: `resend` 6.9.3
  - Implementation: `src/lib/emailSender.ts`
  - Sends: post-ready notifications, post digest emails, waitlist confirmations
  - Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (default: `ShipSignal <notifications@shipsignal.app>`)
  - Silently no-ops if `RESEND_API_KEY` not configured

**Error Monitoring:**

- Sentry — Error tracking and performance tracing
  - SDK: `@sentry/nextjs` 10.42.0
  - Config files: `sentry.server.config.ts`, `sentry.edge.config.ts`
  - Initialized in `src/instrumentation.ts` (Next.js instrumentation hook)
  - Traces at 10% sample rate; sensitive headers scrubbed before sending
  - Env var: `NEXT_PUBLIC_SENTRY_DSN` (optional; disables Sentry if unset)

## Data Storage

**Databases:**

- Supabase (PostgreSQL) — Primary database for all application data
  - SaaS: Supabase cloud, project ref configurable
  - Self-hosted: Supabase Docker (`http://localhost:8000`)
  - Server client: `src/lib/supabase/server.ts`
  - Browser client: `src/lib/supabase/client.ts`
  - Auth: Supabase Auth (JWT-based, `auth.uid() = user_id` RLS policies on all tables)
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Service role client used in cron routes and push senders (bypasses RLS)

**Tables (identified from code):**

- `posts` — Scheduled social posts
- `campaigns` — Post campaigns
- `projects` — User projects
- `blog_drafts` — Blog draft content
- `launch_posts` — Product launch posts
- `social_accounts` — Connected OAuth accounts (stores access/refresh tokens)
- `user_profiles` — User plan (`free`, `pro`, `selfHosted`) and storage usage
- `web_push_subscriptions` — Browser push subscription objects (endpoint + VAPID keys)
- `push_device_tokens` — iOS APNs device tokens

**File Storage:**

- Supabase Storage — Media uploads for post attachments
  - Helpers: `src/lib/storage.ts`, `src/lib/media.ts`
  - Storage limit enforced per plan: 50MB (free), 2GB (pro), unlimited (self-hosted)

**Caching / Rate Limiting:**

- Upstash Redis — Optional; enables rate limiting (10 req/10 sec per IP)
  - SDK: `@upstash/redis` 1.36.4, `@upstash/ratelimit` 2.0.8
  - Degrades gracefully: rate limiting disabled with warnings if not configured
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Authentication & Identity

**Auth Provider:**

- Supabase Auth — Email/password + OAuth
  - Implementation: `src/lib/auth.ts` (`requireAuth()`, `getOptionalAuth()`)
  - OAuth callback: `src/app/(auth)/auth/callback/` route
  - Session management via Supabase SSR helpers

**Social Login (iOS):**

- Google Sign-In — via `@capgo/capacitor-social-login` 8.3.8
  - Configured in `capacitor.config.ts`
  - Env vars: `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`

## Push Notifications

**Web Push (PWA):**

- VAPID-based Web Push via `web-push` 3.6.7
- Implementation: `src/lib/webPushSender.ts`
- Subscriptions stored in `web_push_subscriptions` table
- Silently no-ops if VAPID keys not configured
- Env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

**APNs (iOS Native Push):**

- Apple Push Notification service via HTTP/2 (custom implementation, no third-party SDK)
- Implementation: `src/lib/apnsSender.ts`
- Uses ES256 JWT authentication with 50-minute token caching
- Device tokens stored in `push_device_tokens` table
- Endpoints: `https://api.push.apple.com` (production), `https://api.sandbox.push.apple.com` (sandbox)
- Env vars: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_AUTH_KEY` (base64-encoded .p8 file), `APNS_BUNDLE_ID` (default: `to.shipsignal.app`), `APNS_ENVIRONMENT` (`production` or sandbox)

## CI/CD & Deployment

**Hosting:**

- Vercel — Primary hosting for SaaS mode
  - Production URL: `https://shipsignal.app`
  - Vercel is source of truth for all runtime secrets

**Self-Hosted:**

- Docker Compose running Supabase stack (`make self-host-up`)
- Next.js server with `SELF_HOSTED=true`
- Internal cron via `node-cron` (no Vercel Cron needed)

**CI Pipeline:**

- GitHub Actions (referenced via `@semantic-release/github`)
- `semantic-release` automates versioning and GitHub releases from commit types
- Pre-commit hook: lint + typecheck + unit tests + format check (via husky)

## Webhooks & Cron Jobs

**Vercel Cron (SaaS mode):**
Defined in `vercel.json`:

| Path                        | Schedule      | Purpose                      |
| --------------------------- | ------------- | ---------------------------- |
| `/api/cron/publish`         | `*/5 * * * *` | Auto-publish due posts       |
| `/api/cron/retry-failed`    | `0 * * * *`   | Retry failed posts           |
| `/api/cron/refresh-tokens`  | `0 */6 * * *` | Rotate expiring OAuth tokens |
| `/api/cron/calendar-nudges` | `0 */6 * * *` | Calendar reminder nudges     |
| `/api/cron/cleanup-media`   | `0 3 * * 0`   | Weekly media cleanup         |

All cron endpoints authenticate via `Authorization: Bearer <CRON_SECRET>` (timing-safe comparison in `src/lib/cronAuth.ts`).

**Internal Cron (self-hosted mode):**

- `src/lib/scheduler.ts` — `node-cron` runs publish + token refresh every 5 min
- Started in `src/instrumentation.ts` when `SELF_HOSTED=true` and `NEXT_RUNTIME=nodejs`

**OAuth Callbacks (incoming):**

- `GET /api/social-accounts/twitter/callback` — Twitter OAuth 2.0 PKCE callback
- `GET /api/social-accounts/linkedin/callback` — LinkedIn OAuth 2.0 callback
- `GET /auth/callback` — Supabase Auth OAuth callback

## MCP Servers

Configured in Claude settings (`.claude/settings.json`):

| Server       | Purpose                                      |
| ------------ | -------------------------------------------- |
| `context7`   | Library documentation lookup                 |
| `playwright` | Browser automation for E2E testing           |
| `github`     | GitHub API (PRs, issues, repos)              |
| `supabase`   | Database queries, migrations, edge functions |

## Environment Variables Reference

**Required (app fails without these):**

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

**Recommended (features degrade without these):**

- `CRON_SECRET` — Bearer token for cron endpoint auth; required for self-hosted internal scheduler
- `UPSTASH_REDIS_REST_URL` — Rate limiting Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Rate limiting Redis token
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error monitoring DSN

**Social platforms (platform features disabled without these):**

- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — Twitter OAuth credentials
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` — LinkedIn OAuth credentials
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` — Reddit OAuth credentials
- `REDDIT_USERNAME` / `REDDIT_PASSWORD` / `REDDIT_USER_AGENT` — Reddit script auth (self-hosted only)

**Push notifications:**

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — Web Push VAPID keys
- `APNS_KEY_ID` / `APNS_TEAM_ID` / `APNS_AUTH_KEY` / `APNS_BUNDLE_ID` / `APNS_ENVIRONMENT` — APNs iOS push

**AI:**

- `ANTHROPIC_API_KEY` — Anthropic Claude API for content generation

**Email:**

- `RESEND_API_KEY` — Resend transactional email
- `RESEND_FROM_EMAIL` — Sender address (default: `ShipSignal <notifications@shipsignal.app>`)

**Analytics:**

- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog host (default: `https://us.i.posthog.com`)

**App:**

- `NEXT_PUBLIC_APP_URL` — App base URL for OAuth redirect URIs and email links
- `SELF_HOSTED` — Set to `true` to activate self-hosted mode
- `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` — Google Sign-In for iOS Capacitor app
- `CAPACITOR_SERVER_URL` — Override WebView URL for local iOS dev (default: `https://shipsignal.app`)

---

_Integration audit: 2026-04-21_
