# Self-Hosting Guide

Deploy your own instance of Bullhorn.

## Prerequisites

- [Supabase](https://supabase.com) account (free tier works)
- [Vercel](https://vercel.com) account (or any Node.js host)
- Node.js 20+

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmean-weasel%2Fbullhorn&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Required%20Supabase%20credentials&envLink=https%3A%2F%2Fgithub.com%2Fmean-weasel%2Fbullhorn%2Fblob%2Fmain%2Fdocs%2Fenvironment-variables.md)

You'll be prompted for your Supabase credentials during setup.

## Manual Setup

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/bullhorn.git
cd bullhorn
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** from Settings > API

### 3. Apply database migrations

Install the Supabase CLI, then:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

This creates all required tables, RLS policies, and functions.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in at minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See [environment-variables.md](environment-variables.md) for the full list of required, recommended, and optional variables.

### 5. Configure authentication

In your Supabase dashboard under Authentication > Providers:

- **Email**: Enabled by default
- **Google OAuth** (optional): Add your Google Cloud OAuth client ID and secret

### 6. Deploy

**Vercel:**
```bash
npx vercel
```

**Other hosts:**
```bash
npm run build
npm start
```

### 7. Set up cron jobs

Bullhorn uses scheduled jobs for background tasks. On Vercel, these are configured automatically via `vercel.json`:

| Cron | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/publish` | Every 5 minutes | Publish scheduled posts |
| `/api/cron/retry-failed` | Every hour | Retry failed publications |
| `/api/cron/refresh-tokens` | Every 6 hours | Refresh OAuth tokens |
| `/api/cron/calendar-nudges` | Every 6 hours | Send calendar event nudges |

If not using Vercel, set up equivalent cron jobs that make GET requests to these paths. The requests must include a `CRON_SECRET` header for authentication.

## Optional Services

These are not required but enable additional features:

| Service | Purpose | Variables |
|---------|---------|-----------|
| [Upstash Redis](https://upstash.com) | Rate limiting (10 req/10s per IP) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| [Sentry](https://sentry.io) | Error monitoring | `NEXT_PUBLIC_SENTRY_DSN` |
| [Resend](https://resend.com) | Email notifications | `RESEND_API_KEY` |
| Twitter API | Publish to Twitter | `TWITTER_*` vars |
| LinkedIn API | Publish to LinkedIn | `LINKEDIN_*` vars |
| Reddit API | Publish to Reddit | `REDDIT_*` vars |

## iOS App (Optional)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for iOS/Capacitor setup. You'll need your own Apple Developer account and must change the Bundle ID, Team ID, and Google Client IDs.

## Updating

Pull upstream changes and re-deploy:

```bash
git fetch upstream
git merge upstream/main
npm install
npx supabase db push   # Apply any new migrations
```

## Troubleshooting

**Build fails with missing env vars**: Ensure all required variables from [environment-variables.md](environment-variables.md) are set.

**Auth not working**: Check that your Supabase URL and keys are correct, and that email provider is enabled in Supabase Authentication settings.

**Cron jobs not running**: On Vercel, crons only run in production deployments. For other hosts, verify your cron scheduler is hitting the correct URLs with the `CRON_SECRET` header.
