import type { MetadataRoute } from 'next'
import { LOCALES, localePath } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

/**
 * Every page, in every locale, with its translations declared.
 *
 * The site had no sitemap and no robots.txt, so the only way in was whatever a
 * crawler happened to follow from the root. Fourteen static pages that already
 * exist as real HTML deserve to be enumerable.
 *
 * The route list lives here rather than being discovered, because a static
 * export has nothing to discover it from — but it is the same list `SITE_NAV`
 * drives the navigation with, and `data:validate` will not catch a page added
 * to one and not the other. Keep them together.
 */
const ROUTES = ['', '/rak', '/ansambel', '/teknik', '/laras', '/aransemen'] as const

/**
 * `/diagnostik` is deliberately absent. It is a device-testing page for the
 * maker, linked from the footer for anyone who wants it, and not something a
 * search result should ever land a visitor on.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${SITE_URL}${localePath(locale, route)}/`,
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((code) => [code, `${SITE_URL}${localePath(code, route)}/`]),
        ),
      },
    })),
  )
}
