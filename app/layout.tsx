import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Instrument_Serif, Recursive } from 'next/font/google'
import { SITE_URL, asset } from '@/lib/site'
import './globals.css'

/** Self-hosted by next/font at build time — no runtime network request. */
const display = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

/** Recursive in its mono setting, for angklung numbers, timing, and cents. */
const mono = Recursive({
  subsets: ['latin'],
  axes: ['MONO', 'CASL', 'CRSV'],
  variable: '--font-mono',
  display: 'swap',
})

const TITLE = 'Angklung Simulator — satu angklung, satu nada'
const DESCRIPTION =
  'Simulator angklung: satu angklung hanya bisa membunyikan satu nada, jadi sebuah lagu adalah persoalan koordinasi. Bunyinya disintesis dari model fisik, tanpa rekaman.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — Angklung Simulator',
  },
  description: DESCRIPTION,
  applicationName: 'Angklung Simulator',
  authors: [{ name: 'Andi Fathul Mukminin Salahuddin' }],
  keywords: ['angklung', 'Sunda', 'kurulung', 'centok', 'tengkep', 'laras', 'gamelan', 'sintesis'],
  openGraph: {
    type: 'website',
    siteName: 'Angklung Simulator',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/brand/og.png',
        width: 1200,
        height: 630,
        alt: 'Angklung Simulator — a song is a coordination problem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/brand/og.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'Angklung',
    // The instrument is lit against a dark stage, so the iOS status bar joins it.
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#1B120A',
  colorScheme: 'dark',
  // The rack is played by touch; a double-tap that zooms instead of sounding a
  // note would be the worst possible response to tapping an instrument.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        {/*
         * Written by hand: Next strips the basePath from the manifest link however
         * metadata.manifest is expressed, and a root-relative href 404s on GitHub
         * Pages where the site is served from /angklung-simulator. The icon links
         * are generated from app/ and do get the basePath, so only this one needs
         * the help.
         *
         * The manifest itself is a static file whose every path is relative to it —
         * "id/", "brand/icon-192.png" — so it resolves correctly under a basePath
         * and at the root in development, with no environment logic at all.
         * Verified in the built HTML; do not fold it back into metadata.
         */}
        <link rel="manifest" href={asset('/manifest.webmanifest')} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
