import type { ReactNode } from 'react'

/**
 * A quiet author credit. Personal, not legal — so it sits apart from the
 * project's attribution and citations, and never merges with them.
 *
 * Everything identifying lives in the two constants below, so updating a handle
 * or adding a platform is a one-line change.
 */
const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
} as const

const LINKS: readonly { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'Portfolio',
    href: MAKER.portfolio,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
      </>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/andifathulms',
    icon: (
      <path
        d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6A4.6 4.6 0 0 0 18.7 6a4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.5 5.4 2.8 5.4 2.8A4.3 4.3 0 0 0 5.3 6a4.6 4.6 0 0 0-1.3 3.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
        fill="none"
      />
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/andifathulmukminin/',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 10v7" />
        <path d="M7 7v.01" />
        <path d="M11 17v-4a2 2 0 0 1 4 0v4" />
        <path d="M11 10v7" />
      </>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/andifathulms/',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M16.5 7.5v.01" />
      </>
    ),
  },
]

export function MakerSignature() {
  // Build time is render time for a static export, which is what this needs.
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
      <p className="text-step--1 text-ink-faint">
        Designed &amp; built by{' '}
        <a
          href={MAKER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-muted underline decoration-stage-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-bamboo"
        >
          {MAKER.name}
        </a>{' '}
        · <span className="font-mono tabular-nums">© {year}</span>
      </p>

      <ul className="-ml-1.5 flex items-center gap-0.5 sm:ml-0">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex rounded-lg p-1.5 text-ink-faint transition-colors duration-200 hover:bg-stage-raised hover:text-bamboo"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {link.icon}
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
