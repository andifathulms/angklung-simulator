import { notFound } from 'next/navigation'
import { RackPlayground } from '@/components/rack/RackPlayground'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function RackPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-display text-4xl text-sounding">{dict.rak.title}</h1>
        <p className="leading-relaxed text-bamboo/75">{dict.rak.lede}</p>
      </header>
      <RackPlayground dict={dict} />
    </div>
  )
}
