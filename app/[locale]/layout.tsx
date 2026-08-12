import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AudioProvider } from '@/components/audio/AudioProvider'
import { MakerSignature } from '@/components/MakerSignature'
import { SiteNav } from '@/components/SiteNav'
import { LOCALES, getDictionary, isLocale, localePath } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)
  const locale = params.locale

  return (
    <AudioProvider>
      <div className="flex min-h-screen flex-col">
        <SiteNav locale={locale} dict={dict} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:py-16">{children}</main>

        <footer className="mt-8 border-t border-stage-line bg-stage-deep/60">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
              {/*
               * Credit is placed on the page rather than in a sources list, per
               * PRD §9 — so it gets the first column and normal reading size,
               * not footnote treatment.
               */}
              <div className="space-y-4">
                <p className="eyebrow">{dict.home.creditsTitle}</p>
                <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
                  {dict.home.creditsBody}
                </p>
                <a
                  className="inline-flex items-center gap-2 text-step-0 text-bamboo transition hover:text-sounding"
                  href="https://angklung-udjo.co.id/"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Saung Angklung Udjo
                  <span aria-hidden="true">↗</span>
                </a>
                <p className="max-w-prose text-step--1 leading-relaxed text-ink-faint">
                  {dict.home.visit}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="eyebrow">{dict.footer.about}</p>
                  <p className="text-step--1 leading-relaxed text-ink-faint">
                    {dict.home.disclaimer}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="eyebrow">{dict.footer.respect}</p>
                  <p className="text-step--1 leading-relaxed text-ink-faint">{dict.home.ritual}</p>
                </div>
              </div>
            </div>

            {/*
             * One seam, then the bottom bar. The project's own links sit on the
             * left and the maker's mark on the right — kept apart because one is
             * about the work and the other is personal credit, and merging them
             * would make a signature look like an attribution.
             */}
            <div className="mt-10 flex flex-col gap-5 border-t border-stage-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-step--1">
                <Link
                  className="text-ink-faint transition hover:text-ink"
                  href={localePath(locale, '/diagnostik')}
                >
                  {dict.diagnostik.title}
                </Link>
                <a
                  className="text-ink-faint transition hover:text-ink"
                  href="https://github.com/andifathulms/angklung-simulator"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {dict.footer.source} ↗
                </a>
              </div>

              <MakerSignature />
            </div>
          </div>
        </footer>
      </div>
    </AudioProvider>
  )
}
