'use client'

import { useEffect } from 'react'
import type { Locale } from '@/lib/i18n'

/**
 * Keeps `<html lang>` matching the locale actually being read.
 *
 * The root layout sits above the `[locale]` segment, so it cannot see the param
 * and has to hardcode a language — which meant every /en page declared itself
 * Indonesian, and a screen reader read English prose with Indonesian phonetics.
 *
 * This corrects it in the document rather than in the markup, because the
 * alternative is two root layouts under route groups, and restructuring the
 * export for one attribute is a poor trade. The static HTML still ships the
 * default locale's `lang`; assistive technology reads the live DOM, which this
 * fixes on mount.
 */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
