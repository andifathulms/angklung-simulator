import { notFound } from 'next/navigation'
import { ArrangementView } from '@/components/arrangement/ArrangementView'
import { PageHeader } from '@/components/ui'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <PageHeader eyebrow={dict.nav.aransemen} title={dict.aransemen.title} lede={dict.aransemen.lede} />
      <ArrangementView dict={dict} />
    </div>
  )
}
