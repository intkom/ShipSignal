/* eslint-disable max-lines -- large page component with extracted sub-components */
import Link from 'next/link'
import {
  Bot,
  Rocket,
  FileText,
  FolderKanban,
  Share2,
  Radio,
  PenLine,
  Send,
  TrendingUp,
  Folder,
} from 'lucide-react'
import { FeatureCarousel } from '@/components/ui/FeatureCarousel'
import type { LucideIcon } from 'lucide-react'

const LANDING_IMG = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/landing`

interface Feature {
  icon: LucideIcon
  sn: string
  title: string
  description: string
  slides: { src: string; alt: string; caption: string }[]
}

const features: Feature[] = [
  {
    icon: Bot,
    sn: 'SN-001',
    title: 'Capture with your AI tooling of choice, anytime',
    description:
      'Save post ideas from Claude, Cursor, or whatever AI tool you use. Capture mid-flow via MCP without breaking your work context.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-1/terminal-1.png`,
        alt: 'MCP create_post in Claude Code',
        caption: 'Save a tweet draft from Claude Code via MCP',
      },
      {
        src: `${LANDING_IMG}/feature-1/step-2.png`,
        alt: 'Dashboard overview with stats',
        caption: 'Your dashboard shows all captured drafts at a glance',
      },
      {
        src: `${LANDING_IMG}/feature-1/step-3.png`,
        alt: 'Dashboard drafts section',
        caption: 'Drafts captured via MCP appear instantly',
      },
    ],
  },
  {
    icon: PenLine,
    sn: 'SN-002',
    title: "Polish and organize when you're ready",
    description:
      'Come back later to draft full announcements, refine messaging, and organize into campaigns. Your product context is waiting for you.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-2/step-1.png`,
        alt: 'Posts list with filter tabs',
        caption: 'Filter posts by status — drafts, scheduled, or all',
      },
      {
        src: `${LANDING_IMG}/feature-2/step-2.png`,
        alt: 'Post editor with content',
        caption: 'Edit content, assign campaigns, and set platforms',
      },
      {
        src: `${LANDING_IMG}/feature-2/step-3.png`,
        alt: 'Post editor scheduling controls',
        caption: 'Schedule posts and configure platform-specific settings',
      },
      {
        src: `${LANDING_IMG}/feature-2/step-4.png`,
        alt: 'Create new post form',
        caption: 'Create posts for X (Twitter) or LinkedIn',
      },
    ],
  },
  {
    icon: Share2,
    sn: 'SN-003',
    title: 'Fork your content across formats',
    description:
      'Take a blog post and turn it into tweets. Turn a feature idea into a LinkedIn update. Transform your context for any platform.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-3/terminal-1.png`,
        alt: 'MCP fork blog to tweets in Claude Code',
        caption: 'Turn a blog post into a tweet thread via MCP',
      },
    ],
  },
  {
    icon: FolderKanban,
    sn: 'SN-004',
    title: 'Organize launches like you organize code',
    description:
      'Group related posts into campaigns. Coordinate product launches, feature drops, and announcements in one place.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-4/step-1.png`,
        alt: 'Dashboard campaigns section',
        caption: 'See all campaigns from your dashboard',
      },
      {
        src: `${LANDING_IMG}/feature-4/step-2.png`,
        alt: 'Campaigns list with filters',
        caption: 'Filter campaigns by status — active, planning, or completed',
      },
      {
        src: `${LANDING_IMG}/feature-4/step-3.png`,
        alt: 'Campaign detail with posts',
        caption: 'Drill into a campaign to see all its posts',
      },
    ],
  },
  {
    icon: Rocket,
    sn: 'SN-005',
    title: 'Dedicated workflows for launch day',
    description:
      'Templates for Product Hunt, Hacker News, and coordinated launches. Keep all your launch communication organized and ready.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-5/step-1.png`,
        alt: 'Launch posts list',
        caption: 'Dedicated launch posts for Product Hunt and Hacker News',
      },
      {
        src: `${LANDING_IMG}/feature-5/step-2.png`,
        alt: 'Launch post creation form',
        caption: 'Create launch posts with platform-specific fields',
      },
      {
        src: `${LANDING_IMG}/feature-5/step-3.png`,
        alt: 'Product Hunt specific fields',
        caption: 'Fill in tagline, pricing, and maker comment for PH',
      },
    ],
  },
  {
    icon: FileText,
    sn: 'SN-006',
    title: 'Draft long-form alongside your social content',
    description:
      'Write blog posts in the same place as your tweets and updates. Keep your full product story in one context-rich workspace.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-6/step-1.png`,
        alt: 'Blog drafts list',
        caption: 'Manage blog drafts with word counts and timestamps',
      },
      {
        src: `${LANDING_IMG}/feature-6/step-2.png`,
        alt: 'Blog editor with markdown',
        caption: 'Rich markdown editor with live word count',
      },
    ],
  },
  {
    icon: Folder,
    sn: 'SN-007',
    title: 'Manage multiple products or clients',
    description:
      'Organize everything by project. Perfect for teams shipping multiple products or agencies managing client launches.',
    slides: [
      {
        src: `${LANDING_IMG}/feature-7/step-1.png`,
        alt: 'Dashboard projects section',
        caption: 'Projects overview right on your dashboard',
      },
      {
        src: `${LANDING_IMG}/feature-7/step-2.png`,
        alt: 'Projects list page',
        caption: 'Browse all projects with descriptions and stats',
      },
      {
        src: `${LANDING_IMG}/feature-7/step-3.png`,
        alt: 'Project detail with campaigns and posts',
        caption: 'Drill into a project to see campaigns and posts',
      },
    ],
  },
]

const steps = [
  {
    number: '01',
    icon: PenLine,
    title: 'Create your post',
    description:
      'Write your content and pick which platforms to publish on. Customize per platform if needed.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Schedule across platforms',
    description:
      'Set the date and time for each platform. ShipSignal handles the rest so you can get back to building.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track performance',
    description:
      'Monitor engagement across all your channels. Learn what works and refine your content strategy.',
  },
]

function TacticalRuler({ label }: { label?: string }) {
  const ticks = 80
  return (
    <div className="mx-auto max-w-6xl px-4 py-1 sm:px-6">
      <div className="relative flex items-center" style={{ height: '28px' }}>
        {/* baseline */}
        <div
          className="absolute inset-x-0 top-1/2"
          style={{ height: '0.5px', background: 'hsl(var(--border))' }}
        />
        {/* tick marks */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const isMajor = i % 20 === 0
          const isMid = i % 10 === 0
          const h = isMajor ? 14 : isMid ? 9 : 4
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i / ticks) * 100}%`,
                top: `calc(50% - ${h / 2}px)`,
                width: '0.5px',
                height: `${h}px`,
                background: isMajor ? 'hsl(var(--foreground) / 0.25)' : 'hsl(var(--border))',
              }}
            />
          )
        })}
        {/* major position labels */}
        {[0, 25, 50, 75, 100].map((pct, i) => (
          <span
            key={pct}
            className="absolute font-mono text-[7px] text-muted-foreground"
            style={{
              left: `${pct}%`,
              top: '1px',
              transform: 'translateX(-50%)',
              letterSpacing: '0.05em',
            }}
          >
            {String(i * 250).padStart(4, '0')}
          </span>
        ))}
        {label && (
          <span
            className="absolute right-0 font-mono text-[8px] uppercase tracking-widest text-muted-foreground"
            style={{ top: '1px' }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line max-lines-per-function
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-sm font-bold uppercase tracking-widest">
              ShipSignal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/articles"
              className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Articles
            </Link>
            <Link
              href="/docs/mcp"
              className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              href="/signup"
              className="sticker-button bg-primary px-4 py-2 text-xs text-primary-foreground"
              style={{ boxShadow: '3px 3px 0 #000' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
        {/* Accent bar */}
        <div className="gradient-bar absolute left-0 top-0 h-0.5 w-full" />

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex">
            <span className="sticker-badge bg-primary/5 font-mono text-primary">NOW IN BETA</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Turn your GitHub activity into <span className="text-primary">social proof</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl font-mono text-sm text-muted-foreground sm:text-base">
            ShipSignal converts your commits and releases into reviewed X and LinkedIn posts in
            seconds.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="sticker-button bg-primary px-10 py-3 text-sm text-primary-foreground"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              Get started free
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <span className="sticker-badge border-twitter bg-twitter-soft font-mono text-twitter">
              X / TWITTER
            </span>
            <span className="sticker-badge border-linkedin bg-linkedin-soft font-mono text-linkedin">
              LINKEDIN
            </span>
          </div>
        </div>
      </section>

      <TacticalRuler label="FEAT-SPEC" />

      {/* Features — alternating text + carousel */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
              SYSTEM / CAPABILITIES
            </p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              The scheduling tool built for AI workflows
            </h2>
            <p className="max-w-2xl font-mono text-sm text-muted-foreground">
              Capture post ideas from Claude, Cursor, or any AI tool. Organize into campaigns.
              Schedule across X (Twitter) and LinkedIn — all in one place.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, idx) => {
              const hasSlides = feature.slides.length > 0
              const isEven = idx % 2 === 0

              return (
                <div
                  key={feature.title}
                  className={`relative border border-border p-6 sm:p-8 ${
                    hasSlides
                      ? `flex flex-col items-start gap-8 sm:gap-12 lg:flex-row ${!isEven ? 'lg:flex-row-reverse' : ''}`
                      : ''
                  }`}
                >
                  {/* Serial number */}
                  <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    [{feature.sn}]
                  </span>

                  {/* Text side */}
                  <div className={hasSlides ? 'flex-1' : 'max-w-2xl'}>
                    {/* Icon row */}
                    <div className="mb-5 flex items-center gap-3 border-l-2 border-primary pl-3">
                      <feature.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {feature.sn}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold sm:text-2xl">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {feature.description}
                    </p>
                  </div>

                  {/* Carousel side */}
                  {hasSlides && (
                    <div className="w-full max-w-xs shrink-0 sm:max-w-sm">
                      <FeatureCarousel slides={feature.slides} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <TacticalRuler label="PROC-SEQ" />

      {/* How it Works */}
      <section className="border-y border-border bg-card px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
              OPERATIONAL / SEQUENCE
            </p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="max-w-2xl font-mono text-sm text-muted-foreground">
              Three steps from draft to published. No complicated setup required.
            </p>
          </div>

          <div className="grid gap-0 sm:grid-cols-3">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className="relative border border-border p-6"
                style={idx > 0 ? { borderLeft: 'none' } : {}}
              >
                <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  [STEP-{step.number}]
                </span>
                <div className="mb-4 font-mono text-3xl font-extrabold text-primary">
                  {step.number}
                </div>
                <step.icon className="mb-3 h-5 w-5 text-foreground" strokeWidth={1.5} />
                <h3 className="mb-2 text-base font-bold uppercase tracking-wide">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TacticalRuler label="TGT-AUD" />

      {/* Target Audience */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div
            className="relative border border-border p-8 sm:p-12"
            style={{ boxShadow: '3px 3px 0 #000' }}
          >
            <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              [REF-USR]
            </span>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
              TARGET / USERS
            </p>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Built for people who ship
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
              ShipSignal is built for developers, indie hackers, and early-stage teams who ship
              fast. Whether you are launching a side project, growing an open-source community, or
              running content for a startup, ShipSignal keeps your social presence consistent
              without becoming a full-time job.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="sticker-badge font-mono text-sticker-green">INDIE HACKERS</span>
              <span className="sticker-badge font-mono text-sticker-blue">DEVELOPERS</span>
              <span className="sticker-badge font-mono text-sticker-purple">OSS MAINTAINERS</span>
              <span className="sticker-badge font-mono text-sticker-orange">EARLY-STAGE</span>
            </div>
          </div>
        </div>
      </section>

      <TacticalRuler label="CTA-MAIN" />

      {/* CTA Footer */}
      <section className="border-t border-border bg-card px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
            INITIATE / DEPLOYMENT
          </p>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Start scheduling for free
          </h2>
          <p className="mb-8 font-mono text-sm text-muted-foreground">
            50 posts · 5 campaigns · 3 projects — no credit card required.
          </p>
          <Link
            href="/signup"
            className="sticker-button inline-block bg-primary px-12 py-4 text-sm text-primary-foreground"
            style={{ boxShadow: '4px 4px 0 #000' }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              ShipSignal
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <Link href="/articles" className="transition-colors hover:text-foreground">
              Articles
            </Link>
            <Link href="/docs/mcp" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <a
              href="https://github.com/shipsignal/shipsignal"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <span>&copy; {new Date().getFullYear()} ShipSignal</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
