'use client'
/* eslint-disable max-lines-per-function -- inner arrow functions in JSX map() callbacks */
/* eslint-disable react-refresh/only-export-components -- exports shared type and hook alongside component */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Platform icon components
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// Account type (will come from a real accounts system later)
export interface SocialAccount {
  id: string
  platform: 'twitter' | 'linkedin'
  handle: string
  displayName?: string
  avatarUrl?: string
  isConnected: boolean
}

interface ProjectAccount {
  id: string
  projectId: string
  accountId: string
  createdAt: string
}

interface AccountPickerProps {
  projectId: string
  selectedAccountIds: string[]
  onSelectionChange: (accountIds: string[]) => void
  accounts?: SocialAccount[]
  loading?: boolean
  saving?: boolean
}

const PLATFORM_CONFIG = {
  twitter: {
    name: 'Twitter / X',
    icon: TwitterIcon,
    color: 'text-[#1DA1F2]',
    bgColor: 'bg-[#1DA1F2]/10',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: LinkedInIcon,
    color: 'text-[#0A66C2]',
    bgColor: 'bg-[#0A66C2]/10',
  },
}

export function AccountPicker({
  projectId: _projectId,
  selectedAccountIds,
  onSelectionChange,
  accounts = [],
  loading = false,
  saving = false,
}: AccountPickerProps) {
  const handleToggle = (accountId: string) => {
    if (saving) return

    if (selectedAccountIds.includes(accountId)) {
      onSelectionChange(selectedAccountIds.filter((id) => id !== accountId))
    } else {
      onSelectionChange([...selectedAccountIds, accountId])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <p className="text-sm text-muted-foreground">
          No social accounts connected yet.{' '}
          <Link href="/settings" className="text-primary underline hover:no-underline font-medium">
            Connect accounts in Settings
          </Link>{' '}
          to publish directly to Twitter and LinkedIn.
        </p>
      </div>
    )
  }

  // Group accounts by platform
  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = []
      }
      acc[account.platform].push(account)
      return acc
    },
    {} as Record<string, SocialAccount[]>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select which accounts should be pre-selected when creating posts in this project's
        campaigns.
      </p>

      {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => {
        const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
        const Icon = config.icon

        return (
          <div key={platform} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon className={cn('w-4 h-4', config.color)} />
              <span>{config.name}</span>
            </div>

            <div className="space-y-2">
              {platformAccounts.map((account) => {
                const isSelected = selectedAccountIds.includes(account.id)
                const isDisabled = !account.isConnected || saving

                return (
                  <button
                    key={account.id}
                    onClick={() => handleToggle(account.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                      isSelected
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5'
                        : 'border-border hover:border-[hsl(var(--gold))]/50',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Avatar or platform icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center overflow-hidden',
                        config.bgColor
                      )}
                    >
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={`${account.displayName || account.handle} avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className={cn('w-5 h-5', config.color)} />
                      )}
                    </div>

                    {/* Account info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">
                        {account.displayName || account.handle}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">@{account.handle}</p>
                    </div>

                    {/* Connection status */}
                    {!account.isConnected && (
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Disconnected</span>
                      </div>
                    )}

                    {/* Selection checkbox */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving changes...
        </div>
      )}
    </div>
  )
}

/**
 * Hook to manage project account associations
 */

export function useProjectAccounts(projectId: string) {
  const [accounts, setAccounts] = useState<ProjectAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current associations
  useEffect(() => {
    async function fetchAccounts() {
      if (!projectId) return

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/projects/${projectId}/accounts`)
        if (!res.ok) throw new Error('Failed to fetch accounts')
        const data = await res.json()
        setAccounts(data.accounts || [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [projectId])

  // Add account to project
  const addAccount = async (accountId: string) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add account')
      }

      const data = await res.json()
      setAccounts([...accounts, data.account])
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Remove account from project
  const removeAccount = async (accountId: string) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/projects/${projectId}/accounts?accountId=${encodeURIComponent(accountId)}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove account')
      }

      setAccounts(accounts.filter((a) => a.accountId !== accountId))
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    accounts,
    accountIds: accounts.map((a) => a.accountId),
    loading,
    saving,
    error,
    addAccount,
    removeAccount,
  }
}
