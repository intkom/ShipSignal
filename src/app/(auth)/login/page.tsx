'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isNativePlatform } from '@/lib/capacitor'
import { nativeGoogleSignIn } from '@/lib/googleSignIn'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'

// eslint-disable-next-line max-lines-per-function
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (isNativePlatform()) {
      setError(null)
      setLoading(true)
      const result = await nativeGoogleSignIn(supabase)
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Google Sign-In failed')
      }
      setLoading(false)
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 top-0 h-1 gradient-bar" />
      </div>

      <div className="w-full max-w-md">
        <div className="auth-card">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-primary text-3xl shadow-sticker">
              📢
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">ShipSignal</h1>
            <p className="mt-2 text-muted-foreground">Sign in to manage your social posts</p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {error && <div className="auth-error">⚠️ {error}</div>}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? '⏳ Signing in...' : '🚀 Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-3 font-medium text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton onClick={handleGoogleLogin} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="font-bold text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
