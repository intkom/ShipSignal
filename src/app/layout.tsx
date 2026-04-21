import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import '../index.css'
import '@/lib/envValidation' // Validate env vars on startup
import { CookieConsent } from '@/components/ui/CookieConsent'
import { PostHogProvider } from '@/lib/posthog'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shipsignal.app'

// eslint-disable-next-line react-refresh/only-export-components -- metadata export is required by Next.js App Router
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'ShipSignal — GitHub to social proof',
    template: '%s | ShipSignal',
  },
  description:
    'Turn your GitHub activity into polished X and LinkedIn posts. Schedule and manage posts with campaigns and projects.',
  openGraph: {
    type: 'website',
    siteName: 'ShipSignal',
    title: 'ShipSignal — GitHub to social proof',
    description:
      'Turn your GitHub activity into polished X and LinkedIn posts. Schedule and manage posts with campaigns and projects.',
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipSignal — GitHub to social proof',
    description: 'Turn your GitHub activity into polished X and LinkedIn posts.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <PostHogProvider>
          <Providers>{children}</Providers>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
        <CookieConsent />
      </body>
    </html>
  )
}
