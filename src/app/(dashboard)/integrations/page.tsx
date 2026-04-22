'use client'

import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type IntegrationKey = 'twitter' | 'linkedin'

interface IntegrationCard {
  key: IntegrationKey
  name: string
  description: string
  accentClassName: string
  Logo: ({ className }: { className?: string }) => JSX.Element
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const INTEGRATIONS: IntegrationCard[] = [
  {
    key: 'twitter',
    name: 'X (Twitter)',
    description: 'Connect your X account to publish launch updates, product notes, and threads.',
    accentClassName: 'text-black',
    Logo: XLogo,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    description:
      'Connect LinkedIn to share polished product updates and professional launch content.',
    accentClassName: 'text-linkedin',
    Logo: LinkedInLogo,
  },
]

function hasTwitterProvider(user: {
  app_metadata?: { providers?: unknown }
  user_metadata?: Record<string, unknown> | null
} | null) {
  const providers = user?.app_metadata?.providers

  if (Array.isArray(providers) && providers.some((provider) => provider === 'twitter')) {
    return true
  }

  const userMetadata = user?.user_metadata
  const fallbackValues = [
    userMetadata?.provider,
    userMetadata?.providers,
    userMetadata?.iss,
    userMetadata?.sub,
    userMetadata?.user_name,
    userMetadata?.preferred_username,
  ]

  return fallbackValues.some((value) => {
    if (typeof value === 'string') {
      return value.toLowerCase().includes('twitter')
    }

    if (Array.isArray(value)) {
      return value.some((item) => typeof item === 'string' && item.toLowerCase() === 'twitter')
    }

    return false
  })
}

export default function IntegrationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loadingKey, setLoadingKey] = useState<IntegrationKey | null>(null)
  const [isCheckingTwitter, setIsCheckingTwitter] = useState(true)
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadTwitterStatus() {
      setIsCheckingTwitter(true)
      setError(null)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (ignore) return

        if (userError) {
          throw userError
        }

        setTwitterConnected(hasTwitterProvider(user))
      } catch {
        if (!ignore) {
          setError('We could not check your X connection yet. Please try again.')
        }
      } finally {
        if (!ignore) {
          setIsCheckingTwitter(false)
        }
      }
    }

    void loadTwitterStatus()

    return () => {
      ignore = true
    }
  }, [supabase])

  const handleConnectTwitter = async () => {
    setError(null)
    setLoadingKey('twitter')

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'x',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/integrations`,
        },
      })

      if (signInError) {
        throw signInError
      }
    } catch {
      setError('We could not start the X connection flow. Please try again.')
      setLoadingKey(null)
    }
  }

  const handlePlaceholderConnect = async (integration: IntegrationKey) => {
    setError(null)
    setLoadingKey(integration)

    await new Promise((resolve) => window.setTimeout(resolve, 1200))

    setLoadingKey(null)
  }

  const twitterStatus = isCheckingTwitter
    ? 'Checking connection...'
    : twitterConnected
      ? 'Connected'
      : 'Not connected'

  const twitterButtonLabel = isCheckingTwitter
    ? 'Checking...'
    : twitterConnected
      ? 'Connected'
      : 'Connect'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 animate-fade-in">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          Integrations
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Manage your connections
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Connect the channels you publish to most. X now uses real Supabase OAuth, while the
          LinkedIn action remains a lightweight placeholder until its flow is wired in.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-[8px] border border-[#ffd2bf] bg-[#fff6f2] px-4 py-3 text-sm text-[#b34000]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const isTwitterCard = integration.key === 'twitter'
          const isLoading = loadingKey === integration.key
          const status = isTwitterCard ? twitterStatus : 'Not connected'
          const buttonLabel = isTwitterCard
            ? twitterButtonLabel
            : isLoading
              ? 'Loading...'
              : 'Connect'
          const isDisabled = isTwitterCard
            ? isCheckingTwitter || twitterConnected || isLoading
            : isLoading

          return (
            <section
              key={integration.key}
              className="card-clean flex h-full flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-border bg-muted/40">
                      <integration.Logo
                        className={cn('h-6 w-6', integration.accentClassName)}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{integration.name}</h2>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {(isTwitterCard && (isCheckingTwitter || isLoading)) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {status}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  {integration.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {isTwitterCard
                    ? twitterConnected
                      ? 'X account available in this session'
                      : 'OAuth with Supabase'
                    : 'Ready when OAuth is wired'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    isTwitterCard
                      ? void handleConnectTwitter()
                      : void handlePlaceholderConnect(integration.key)
                  }
                  disabled={isDisabled}
                  className={cn(
                    'btn-primary min-w-[118px]',
                    isDisabled && 'cursor-not-allowed opacity-70',
                    isLoading && 'cursor-wait opacity-80'
                  )}
                >
                  {(isTwitterCard && (isCheckingTwitter || isLoading)) || (!isTwitterCard && isLoading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {buttonLabel}
                    </>
                  ) : (
                    buttonLabel
                  )}
                </button>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
