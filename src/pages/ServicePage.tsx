import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem, ServiceContentBlock } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'

interface ServicePageProps {
  service: ServiceItem
  onNavigateHome: () => void
}

const sectionForHeading = (value: string, language: string) => {
  const normalized = value.trim().toLocaleLowerCase()
  const headings: Record<string, Record<string, string[]>> = {
    bg: {
      trenches: ['какво включва монтажът на автоматична поливна система'],
      pipeline: ['полагане на тръби и кабели'],
      equipment: ['монтаж на разпръсквачи и капково напояване'],
      automation: ['клапани, филтри и управление'],
    },
    ru: {
      trenches: ['что включает монтаж системы автоматического полива'],
      pipeline: ['прокладка труб и кабелей'],
      equipment: ['монтаж дождевателей и капельного полива'],
      automation: ['клапаны, фильтры и управление'],
    },
    en: {
      trenches: ['what is included in an automatic irrigation system installation'],
      pipeline: ['pipe and cable installation'],
      equipment: ['sprinkler and drip irrigation installation'],
      automation: ['valves, filters and controls'],
    },
  }
  const languageHeadings = headings[language] || headings.bg
  return Object.entries(languageHeadings).find(([, values]) => values.some((heading) => normalized === heading))?.[0]
}

function renderImageGallery(images: ServiceContentBlock[], group: string, language: string) {
  if (!images.length) return null
  return (
    <section key={`gallery-${group}`} aria-label={group === 'intro' ? 'Снимки от монтажа на поливна система' : undefined}
      className={group === 'intro'
        ? 'my-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'
        : 'my-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3'}>
      {images.map((image, index) => {
        const alt = language === 'ru'
          ? (image.imageAltRu || image.imageAlt || '')
          : language === 'en'
            ? (image.imageAltEn || image.imageAlt || '')
            : (image.imageAlt || '')
        return (
          <figure key={image._key || `${group}-${index}`} className="min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {image.imageUrl && <img src={image.imageUrl} alt={alt} loading="lazy"
              className={group === 'intro' ? 'h-36 w-full object-cover sm:h-44 lg:h-48' : 'h-40 w-full object-cover sm:h-52 md:h-56'} />}
            {alt && <figcaption className="px-3 py-2.5 text-xs leading-5 text-slate-600 sm:text-sm">{alt}</figcaption>}
          </figure>
        )
      })}
    </section>
  )
}

function renderPortableText(
  content: any,
  language = 'bg',
  imageGroups: Record<string, ServiceContentBlock[]> = {},
) {
  const withGallery = (section: string | undefined) =>
    section ? renderImageGallery(imageGroups[section] || [], section, language) : null

  if (!content) return null

  if (typeof content === 'string') {
    return content.split('\n').map((paragraph, index) => paragraph.trim()).filter(Boolean).map((paragraph, index) => {
      const section = sectionForHeading(paragraph, language)
      if (section) {
        return (
          <React.Fragment key={`paragraph-${index}`}>
            <h2 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{paragraph}</h2>
            {withGallery(section)}
          </React.Fragment>
        )
      }
      return <p key={index} className="mb-4 leading-7 text-slate-600">{paragraph}</p>
    })
  }

  if (!Array.isArray(content)) return null

  return content.map((block: any, index: number) => {
    if (block?._type !== 'block') return null

    const children = block.children || []
    const text = children.map((child: any) => child.text || '').join('')
    const key = block._key || index

    if (block.style === 'h2') {
      const section = sectionForHeading(text, language)
      return (
        <React.Fragment key={key}>
          <h2 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{text}</h2>
          {withGallery(section)}
        </React.Fragment>
      )
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

export function ServicePage({ service, onNavigateHome }: ServicePageProps) {
  const { t, language, localize } = useI18n()

  // Localized service SEO and alternates are emitted only for published translations.
  useEffect(() => {
    const localizedSeo = language === 'bg' ? service.seo : service.translations?.[language]?.seo
    const localizedName = String(localize(service, 'name') || service.name)
    const shortDescription = localize(service, 'shortDescription')
    const serviceSlug = service.slug?.current || (typeof service.slug === 'string' ? service.slug : '')
    const baseUrl = serviceSlug
      ? `https://florial-bg.com/services/${encodeURIComponent(serviceSlug)}`
      : undefined
    const hasLocalizedSeo = (locale: 'ru' | 'en') => Boolean(
      service.translations?.[locale]?.seo?.metaTitle &&
      service.translations?.[locale]?.seo?.metaDescription &&
      service.translations?.[locale]?.seo?.noIndex !== true
    )
    const alternates: Record<string, string> = {}
    if (baseUrl) {
      alternates.bg = baseUrl
      alternates['x-default'] = baseUrl
      if (hasLocalizedSeo('ru')) alternates.ru = `${baseUrl}?lang=ru`
      if (hasLocalizedSeo('en')) alternates.en = `${baseUrl}?lang=en`
    }

    applyPageSeo({
      seo: localizedSeo,
      fallbackTitle: `${localizedName} | Florial`,
      fallbackDescription: typeof shortDescription === 'string' && shortDescription.trim()
        ? shortDescription
        : `${localizedName} — професионални услуги от Florial в България.`,
      language,
      noIndex: false,
      alternates: baseUrl ? alternates : undefined,
    })

    if (baseUrl) {
      setStructuredData('breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('Начало'), item: new URL(localizedHref('/', language), window.location.origin).toString() },
          { '@type': 'ListItem', position: 2, name: language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги', item: new URL(localizedHref('/services', language), window.location.origin).toString() },
          { '@type': 'ListItem', position: 3, name: localizedName, item: new URL(localizedHref(`/services/${encodeURIComponent(serviceSlug)}`, language), window.location.origin).toString() },
        ],
      })
    }
  }, [service, language, localize, t])

  // Photos imported from DROP are tagged by section in contentBlocks.title.
  // Render each group inside the matching article section, not at the page end.
  const sourceBlocks = Array.isArray(service.contentBlocks) ? service.contentBlocks : []
  const imageGroups = sourceBlocks.reduce<Record<string, ServiceContentBlock[]>>((groups, block) => {
    const match = typeof block.title === 'string' ? block.title.match(/^__gallery:(intro|trenches|pipeline|equipment|automation)$/) : null
    if (!match || !block.imageUrl) return groups
    const group = match[1]
    groups[group] = [...(groups[group] || []), block]
    return groups
  }, {})
  const hasIntroGallery = Boolean(imageGroups.intro?.length)

  return (
    <main className="w-full flex-grow bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <a href={localizedHref('/', language)} className="hover:text-emerald-700 no-underline">{language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'}</a>
          <span aria-hidden="true">/</span>
          <a href={localizedHref('/services', language)} className="hover:text-emerald-700 no-underline">{language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги'}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-slate-700">{localize(service, 'name')}</span>
        </nav>

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

        {hasIntroGallery
          ? renderImageGallery(imageGroups.intro || [], 'intro', language)
          : service.imageUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl bg-slate-100 shadow-sm md:mb-12">
              <img
                src={service.imageUrl}
                alt={language === 'ru'
                  ? (service.imageAltRu || localize(service, 'name'))
                  : language === 'en'
                    ? (service.imageAltEn || localize(service, 'name'))
                    : (service.imageAlt || localize(service, 'name'))}
                fetchPriority="high"
                className="max-h-[560px] min-h-[220px] w-full object-cover"
              />
            </div>
          )}

        {service.description && (
          <div className="mx-auto max-w-4xl py-4 text-base md:py-6 md:text-lg">
            {renderPortableText(localize(service, 'description'), language, imageGroups)}
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
