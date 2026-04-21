'use client'
/* eslint-disable max-lines-per-function -- collapsible draft list with edit/schedule per post */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Calendar,
  Check,
  X,
  Github,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePostsStore } from '@/lib/storage'
import { useGithubProjectsStore } from '@/lib/githubProjects'
import type { Post } from '@/lib/posts'
import { cn } from '@/lib/utils'

const SHIPSIGNAL_PREFIX = '[shipsignal]'

function extractRepoUrl(notes: string): string | null {
  if (!notes.startsWith('[shipsignal]')) return null
  const url = notes.split(' ').find((p) => p.startsWith('http'))
  return url ?? null
}

function isShipSignalDraft(post: Post): boolean {
  return (
    (post.status === 'draft' || post.status === 'scheduled') &&
    (post.notes?.startsWith(SHIPSIGNAL_PREFIX) ?? false)
  )
}

function PlatformBadge({ platform, isNewsletter }: { platform: string; isNewsletter: boolean }) {
  if (isNewsletter) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-sticker-purple/10 text-sticker-purple border-sticker-purple/30 uppercase tracking-wide">
        Newsletter
      </span>
    )
  }
  if (platform === 'twitter') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-twitter/10 text-twitter border-twitter/30 uppercase tracking-wide">
        𝕏 Thread
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-linkedin/10 text-linkedin border-linkedin/30 uppercase tracking-wide">
      LinkedIn
    </span>
  )
}

function DraftCard({ post }: { post: Post }) {
  const updatePost = usePostsStore((s) => s.updatePost)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleAt, setScheduleAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [saving, setSaving] = useState(false)

  const isNewsletter = post.notes?.includes('[newsletter]') ?? false
  const text = 'text' in post.content ? (post.content as { text: string }).text : ''

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const newContent =
        post.platform === 'linkedin' ? { ...post.content, text: editText } : { text: editText }
      await updatePost(post.id, { content: newContent })
      setEditing(false)
      toast.success('Saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSchedule() {
    setSaving(true)
    try {
      await updatePost(post.id, {
        status: 'scheduled',
        scheduledAt: new Date(scheduleAt).toISOString(),
      })
      setScheduling(false)
      toast.success('Post scheduled!')
    } catch {
      toast.error('Schedule failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border-[2px] border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <PlatformBadge platform={post.platform} isNewsletter={isNewsletter} />
        {post.status === 'scheduled' && (
          <span className="text-[10px] font-bold text-sticker-blue uppercase tracking-wide">
            Scheduled
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={5}
            className={cn(
              'w-full text-sm rounded-md px-3 py-2 resize-y',
              'bg-background border-[2px] border-border',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/40',
              'font-mono leading-relaxed'
            )}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold',
                'bg-sticker-green/10 text-sticker-green border-[2px] border-sticker-green/30',
                'hover:bg-sticker-green/20 transition-colors disabled:opacity-50'
              )}
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-muted text-muted-foreground border-[2px] border-border hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <Link
          href={`/edit/${post.id}`}
          className="block text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 line-clamp-4 hover:text-foreground transition-colors cursor-pointer"
        >
          {text || <span className="text-muted-foreground italic">No content</span>}
        </Link>
      )}

      {scheduling && !editing && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className={cn(
              'flex-1 text-xs rounded-md px-2 py-1.5',
              'bg-background border-[2px] border-border',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/40'
            )}
          />
          <button
            onClick={handleSchedule}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold',
              'bg-sticker-blue/10 text-sticker-blue border-[2px] border-sticker-blue/30',
              'hover:bg-sticker-blue/20 transition-colors disabled:opacity-50'
            )}
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Scheduling…' : 'Confirm'}
          </button>
          <button
            onClick={() => setScheduling(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!editing && !scheduling && post.status === 'draft' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              setEditText(text)
              setEditing(true)
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold',
              'border-[2px] border-border bg-card text-muted-foreground',
              'hover:bg-muted transition-colors'
            )}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => setScheduling(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold',
              'border-[2px] border-border bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
              'hover:bg-[hsl(var(--gold))]/20 transition-colors'
            )}
          >
            <Calendar className="w-3 h-3" />
            Schedule
          </button>
        </div>
      )}
    </div>
  )
}

interface ProjectGroup {
  repoUrl: string
  repoName: string
  posts: Post[]
}

export function GithubDraftsPanel() {
  const allPosts = usePostsStore((s) => s.posts)
  const githubProjects = useGithubProjectsStore((s) => s.githubProjects)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const groups = useMemo<ProjectGroup[]>(() => {
    const shipDrafts = allPosts.filter(isShipSignalDraft)
    if (shipDrafts.length === 0) return []

    // Group by repo URL extracted from notes
    const byRepo = new Map<string, Post[]>()
    for (const post of shipDrafts) {
      const url = extractRepoUrl(post.notes ?? '')
      if (!url) continue
      const existing = byRepo.get(url) ?? []
      byRepo.set(url, [...existing, post])
    }

    // Respect github project order (most recently connected first)
    const knownUrls = new Set(githubProjects.map((p) => p.githubRepoUrl))
    const result: ProjectGroup[] = []

    // Known projects first
    for (const project of githubProjects) {
      const posts = byRepo.get(project.githubRepoUrl)
      if (posts && posts.length > 0) {
        result.push({
          repoUrl: project.githubRepoUrl,
          repoName: project.githubRepoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, ''),
          posts: [...posts].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
        })
      }
    }

    // Any orphaned drafts whose project was deleted
    for (const [url, posts] of byRepo.entries()) {
      if (!knownUrls.has(url)) {
        result.push({
          repoUrl: url,
          repoName: url.replace(/^https?:\/\/(www\.)?github\.com\//i, ''),
          posts: [...posts].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
        })
      }
    }

    return result
  }, [allPosts, githubProjects])

  if (groups.length === 0) return null

  function toggle(repoUrl: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(repoUrl)) next.delete(repoUrl)
      else next.add(repoUrl)
      return next
    })
  }

  return (
    <section className="animate-fade-in mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-sticker-purple/10 shrink-0">
          <Sparkles className="w-4 h-4 text-sticker-purple" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-sticker-purple">
          AI Drafts
        </h2>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.repoUrl)
          return (
            <div
              key={group.repoUrl}
              className="rounded-xl border-[2px] border-border bg-card overflow-hidden"
            >
              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => toggle(group.repoUrl)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Github className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-semibold truncate">{group.repoName}</span>
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    {group.posts.length} draft{group.posts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Posts list */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {group.posts.map((post) => (
                    <DraftCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
