import { notFound } from 'next/navigation'
import { AudioProvider } from '@/components/audio/AudioProvider'
import { SiteNav } from '@/components/SiteNav'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

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

  return (
    <AudioProvider>
      <div className="flex min-h-screen flex-col">
        <SiteNav locale={params.locale} dict={dict} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
        <footer className="border-t border-rattan/50 px-5 py-6">
          <div className="mx-auto max-w-6xl space-y-2 text-xs leading-relaxed text-bamboo/60">
            <p>{dict.home.creditsBody}</p>
            <p>{dict.home.disclaimer}</p>
            <p>{dict.home.ritual}</p>
            <p>
              <a
                className="underline decoration-rattan underline-offset-4 hover:text-sounding"
                href="https://angklung-udjo.co.id/"
                rel="noreferrer noopener"
                target="_blank"
              >
                Saung Angklung Udjo
              </a>{' '}
              — {dict.home.visit}
            </p>
          </div>
        </footer>
      </div>
    </AudioProvider>
  )
}
