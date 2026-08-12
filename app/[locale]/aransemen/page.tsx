import { notFound } from 'next/navigation'
import { ArrangementView } from '@/components/arrangement/ArrangementView'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function ArrangementPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-display text-4xl text-sounding">{dict.aransemen.title}</h1>
        <p className="leading-relaxed text-bamboo/75">{dict.aransemen.lede}</p>
      </header>
      <ArrangementView dict={dict} />
    </div>
  )
}
