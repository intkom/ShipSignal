/* eslint-disable max-lines -- large page component with extracted sub-components */
import Link from 'next/link'
import { FileText, FolderKanban, Radio, PenLine, Send, TrendingUp } from 'lucide-react'

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
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-28">
        {/* Accent bar */}
        <div className="gradient-bar absolute left-0 top-0 h-0.5 w-full" />

        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-8 inline-flex">
            <span className="sticker-badge bg-primary/5 font-mono text-primary">NOW IN BETA</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
            Turn your GitHub activity into <span className="text-primary">social proof</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
            ShipSignal converts your commits and releases into reviewed X and LinkedIn posts in
            seconds.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row">
            <Link
              href="/signup"
              className="btn-primary px-10 py-3 uppercase tracking-[0.08em]"
            >
              GET STARTED FREE
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:mt-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[9px] font-semibold text-neutral-500">
                X
              </span>
              Twitter
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[8px] font-semibold text-neutral-500">
                in
              </span>
              LinkedIn
            </span>
          </div>

          <div className="mt-14 w-full max-w-3xl sm:mt-16">
            <div className="card-clean overflow-hidden bg-white">
              <div className="border-b border-[#e5e5e5] px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-neutral-200 bg-white">
                      <Radio className="h-4 w-4 text-black" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="h-2.5 w-24 rounded-full bg-neutral-900/90" />
                      <div className="h-2 w-16 rounded-full bg-neutral-200" />
                    </div>
                  </div>
                  <div className="rounded-[8px] bg-[#ff4f00] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    New Post
                  </div>
                </div>
              </div>

              <div className="grid gap-0 border-t border-[#f1f1f1] md:grid-cols-[1.45fr_0.9fr]">
                <div className="space-y-4 border-b border-[#e5e5e5] p-4 md:border-b-0 md:border-r md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-black" strokeWidth={1.75} />
                      <div className="h-2.5 w-24 rounded-full bg-neutral-900" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-[#ff4f00]" />
                  </div>

                  {[
                    { wide: 'w-full', short: 'w-24' },
                    { wide: 'w-[92%]', short: 'w-20' },
                    { wide: 'w-[86%]', short: 'w-16' },
                  ].map((row, index) => (
                    <div
                      key={`post-row-${index}`}
                      className="rounded-[10px] border border-neutral-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className={`h-2.5 rounded-full bg-neutral-300 ${row.wide}`} />
                          <div className={`h-2 rounded-full bg-neutral-200 ${row.short}`} />
                        </div>
                        <div className="mt-0.5 h-5 w-5 rounded-full border border-neutral-900 bg-white" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-black" strokeWidth={1.75} />
                    <div className="h-2.5 w-20 rounded-full bg-neutral-900" />
                  </div>

                  <div className="rounded-[10px] border border-neutral-200 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="h-2.5 w-[4.5rem] rounded-full bg-neutral-300" />
                      <div className="h-2.5 w-10 rounded-full bg-[#ff4f00]" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-neutral-200" />
                      <div className="h-2 w-[82%] rounded-full bg-neutral-200" />
                      <div className="h-2 w-[64%] rounded-full bg-neutral-200" />
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-neutral-200 bg-white p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-black" strokeWidth={1.75} />
                      <div className="h-2.5 w-16 rounded-full bg-neutral-900" />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="h-8 w-6 rounded-t-[6px] bg-neutral-200" />
                      <div className="h-12 w-6 rounded-t-[6px] bg-neutral-300" />
                      <div className="h-16 w-6 rounded-t-[6px] bg-[#ff4f00]" />
                      <div className="h-10 w-6 rounded-t-[6px] bg-neutral-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-black sm:text-4xl md:text-5xl">
            The scheduling tool built for AI workflows
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-neutral-600 sm:text-base">
            Draft, schedule, and organize product storytelling in one clean operational view.
          </p>

          <div className="mt-14 sm:mt-16">
            <div className="card-clean mx-auto max-w-5xl overflow-hidden px-6 py-8 text-left sm:px-10 sm:py-10 lg:px-14 lg:py-14">
              <div className="flex flex-col gap-10 lg:gap-12">
                <div className="flex flex-col gap-6 border-b border-[#e5e5e5] pb-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-neutral-200 bg-white">
                      <Radio className="h-5 w-5 text-black" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-28 rounded-full bg-neutral-900" />
                      <div className="h-2.5 w-40 rounded-full bg-neutral-200" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="h-9 w-24 rounded-[8px] bg-[#ff4f00]" />
                    <div className="h-9 w-9 rounded-[8px] border border-neutral-200 bg-white" />
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-10">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-black" strokeWidth={1.75} />
                        <div className="h-2.5 w-28 rounded-full bg-neutral-900" />
                      </div>
                      <div className="h-7 w-20 rounded-[8px] bg-[#ff4f00]" />
                    </div>

                    {[
                      { title: 'w-[92%]', meta: 'w-24' },
                      { title: 'w-[86%]', meta: 'w-20' },
                      { title: 'w-full', meta: 'w-16' },
                    ].map((row, index) => (
                      <div
                        key={`interface-row-${index}`}
                        className="rounded-[12px] border border-[#e5e5e5] bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className={`h-2.5 rounded-full bg-neutral-300 ${row.title}`} />
                            <div className={`h-2 rounded-full bg-neutral-200 ${row.meta}`} />
                          </div>
                          <div className="h-6 w-16 rounded-full bg-[#ff4f00]" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[12px] border border-[#e5e5e5] bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="h-4 w-4 text-black" strokeWidth={1.75} />
                          <div className="h-2.5 w-20 rounded-full bg-neutral-900" />
                        </div>
                        <div className="h-2.5 w-12 rounded-full bg-[#ff4f00]" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 rounded-full bg-neutral-200" />
                        <div className="h-2 w-[82%] rounded-full bg-neutral-200" />
                        <div className="h-2 w-[70%] rounded-full bg-neutral-200" />
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-[#e5e5e5] bg-white p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-black" strokeWidth={1.75} />
                        <div className="h-2.5 w-[4.5rem] rounded-full bg-neutral-900" />
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="h-10 w-8 rounded-t-[8px] bg-neutral-200" />
                        <div className="h-14 w-8 rounded-t-[8px] bg-neutral-300" />
                        <div className="h-20 w-8 rounded-t-[8px] bg-[#ff4f00]" />
                        <div className="h-12 w-8 rounded-t-[8px] bg-neutral-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
