import { notFound } from 'next/navigation'
import { EnsembleView } from '@/components/ensemble/EnsembleView'
import { PageHeader } from '@/components/ui'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'
import { sectionMetadata } from '@/lib/seo'

/** Title and description come from the dictionary this page already renders. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {}
  return sectionMetadata(params.locale, 'ansambel')
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <PageHeader eyebrow={dict.nav.ansambel} title={dict.ansambel.title} lede={dict.ansambel.lede} />
      <EnsembleView dict={dict} />
    </div>
  )
}
