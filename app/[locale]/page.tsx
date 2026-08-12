import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, getDictionary, isLocale, localePath } from '@/lib/i18n'
import { KURULUNG_SHAKE_RATE_RANGE_HZ } from '@/lib/synth'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)
  const locale = params.locale

  const techniques = [
    { key: 'kurulung', name: dict.teknikNames.kurulung, body: dict.teknikDesc.kurulung },
    { key: 'centok', name: dict.teknikNames.centok, body: dict.teknikDesc.centok },
    { key: 'tengkep', name: dict.teknikNames.tengkep, body: dict.teknikDesc.tengkep },
  ] as const

  return (
    <div className="space-y-16">
      <section className="max-w-3xl space-y-6">
        <h1 className="font-display text-5xl leading-tight text-sounding sm:text-6xl">
          {dict.home.title}
        </h1>
        <p className="font-display text-2xl text-bamboo">{dict.home.premise}</p>
        <p className="text-base leading-relaxed text-bamboo/80">{dict.home.premiseBody}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={localePath(locale, '/rak')}
            className="rounded-full bg-sounding px-5 py-2 text-sm font-medium text-stage transition hover:bg-bamboo"
          >
            {dict.home.startHere}
          </Link>
          <Link
            href={localePath(locale, '/ansambel')}
            className="rounded-full border border-yourPart px-5 py-2 text-sm text-yourPart transition hover:bg-yourPart/10"
          >
            {dict.nav.ansambel}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl space-y-3">
        <h2 className="font-display text-3xl text-sounding">{dict.home.whyTitle}</h2>
        <p className="leading-relaxed text-bamboo/80">{dict.home.whyBody}</p>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-3xl text-sounding">{dict.home.techniquesTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {techniques.map((technique) => (
            <article
              key={technique.key}
              className="rounded-lg border border-rattan/60 bg-rattan/10 p-5"
            >
              <h3 className="font-display text-2xl text-sounding">{technique.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bamboo/75">{technique.body}</p>
            </article>
          ))}
        </div>
        <p className="font-mono text-xs text-bamboo/50">
          {KURULUNG_SHAKE_RATE_RANGE_HZ.minHz}–{KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz} Hz ·{' '}
          <Link className="underline underline-offset-4" href={localePath(locale, '/teknik')}>
            {dict.teknik.title}
          </Link>
        </p>
      </section>

      <section className="max-w-3xl space-y-3 border-l-2 border-cue pl-6">
        <h2 className="font-display text-3xl text-sounding">{dict.home.tengkepTitle}</h2>
        <p className="leading-relaxed text-bamboo/80">{dict.home.tengkepBody}</p>
      </section>

      <section className="max-w-3xl space-y-3">
        <h2 className="font-display text-3xl text-sounding">{dict.home.creditsTitle}</h2>
        <p className="leading-relaxed text-bamboo/80">{dict.home.creditsBody}</p>
      </section>
    </div>
  )
}
