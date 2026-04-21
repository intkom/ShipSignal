# Coding Conventions

**Analysis Date:** 2026-04-21

## TypeScript

**Mode:** Strict (`"strict": true` in `tsconfig.json`)

**Additional strictness flags:**

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Target:** ES2020, module resolution `bundler`

**Path alias:** `@/*` maps to `./src/*`. Use `@/lib/...`, `@/components/...`, `@/hooks/...` everywhere. Never use relative paths for cross-directory imports.

**Unused vars rule:** Prefix with `_` to intentionally ignore: `_userId`, `_error`. Caught errors may also be named `error` or `err`.

## File Naming

- React components: `PascalCase.tsx` — e.g., `PostCard.tsx`, `AppHeader.tsx`
- Hooks: `camelCase.ts` starting with `use` — e.g., `useAutoSave.ts`, `useKeyboardShortcuts.ts`
- Stores (Zustand): `camelCase.ts` — e.g., `campaigns.ts`, `analyticsStore.ts`
- API routes: `route.ts` inside the Next.js App Router directory
- Test files: co-located with source, same name + `.test.ts` / `.test.tsx`
- Split test files: append `.part2.test.ts`, `.part3.test.ts` etc. when a single test file would exceed the 300-line limit
- Utility libraries: `camelCase.ts` — e.g., `utils.ts`, `cronAuth.ts`

## Component Patterns

**Client directive:** Place `'use client'` as the first line for any component using state, effects, or browser APIs.

```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  isActive?: boolean
  onClose: () => void
}

export function MyComponent({ title, isActive = false, onClose }: MyComponentProps) {
  // ...
}
```

**Rules:**

- Always declare a named `interface` for component props — never use inline object types in function signatures
- Use `cn()` from `@/lib/utils` for all conditional class merging (wraps `clsx` + `tailwind-merge`)
- Prefer named exports over default exports for components (except Next.js page/layout files which require default exports)
- `eslint-disable max-lines-per-function` comment is accepted on large page components, but extraction is preferred

## Import Ordering

No automated import sorting enforced. Convention observed in source:

1. React and Next.js framework imports
2. Third-party library imports (lucide-react, date-fns, etc.)
3. Internal `@/lib/...` imports (stores, utilities, types)
4. Internal `@/components/...` and `@/hooks/...` imports
5. Relative imports (same directory)

```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Clock, Edit2 } from 'lucide-react'
import { Post } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { usePostsStore } from '@/lib/storage'
import { PostCard } from './PostCard'
```

## API Route Pattern

Every API route must follow this exact structure:

```typescript
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { transformXFromDb } from '@/lib/utils'

export async function GET(request: NextRequest) {
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

**Mandatory rules:**

- Call `requireAuth()` first — returns `{ userId }` or throws `'Unauthorized'`
- Always filter Supabase queries by `.eq('user_id', userId)` — RLS-equivalent ownership check
- Apply the appropriate `transformXFromDb()` function from `src/lib/utils.ts` to all DB results
- Standard error status codes: 401 (unauthorized), 403 (forbidden), 400 (bad request), 404 (not found), 500 (server error)
- For API key scoped requests, call `validateScopes(auth.scopes, required)` after `requireAuth()`
- Add `export const dynamic = 'force-dynamic'` to routes that must not be statically cached
- Use Zod schemas (`z.object(...)`) to validate POST/PUT request bodies; return 400 with `details` on parse failure

## Zustand Store Pattern

```typescript
import { create } from 'zustand'
import { dedup, createDedupKey } from './requestDedup'

interface XState {
  items: Item[]
  loading: boolean
  error: string | null
  initialized: boolean
}

interface XActions {
  fetchItems: () => Promise<void>
  addItem: (data: CreateInput) => Promise<Item>
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

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

**Mandatory rules:**

- State shape always includes `{ items, loading, error, initialized }` (or resource-specific equivalents)
- Use `dedup()` with `createDedupKey()` from `src/lib/requestDedup.ts` on all fetch actions to prevent duplicate concurrent API calls
- Implement optimistic updates for mutations (`addItem`, `updateItem`, `deleteItem`) — set local state immediately, rollback on error
- Store files live in `src/lib/` named after the resource (e.g., `src/lib/campaigns.ts`, `src/lib/blogDrafts.ts`)

## Data Transforms

All Supabase rows use `snake_case`. Frontend types use `camelCase`. Always apply the appropriate transform function from `src/lib/utils.ts`:

- `transformPostFromDb()` / `transformPostToDb()` — posts table
- `transformCampaignFromDb()` — campaigns table
- `transformProjectFromDb()` / `transformProjectToDb()` — projects table
- `transformAnalyticsConnectionFromDb()` / `transformAnalyticsConnectionToDb()` — analytics table
- Generic: `snakeToCamel()` / `camelToSnake()` for other tables

Typed DB row interfaces (`DbPost`, `DbPostInsert`, etc.) are defined in `src/lib/utils.ts`.

## Self-Hosted Mode Gating

Use `isSelfHosted()` from `src/lib/selfHosted.ts` — never check `process.env.SELF_HOSTED` directly:

```typescript
import { isSelfHosted } from '@/lib/selfHosted'

if (isSelfHosted()) {
  // self-hosted behavior
}
```

## Error Handling

**In API routes:** Catch all errors in a top-level `try/catch`. Re-throw Supabase errors (`if (error) throw error`). Map known error messages to HTTP status codes. Default to 500.

**In stores:** Set `{ error: (error as Error).message, loading: false }` in catch blocks.

**In components:** Use `react-hot-toast` for user-facing error notifications.

## CSS / Tailwind Conventions

**Design system:** Sticker bomb aesthetic — bold 3px borders, 4px offset box shadows, vibrant palette.

**Utility classes (always use instead of raw Tailwind equivalents):**

| Class                 | Use for                |
| --------------------- | ---------------------- |
| `.sticker-card`       | Cards and panels       |
| `.sticker-card-hover` | Clickable cards        |
| `.sticker-button`     | Primary action buttons |
| `.sticker-input`      | Form inputs            |
| `.sticker-badge`      | Status/label pills     |

**Platform colors (Tailwind custom tokens):**

- Twitter: `bg-twitter`, `text-twitter`, `border-twitter-border`, `bg-twitter-soft`
- LinkedIn: `bg-linkedin`, `text-linkedin`, `border-linkedin-border`, `bg-linkedin-soft`
- Reddit: `bg-reddit`, `text-reddit`, `border-reddit-border`, `bg-reddit-soft`

**Sticker palette tokens:** `sticker-yellow`, `sticker-pink`, `sticker-purple`, `sticker-green`, `sticker-blue`, `sticker-orange`, `sticker-black`

**Primary gold color:** CSS variable `--primary` (`#ce9a08`) — use `text-primary`, `bg-primary`, etc. Do not hardcode hex.

## Code Style (Prettier)

Config at `.prettierrc`:

- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- 2-space indent
- Trailing commas in multi-line arrays/objects (`"trailingComma": "es5"`)
- Max line width 100 chars

`make fix` runs both ESLint fix and Prettier. `make format` runs Prettier only.

## ESLint Limits

File: `eslint.config.js`

- Max file lines: 300 (warn) — use `/* eslint-disable max-lines */` comment when a page component legitimately exceeds this
- Max function lines: 50 (warn) — use `// eslint-disable-next-line max-lines-per-function` comment on large handler functions
- Max line length: 120 chars (warn)
- Security plugin is active — `detect-unsafe-regex` and `detect-eval-with-expression` are errors

## Git Commit Conventions

Format: `<type>: <description>` (50-char max subject line, imperative mood)

| Type       | Version bump | When                       |
| ---------- | ------------ | -------------------------- |
| `feat`     | Minor        | New user-facing capability |
| `fix`      | Patch        | Bug fix                    |
| `perf`     | Patch        | Performance improvement    |
| `security` | Patch        | Security fix               |
| `docs`     | None         | Docs only                  |
| `test`     | None         | Adding/updating tests      |
| `chore`    | None         | Maintenance, deps, config  |
| `refactor` | None         | Code restructure only      |
| `ci`       | None         | CI/CD changes              |
| `style`    | None         | Formatting only            |

Breaking changes: `feat!: ...` — triggers major version bump.

Commits are validated by commitlint git hook. Failing messages are rejected at commit time.

## Logging

Use `console.error()` for errors in API routes and server-side code. No structured logging library. Browser-side code may use `console.warn()` for non-critical issues. Do not log sensitive data (tokens, passwords, user content).

## Comments

- Use `/** JSDoc */` style for exported utility functions that other modules consume
- Use `// ---------------------------------------------------------------------------` section dividers in long files (common in test files and large stores)
- Use `// eslint-disable-next-line <rule> -- reason` inline disables with explanation
- Avoid commenting obvious code; prefer self-documenting names
