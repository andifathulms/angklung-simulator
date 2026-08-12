import { notFound } from 'next/navigation'
import { AkompanimenLab } from '@/components/lab/AkompanimenLab'
import { TechniqueLab } from '@/components/lab/TechniqueLab'
import { PageHeader, Section } from '@/components/ui'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'
import { sectionMetadata } from '@/lib/seo'

/** Title and description come from the dictionary this page already renders. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {}
  return sectionMetadata(params.locale, 'teknik')
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TechniquePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-16">
      <PageHeader eyebrow={dict.nav.teknik} title={dict.teknik.title} lede={dict.teknik.lede} />

      <TechniqueLab dict={dict} />

      <div className="rule-fade" aria-hidden="true" />

      <Section title={dict.akor.title} description={dict.home.tengkepBody}>
        <AkompanimenLab dict={dict} />
      </Section>
    </div>
  )
}
