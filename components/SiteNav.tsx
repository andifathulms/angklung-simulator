'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { StartAudio } from './audio/StartAudio'
import { LOCALES, localePath } from '@/lib/i18n'
import type { Dictionary, Locale } from '@/lib/i18n'

export function SiteNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()

  const links = [
    { href: '', label: dict.nav.beranda },
    { href: '/rak', label: dict.nav.rak },
    { href: '/ansambel', label: dict.nav.ansambel },
    { href: '/teknik', label: dict.nav.teknik },
    { href: '/laras', label: dict.nav.laras },
    { href: '/aransemen', label: dict.nav.aransemen },
  ]

  const isActive = (href: string): boolean => {
    const full = localePath(locale, href)
    if (href === '') return pathname === full || pathname === `${full}/`
    return pathname.startsWith(full)
  }

  return (
    <header className="border-b border-rattan/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label={dict.nav.beranda} className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localePath(locale, link.href)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={
                isActive(link.href)
                  ? 'text-sm text-sounding underline decoration-cue decoration-2 underline-offset-8'
                  : 'text-sm text-bamboo/70 transition hover:text-sounding'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <StartAudio dict={dict} />
          <div className="flex items-center gap-2 font-mono text-xs">
            {LOCALES.map((candidate) => (
              <Link
                key={candidate}
                href={localePath(candidate, pathname.replace(/^\/[a-z]{2}/, ''))}
                className={
                  candidate === locale ? 'text-sounding' : 'text-bamboo/50 hover:text-sounding'
                }
              >
                {candidate.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
