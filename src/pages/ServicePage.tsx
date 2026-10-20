import React from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem, ServiceContentBlock } from '../types'

interface ServicePageProps {
  service: ServiceItem
  onNavigateHome: () => void
}

function renderPortableText(content: any) {
  if (!content) return null

  if (typeof content === 'string') {
    return content.split('\n').filter(Boolean).map((paragraph, index) => (
      <p key={index} className="mb-4 leading-7 text-slate-600">{paragraph}</p>
    ))
  }

  if (!Array.isArray(content)) return null

  return content.map((block: any, index: number) => {
    if (block?._type !== 'block') return null

    const children = block.children || []
    const text = children.map((child: any) => child.text || '').join('')
    const key = block._key || index

    if (block.style === 'h2') {
      return <h2 key={key} className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{text}</h2>
    }
    if (block.style === 'h3') {
      return <h3 key={key} className="mb-3 mt-6 text-xl font-bold text-slate-900">{text}</h3>
    }
    if (block.listItem) {
      return <li key={key} className="ml-5 mb-2 list-disc leading-7 text-slate-600">{text}</li>
    }

    return <p key={key} className="mb-4 leading-7 text-slate-600">{text}</p>
  })
}

function ContentBlock({ block, index }: { block: ServiceContentBlock; index: number }) {
  const imageLeft = block.imagePosition === 'left' || (!block.imagePosition && index % 2 === 0)

  return (
    <section className="grid items-center gap-6 py-8 md:grid-cols-2 md:gap-10 md:py-12">
      <div className={imageLeft ? 'order-1' : 'order-1 md:order-2'}>
        {block.imageUrl ? (
          <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
            <img
              src={block.imageUrl}
              alt={block.imageAlt || block.title || ''}
              loading="lazy"
              className="h-64 w-full object-cover sm:h-80 md:h-[360px]"
            />
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
            <span className="text-sm font-medium">{t("Florial")}</span>
          </div>
        )}
      </div>

      <div className={imageLeft ? 'order-2' : 'order-2 md:order-1'}>
        {block.title && (
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {block.title}
          </h2>
        )}
        <div className="text-base md:text-lg">
          {renderPortableText(block.text)}
        </div>
      </div>
    </section>
  )
}

export function ServicePage({ service, onNavigateHome }: ServicePageProps) {
  const { t, language, localize } = useI18n()
  const contentBlocks = (service.contentBlocks || []).map((block) => ({ ...block, title: localize(block, 'title'), text: localize(block, 'text'), imageAlt: localize(block, 'imageAlt') }))

  return (
    <main className="w-full flex-grow bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onNavigateHome}
          className="mb-6 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        >
          <span aria-hidden="true">←</span> {t("Към началната страница")}
        </button>

        <header className="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">
          <span className="mb-3 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            {t("Услуги на Florial")}
          </span>
          <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {localize(service, 'name')}
          </h1>
          {service.shortDescription && (
            <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              {localize(service, 'shortDescription')}
            </p>
          )}
          {service.startingPriceEUR != null && service.startingPriceEUR > 0 && (
            <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3">
              <span className="text-sm font-medium text-emerald-900">{t('Начална цена:')}</span>
              <span className="text-2xl font-extrabold text-emerald-800">
                {language === 'en' ? 'from' : 'от'} {new Intl.NumberFormat(language === 'en' ? 'en-IE' : language === 'ru' ? 'ru-RU' : 'bg-BG', { maximumFractionDigits: 2 }).format(service.startingPriceEUR)} €
              </span>
            </div>
          )}
        </header>

        {service.imageUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl bg-slate-100 shadow-sm md:mb-12">
            <img
              src={service.imageUrl}
              alt={localize(service, 'name')}
              fetchPriority="high"
              className="max-h-[560px] min-h-[220px] w-full object-cover"
            />
          </div>
        )}

        {service.description && (
          <div className="mx-auto max-w-4xl py-4 text-base md:py-6 md:text-lg">
            {renderPortableText(localize(service, 'description'))}
          </div>
        )}

        {contentBlocks.length > 0 && (
          <div className="divide-y divide-slate-100">
            {contentBlocks.map((block, index) => (
              <ContentBlock key={block._key || index} block={block} index={index} />
            ))}
          </div>
        )}

        {service.callToAction?.title && (
          <section className="my-8 rounded-2xl bg-emerald-800 px-6 py-10 text-center text-white md:my-12 md:px-12">
            <h2 className="text-2xl font-bold md:text-3xl">{localize(service.callToAction, 'title')}</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-emerald-50">
              {t('Свържете се с нас и ще обсъдим подходящото решение за вашата градина.')}
            </p>
            <a
              href="/contacts"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800"
            >
              {t("Свържете се с нас")}
            </a>
          </section>
        )}
      </div>
    </main>
  )
}
