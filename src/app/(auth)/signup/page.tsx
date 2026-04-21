'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isNativePlatform } from '@/lib/capacitor'
import { nativeGoogleSignIn } from '@/lib/googleSignIn'
import PasswordStrength from '@/components/ui/PasswordStrength'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { captureEvent } from '@/lib/posthog'

// eslint-disable-next-line max-lines-per-function
export default function SignUpPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    if (isNativePlatform()) {
      setError(null)
      setLoading(true)
      const result = await nativeGoogleSignIn(supabase)
      if (result.success) {
        window.location.href = '/dashboard'
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    captureEvent('signup_started', { method: 'email' })

    // eslint-disable-next-line security/detect-possible-timing-attacks -- comparing UI form fields, not secrets
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const checkRes = await fetch('/api/auth/pre-signup-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const check = await checkRes.json()
      if (!check.allowed) {
        setError(check.reason || 'Signup is not allowed at this time.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute left-0 right-0 top-0 h-1 gradient-bar" />
        </div>
        <div className="w-full max-w-md">
          <div className="auth-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-sticker-green/10 text-3xl shadow-sticker">
              ✉️
            </div>
            <h2 className="mb-2 text-xl font-extrabold text-foreground">Check your email</h2>
            <p className="mb-4 text-muted-foreground">
              We&apos;ve sent you a confirmation link to{' '}
              <strong className="text-foreground">{email}</strong>. Click the link to activate your
              account.
            </p>
            <Link
              href="/login"
              className="auth-btn-ghost inline-flex w-auto items-center gap-2 px-4 py-2.5 text-sm"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-sticker-pink/10 text-3xl shadow-sticker">
              🎉
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Create an account</h1>
            <p className="mt-2 text-muted-foreground">Get started with ShipSignal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-5">
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
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="auth-input"
                placeholder="••••••••"
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-bold text-foreground"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="auth-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? '⏳ Creating account...' : '🚀 Create account'}
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

          <GoogleSignInButton onClick={handleGoogleSignUp} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
