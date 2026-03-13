# Architecture

Bullhorn is a Next.js 15 app using the App Router, backed by Supabase (PostgreSQL, Auth, Storage) with Zustand for client state and Tailwind CSS for styling.

## App Router Structure

```
src/app/
  (auth)/           # Auth pages: login, signup, forgot-password, reset-password
    auth/callback/  # OAuth callback route
  (dashboard)/      # Authenticated pages with shared layout
    dashboard/      # Main dashboard
    posts/          # Post list
    new/            # Create post
    edit/[id]/      # Edit post
    campaigns/      # Campaign list + [id] detail
    projects/       # Project list + [id] detail
    launch-posts/   # Launch posts list + new + [id]
    blog/           # Blog drafts list + new + [id]
    settings/       # User settings
    profile/        # User profile
    components/     # Dashboard-scoped components (AppHeader, BottomNav, UserMenu)
  api/              # API routes
```

## Components

```
src/components/
  ui/               # Shared: ConfirmDialog, MediaUpload, IOSActionSheet, IOSDateTimePicker
  projects/         # ProjectCard, ProjectSelector, CreateProjectModal
  campaigns/        # MoveCampaignModal
  launch-posts/     # LaunchPostCard, LaunchPostForm
  analytics/        # AnalyticsDashboard, ConnectAnalyticsModal
```

## Key Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | `requireAuth()`, `requireSessionAuth()`, `validateScopes()` |
| `utils.ts` | `cn()`, snake/camel transforms, `transformXFromDb/ToDb` |
| `requestDedup.ts` | `dedup()` for preventing duplicate API requests |
| `posts.ts` | Type definitions (Post, Campaign, Project, Platform) |
| `campaigns.ts` | Zustand store: `useCampaignsStore` |
| `projects.ts` | Zustand store: `useProjectsStore` |
| `blogDrafts.ts` | Zustand store: `useBlogDraftsStore` |
| `launchPosts.ts` | Zustand store: `useLaunchPostsStore` |
| `supabase/server.ts` | Server-side Supabase client |
| `supabase/client.ts` | Browser-side Supabase client |

## API Route Pattern

Every API route follows this structure:

```typescript
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { transformXFromDb } from '@/lib/utils'

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId)

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

**Key conventions:**
- Call `requireAuth()` first — returns `{ userId }` or throws
- Filter by `.eq('user_id', userId)` for ownership checks
- Apply `transformXFromDb()` to convert snake_case DB fields to camelCase
- Standard error codes: 401, 400, 404, 500

### Auth Functions

| Function | Use Case |
|----------|----------|
| `requireAuth()` | API key or session auth — most routes |
| `requireSessionAuth()` | Session-only — sensitive routes (API key management, account deletion) |
| `validateScopes(scopes, required)` | Check API key has required scopes |

## Zustand Store Pattern

All stores follow the same shape:

```typescript
interface XState {
  items: Item[]
  loading: boolean
  error: string | null
  initialized: boolean
}
```

CRUD actions: `fetchX`, `addX`, `updateX`, `deleteX`. All use `dedup()` to prevent duplicate concurrent API requests.

## Database

- **Supabase PostgreSQL** with Row Level Security on all tables
- Every table has a `user_id` column with `auth.uid() = user_id` RLS policies
- **Server client** (`@/lib/supabase/server`) for API routes
- **Browser client** (`@/lib/supabase/client`) for client components
- **Migrations**: `make db-new name=description` to create, `make db-push` to apply
- Never edit existing migration files — always create new ones

### Data Transforms

Supabase returns snake_case, the frontend uses camelCase. Transform functions in `src/lib/utils.ts`:

- `transformPostFromDb()` / `transformPostToDb()`
- `transformCampaignFromDb()` / `transformProjectFromDb()`
- Generic: `snakeToCamel()` / `camelToSnake()`

## Design System

**Sticker bomb aesthetic** — bold borders, offset shadows, vibrant colors.

| Class | Effect |
|-------|--------|
| `.sticker-card` | 3px border, 4px shadow, rounded-lg |
| `.sticker-card-hover` | Same + hover lift effect |
| `.sticker-button` | 3px border, 3px shadow, rounded-md, bold |
| `.sticker-input` | 3px border, 3px shadow, focus ring |
| `.sticker-badge` | Inline pill badge with 2px border |

**Colors:** Primary gold (`#ce9a08`), accent pink (`#ec4899`). Platform colors: `twitter`, `linkedin`, `reddit`. Sticker palette: yellow, pink, purple, green, blue, orange, black.

**Fonts:** Nunito (sans), JetBrains Mono (mono).

**Conventions:**
- `'use client'` for interactive components
- `cn()` from `@/lib/utils` for conditional class merging
- Type all props with explicit interfaces

## Testing

- **Unit tests**: Vitest — colocated at `src/**/*.test.ts`
- **E2E tests**: Playwright — at `e2e/*.spec.ts`
- **Test mode**: `E2E_TEST_MODE=true` bypasses auth (test user `00000000-0000-0000-0000-000000000001`)
- Run `make test-run` for single run, `make test` for watch, `make test-e2e` for E2E
