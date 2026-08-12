import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Instrument_Serif, Recursive } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Angklung Simulator — satu angklung, satu nada',
  description:
    'Simulator angklung: satu angklung hanya bisa membunyikan satu nada, jadi sebuah lagu adalah persoalan koordinasi. Bunyinya disintesis dari model fisik, tanpa rekaman.',
}

export const viewport: Viewport = {
  themeColor: '#221B14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
