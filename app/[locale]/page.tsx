import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HeroDemo } from '@/components/home/HeroDemo'
import { WorkedExample } from '@/components/home/WorkedExample'
import { ButtonLink, Card, CardLink, Section, Term } from '@/components/ui'
import { LOCALES, getDictionary, isLocale, localePath } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { KURULUNG_SHAKE_RATE_RANGE_HZ } from '@/lib/synth'

/**
 * The home page's own title and description, from the same strings it renders:
 * the headline above the fold and the sentence under it.
 */
export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {}
  const dict = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    path: '',
    title: `Angklung Simulator — ${dict.home.title.toLowerCase()}`,
    description: dict.home.subtitle,
  })
}

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
        {/*
          * Order of business for a stranger: what is this, what can I do, why
          * should I care. The identity line used to be the eyebrow — 0.68rem,
          * uppercase, ink-faint — which made the smallest, faintest text on the
          * page the only text that said what the page was, while an aphorism
          * took the largest. The headline still leads, one step quieter; the
          * subtitle names the object and the interaction at reading weight; the
          * argument follows.
          */}
        <div className="space-y-5">
          <h1 className="text-step-4">
            {dict.home.title.split(',')[0]},
            <br />
            <span className="text-bamboo">{dict.home.title.split(',').slice(1).join(',').trim()}</span>
          </h1>
          <p className="max-w-prose text-step-1 leading-relaxed text-ink">{dict.home.subtitle}</p>
          <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
            {dict.home.premiseBody}
          </p>
          {/*
            * One primary action above the fold, and it is the sound button in
            * the demo alongside. This used to be two buttons pointing away from
            * the demonstration before the visitor had heard anything — offering
            * the exits before the payoff. Both destinations are cards further
            * down; here one quiet link is enough.
            */}
          <p className="pt-1">
            <Link
              href={localePath(locale, '/ansambel')}
              className="group inline-flex items-center gap-1.5 text-step-0 text-bamboo transition hover:text-sounding"
            >
              {dict.hero.explore}
              <span
                aria-hidden="true"
                className="transition-transform duration-300 ease-physical group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </p>
        </div>

        <HeroDemo dict={dict} />
      </section>

      {/*
        * The worked example comes before the three steps, and before every
        * other explanation on the page. The steps describe the mechanism in
        * prose; this one shows it happening to four real notes, with the same
        * solver the ensemble page runs. Someone who reads only this should be
        * able to reconstruct the rest.
        */}
      <WorkedExample dict={dict} />

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

      {/* Techniques. Each card carries the gloss as visible text, because the
          Sundanese words are never translated away and so the page has to teach
          them — to everyone, not only to whoever can hover. */}
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
          <Term term="kurulung" />
        </p>
      </Section>

      {/* The distinctive claim, given the room it deserves. */}
      <section className="overflow-hidden rounded-card border border-cue/25 bg-gradient-to-br from-cue/[0.09] to-transparent p-7 sm:p-10">
        <div className="max-w-readable space-y-4">
          <p className="eyebrow text-cue-light">{dict.home.tengkepTitle}</p>
          <h2 className="text-step-3">
            <Term term="Tengkep" />
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
