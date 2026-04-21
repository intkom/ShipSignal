# shipsignal

[![CI](https://github.com/intkom/shipsignal/actions/workflows/ci.yml/badge.svg)](https://github.com/intkom/shipsignal/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

Social media post scheduler for Twitter, LinkedIn, and Reddit.

Plan, draft, and schedule your social media content. Organize posts into campaigns and projects, set publish dates, and manage your content pipeline from idea to published.

**[shipsignal.to](https://shipsignal.to)**

<!-- TODO: add screenshot or GIF of dashboard -->

## Features

- **Multi-platform drafting** — Write posts for Twitter, LinkedIn, and Reddit with platform-specific formatting and character limits
- **Campaigns & projects** — Organize posts into campaigns, group campaigns into projects
- **Scheduling** — Set publish dates and track your content pipeline
- **Blog drafts** — Long-form content with Markdown support
- **Launch posts** — Dedicated workspace for product launch announcements
- **Media uploads** — Attach images with drag-and-drop, stored in Supabase Storage
- **API & MCP server** — Programmatic access via API keys, plus an MCP server for AI-native workflows
- **iOS app** — Native iOS app via Capacitor (TestFlight)
- **Push notifications** — Web push and iOS push for scheduled post reminders
- **Community events** — Calendar of social media events with nudge reminders

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fintkom%shipsignal&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Required%20Supabase%20credentials&envLink=https%3A%2F%2Fgithub.com%2Fintkom%shipsignal%2Fblob%2Fmain%2Fdocs%2Fenvironment-variables.md)

See the [Self-Hosting Guide](docs/self-hosting.md) for detailed setup instructions.

## Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Framework  | Next.js 15 (App Router)                |
| Database   | Supabase (PostgreSQL + Auth + Storage) |
| State      | Zustand                                |
| Styling    | Tailwind CSS                           |
| Hosting    | Vercel                                 |
| iOS        | Capacitor 8                            |
| Monitoring | Sentry                                 |

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials (see docs/environment-variables.md)
make dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup, code style, and contribution guidelines.

## Development

```bash
make dev          # Start dev server
make check        # Lint + typecheck
make test         # Unit tests (watch)
make test-e2e     # E2E tests (Playwright)
make ci           # Full CI checks
```

Run `make help` to see all available commands.

## Architecture

See [docs/architecture.md](docs/architecture.md) for app structure, API patterns, store patterns, database conventions, and design system.

## Documentation

- [Architecture](docs/architecture.md) — App structure, patterns, design system
- [Environment Variables](docs/environment-variables.md) — All env vars with setup instructions
- [Self-Hosting](docs/self-hosting.md) — Deploy your own instance
- [Contributing](CONTRIBUTING.md) — Development setup and guidelines
- [Roadmap](docs/ROADMAP.md) — Planned features
- [Security Policy](SECURITY.md) — Vulnerability reporting
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

[AGPL-3.0](LICENSE) — You can use, modify, and self-host shipsignal freely. If you distribute a modified version or run it as a network service, you must make your source code available under the same license.

Copyright (C) 2026 Mean Weasel LLC
