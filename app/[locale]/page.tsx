import { notFound } from 'next/navigation'
import { HeroDemo } from '@/components/home/HeroDemo'
import { ButtonLink, Card, CardLink, Section, Term } from '@/components/ui'
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

  const steps = [
    { n: '01', title: dict.hero.step1, body: dict.hero.step1Body },
    { n: '02', title: dict.hero.step2, body: dict.hero.step2Body },
    { n: '03', title: dict.hero.step3, body: dict.hero.step3Body },
  ]

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* Hero: the claim on the left, the proof of it on the right. */}
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="space-y-6">
          <p className="eyebrow">{dict.hero.kicker}</p>
          <h1 className="text-step-5">
            {dict.home.title.split(',')[0]},
            <br />
            <span className="text-bamboo">{dict.home.title.split(',').slice(1).join(',').trim()}</span>
          </h1>
          <p className="max-w-prose text-step-1 leading-relaxed text-ink-muted">
            {dict.home.premiseBody}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href={localePath(locale, '/ansambel')} tone="secondary" size="md">
              {dict.hero.explore}
            </ButtonLink>
            <ButtonLink href={localePath(locale, '/rak')} tone="ghost" size="md">
              {dict.nav.rak} →
            </ButtonLink>
          </div>
        </div>

        <HeroDemo dict={dict} />
      </section>

      {/* Three steps, numbered, because the mechanism is a sequence. */}
      <Section title={dict.hero.stepsTitle}>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="relative rounded-card border border-stage-line bg-stage-raised/60 p-6"
            >
              <span
                aria-hidden="true"
                className="font-mono text-step-3 text-bamboo/25"
              >
                {step.n}
              </span>
              <h3 className="mt-2 text-step-2">{step.title}</h3>
              <p className="mt-2 text-step-0 leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Techniques. Glossed inline, because the Sundanese words are never
          translated away and so the page has to teach them. */}
      <Section title={dict.home.techniquesTitle} description={dict.home.whyBody}>
        <div className="grid gap-5 sm:grid-cols-3">
          {techniques.map((technique) => (
            <Card key={technique.key} as="article">
              <h3 className="font-display text-step-2 text-sounding">{technique.name}</h3>
              <p className="mt-2.5 text-step-0 leading-relaxed text-ink-muted">{technique.body}</p>
            </Card>
          ))}
        </div>
        <p className="font-mono text-step--1 text-ink-faint">
          {KURULUNG_SHAKE_RATE_RANGE_HZ.minHz}–{KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz} Hz ·{' '}
          <Term term="kurulung" gloss={dict.teknikDesc.kurulung} />
        </p>
      </Section>

      {/* The distinctive claim, given the room it deserves. */}
      <section className="overflow-hidden rounded-card border border-cue/25 bg-gradient-to-br from-cue/[0.09] to-transparent p-7 sm:p-10">
        <div className="max-w-readable space-y-4">
          <p className="eyebrow text-cue-light">{dict.home.tengkepTitle}</p>
          <h2 className="text-step-3">
            <Term term="Tengkep" gloss={dict.teknikDesc.tengkep} />
          </h2>
          <p className="text-step-1 leading-relaxed text-ink-muted">{dict.home.tengkepBody}</p>
          <ButtonLink href={localePath(locale, '/teknik')} tone="secondary" size="md">
            {dict.teknik.title}
          </ButtonLink>
        </div>
      </section>

      <Section title={dict.hero.whereTitle}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardLink href={localePath(locale, '/rak')} eyebrow="01" title={dict.nav.rak}>
            {dict.rak.lede}
          </CardLink>
          <CardLink href={localePath(locale, '/ansambel')} eyebrow="02" title={dict.nav.ansambel}>
            {dict.ansambel.lede}
          </CardLink>
          <CardLink href={localePath(locale, '/teknik')} eyebrow="03" title={dict.nav.teknik}>
            {dict.teknik.lede}
          </CardLink>
          <CardLink href={localePath(locale, '/laras')} eyebrow="04" title={dict.nav.laras}>
            {dict.laras.lede}
          </CardLink>
          <CardLink href={localePath(locale, '/aransemen')} eyebrow="05" title={dict.nav.aransemen}>
            {dict.aransemen.lede}
          </CardLink>
        </div>
      </Section>

      <section className="max-w-readable space-y-3 border-l-2 border-stage-strong pl-6">
        <h2 className="text-step-2">{dict.home.repertoireTitle}</h2>
        <p className="text-step-0 leading-relaxed text-ink-faint">{dict.home.repertoireBody}</p>
      </section>
    </div>
  )
}
