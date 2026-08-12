'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DEFAULT_LOCALE, localePath } from '@/lib/i18n'

/**
 * The root sends visitors to the Indonesian site. Done client-side because a
 * static export has no server to redirect from; the link below is the version
 * that works without JavaScript.
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(localePath(DEFAULT_LOCALE))
  }, [router])

  return (
    <main className="mx-auto max-w-xl px-5 py-24">
      <p className="font-display text-2xl text-sounding">Angklung Simulator</p>
      <p className="mt-4 text-sm text-bamboo/70">
        <Link className="underline underline-offset-4" href={localePath(DEFAULT_LOCALE)}>
          Lanjut ke situs Bahasa Indonesia
        </Link>
        {' · '}
        <Link className="underline underline-offset-4" href={localePath('en')}>
          Continue in English
        </Link>
      </p>
    </main>
  )
}
