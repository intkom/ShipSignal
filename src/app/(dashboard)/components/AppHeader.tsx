'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Settings,
  Plus,
  FolderOpen,
  FileText,
  FolderKanban,
  Rocket,
  Calendar,
  Radio,
} from 'lucide-react'
import { UserMenu } from './UserMenu'
import { UsageBanner } from '@/components/ui/UsageBanner'

interface AppHeaderProps {
  userEmail?: string
  userDisplayName?: string | null
}

// eslint-disable-next-line max-lines-per-function
export function AppHeader({ userEmail, userDisplayName }: AppHeaderProps) {
  const pathname = usePathname()
  const isEditorPage =
    pathname?.startsWith('/new') ||
    pathname?.startsWith('/edit') ||
    pathname?.startsWith('/blog/new') ||
    pathname?.startsWith('/blog/edit')

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-card backdrop-blur-xl border-b border-border"
        style={{ boxShadow: '0 1px 0 0 #E5E5E5' }}
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            {isEditorPage && (
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border-2 border-transparent hover:border-border"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
            )}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div
                className="w-9 h-9 bg-primary flex items-center justify-center text-primary-foreground"
                style={{ borderRadius: '2px', boxShadow: '2px 2px 0 #000' }}
              >
                <Radio className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span
                className="font-bold text-lg md:text-xl tracking-tight uppercase"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
              >
                ShipSignal
              </span>
            </Link>
          </div>

          {/* Desktop nav icons - hidden on mobile */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2">
            <Link
              href="/calendar"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname?.startsWith('/calendar') && 'bg-secondary text-foreground border-border'
              )}
              aria-label="Calendar"
            >
              <Calendar className="w-5 h-5" />
            </Link>
            <Link
              href="/projects"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname?.startsWith('/projects') && 'bg-secondary text-foreground border-border'
              )}
              aria-label="Projects"
            >
              <FolderKanban className="w-5 h-5" />
            </Link>
            <Link
              href="/campaigns"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname?.startsWith('/campaigns') && 'bg-secondary text-foreground border-border'
              )}
              aria-label="Campaigns"
            >
              <FolderOpen className="w-5 h-5" />
            </Link>
            <Link
              href="/blog"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname?.startsWith('/blog') && 'bg-secondary text-foreground border-border'
              )}
              aria-label="Blog Drafts"
            >
              <FileText className="w-5 h-5" />
            </Link>
            <Link
              href="/launch-posts"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname?.startsWith('/launch-posts') &&
                  'bg-secondary text-foreground border-border'
              )}
              aria-label="Launch Posts"
            >
              <Rocket className="w-5 h-5" />
            </Link>
            <Link
              href="/settings"
              className={cn(
                'p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-all',
                'hover:text-foreground hover:bg-secondary',
                'border-2 border-transparent hover:border-border',
                pathname === '/settings' && 'bg-secondary text-foreground border-border'
              )}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <div className="ml-2">
              {userEmail ? (
                <UserMenu email={userEmail} displayName={userDisplayName} />
              ) : (
                <div className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-md bg-sticker-purple flex items-center justify-center text-xs font-bold text-white border-2 border-border">
                  U
                </div>
              )}
            </div>
          </nav>
          {/* Mobile user avatar only */}
          <div className="md:hidden">
            {userEmail ? (
              <UserMenu email={userEmail} displayName={userDisplayName} />
            ) : (
              <div className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-md bg-sticker-purple flex items-center justify-center text-xs font-bold text-white border-2 border-border">
                U
              </div>
            )}
          </div>
        </div>
        {/* Orange accent line under header */}
        <div className="gradient-bar" />
      </header>
      <UsageBanner />
    </>
  )
}

export function FloatingActionButton() {
  const pathname = usePathname()
  const isEditorPage =
    pathname?.startsWith('/new') ||
    pathname?.startsWith('/edit') ||
    pathname?.startsWith('/blog/new') ||
    pathname?.startsWith('/blog/edit')

  if (isEditorPage) return null

  return (
    <Link
      href="/new"
      className={cn(
        'fixed bottom-8 right-8 z-50',
        'w-12 h-12',
        'bg-foreground',
        'flex items-center justify-center',
        'text-card',
        'transition-all duration-150',
        'hidden md:flex'
      )}
      style={{
        borderRadius: '2px',
        boxShadow: '2px 2px 0 #FF4F00',
      }}
      aria-label="Create new post"
    >
      <Plus className="w-5 h-5" strokeWidth={2.5} />
    </Link>
  )
}
