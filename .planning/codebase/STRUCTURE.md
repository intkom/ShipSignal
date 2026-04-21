# Codebase Structure

**Analysis Date:** 2026-04-21

## Directory Layout

```
ShipSignal/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── (auth)/                 # Auth pages (no dashboard layout)
│   │   ├── (dashboard)/            # Authenticated pages (shared layout)
│   │   ├── (public)/               # Public marketing/articles (no auth)
│   │   ├── api/                    # API route handlers
│   │   ├── access-denied/          # Access denied page
│   │   ├── privacy/                # Privacy policy page
│   │   ├── terms/                  # Terms of service page
│   │   ├── page.tsx                # Root landing page
│   │   └── layout.tsx              # Root layout (Sentry, PostHog, theme)
│   ├── components/                 # Shared reusable components
│   │   ├── ui/                     # Generic UI primitives
│   │   ├── analytics/              # Analytics dashboard components
│   │   ├── calendar/               # Calendar UI components
│   │   ├── campaigns/              # Campaign-specific components
│   │   ├── editor/                 # Rich text / post editor components
│   │   ├── launch-posts/           # Launch post card + form
│   │   ├── projects/               # Project card, selector, modals
│   │   └── reminders/              # Reminder UI components
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Shared logic, stores, utilities
│       ├── supabase/               # Supabase client factories
│       └── publishers/             # Platform publishing engines
├── supabase/
│   └── migrations/                 # 42 SQL migration files (sequential)
├── e2e/                            # Playwright E2E tests
├── public/                         # Static assets (sw.js, icons, images)
├── .planning/                      # GSD planning documents
├── docs/                           # Architecture and setup docs
├── capacitor.config.ts             # iOS Capacitor configuration
├── next.config.ts                  # Next.js config (Sentry, headers)
├── tailwind.config.ts              # Tailwind config + sticker design tokens
├── tsconfig.json                   # TypeScript config (@/* path alias)
├── vitest.config.ts                # Vitest unit test config
├── playwright.config.ts            # Playwright E2E config
├── Makefile                        # Dev workflow commands
└── vercel.json                     # Cron job schedules
```

---

## Directory Purposes

### `src/app/(auth)/`
Auth pages without the dashboard shell. All unauthenticated.
- `login/page.tsx` — Email/password + Google OAuth login form
- `signup/page.tsx` — Registration form (calls `/api/auth/pre-signup-check`)
- `forgot-password/page.tsx` — Password reset request
- `reset-password/page.tsx` — New password form (after email link)
- `auth/callback/route.ts` — Supabase OAuth callback; exchanges code for session, redirects to `/dashboard`

### `src/app/(dashboard)/`
All authenticated pages. Wrapped by `layout.tsx` which checks session and redirects to `/login` if missing.
- `layout.tsx` — Session guard, AppHeader, BottomNav, Toaster, PlanInitializer, PostHogIdentify
- `dashboard/page.tsx` — Main dashboard: stats, CalendarWidget, recent posts
- `posts/page.tsx` — Post list with filtering by status/platform; includes CalendarView
- `new/page.tsx` — Create post form (platform selector, content editor, scheduler)
- `edit/[id]/page.tsx` — Edit existing post
- `campaigns/page.tsx` — Campaign list
- `campaigns/[id]/` — Campaign detail with post cards and AddPostModal
- `projects/page.tsx` — Project list
- `projects/[id]/` — Project detail
- `calendar/page.tsx` — Full calendar view
- `calendar/events/page.tsx` — Community events list
- `launch-posts/page.tsx` — Launch posts tracker (HN, PH, etc.)
- `launch-posts/new/page.tsx` — Create launch post
- `launch-posts/[id]/page.tsx` — Edit launch post
- `blog/page.tsx` — Blog drafts list
- `blog/new/page.tsx` — Create blog draft
- `blog/[id]/page.tsx` — Edit blog draft
- `settings/page.tsx` — User settings (connected accounts, plan, notifications, biometrics, AI persona)
- `profile/page.tsx` — User profile (display name, avatar)
- `components/` — Dashboard-scoped layout components: `AppHeader.tsx`, `BottomNav.tsx`, `UserMenu.tsx`, `EmailVerificationBanner.tsx`, `NativeInit.tsx`, `PlanInitializer.tsx`

### `src/app/(public)/`
Public-facing pages, no auth required.
- `articles/page.tsx` — Articles index listing all content
- `articles/[slug]/page.tsx` — Individual article page
- `articles/content/` — MDX-like article content files (one per article)
- `articles/components/` — `ArticlesHeader.tsx`, `ArticleCard.tsx`, `ArticlesFooter.tsx`

### `src/app/api/`
All REST API endpoints. Full route map below.

### `src/components/ui/`
Generic, reusable UI primitives used across the app:
- `ConfirmDialog.tsx` — Modal confirmation dialog
- `MediaUpload.tsx` — File upload with preview and validation
- `IOSActionSheet.tsx` — iOS-style bottom action sheet
- `IOSDateTimePicker.tsx` — Mobile-native datetime picker
- `IOSSegmentedControl.tsx` — Segmented control for iOS feel
- `IOSToggleSwitch.tsx` — Toggle switch
- `LimitGate.tsx` — Renders upgrade prompt when plan limit reached
- `MarkdownEditor.tsx` — Rich text / markdown editor
- `ApiKeyManager.tsx` — API key CRUD UI
- `AuthSyncProvider.tsx` — Syncs Supabase session changes to client
- `AutoSaveIndicator.tsx` — Displays auto-save status
- `PasswordStrength.tsx` — Password strength meter
- `CookieConsent.tsx` — Cookie consent banner
- `FeatureCarousel.tsx` — Feature showcase carousel

### `src/lib/`
All shared logic. Key files:

| File | Purpose |
|------|---------|
| `auth.ts` | `requireAuth()`, `requireSessionAuth()`, `getOptionalAuth()`, API key resolution (`resolveApiKey()`), ownership validators, `isTestMode()` |
| `utils.ts` | `cn()`, `escapeSearchPattern()`, snake↔camel transforms for all DB entities |
| `requestDedup.ts` | `dedup()` + `createDedupKey()` — prevents duplicate in-flight Zustand requests |
| `posts.ts` | Core types: `Post`, `Platform`, `PostStatus`, `Campaign`, `Project`, `GithubProject`, etc. |
| `limits.ts` | `PlanType`, `PLAN_LIMITS`, `PLAN_FEATURES`, `RESOURCE_LABELS` |
| `planEnforcement.ts` | `getUserPlan()`, `enforceResourceLimit()`, `enforceStorageLimit()`, `enforceSocialAccountLimit()`, `isPlanLimitError()` |
| `selfHosted.ts` | `isSelfHosted()` — single source of truth for self-hosted mode |
| `scheduler.ts` | `startScheduler()` — starts node-cron for self-hosted mode |
| `cronAuth.ts` | `verifyCronSecret()` — timing-safe cron endpoint auth |
| `tokenRefresh.ts` | `getValidAccessToken()`, `refreshRedditViaPasswordGrant()`, `isTokenExpiringSoon()` |
| `campaigns.ts` | `useCampaignsStore` (Zustand) |
| `projects.ts` | `useProjectsStore` (Zustand) |
| `blogDrafts.ts` | `useBlogDraftsStore` (Zustand) |
| `launchPosts.ts` | `useLaunchPostsStore` (Zustand) |
| `analyticsStore.ts` | `useAnalyticsStore` (Zustand) |
| `planStore.ts` | `usePlanStore` (Zustand) — caches user plan + limits client-side |
| `calendarStore.ts` | `useCalendarStore` (Zustand) |
| `communityEvents.ts` | Community events store (Zustand) |
| `reminders.ts` | Reminders store (Zustand) |
| `githubProjects.ts` | GitHub projects store (Zustand) |
| `socialAccounts.ts` | Social accounts utilities |
| `media.ts` | Media upload helpers |
| `storage.ts` | Supabase storage bucket helpers |
| `profile.ts` | User profile utilities |
| `notifications.ts` | In-app notification helpers |
| `rateLimit.ts` | Upstash Redis rate limiting (optional) |
| `rrule.ts` | `getNextOccurrence()` — RRULE recurrence calculation |
| `aiTransformer.ts` | AI content generation utilities |
| `githubImporter.ts` | GitHub activity import logic |
| `emailSender.ts` | Transactional email sending |
| `webPushSender.ts` | Web push notification sending |
| `apnsSender.ts` | Apple Push Notification Service sender |
| `capacitor.ts` | `isNativePlatform()` — iOS Capacitor detection via user agent |
| `envValidation.ts` | Startup env var validation with warnings |
| `theme.tsx` | Light/dark theme provider |
| `posthog.tsx` | PostHog analytics client |

### `src/lib/supabase/`
- `server.ts` — `createClient()` for Server Components and API routes (uses `next/headers` cookies)
- `client.ts` — `createClient()` for Client Components (browser-side session)

### `src/lib/publishers/`
- `index.ts` — `publishPost()` orchestrator: resolves token, dispatches to platform publisher, updates post status in DB
- `twitter.ts` — `publishToTwitter()` — calls Twitter API v2
- `linkedin.ts` — `publishToLinkedIn()` — calls LinkedIn API
- `twitterMedia.ts` — Twitter media upload handling
- `linkedinMedia.ts` — LinkedIn media upload handling
- `mediaDownload.ts` — Download media from Supabase storage for upload to platform

### `src/hooks/`
- `useKeyboardShortcuts.ts` — Global keyboard shortcut bindings
- `useUnsavedChanges.ts` — Warn user before leaving with unsaved changes
- `useAutoSave.ts` — Debounced auto-save for editors

---

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — Root layout, Sentry + PostHog + theme init
- `src/app/page.tsx` — Landing page
- `src/instrumentation.ts` — Next.js startup hook; starts node-cron in self-hosted mode

**Configuration:**
- `tsconfig.json` — `@/*` maps to `./src/*`
- `tailwind.config.ts` — Design tokens: sticker palette, platform colors, sticker utility classes
- `src/index.css` — CSS variables (colors, fonts, shadows)
- `next.config.ts` — Sentry integration, security headers
- `vercel.json` — Vercel Cron job schedule definitions

**Core Logic:**
- `src/lib/auth.ts` — Auth entry point for every API route
- `src/lib/planEnforcement.ts` — Resource limit gate for all CRUD operations
- `src/lib/publishers/index.ts` — Publishing engine entry point
- `src/app/api/cron/publish/route.ts` — Main scheduling/publishing cron

**Testing:**
- `vitest.config.ts` — Unit test config
- `playwright.config.ts` — E2E test config
- `e2e/*.spec.ts` — E2E test specs

---

## Route Map

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Landing page |
| `/login` | `src/app/(auth)/login/page.tsx` | Login |
| `/signup` | `src/app/(auth)/signup/page.tsx` | Registration |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Password reset |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | New password |
| `/auth/callback` | `src/app/(auth)/auth/callback/route.ts` | OAuth callback |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `/posts` | `src/app/(dashboard)/posts/page.tsx` | Post list |
| `/new` | `src/app/(dashboard)/new/page.tsx` | Create post |
| `/edit/[id]` | `src/app/(dashboard)/edit/[id]/page.tsx` | Edit post |
| `/campaigns` | `src/app/(dashboard)/campaigns/page.tsx` | Campaign list |
| `/campaigns/[id]` | `src/app/(dashboard)/campaigns/[id]/page.tsx` | Campaign detail |
| `/projects` | `src/app/(dashboard)/projects/page.tsx` | Project list |
| `/projects/[id]` | `src/app/(dashboard)/projects/[id]/page.tsx` | Project detail |
| `/calendar` | `src/app/(dashboard)/calendar/page.tsx` | Calendar view |
| `/calendar/events` | `src/app/(dashboard)/calendar/events/page.tsx` | Community events |
| `/launch-posts` | `src/app/(dashboard)/launch-posts/page.tsx` | Launch posts |
| `/launch-posts/new` | `src/app/(dashboard)/launch-posts/new/page.tsx` | Create launch post |
| `/launch-posts/[id]` | `src/app/(dashboard)/launch-posts/[id]/page.tsx` | Edit launch post |
| `/blog` | `src/app/(dashboard)/blog/page.tsx` | Blog drafts |
| `/blog/new` | `src/app/(dashboard)/blog/new/page.tsx` | Create blog draft |
| `/blog/[id]` | `src/app/(dashboard)/blog/[id]/page.tsx` | Edit blog draft |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | Settings |
| `/profile` | `src/app/(dashboard)/profile/page.tsx` | User profile |
| `/articles` | `src/app/(public)/articles/page.tsx` | Articles index |
| `/articles/[slug]` | `src/app/(public)/articles/[slug]/page.tsx` | Article |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy |
| `/terms` | `src/app/terms/page.tsx` | Terms of service |
| `/access-denied` | `src/app/access-denied/page.tsx` | Access denied |

### API Routes

| Method + Route | File | Purpose |
|----------------|------|---------|
| `GET/POST /api/posts` | `posts/route.ts` | List / create posts |
| `GET/PATCH/DELETE /api/posts/[id]` | `posts/[id]/route.ts` | Get / update / delete post |
| `POST /api/posts/[id]/publish` | `posts/[id]/publish/route.ts` | Manually publish post |
| `POST /api/posts/[id]/archive` | `posts/[id]/archive/route.ts` | Archive post |
| `POST /api/posts/[id]/restore` | `posts/[id]/restore/route.ts` | Restore archived post |
| `GET /api/posts/[id]/media` | `posts/[id]/media/route.ts` | Get post media |
| `GET /api/posts/due` | `posts/due/route.ts` | Get ready-status posts |
| `GET /api/posts/upcoming` | `posts/upcoming/route.ts` | Get upcoming scheduled posts |
| `GET /api/posts/search` | `posts/search/route.ts` | Full-text post search |
| `POST /api/posts/reset` | `posts/reset/route.ts` | Reset test posts (dev only) |
| `GET/POST /api/campaigns` | `campaigns/route.ts` | List / create campaigns |
| `GET/PATCH/DELETE /api/campaigns/[id]` | `campaigns/[id]/route.ts` | Get / update / delete campaign |
| `GET/POST /api/campaigns/[id]/posts` | `campaigns/[id]/posts/route.ts` | List / add posts to campaign |
| `DELETE /api/campaigns/[id]/posts/[postId]` | `campaigns/[id]/posts/[postId]/route.ts` | Remove post from campaign |
| `GET/POST /api/projects` | `projects/route.ts` | List / create projects |
| `GET/PATCH/DELETE /api/projects/[id]` | `projects/[id]/route.ts` | Get / update / delete project |
| `GET /api/projects/[id]/campaigns` | `projects/[id]/campaigns/route.ts` | List project campaigns |
| `GET /api/projects/[id]/accounts` | `projects/[id]/accounts/route.ts` | List project social accounts |
| `GET /api/projects/[id]/analytics` | `projects/[id]/analytics/route.ts` | Project analytics summary |
| `POST /api/projects/[id]/logo` | `projects/[id]/logo/route.ts` | Upload project logo |
| `GET/POST /api/blog-drafts` | `blog-drafts/route.ts` | List / create blog drafts |
| `GET/PATCH/DELETE /api/blog-drafts/[id]` | `blog-drafts/[id]/route.ts` | Get / update / delete draft |
| `POST /api/blog-drafts/[id]/archive` | `blog-drafts/[id]/archive/route.ts` | Archive draft |
| `POST /api/blog-drafts/[id]/restore` | `blog-drafts/[id]/restore/route.ts` | Restore archived draft |
| `GET/POST /api/blog-drafts/[id]/images` | `blog-drafts/[id]/images/route.ts` | List / upload images |
| `DELETE /api/blog-drafts/[id]/images/[filename]` | `blog-drafts/[id]/images/[filename]/route.ts` | Delete image |
| `GET /api/blog-drafts/search` | `blog-drafts/search/route.ts` | Search blog drafts |
| `GET/POST /api/launch-posts` | `launch-posts/route.ts` | List / create launch posts |
| `GET/PATCH/DELETE /api/launch-posts/[id]` | `launch-posts/[id]/route.ts` | Get / update / delete launch post |
| `GET /api/social-accounts` | `social-accounts/route.ts` | List connected social accounts |
| `DELETE /api/social-accounts/[id]` | `social-accounts/[id]/route.ts` | Disconnect social account |
| `GET /api/social-accounts/twitter/auth` | `social-accounts/twitter/auth/route.ts` | Get Twitter OAuth URL (PKCE) |
| `GET /api/social-accounts/twitter/callback` | `social-accounts/twitter/callback/route.ts` | Twitter OAuth callback |
| `GET /api/social-accounts/linkedin/auth` | `social-accounts/linkedin/auth/route.ts` | Get LinkedIn OAuth URL |
| `GET /api/social-accounts/linkedin/callback` | `social-accounts/linkedin/callback/route.ts` | LinkedIn OAuth callback |
| `GET /api/social-accounts/reddit/auth` | `social-accounts/reddit/auth/route.ts` | Reddit auth (delegates to connect in self-hosted) |
| `POST /api/social-accounts/reddit/connect` | `social-accounts/reddit/connect/route.ts` | Reddit password grant (self-hosted) |
| `GET/POST /api/api-keys` | `api-keys/route.ts` | List / create API keys |
| `DELETE /api/api-keys/[id]` | `api-keys/[id]/route.ts` | Revoke API key |
| `GET /api/plan` | `plan/route.ts` | Get user plan + limits |
| `GET /api/calendar` | `calendar/route.ts` | Get calendar items |
| `GET/POST /api/reminders` | `reminders/route.ts` | List / create reminders |
| `PATCH/DELETE /api/reminders/[id]` | `reminders/[id]/route.ts` | Update / delete reminder |
| `GET/POST /api/community-events` | `community-events/route.ts` | Community events |
| `POST /api/community-events/subscriptions` | `community-events/subscriptions/route.ts` | Subscribe to event |
| `DELETE /api/community-events/subscriptions/[id]` | `community-events/subscriptions/[id]/route.ts` | Unsubscribe |
| `GET /api/analytics/auth/url` | `analytics/auth/url/route.ts` | Get Google Analytics OAuth URL |
| `GET /api/analytics/auth/callback` | `analytics/auth/callback/route.ts` | Google Analytics OAuth callback |
| `GET/POST /api/analytics/connections` | `analytics/connections/route.ts` | List / create GA connections |
| `GET/DELETE /api/analytics/connections/[id]` | `analytics/connections/[id]/route.ts` | Get / delete GA connection |
| `GET /api/analytics/connections/[id]/report` | `analytics/connections/[id]/report/route.ts` | Fetch GA report |
| `GET /api/analytics/properties` | `analytics/properties/route.ts` | List GA properties |
| `POST /api/media/upload` | `media/upload/route.ts` | Upload media file |
| `GET /api/media` | `media/route.ts` | List user media |
| `DELETE /api/media/[filename]` | `media/[filename]/route.ts` | Delete media file |
| `GET /api/github-projects` | `github-projects/route.ts` | List GitHub project connections |
| `POST /api/github-projects/[id]/sync` | `github-projects/[id]/sync/route.ts` | Sync GitHub activity |
| `POST /api/generate-posts` | `generate-posts/route.ts` | AI post generation |
| `GET/POST /api/notification-preferences` | `notification-preferences/route.ts` | Notification settings |
| `POST /api/push-subscriptions` | `push-subscriptions/route.ts` | Register web push subscription |
| `POST /api/push-tokens` | `push-tokens/route.ts` | Register iOS APNS push token |
| `GET /api/profile/ai-settings` | `profile/ai-settings/route.ts` | Get AI persona settings |
| `DELETE /api/account/delete` | `account/delete/route.ts` | Delete user account |
| `GET /api/auth/pre-signup-check` | `auth/pre-signup-check/route.ts` | Validate email allowlist + re-registration cooldown |
| `GET /api/export` | `export/route.ts` | Export user data as JSON |
| `POST /api/import` | `import/route.ts` | Import posts from JSON |
| `GET /api/waitlist` | `waitlist/route.ts` | Pro waitlist signup |
| `GET /api/cron/publish` | `cron/publish/route.ts` | Cron: publish due posts |
| `GET /api/cron/refresh-tokens` | `cron/refresh-tokens/route.ts` | Cron: refresh OAuth tokens |
| `GET /api/cron/retry-failed` | `cron/retry-failed/route.ts` | Cron: retry failed posts |
| `GET /api/cron/cleanup-media` | `cron/cleanup-media/route.ts` | Cron: remove orphaned media |
| `GET /api/cron/calendar-nudges` | `cron/calendar-nudges/route.ts` | Cron: send calendar reminders |
| `GET /api/health` | `health/route.ts` | Health check |
| `GET /api/health/schema` | `health/schema/route.ts` | DB schema health canary |
| `POST /api/dev/test-push` | `dev/test-push/route.ts` | Dev: send test push notification |

---

## Database Schema Overview

All tables use `uuid` primary keys with `gen_random_uuid()` and `user_id uuid references auth.users(id) on delete cascade`. RLS is enabled on all tables with `auth.uid() = user_id` policies.

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `posts` | `id`, `user_id`, `platform` (twitter/linkedin/reddit), `status` (draft/scheduled/ready/publishing/published/failed/archived), `scheduled_at`, `content` (JSONB), `publish_result` (JSONB), `campaign_id`, `social_account_id`, `group_id`, `group_type`, `recurrence_rule`, `github_activity_id` | Core scheduling table |
| `campaigns` | `id`, `user_id`, `name`, `status` (active/paused/completed/archived), `project_id` | Groups posts |
| `projects` | `id`, `user_id`, `name`, `hashtags[]`, `brand_colors` (JSONB), `logo_url` | Top-level org unit |
| `project_accounts` | `project_id`, `account_id` | M2M: projects ↔ social accounts |
| `user_profiles` | `id` (FK to auth.users), `display_name`, `avatar_url`, `plan` (free/pro/selfHosted), `storage_used_bytes`, `founder_bio`, `tone_of_voice`, `default_hashtags` | Auto-created on signup via trigger |
| `social_accounts` | `id`, `user_id`, `provider` (twitter/linkedin/reddit), `provider_account_id`, `access_token`, `refresh_token`, `token_expires_at`, `status` (active/expired/revoked/error) | OAuth token storage |
| `api_keys` | `id`, `user_id`, `name`, `key_hash`, `key_prefix`, `scopes[]`, `expires_at`, `revoked_at`, `last_used_at` | Hashed API keys |
| `blog_drafts` | `id`, `user_id`, `title`, `content`, `status` (draft/scheduled/published/archived), `campaign_id`, `images` (JSONB) | Blog content drafts |
| `launch_posts` | `id`, `user_id`, `platform` (hacker_news_show/ask/link/product_hunt/dev_hunt/beta_list/indie_hackers), `status` (draft/scheduled/posted), `title`, `url`, `platform_fields` (JSONB), `campaign_id` | Launch platform tracker |
| `analytics_connections` | `id`, `user_id`, `provider`, `access_token`, `refresh_token`, `property_id` | Google Analytics OAuth |
| `web_push_subscriptions` | `id`, `user_id`, `endpoint`, `keys_p256dh`, `keys_auth` | Web push subscriptions |
| `reminders` | `id`, `user_id`, `title`, `remind_at`, `recurrence_rule` | User reminders with optional recurrence |
| `community_events` | `id`, `title`, `event_date`, `platform` | Seeded community events |
| `user_event_subscriptions` | `user_id`, `event_id` | M2M: users ↔ community events |
| `github_projects` | `id`, `user_id`, `github_repo_url`, `changelog_url`, `documentation_url` | Connected GitHub repos |
| `github_activity` | `id`, `user_id`, `github_project_id`, `source_type` (release/prs/commits), `raw_text`, `fetched_at` | Latest fetched GitHub activity (1 row per project) |
| `deleted_accounts` | `email`, `deleted_at`, `can_reregister_at` | 30-day re-registration cooldown |
| `pro_waitlist` | `user_id`, `email`, `feature` | Tracks upgrade interest |

**DB-level enforcement:**
- `enforce_resource_limit()` BEFORE INSERT trigger on `posts`, `campaigns`, `projects`, `blog_drafts`, `launch_posts` — raises SQLSTATE 23514 when count exceeds plan limit
- `update_updated_at()` BEFORE UPDATE trigger on all tables
- `handle_new_user()` AFTER INSERT trigger on `auth.users` — creates `user_profiles` row

---

## Naming Conventions

**Files:**
- Page files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- API routes: `route.ts`
- Component files: PascalCase matching component name (`PostCard.tsx`, `AppHeader.tsx`)
- Store/lib files: camelCase (`campaigns.ts`, `planEnforcement.ts`)
- Test files: `*.test.ts` or `*.test.tsx`, co-located with source; split into `*.part2.test.ts` etc. for large suites

**Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`)

---

## Where to Add New Code

**New dashboard page:**
- Create `src/app/(dashboard)/[feature]/page.tsx`
- Add API route(s) at `src/app/api/[feature]/route.ts`
- Add Zustand store at `src/lib/[feature].ts`

**New API route:**
- Create `src/app/api/[resource]/route.ts`
- Always call `requireAuth()` first
- Filter all DB queries with `.eq('user_id', userId)`
- Apply `transformXFromDb()` to all responses

**New shared component:**
- Generic UI primitives: `src/components/ui/`
- Feature-specific: `src/components/[feature]/`

**New database table:**
- Create migration: `make db-new name=description`
- Enable RLS with `auth.uid() = user_id` policies
- Add to `enforce_resource_limit()` trigger if it has a plan limit
- Never edit existing migration files

**New platform publisher:**
- Add `src/lib/publishers/[platform].ts`
- Export `publishTo[Platform]()` matching `Publisher` type from `src/lib/publishers/index.ts`
- Register in `publishers` map in `src/lib/publishers/index.ts`

---

*Structure analysis: 2026-04-21*
