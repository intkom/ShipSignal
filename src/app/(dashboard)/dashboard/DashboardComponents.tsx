'use client'

import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Calendar, Clock, ChevronRight, FolderOpen, FolderKanban } from 'lucide-react'
import { Post, getPostPreviewText, Campaign, Project } from '@/lib/posts'
import { cn } from '@/lib/utils'

const PLATFORM_STAMP: Record<string, string> = {
  twitter: 'X.COM',
  linkedin: 'LINKEDIN',
  reddit: 'REDDIT',
}

const PLATFORM_DOT: Record<string, string> = {
  twitter: 'bg-twitter',
  linkedin: 'bg-linkedin',
  reddit: 'bg-reddit',
}

// Platform icon component
export function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249z" />
    </svg>
  )
}

// Post card — technical data sheet aesthetic
// eslint-disable-next-line max-lines-per-function -- borderline, extraction would hurt readability
export function DashboardPostCard({
  post,
  showSchedule = false,
}: {
  post: Post
  showSchedule?: boolean
}) {
  const previewText = getPostPreviewText(post)

  return (
    <Link
      href={`/edit/${post.id}`}
      className={cn('block bg-card border border-border transition-all duration-150 group')}
      style={{ borderRadius: '2px', boxShadow: '2px 2px 0 #000' }}
    >
      {/* Platform stamp bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
        <span
          className={cn('w-1.5 h-1.5 shrink-0', PLATFORM_DOT[post.platform] ?? 'bg-foreground')}
          style={{ borderRadius: '0' }}
        />
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          [{PLATFORM_STAMP[post.platform] ?? post.platform.toUpperCase()}]
        </span>
        <span className="ml-auto font-mono text-[10px] tracking-wider uppercase text-muted-foreground/60">
          {post.status}
        </span>
      </div>

      {/* Content preview */}
      <div className="px-3 py-3">
        <p className="text-sm leading-relaxed line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors">
          {previewText || (
            <span className="text-muted-foreground italic font-mono text-xs">
              // no content yet
            </span>
          )}
        </p>
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
        <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
          {showSchedule && post.scheduledAt
            ? format(new Date(post.scheduledAt), 'yyyy-MM-dd HH:mm')
            : formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
        </span>
        <ChevronRight className="w-3 h-3 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

// Campaign status badge
const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: 'text-muted-foreground border-border bg-muted',
  active: 'text-sticker-green border-sticker-green/40 bg-sticker-green/5',
  completed: 'text-sticker-blue border-sticker-blue/40 bg-sticker-blue/5',
  archived: 'text-muted-foreground border-border bg-muted',
}

// Mini project card — data sheet
export function ProjectMiniCard({
  project,
  campaignCount,
}: {
  project: Project
  campaignCount: number
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-card border border-border transition-all duration-150 group"
      style={{ borderRadius: '2px', boxShadow: '2px 2px 0 #000' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
        <FolderKanban className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          PROJECT
        </span>
      </div>
      <div className="px-3 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
              {campaignCount} CAMPAIGNS
            </span>
            {project.hashtags.length > 0 && (
              <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
                {project.hashtags.length} TAGS
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
      </div>
    </Link>
  )
}

// Campaign card component
export function DashboardCampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block bg-card border border-border transition-all duration-150 group"
      style={{ borderRadius: '2px', boxShadow: '2px 2px 0 #000' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
        <FolderOpen className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          CAMPAIGN
        </span>
        <span
          className={cn(
            'ml-auto font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border',
            CAMPAIGN_STATUS_STYLES[campaign.status]
          )}
          style={{ borderRadius: '2px' }}
        >
          {campaign.status}
        </span>
      </div>

      <div className="px-3 py-3">
        <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
          {campaign.name || 'Untitled Campaign'}
        </h3>
        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{campaign.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
        <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
          {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}
        </span>
        <ChevronRight className="w-3 h-3 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

// Section component
// eslint-disable-next-line max-lines-per-function -- near-borderline, extraction would hurt readability
export function DashboardSection({
  title,
  icon: Icon,
  children,
  viewAllLink,
  viewAllLabel = 'View all',
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  icon: typeof Calendar
  children: React.ReactNode
  viewAllLink: string
  viewAllLabel?: string
  isEmpty?: boolean
  emptyIcon?: typeof Calendar
  emptyTitle?: string
  emptyDescription?: string
}) {
  return (
    <section className="animate-fade-in">
      {/* Section header — Technical Blueprint style */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground truncate"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {title}
          </h2>
        </div>
        {!isEmpty && (
          <Link
            href={viewAllLink}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            {viewAllLabel}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Content or empty state */}
      {isEmpty ? (
        <div
          className="text-center py-8 px-4 border border-dashed border-border bg-card"
          style={{ borderRadius: '2px' }}
        >
          {EmptyIcon && (
            <div
              className="w-10 h-10 mx-auto mb-3 bg-secondary flex items-center justify-center border border-border"
              style={{ borderRadius: '2px' }}
            >
              <EmptyIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <p className="text-xs font-semibold mb-1 uppercase tracking-wider font-mono">
            {emptyTitle}
          </p>
          <p className="text-xs text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  )
}
