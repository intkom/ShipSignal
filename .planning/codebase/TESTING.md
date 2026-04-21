# Testing Patterns

**Analysis Date:** 2026-04-21

## Unit Test Framework

**Runner:** Vitest
**Config:** `vitest.config.ts` (project root)
**Environment:** `jsdom` (browser-like DOM simulation)
**Globals:** enabled (`describe`, `it`, `expect`, `vi` available without imports)
**Setup file:** `src/test/setup.ts` — imports `@testing-library/jest-dom` matchers
**Path alias:** `@/*` → `./src/*` (mirrors tsconfig)

**Run commands:**

```bash
make test          # Vitest watch mode (development)
make test-run      # Vitest single run (CI)
npm run test:coverage  # Single run with coverage report
```

## Unit Test File Organization

**Location:** Co-located with source file, same directory.

**Naming:**

- `route.ts` → `route.test.ts`
- `campaigns.ts` → `campaigns.test.ts` (lib store)
- `useAutoSave.ts` → `useAutoSave.test.ts` (hook)

**Split test files:** When a route or store has too many test cases to fit in 300 lines (the ESLint file limit), split into `route.test.ts`, `route.part2.test.ts`, `route.part3.test.ts`, etc. Each part file imports its own mocks independently. This is common for campaign and launch-post routes.

**Test file count:** 129 unit test files total (111 `.test.ts` + 18 `.test.tsx`) across `src/`.

```
src/
├── app/api/**/*.test.ts       # API route tests (52 files, majority)
├── hooks/*.test.ts            # Custom hook tests
├── lib/*.test.ts              # Store and utility tests
```

## Unit Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

import { GET, POST } from './route'
import { requireAuth } from '@/lib/auth'

const mockRequireAuth = vi.mocked(requireAuth)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(
    new URL(url, 'http://localhost:3000'),
    init as ConstructorParameters<typeof NextRequest>[1]
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/resource', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    const req = createRequest('/api/resource')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns data for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'user-1' })
    // ... mock DB chain ...
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

## API Route Unit Test Mocking

**Auth mock (always present):**

```typescript
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  requireAuth: vi.fn(),
}))
```

**Supabase client mock (chained query builder):**
Build a mock chain bottom-up matching the actual query chain. Each method in the chain (`.from`, `.select`, `.eq`, `.order`, `.limit`, `.single`, `.insert`, `.update`, `.delete`) is a separate `vi.fn()` that returns the next step.

```typescript
const mockSingle = vi.fn()
const mockInsertSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }))
const mockFrom = vi.fn(() => ({ insert: mockInsert, select: mockSelect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}))
```

**Plan enforcement mock (common in routes with resource limits):**

```typescript
vi.mock('@/lib/planEnforcement', () => ({
  enforceResourceLimit: vi.fn(async () => ({
    allowed: true,
    current: 0,
    limit: 50,
    plan: 'free',
  })),
  isPlanLimitError: vi.fn(() => false),
}))
```

**Self-hosted mode mock (cron and publisher routes):**

```typescript
const mockIsSelfHosted = vi.fn(() => false)
vi.mock('@/lib/selfHosted', () => ({
  isSelfHosted: () => mockIsSelfHosted(),
}))
```

**Global fetch mock (store tests):**

```typescript
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})
```

## Test Data Factories

API route tests use inline factory functions to produce realistic DB row shapes:

```typescript
function makeDbPost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    scheduled_at: new Date(Date.now() - 60_000).toISOString(),
    status: 'scheduled',
    platform: 'twitter',
    content: { text: 'Hello world' },
    user_id: 'user-1',
    ...overrides,
  }
}
```

Store tests use helper functions to produce typed domain objects:

```typescript
const makeConnection = (overrides: Partial<AnalyticsConnection> = {}): AnalyticsConnection => ({
  id: 'conn-1',
  userId: 'user-1',
  provider: 'google_analytics',
  // ...
  ...overrides,
})
```

## Coverage

**No enforced minimum.** Coverage reporters configured (`text`, `json`, `html`) but no threshold gates in CI.

**View coverage:**

```bash
npm run test:coverage
```

**Coverage output:** `coverage/` directory (excluded from tsconfig).

## E2E Test Framework

**Runner:** Playwright
**Config:** `playwright.config.ts` (project root)
**Test directory:** `e2e/`
**Browser:** Chromium only (Desktop Chrome profile)
**Parallelism:** 1 worker (`workers: 1`), `fullyParallel: false`
**Retries:** 2 on CI, 0 locally

**Run commands:**

```bash
make test-e2e          # Headless, dev server
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:headed  # Headed browser
npm run test:e2e:debug   # Step debugger
```

**Timeouts:**

- Overall test: 120s CI, 30s local
- Action timeout: 30s CI, 10s local
- Navigation timeout: 60s CI, 30s local
- Web server startup: 180s CI, 120s local

## E2E Auth Bypass

E2E tests bypass real Supabase auth. The server runs with `E2E_TEST_MODE=true` and `NEXT_PUBLIC_E2E_TEST_MODE=true`. This makes auth middleware treat all requests as the fixed test user `00000000-0000-0000-0000-000000000001`. Tests call `enterDemoMode(page)` from `e2e/helpers.ts` as their setup step — this resets the database and sets required `localStorage` flags.

```typescript
test.beforeEach(async ({ page }) => {
  await enterDemoMode(page)
})
```

`enterDemoMode` does three things:

1. Calls `POST /api/posts/reset` to wipe all data for the test user
2. Sets `localStorage.cookie_consent = 'accepted'` and `localStorage.onboarding_complete = 'true'` via `addInitScript`
3. Navigates to `/` and waits for the header link to appear

## E2E Test File Organization

```
e2e/
├── helpers.ts               # All shared helpers (post/campaign/project CRUD, DB queries)
├── helpers-blog-drafts.ts   # Blog draft helpers
├── helpers-campaigns.ts     # Campaign helpers (overflow from helpers.ts)
├── helpers-editor.ts        # Editor-specific helpers
├── helpers-launch-posts.ts  # Launch post helpers
├── helpers-media.ts         # Media upload helpers
├── helpers-posts.ts         # Post-specific helpers
├── helpers-profile.ts       # Profile page helpers
├── helpers-projects.ts      # Project helpers
├── fixtures/
│   └── test-image.png       # Static fixture file for media upload tests
├── auth.spec.ts             # Login, signup, forgot/reset password flows
├── create-post.spec.ts      # Post creation (Twitter, LinkedIn, Reddit)
├── edit-post.spec.ts        # Post editing flows
├── delete-post.spec.ts      # Delete post flow
├── archive-post.spec.ts     # Archive/restore flow
├── posts-list.spec.ts       # Posts list view, filters
├── scheduling.spec.ts       # Schedule date/time picker
├── auto-save.spec.ts        # Auto-save behavior
├── campaigns.spec.ts        # Campaign UI smoke tests
├── campaigns-crud.spec.ts   # Campaign CRUD operations
├── campaigns-posts.spec.ts  # Adding posts to campaigns
├── projects.spec.ts         # Project management
├── launch-posts.spec.ts     # Launch post UI
├── launch-posts-edit.spec.ts
├── launch-posts-list.spec.ts
├── blog-drafts.spec.ts
├── blog-drafts-crud.spec.ts
├── blog-drafts-search.spec.ts
├── dashboard.spec.ts        # Dashboard page
├── settings.spec.ts         # Settings page
├── profile.spec.ts          # Profile page
├── media-features.spec.ts   # Media upload
├── reddit-crosspost.spec.ts # Reddit cross-posting
├── published-links.spec.ts  # Published post link behavior
├── usage-limits.spec.ts     # Plan limit enforcement
├── database-state.spec.ts   # DB state verification after operations
├── schema-health.spec.ts    # Schema cache canary
├── self-hosted.spec.ts      # Self-hosted mode behavior
└── .playwright/profiles/    # Persistent browser sessions (free-user, pro-user)
```

## E2E Helper Patterns

**API-based setup (preferred over UI setup):** Create test data via API to avoid UI flakiness:

```typescript
import { createPostViaAPI, getAllPosts } from './helpers'

const post = await createPostViaAPI(page, {
  platform: 'twitter',
  content: 'Test content',
  status: 'draft',
})
```

Available API helpers: `createPostViaAPI`, `createCampaignViaAPI` (implicit in `createCampaign`), `createProjectViaAPI`, `createLaunchPostViaAPI`, `createBlogDraftViaAPI`

**DB state verification:** After UI actions, verify via API to confirm correct persistence:

```typescript
const posts = await getAllPosts(page)
expect(posts).toHaveLength(1)
expect(posts[0].status).toBe('scheduled')
```

**`data-testid` selectors:** Used for elements that lack semantic roles (subreddit cards, schedule inputs):

- `[data-testid="subreddit-card-{name}"]`
- `[data-testid="subreddit-title-{name}"]`
- `[data-testid="main-schedule-date-input"]`
- `[data-testid="main-schedule-time-input"]`
- `[data-testid="preview-panel"]`
- `[data-testid="launch-post-card"]`

**Preferred selectors (in priority order):**

1. `getByRole` with accessible name (most stable)
2. `getByLabel` for form inputs
3. `getByText` for static text
4. `data-testid` for custom components without roles
5. CSS class selectors only as last resort

## E2E Serial Test Suites

Use `test.describe.serial()` when tests within a suite share cumulative database state:

```typescript
test.describe.serial('Create Operations', () => {
  test('should create exactly one Twitter draft', async ({ page }) => {
    expect(await getPostCount(page)).toBe(0)
    // ... create and verify count = 1
  })
})
```

Serial ordering is required for `database-state.spec.ts` because each test verifies exact record counts and builds on the empty state established by `beforeEach(enterDemoMode)`.

## E2E Fixture Schedules and Date Handling

All test timezones are forced to UTC via `timezoneId: 'UTC'` in `playwright.config.ts` and `TZ: UTC` in CI. Schedule dates are computed relative to `Date.now()` to avoid brittle hardcoded timestamps:

```typescript
const tomorrow = new Date()
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
tomorrow.setUTCHours(12, 0, 0, 0)
await setSchedule(page, tomorrow)
```

## QA Fixture System

The `qa/` directory provides a YAML-based seed system for manual QA workflows (not automated tests).

**Fixture files:**

- `qa/fixtures/default.yaml` — Realistic dataset: 2 projects, 4 campaigns, ~10 posts across all platforms, 4 blog drafts, 4 launch posts
- `qa/fixtures/empty.yaml` — Wipes the database only (empty fixture)
- `qa/fixtures/media/test-image.png` — Sample image for media upload testing

**Seed script:** `qa/seed.ts` — reads YAML, resolves `ref:fieldName` cross-references, resolves `+Nd HH:MM` relative timestamps, inserts into Supabase via service role key.

**Run commands:**

```bash
make qa-dev          # Start dev server in E2E_TEST_MODE (auth bypassed)
make qa-seed         # Seed with default.yaml
make qa-seed-empty   # Seed with empty.yaml (reset only)
make qa-reset        # Reset DB (no seed)
```

**YAML conventions:**

- `_name: identifier` — internal reference name (not stored in DB)
- `ref:fieldName: target-name` — foreign key cross-reference by `_name`
- `"+Nd HH:MM"` — relative timestamp: N days from now at HH:MM UTC

**QA workflow docs:** `qa/workflows/*.md` — step-by-step manual test scripts for smoke-test, post-management, campaigns, blog drafts, launch-day, and empty-states.

## CI Test Jobs

Defined in `.github/workflows/ci.yml`. Runs on push to `main` and all PRs.

| Job               | What it runs                                                        | Timeout |
| ----------------- | ------------------------------------------------------------------- | ------- |
| `knip`            | Dead code / unused dependency check (`npm run knip`)                | 5 min   |
| `lint`            | ESLint with cache (`npm run lint`)                                  | 5 min   |
| `typecheck`       | TypeScript (`npm run typecheck`)                                    | 5 min   |
| `unit-tests`      | Vitest (`npx vitest run`) + MCP server tests                        | 10 min  |
| `build`           | Next.js build in E2E mode, uploads `.next` artifact                 | 10 min  |
| `e2e-tests`       | Playwright — 5 shards in parallel, excludes `Self-Hosted Mode`      | 20 min  |
| `e2e-self-hosted` | Playwright — only `e2e/self-hosted.spec.ts` with `SELF_HOSTED=true` | 15 min  |
| `release`         | semantic-release (main branch only, after all jobs pass)            | —       |

E2E jobs require the `build` job to complete first and download the `.next` artifact. Both SaaS and self-hosted E2E jobs start a local Supabase instance and run migrations before tests.

## What Is Tested

**Well-covered:**

- All API routes have unit tests — 52 test files for `src/app/api/**`
- Happy path + auth failure (401) + DB failure (500) for every route
- Plan limit enforcement paths in resource-creation routes
- Zustand stores for campaigns, analytics, and hooks (useAutoSave, useKeyboardShortcuts, useUnsavedChanges, usePushNotifications, useLocalDraft)
- Full CRUD E2E flows for posts, campaigns, projects, launch posts, blog drafts
- Self-hosted mode behavioral differences (plan enforcement bypass, Reddit script auth, unlimited limits)
- Database state correctness (no duplicates on edit, exact counts after create/delete/archive)
- Schema health canary (`/api/health/schema`) for PostgREST cache drift detection

## Coverage Gaps

**UI components:** No unit tests for any React components (PostCard, AppHeader, CalendarWidget, etc.). All component testing is done through E2E.

**Stores without tests:** `src/lib/posts.ts` (postsStore), `src/lib/projects.ts` (projectsStore), `src/lib/blogDrafts.ts`, `src/lib/launchPosts.ts` — these stores have no unit tests; they are implicitly covered by E2E.

**Auth flow E2E:** Login tests use invalid credentials (no real user). No test covers a successful login with session persistence.

**Mobile/iOS:** No automated tests for the Capacitor iOS wrapper. iOS testing is manual via Simulator.

**OAuth flows:** Twitter, LinkedIn, Reddit OAuth connect/disconnect flows are not E2E tested (requires real OAuth provider).

**Cron jobs:** `route.test.ts` files exist for `/api/cron/publish` and `/api/cron/refresh-tokens`, but they mock the publisher entirely — no integration test for actual publishing to social platforms.

**Analytics store parts 2 and 3:** Files `analyticsStore.part2.test.ts` and `analyticsStore.part3.test.ts` exist but have `@ts-nocheck` headers indicating test scaffolding that may not be fully exercised.

---

_Testing analysis: 2026-04-21_
