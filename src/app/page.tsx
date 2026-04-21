import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from './landing-page'

// eslint-disable-next-line react-refresh/only-export-components -- metadata export is required by Next.js App Router
export const metadata: Metadata = {
  title: 'ShipSignal — GitHub to social proof',
  description:
    'ShipSignal converts your commits and releases into reviewed X and LinkedIn posts. Schedule posts, organize campaigns, and capture ideas from AI tools.',
}

export default async function Home() {
  // Skip auth check in E2E test mode. See dashboard/layout.tsx for the full gate rationale.
  const isTestMode =
    process.env.E2E_TEST_MODE === 'true' && process.env.CI === 'true' && process.env.VERCEL !== '1'
  if (isTestMode) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPage />
}
