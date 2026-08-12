import { notFound } from 'next/navigation'
import { RackPlayground } from '@/components/rack/RackPlayground'
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
      <PageHeader eyebrow={dict.nav.rak} title={dict.rak.title} lede={dict.rak.lede} />
      <RackPlayground dict={dict} />
    </div>
  )
}
