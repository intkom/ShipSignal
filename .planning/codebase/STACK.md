# Technology Stack

**Analysis Date:** 2026-04-21

## Languages

**Primary:**

- TypeScript 5.3.3 - All application code in `src/`
- TSX - React components throughout `src/app/` and `src/components/`

**Secondary:**

- JavaScript - Config files (`eslint.config.js`, scripts)
- CSS - `src/index.css` (Tailwind CSS source)

## Runtime

**Environment:**

- Node.js 24.15.0 (current dev environment; no `.nvmrc` pinning)
- ESM (`"type": "module"` in `package.json`)

**Package Manager:**

- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**

- Next.js 15.5.12 — App Router, SSR/SSG, API routes at `src/app/api/`
- React 18.3.1 — UI rendering
- React DOM 18.3.1 — DOM rendering

**Testing:**

- Vitest 4.0.16 — Unit test runner; config via `vitest.config.ts`
- @playwright/test 1.58.2 — E2E tests in `e2e/` directory
- @testing-library/react 16.3.2 — Component testing helpers
- @testing-library/jest-dom 6.9.1 — DOM matchers
- jsdom 28.1.0 — DOM environment for unit tests
- @vitest/coverage-v8 4.0.16 — Code coverage

**Build/Dev:**

- Vite 6.4.1 — Bundler for unit tests (Vitest uses it internally)
- @vitejs/plugin-react 4.2.1 — React transform for Vite
- @tailwindcss/postcss 4.2.1 — Tailwind CSS processing
- PostCSS 8.5.8 — CSS transformation pipeline
- tsx 4.7.0 — TypeScript execution for scripts

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.99.0 — Primary database and auth client
- `@supabase/ssr` 0.9.0 — SSR-compatible Supabase client helpers
- `zustand` 4.4.7 — Client-side state management
- `next` 15.5.12 — Framework powering routing, SSR, API routes
- `zod` 4.3.6 — Schema validation (API inputs, env vars)

**Infrastructure:**

- `@upstash/ratelimit` 2.0.8 — Rate limiting (optional, degrades gracefully without Redis)
- `@upstash/redis` 1.36.4 — Redis client for rate limiting
- `node-cron` 4.2.1 — Internal cron scheduler for self-hosted mode (`src/lib/scheduler.ts`)
- `web-push` 3.6.7 — Web Push API notifications (VAPID-based); `src/lib/webPushSender.ts`
- `resend` 6.9.3 — Transactional email; `src/lib/emailSender.ts`
- `@sentry/nextjs` 10.42.0 — Error monitoring and tracing

**UI:**

- `tailwind-merge` 2.2.0 — Conditional Tailwind class merging (used by `cn()`)
- `clsx` 2.1.0 — Class name utility (used in `cn()` from `src/lib/utils.ts`)
- `lucide-react` 0.577.0 — Icon library
- `react-hot-toast` 2.6.0 — Toast notifications
- `date-fns` 3.2.0 — Date utilities
- `rrule` 2.8.1 — Recurring post schedule rules
- `react-markdown` 10.1.0 + `remark-gfm` 4.0.1 — Markdown rendering

**AI:**

- `@anthropic-ai/sdk` 0.90.0 — Anthropic Claude API for post content generation (`src/lib/aiTransformer.ts`)

**Mobile (Capacitor):**

- `@capacitor/core` 8.2.0 — Capacitor bridge for iOS WebView app
- `@capacitor/ios` 8.2.0 — iOS platform
- `@capacitor/push-notifications` 8.0.2 — Native push notification registration
- `@capacitor/local-notifications` 8.0.2 — Local notification scheduling
- `@capgo/capacitor-social-login` 8.3.8 — Google Sign-In on iOS
- Additional Capacitor plugins: `app`, `browser`, `clipboard`, `dialog`, `haptics`, `keyboard`, `network`, `share`, `splash-screen`, `status-bar`, `@capacitor-community/in-app-review`, `@capawesome/capacitor-badge`

**Analytics:**

- `posthog-js` 1.360.2 — Product analytics (`src/lib/posthog.tsx`)
- `@vercel/analytics` 1.6.1 — Vercel web analytics
- `@vercel/speed-insights` 1.3.1 — Vercel Core Web Vitals tracking

## Configuration

**TypeScript:**

- `tsconfig.json` — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, target ES2020
- Path alias `@/*` maps to `./src/*`
- `tsconfig.node.json` — separate config for config files

**Build:**

- `next.config.*` — Next.js config (not read; present in root)
- `postcss.config.*` — PostCSS/Tailwind pipeline
- `tailwind.config.*` — Tailwind customizations

**Code Quality:**

- `eslint.config.js` — Flat ESLint config: TypeScript-ESLint, react-hooks, react-refresh, security plugin
  - File limits: 300 lines/file, 50 lines/function, 120 chars/line
  - Security rules: `detect-unsafe-regex` (error), `detect-buffer-noassert` (error), `detect-eval-with-expression` (error), `detect-no-csrf-before-method-override` (error)
- `.prettierrc` — `semi: false`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: es5`, `printWidth: 100`
- `knip` 5.86.0 — Dead code and unused dependency detection
- `husky` 9.1.7 — Git hooks (pre-commit: lint + typecheck + tests + format check)
- `@commitlint/cli` 20.4.3 + `@commitlint/config-conventional` — Commit message linting
- `semantic-release` 25.0.3 + plugins — Automated versioning from commit types

**Environment:**

- `src/lib/envValidation.ts` — Startup validation; throws on missing required vars
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional vars: `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `TWITTER_CLIENT_ID`, `LINKEDIN_CLIENT_ID`

## Platform Requirements

**Development:**

- Node.js (v24 in current env; no hard pin)
- npm for package management
- Supabase CLI for database migrations (`supabase` CLI, `SUPABASE_ACCESS_TOKEN` in shell env)
- Xcode for iOS builds (macOS only)

**Production:**

- Hosted on Vercel (SaaS mode)
- Supabase cloud (PostgreSQL + Auth + Storage)
- Self-hosted alternative: Docker Compose running Supabase locally with `SELF_HOSTED=true`
- iOS: Capacitor WebView pointing at `https://shipsignal.app` (production) or localhost (dev)
- App ID: `to.shipsignal.app`, App Name: `ShipSignal`

---

_Stack analysis: 2026-04-21_
