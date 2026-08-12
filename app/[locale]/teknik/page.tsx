import { notFound } from 'next/navigation'
import { AkompanimenLab } from '@/components/lab/AkompanimenLab'
import { TechniqueLab } from '@/components/lab/TechniqueLab'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TechniquePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDictionary(params.locale)

  return (
    <div className="space-y-14">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-display text-4xl text-sounding">{dict.teknik.title}</h1>
        <p className="leading-relaxed text-bamboo/75">{dict.teknik.lede}</p>
      </header>

      <TechniqueLab dict={dict} />

      <section className="space-y-4 border-t border-rattan/40 pt-10">
        <h2 className="font-display text-3xl text-sounding">{dict.home.tengkepTitle}</h2>
        <p className="max-w-3xl leading-relaxed text-bamboo/75">{dict.home.tengkepBody}</p>
        <AkompanimenLab dict={dict} />
      </section>
    </div>
  )
}
