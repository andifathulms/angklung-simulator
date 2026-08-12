import { notFound } from 'next/navigation'
import { DiagnosticsView } from '@/components/diagnostics/DiagnosticsView'
import { PageHeader } from '@/components/ui'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'
import { sectionMetadata } from '@/lib/seo'

/** Title and description come from the dictionary this page already renders. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {}
  return sectionMetadata(params.locale, 'diagnostik')
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <PageHeader eyebrow={dict.diagnostik.eyebrow} title={dict.diagnostik.title} lede={dict.diagnostik.lede} />
      <DiagnosticsView dict={dict} />
    </div>
  )
}
