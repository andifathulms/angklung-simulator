'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StartAudio } from './audio/StartAudio'
import { cx } from './ui'
import { LOCALES, localePath } from '@/lib/i18n'
import type { Dictionary, Locale } from '@/lib/i18n'

/** The wordmark: three tubes graduated by length, which is the instrument in miniature. */
function Mark() {
  return (
    <svg viewBox="0 0 26 20" className="h-5 w-[26px]" aria-hidden="true">
      <rect x="0" y="2" width="26" height="2.2" rx="1.1" className="fill-rattan" />
      <rect x="3" y="4" width="4" height="15" rx="2" className="fill-bamboo" />
      <rect x="11" y="4" width="4" height="11" rx="2" className="fill-bamboo" opacity="0.8" />
      <rect x="19" y="4" width="4" height="7.5" rx="2" className="fill-bamboo" opacity="0.6" />
    </svg>
  )
}

export function SiteNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // A menu that survives navigation is a menu in the way.
  useEffect(() => setOpen(false), [pathname])

  const links = [
    { href: '/rak', label: dict.nav.rak },
    { href: '/ansambel', label: dict.nav.ansambel },
    { href: '/teknik', label: dict.nav.teknik },
    { href: '/laras', label: dict.nav.laras },
    { href: '/aransemen', label: dict.nav.aransemen },
  ]

  const isActive = (href: string): boolean => pathname.startsWith(localePath(locale, href))

  return (
    <header className="sticky top-0 z-40 border-b border-stage-line/80 bg-stage-deep/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link
          href={localePath(locale)}
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Mark />
          <span className="font-display text-step-1 leading-none text-ink">
            Angklung<span className="text-bamboo"> Simulator</span>
          </span>
        </Link>

        <nav aria-label={dict.nav.beranda} className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localePath(locale, link.href)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'relative rounded-full px-3 py-1.5 text-step--1 transition duration-200',
                isActive(link.href)
                  ? 'bg-stage-raised text-ink'
                  : 'text-ink-muted hover:bg-stage-raised/60 hover:text-ink',
              )}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute inset-x-3 -bottom-px h-px bg-bamboo" aria-hidden="true" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <div className="hidden sm:block">
            <StartAudio dict={dict} />
          </div>

          <div className="flex items-center rounded-full border border-stage-line p-0.5 font-mono text-[0.68rem]">
            {LOCALES.map((candidate) => (
              <Link
                key={candidate}
                href={localePath(candidate, pathname.replace(/^\/[a-z]{2}/, ''))}
                className={cx(
                  'rounded-full px-2 py-1 transition',
                  candidate === locale
                    ? 'bg-bamboo text-ink-inverse'
                    : 'text-ink-faint hover:text-ink',
                )}
              >
                {candidate.toUpperCase()}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={dict.nav.menu}
            className="rounded-full border border-stage-line p-2 text-ink-muted transition hover:text-ink lg:hidden"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              {open ? (
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-stage-line bg-stage-deep px-5 pb-4 pt-3 lg:hidden">
          <nav className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={localePath(locale, link.href)}
                className={cx(
                  'rounded-lg px-3 py-2.5 text-step-0 transition',
                  isActive(link.href)
                    ? 'bg-stage-raised text-sounding'
                    : 'text-ink-muted hover:bg-stage-raised hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-stage-line pt-3 sm:hidden">
            <StartAudio dict={dict} />
          </div>
        </div>
      ) : null}
    </header>
  )
}
