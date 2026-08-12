import type { Metadata } from 'next'
import { LOCALES, getDictionary, localePath } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

/**
 * Per-page metadata, built from the same dictionary the page renders.
 *
 * Every route used to ship the layout's metadata verbatim: one title for seven
 * pages, an Indonesian description on the English tree, `og:locale=id_ID`
 * everywhere, and `og:url` pointing at the site root no matter which page was
 * shared. The `%s — Angklung Simulator` template existed and was never reached
 * because no page ever set a title.
 *
 * Titles and descriptions are read from the dictionary rather than written
 * again here. A description that drifts from the page it describes is worse
 * than none, and the only way it cannot drift is if there is one copy of it.
 */

/** Where a locale's version of a page lives, absolutely. */
function absolute(locale: Locale, path: string): string {
  return `${SITE_URL}${localePath(locale, path)}`
}

const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_US' }

/*
 * The social image, repeated on every page rather than inherited.
 *
 * A page-level `openGraph` replaces the layout's wholesale rather than merging
 * into it, so declaring a per-page title silently dropped og:image from all
 * fourteen pages. Declared here once, where every page picks it up.
 */
const OG_IMAGE = {
  url: `${SITE_URL}/brand/og.png`,
  width: 1200,
  height: 630,
  alt: 'Angklung Simulator — a song is a coordination problem',
} as const

export interface PageSeo {
  readonly locale: Locale
  /** Route below the locale segment, e.g. '/laras'. Empty for the home page. */
  readonly path: string
  readonly title: string
  readonly description: string
}

export function pageMetadata({ locale, path, title, description }: PageSeo): Metadata {
  const url = absolute(locale, path)

  return {
    title,
    description,
    alternates: {
      canonical: url,
      /*
       * hreflang, so the two trees are understood as translations of one page
       * rather than as duplicates competing with each other. `x-default` points
       * at the Indonesian version, which is what the root redirect chooses.
       */
      languages: {
        ...Object.fromEntries(LOCALES.map((code) => [code, absolute(code, path)])),
        'x-default': absolute('id', path),
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Angklung Simulator',
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((code) => code !== locale).map((code) => OG_LOCALE[code]),
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
  }
}

/**
 * Metadata for a page whose title and lede already exist in the dictionary.
 *
 * `section` is a key of the dictionary that carries `title` and `lede` — every
 * feature page has one, because every feature page renders a PageHeader from
 * exactly those two strings.
 */
type SectionKey = 'rak' | 'ansambel' | 'teknik' | 'laras' | 'aransemen' | 'diagnostik'

const SECTION_PATH: Record<SectionKey, string> = {
  rak: '/rak',
  ansambel: '/ansambel',
  teknik: '/teknik',
  laras: '/laras',
  aransemen: '/aransemen',
  diagnostik: '/diagnostik',
}

export function sectionMetadata(locale: Locale, section: SectionKey): Metadata {
  const dict = getDictionary(locale)
  const entry = dict[section]
  return pageMetadata({
    locale,
    path: SECTION_PATH[section],
    title: entry.title,
    description: entry.lede,
  })
}
