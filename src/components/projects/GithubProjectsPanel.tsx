'use client'
/* eslint-disable max-lines-per-function -- section list + empty states mirror dashboard Projects block */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Github, Plus, ExternalLink, FileText, BookOpen, RefreshCw, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useGithubProjectsStore } from '@/lib/githubProjects'
import { usePostsStore } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { ConnectGithubProjectModal } from './ConnectGithubProjectModal'

export function GithubProjectsPanel() {
  const [modalOpen, setModalOpen] = useState(false)
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const githubProjects = useGithubProjectsStore((s) => s.githubProjects)
  const fetchGithubProjects = useGithubProjectsStore((s) => s.fetchGithubProjects)
  const syncGithubProject = useGithubProjectsStore((s) => s.syncGithubProject)
  const syncing = useGithubProjectsStore((s) => s.syncing)
  const initialized = useGithubProjectsStore((s) => s.initialized)
  const loading = useGithubProjectsStore((s) => s.loading)
  const fetchPosts = usePostsStore((s) => s.fetchPosts)

  useEffect(() => {
    if (!initialized) void fetchGithubProjects().catch(() => {})
  }, [initialized, fetchGithubProjects])

  async function handleSync(id: string) {
    try {
      await syncGithubProject(id)
      toast.success('Activity imported!')
    } catch (err) {
      toast.error((err as Error).message || 'Sync failed')
    }
  }

  async function handleGenerate(id: string) {
    setGenerating((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubProjectId: id }),
      })
      const data = (await res.json()) as { error?: string; posts?: unknown[] }
      if (!res.ok) throw new Error(data.error || 'Failed to generate posts')
      const count = data.posts?.length ?? 0
      void fetchPosts()
      toast.success(`${count} post drafts ready — check AI Drafts below!`)
    } catch (err) {
      toast.error((err as Error).message || 'Generation failed')
    } finally {
      setGenerating((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <>
      <section className="animate-fade-in mb-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-[hsl(var(--gold))]/10 shrink-0">
              <Github className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--gold-dark))] truncate">
              GitHub projects
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-xs font-medium text-[hsl(var(--gold-dark))] hover:text-[hsl(var(--gold))] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect
          </button>
        </div>

        {!initialized && loading ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : githubProjects.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-card/50">
            <p className="text-sm font-medium mb-1">No repositories connected</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              Add a public GitHub repo to fetch release notes, merged PRs, or recent commits.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
                'text-sm font-medium',
                'hover:bg-[hsl(var(--gold))]/20 transition-colors'
              )}
            >
              <Github className="w-4 h-4" />
              Connect New Project
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {githubProjects.map((p) => {
              const isSyncing = syncing[p.id] ?? false
              const isGenerating = generating[p.id] ?? false
              return (
                <li
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border-[2px] border-border bg-card px-3 py-2.5 shadow-sticker-sm"
                >
                  <div className="min-w-0 flex items-start gap-2">
                    <Github className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <a
                        href={p.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-[hsl(var(--gold-dark))] inline-flex items-center gap-1 break-all"
                      >
                        {p.githubRepoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '')}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      </a>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {p.changelogUrl && (
                          <Link
                            href={p.changelogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-[hsl(var(--gold-dark))] inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Changelog
                          </Link>
                        )}
                        {p.documentationUrl && (
                          <Link
                            href={p.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-[hsl(var(--gold-dark))] inline-flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            Docs
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSync(p.id)}
                      disabled={isSyncing || isGenerating}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold',
                        'border-[2px] border-border shadow-sticker-sm',
                        'bg-card text-muted-foreground',
                        'hover:bg-muted transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      aria-label={isSyncing ? 'Syncing…' : 'Fetch latest activity'}
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                      {isSyncing ? 'Syncing…' : 'Sync'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerate(p.id)}
                      disabled={isSyncing || isGenerating}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold',
                        'border-[2px] border-border shadow-sticker-sm',
                        'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
                        'hover:bg-[hsl(var(--gold))]/20 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      aria-label={isGenerating ? 'Writing your posts…' : 'Generate posts with AI'}
                    >
                      <Sparkles className={cn('w-3.5 h-3.5', isGenerating && 'animate-pulse')} />
                      {isGenerating ? 'Writing…' : 'Generate'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConnectGithubProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
