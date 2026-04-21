'use client'

import { useState, useEffect, useRef } from 'react'
import { Github } from 'lucide-react'
import { useGithubProjectsStore } from '@/lib/githubProjects'
import { cn } from '@/lib/utils'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogActions,
  ResponsiveDialogButton,
} from '@/components/ui/ResponsiveDialog'

interface ConnectGithubProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// eslint-disable-next-line max-lines-per-function
export function ConnectGithubProjectModal({
  open,
  onClose,
  onSuccess,
}: ConnectGithubProjectModalProps) {
  const [githubRepoUrl, setGithubRepoUrl] = useState('')
  const [changelogUrl, setChangelogUrl] = useState('')
  const [documentationUrl, setDocumentationUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { connectGithubProject } = useGithubProjectsStore()

  useEffect(() => {
    if (open) {
      setGithubRepoUrl('')
      setChangelogUrl('')
      setDocumentationUrl('')
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubRepoUrl.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await connectGithubProject({
        githubRepoUrl: githubRepoUrl.trim(),
        changelogUrl: changelogUrl.trim() || undefined,
        documentationUrl: documentationUrl.trim() || undefined,
      })
      onClose()
      onSuccess?.()
    } catch (err) {
      setError((err as Error).message || 'Failed to connect repository')
    } finally {
      setIsSubmitting(false)
    }
  }

  const iconWrapper = (
    <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center">
      <Github className="w-6 h-6 text-[hsl(var(--gold-dark))]" />
    </div>
  )

  const inputClass = cn(
    'w-full px-3 py-2.5 rounded-lg',
    'bg-background border border-border',
    'text-foreground placeholder:text-muted-foreground',
    'focus:outline-hidden focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]',
    'transition-all'
  )

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="Connect New Project"
      titleId="connect-github-project-title"
      icon={iconWrapper}
    >
      <ResponsiveDialogDescription>
        Link a public GitHub repository. ShipSignal stores these URLs for upcoming import features —
        nothing is synced from GitHub yet.
      </ResponsiveDialogDescription>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="github-repo-url" className="block text-sm font-medium mb-2">
            Public GitHub repository URL <span className="text-destructive">*</span>
          </label>
          <input
            ref={inputRef}
            id="github-repo-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
            maxLength={2048}
            className={inputClass}
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Example: github.com/you/my-app or the full https:// URL
          </p>
        </div>

        <div>
          <label htmlFor="github-changelog-url" className="block text-sm font-medium mb-2">
            Changelog URL <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <input
            id="github-changelog-url"
            type="url"
            inputMode="url"
            value={changelogUrl}
            onChange={(e) => setChangelogUrl(e.target.value)}
            placeholder="https://…"
            maxLength={2048}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="github-docs-url" className="block text-sm font-medium mb-2">
            Documentation URL <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <input
            id="github-docs-url"
            type="url"
            inputMode="url"
            value={documentationUrl}
            onChange={(e) => setDocumentationUrl(e.target.value)}
            placeholder="https://…"
            maxLength={2048}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <ResponsiveDialogActions>
          <ResponsiveDialogButton onClick={onClose} variant="secondary" type="button">
            Cancel
          </ResponsiveDialogButton>
          <ResponsiveDialogButton
            type="submit"
            variant="primary"
            disabled={!githubRepoUrl.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save connection'}
          </ResponsiveDialogButton>
        </ResponsiveDialogActions>
      </form>
    </ResponsiveDialog>
  )
}
