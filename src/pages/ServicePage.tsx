import React, { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem, ServiceContentBlock, ServiceGalleryImage } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { classifyRichTextHref } from '../lib/richTextUtils.mjs'
import { getSanityImageProps } from '../lib/sanityImage'

interface ServicePageProps {
  service: ServiceItem
  onNavigateHome: () => void
}

const SERVICE_DIRECTION_BY_CATEGORY: Record<string, { slug: string; title: Record<string, string> }> = {
  landscaping: { slug: 'landshaften-arhitekt', title: { bg: 'Ландшафтен архитект', ru: 'Ландшафтный архитектор', en: 'Landscape architect' } },
  irrigation: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  maintenance: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  delivery: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  planting: { slug: 'gardinar', title: { bg: 'Градинар', ru: 'Садовник', en: 'Gardener' } },
  lawn: { slug: 'trevni-ploshti', title: { bg: 'Специалист по тревни площи', ru: 'Специалист по газонам', en: 'Lawn specialist' } },
}

function createLeadIdempotencyKey(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return `florial-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

const sectionForHeading = (value: string, language: string) => {
  const normalized = value.trim().toLocaleLowerCase()
  const headings: Record<string, Record<string, string[]>> = {
    bg: {
      intro: ['нашият подход към засаждането на маслини', 'планиране на засаждането и избор на растения', 'проектиране на система за автоматично поливане'],
      design: ['проектиране и разделяне на поливни зони'],
      testing: ['проверка, настройка и пускане'],

      trenches: ['какво включва монтажът на автоматична поливна система', 'подготовка на мястото и посадъчната яма', 'подготовка на терена и почвата', 'оглед и подготовка на терена', 'подготовка на трасетата и полагане на тръбите'],
      pipeline: ['полагане на тръби и кабели', 'доставка и транспортиране на маслиновото дърво', 'трасировка на тръбопроводите'],

      watering: ['поливане и грижи след засаждането', 'първоначално поливане и последващи грижи', 'калкулация и проектна документация'],

      equipment: ['монтаж на разпръсквачи и капково напояване', 'позициониране и засаждане с помощта на техника', 'засаждане на дървета, храсти и живи плетове', 'професионално засаждане на палмата', 'подбор на поливочно оборудване', 'монтаж на разпръсквачите и поливното оборудване'],

      automation: ['клапани, филтри и управление', 'първоначални грижи след засаждането', 'засаждане на цветя и декоративни треви', 'автоматизация на поливането'],

    },
    ru: {
      intro: ['наш подход к посадке оливковых деревьев', 'планирование посадки и выбор растений', 'проектирование системы автоматического полива'],
      design: ['проектирование и разделение на зоны полива'],
      testing: ['проверка, настройка и запуск'],

      trenches: ['что включает монтаж системы автоматического полива', 'подготовка участка и посадочной ямы', 'подготовка участка и почвы', 'осмотр и подготовка участка', 'подготовка трасс и прокладка труб'],
      pipeline: ['прокладка труб и кабелей', 'доставка и транспортировка оливкового дерева', 'трассировка трубопроводов'],

      watering: ['полив и уход после посадки', 'первый полив и уход после посадки', 'смета и проектная документация'],

      equipment: ['монтаж дождевателей и капельного полива', 'позиционирование и посадка с помощью техники', 'посадка деревьев, кустарников и живых изгородей', 'технология посадки пальм', 'подбор оборудования для полива', 'установка дождевателей и поливного оборудования'],

      automation: ['клапаны, фильтры и управление', 'первоначальный уход после посадки', 'посадка цветов и декоративных трав', 'автоматизация полива'],

    },
    en: {
      intro: ['our approach to olive tree planting', 'planning the planting and selecting suitable plants', 'designing an automatic irrigation system'],
      design: ['system design and irrigation zones'],
      testing: ['system testing, adjustment and commissioning'],

      trenches: ['what is included in an automatic irrigation system installation', 'site and planting pit preparation', 'preparing the site and soil', 'site assessment and preparation', 'route preparation and pipe installation'],
      pipeline: ['pipe and cable installation', 'delivery and transportation of the olive tree', 'irrigation pipe routing'],

      watering: ['watering and aftercare', 'initial watering and aftercare', 'cost estimate and project documentation'],

      equipment: ['sprinkler and drip irrigation installation', 'positioning and planting with specialist equipment', 'planting trees, shrubs and hedges', 'the palm planting process', 'selecting irrigation equipment', 'installing sprinklers and irrigation equipment'],

      automation: ['valves, filters and controls', 'initial care after planting', 'planting flowers and ornamental grasses', 'irrigation automation'],

    },
  }
  const languageHeadings = headings[language] || headings.bg
  return Object.entries(languageHeadings).find(([, values]) => values.some((heading) => normalized === heading))?.[0]
}

function renderImageGallery(images: ServiceContentBlock[], group: string, language: string) {
  if (!images.length) return null
  const singleImage = images.length === 1
  return (
    <section
      aria-label={language === 'ru' ? 'Иллюстрации к разделам услуги' : language === 'en' ? 'Service section illustrations' : 'Илюстрации към разделите на услугата'}
      className={singleImage ? 'my-8 flex justify-center' : group === 'intro' ? 'my-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4' : 'my-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3'}
    >
      {images.map((image, index) => {
        const isPriorityImage = group === 'intro' && index === 0
        const alt = language === 'ru'
          ? image.imageAltRu || image.imageAlt || ''
          : language === 'en'
            ? image.imageAltEn || image.imageAlt || ''
            : image.imageAlt || ''
        return (
          <figure
            key={image._key || `${group}-${index}`}
            className={singleImage
              ? 'w-full max-w-2xl overflow-hidden rounded-xl border border-slate-100 bg-slate-50'
              : 'min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm'}
          >
            {image.imageUrl && (
              image.imageLinkUrl || image.linkUrl
                ? <a href={(image.imageLinkUrl || image.linkUrl || '').startsWith('/') ? localizedHref(image.imageLinkUrl || image.linkUrl || '/', language) : (image.imageLinkUrl || image.linkUrl)} className="block" aria-label={alt || undefined}>
                    <img {...getSanityImageProps(image.imageUrl, singleImage ? '(min-width: 768px) 672px, 100vw' : group === 'intro' ? '(min-width: 1024px) 25vw, 50vw' : '(min-width: 768px) 33vw, 50vw')} alt={alt} loading={isPriorityImage ? "eager" : "lazy"} fetchPriority={isPriorityImage ? "high" : undefined} decoding="async" className={singleImage ? 'mx-auto max-h-[520px] w-full object-contain' : group === 'intro' ? 'h-36 w-full object-cover sm:h-44 lg:h-48' : 'h-40 w-full object-cover sm:h-52 md:h-56'} />
                  </a>
                : <img {...getSanityImageProps(image.imageUrl, singleImage ? '(min-width: 768px) 672px, 100vw' : group === 'intro' ? '(min-width: 1024px) 25vw, 50vw' : '(min-width: 768px) 33vw, 50vw')} alt={alt} loading={isPriorityImage ? "eager" : "lazy"} fetchPriority={isPriorityImage ? "high" : undefined} decoding="async" className={singleImage ? 'mx-auto max-h-[520px] w-full object-contain' : group === 'intro' ? 'h-36 w-full object-cover sm:h-44 lg:h-48' : 'h-40 w-full object-cover sm:h-52 md:h-56'} />
            )}
            {!singleImage && alt && (
              <figcaption className="px-3 py-2.5 text-xs leading-5 text-slate-600 sm:text-sm">{alt}</figcaption>
            )}
          </figure>
        )
      })}
    </section>
  )
}

function renderServiceGallery(images: ServiceGalleryImage[], language: string) {
  if (!images.length) return null

  return (
    <section className="my-8" aria-label={language === 'ru' ? 'Галерея услуги' : language === 'en' ? 'Service gallery' : 'Галерия на услугата'}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {images.map((image, index) => {
          if (!image.url) return null
          const alt = language === 'ru'
            ? (image.altRu || image.alt || '')
            : language === 'en'
              ? (image.altEn || image.alt || '')
              : (image.alt || '')
          return (
            <figure key={image._key || `service-gallery-${index}`} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              {image.linkUrl
            ? <a href={image.linkUrl.startsWith('/') ? localizedHref(image.linkUrl, language) : image.linkUrl} className="block"><img {...getSanityImageProps(image.url, '(min-width: 768px) 33vw, 50vw')} alt={alt} loading="lazy" decoding="async" className="h-40 w-full object-cover sm:h-52 md:h-56" /></a>
            : <img {...getSanityImageProps(image.url, '(min-width: 768px) 33vw, 50vw')} alt={alt} loading="lazy" decoding="async" className="h-40 w-full object-cover sm:h-52 md:h-56" />}
            </figure>
          )
        })}
      </div>
    </section>
  )
}

function getLeadFieldLabel(field: any, language: string): string {
  const localizedLabels: Record<string, Record<string, string>> = {
    name: { ru: 'Имя', en: 'Name' },
    phone: { ru: 'Телефон', en: 'Phone' },
    email: { ru: 'Электронная почта', en: 'Email' },
    location: { ru: 'Населённый пункт', en: 'Town / city' },
    details: { ru: 'Описание проекта', en: 'Project details' },
  }
  return localizedLabels[field?.name]?.[language] || field?.label || field?.name || ''
}

function normalizeHeadingText(value: string): string {
  return value
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!:：]+$/g, '')
    .toLocaleLowerCase()
    .trim()
}

function removeDuplicateHeroHeading(content: any, heroTitle: string): any {
  const target = normalizeHeadingText(heroTitle || '')
  if (!target) return content

  if (typeof content === 'string') {
    const lines = content.split('\n')
    const firstContentLine = lines.findIndex((line) => line.trim().length > 0)
    if (firstContentLine >= 0 && normalizeHeadingText(lines[firstContentLine]) === target) {
      lines.splice(firstContentLine, 1)
    }
    return lines.join('\n')
  }

  if (Array.isArray(content)) {
    let firstHeadingSeen = false
    return content.filter((block: any) => {
      if (firstHeadingSeen || block?._type !== 'block' || !['h1', 'h2', 'h3'].includes(block.style)) {
        return true
      }
      firstHeadingSeen = true
      const heading = (block.children || []).map((child: any) => child.text || '').join('')
      return normalizeHeadingText(heading) !== target
    })
  }

  return content
}

function getDescriptionHeadings(content: any): string[] {
  if (typeof content === 'string') {
    return content.split('\n').map((line) => line.trim().replace(/^#{1,6}\s*/, '')).filter(Boolean)
  }
  if (!Array.isArray(content)) return []
  return content
    .filter((block: any) => block?._type === 'block' && ['h2', 'h3'].includes(block.style))
    .map((block: any) => (block.children || []).map((child: any) => child.text || '').join('').trim())
    .filter(Boolean)
}

function descriptionHasSection(headings: string[], section: 'advantages' | 'steps' | 'contact'): boolean {
  const values = headings.map((heading) => heading.toLocaleLowerCase().replace(/[.!:：]+$/g, '').trim())
  if (section === 'advantages') {
    return values.some((heading) => /^(предимства|преимущества|advantages|benefits|why choose us|why choose florial)$/.test(heading))
  }
  if (section === 'steps') {
    return values.some((heading) => /^(етапи на работа|етапи на изпълнение|этапы работы|этапы выполнения|how it works|how we work|our process|steps of the process)$/.test(heading))
  }
  return values.some((heading) => /^(свържете се с florial|свържете се с нас|свяжитесь с florial|свяжитесь с нами|contact florial|contact us)$/.test(heading))
}

function getInternalRichTextPath(href: string) {
  const url = new URL(href, 'https://florial-bg.com')
  url.searchParams.delete('lang')
  return url.pathname + url.search + url.hash
}

function renderInlineMarkdown(value: string, language: string) {
  // Support a deliberately small, safe inline-markup subset for localized service copy.
  // Underline is rendered as a React element; raw HTML is never injected into the page.
  const tokens = value.split(/(<u>[^<]+<\/u>|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return tokens.map((part, index) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={index}>{part.slice(3, -4)}</u>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{renderInlineMarkdown(part.slice(2, -2), language)}</strong>
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      const kind = classifyRichTextHref(href)
      if (kind === 'unsafe') return label
      const resolvedHref = kind === 'internal'
        ? localizedHref(getInternalRichTextPath(href), language)
        : href
      return (
        <a
          key={index}
          href={resolvedHref}
          target={kind === 'external' ? '_blank' : undefined}
          rel={kind === 'external' ? 'noopener noreferrer' : undefined}
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          {label}
        </a>
      )
    }
    return part
  })
}

function renderMarkdownDescription(content: string, language: string, imageGroups: Record<string, ServiceContentBlock[]>) {
  const chunks = content.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean)
  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    const first = lines[0]
    const galleryMarker = first.match(/^\[\[gallery:(intro|design|pipeline|equipment|trenches|watering|automation)\]\]$/)
    if (galleryMarker) return renderImageGallery(imageGroups[galleryMarker[1]] || [], galleryMarker[1], language)
    if (first.startsWith('## ')) {
      const heading = first.slice(3).trim()
      const section = sectionForHeading(heading, language)
      return (
        <React.Fragment key={index}>
          <h2 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{heading}</h2>
          {section ? renderImageGallery(imageGroups[section] || [], section, language) : null}
          {lines.slice(1).length > 0 && <p className="mb-4 leading-7 text-slate-600">{renderInlineMarkdown(lines.slice(1).join(' '), language)}</p>}
        </React.Fragment>
      )
    }
    if (first.startsWith('### ')) {
      const heading = first.slice(4).trim()
      const section = sectionForHeading(heading, language)
      return (
        <React.Fragment key={index}>
          <h3 className="mb-3 mt-6 text-xl font-bold text-slate-900">{heading}</h3>
          {section ? renderImageGallery(imageGroups[section] || [], section, language) : null}
        </React.Fragment>
      )
    }
    if (lines.every((line) => line.startsWith('- '))) {
      return (
        <ul key={index} className="mb-5 list-disc space-y-2 pl-6 leading-7 text-slate-600">
          {lines.map((line, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(line.slice(2), language)}</li>)}
        </ul>
      )
    }
    if (lines.every((line) => /^\d+\.\s/.test(line))) {
      return (
        <ol key={index} className="mb-5 list-decimal space-y-2 pl-6 leading-7 text-slate-600">
          {lines.map((line, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(line.replace(/^\d+\.\s/, ''), language)}</li>)}
        </ol>
      )
    }
    return <p key={index} className="mb-4 leading-7 text-slate-600">{renderInlineMarkdown(lines.join(' '), language)}</p>
  })
}

function renderPortableText(
  content: any,
  language = 'bg',
  imageGroups: Record<string, ServiceContentBlock[]> = {},
) {
  if (!content) return null
  if (typeof content === 'string') return renderMarkdownDescription(content, language, imageGroups)
  if (!Array.isArray(content)) return null

  return content.map((block: any, index: number) => {
    if (block?._type !== 'block') return null
    const children = (block.children || []).map((child: any, childIndex: number) => {
      let node: React.ReactNode = child.text || ''
      const marks: string[] = Array.isArray(child.marks) ? child.marks : []
      marks.forEach((mark: string) => {
        if (mark === 'strong') node = <strong key={childIndex}>{node}</strong>
        else if (mark === 'em') node = <em key={childIndex}>{node}</em>
        else if (mark === 'underline') node = <u key={childIndex}>{node}</u>
        else if (mark === 'strike-through') node = <s key={childIndex}>{node}</s>
        else if (mark === 'code') node = <code key={childIndex}>{node}</code>
      })
      const link = (block.markDefs || []).find((definition: any) =>
        definition?._type === 'link' && definition?._key && marks.includes(definition._key)
      )
      const kind = link?.href ? classifyRichTextHref(link.href) : 'unsafe'
      if (link?.href && kind !== 'unsafe') {
        const href = kind === 'internal'
          ? localizedHref(getInternalRichTextPath(link.href), language)
          : link.href
        node = (
          <a
            href={href}
            target={kind === 'external' ? '_blank' : undefined}
            rel={kind === 'external' ? 'noopener noreferrer' : undefined}
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
          >
            {node}
          </a>
        )
      }
      return <React.Fragment key={child._key || childIndex}>{node}</React.Fragment>
    })
    const key = block._key || index
    const text = (block.children || []).map((child: any) => child.text || '').join('')
    const galleryMarker = block.style === 'normal' ? text.trim().match(/^\[\[gallery:(intro|design|pipeline|equipment|trenches|watering|automation)\]\]$/) : null
    if (galleryMarker) return <React.Fragment key={key}>{renderImageGallery(imageGroups[galleryMarker[1]] || [], galleryMarker[1], language)}</React.Fragment>
    if (block.style === 'h2') {
      const section = sectionForHeading(text, language)
      return (
        <React.Fragment key={key}>
          <h2 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{children}</h2>
          {section ? renderImageGallery(imageGroups[section] || [], section, language) : null}
        </React.Fragment>
      )
    }
    if (block.style === 'h3') {
      const section = sectionForHeading(text, language)
      return (
        <React.Fragment key={key}>
          <h3 className="mb-3 mt-6 text-xl font-bold text-slate-900">{children}</h3>
          {section ? renderImageGallery(imageGroups[section] || [], section, language) : null}
        </React.Fragment>
      )
    }
    if (block.style === 'h4') return <h4 key={key} className="mb-2 mt-5 text-lg font-semibold text-slate-900">{children}</h4>
    if (block.listItem === 'number') return <ol key={key} className="mb-4 list-decimal pl-6 text-slate-600"><li>{children}</li></ol>
    if (block.listItem === 'bullet') return <ul key={key} className="mb-4 list-disc pl-6 text-slate-600"><li>{children}</li></ul>
    return <p key={key} className="mb-4 leading-7 text-slate-600">{children}</p>
  })
}

export function ServicePage({ service }: ServicePageProps) {
  const { t, language, localize } = useI18n()
  const [leadSubmissionStatus, setLeadSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [leadSubmissionMessage, setLeadSubmissionMessage] = useState('')
  const [leadSubmissionNumber, setLeadSubmissionNumber] = useState('')
  const [leadIdempotencyKey] = useState(() => createLeadIdempotencyKey())
  const localizedName = String(localize(service, 'name') || service.name)
  const translatedHero = language === 'bg' ? service.hero : service.translations?.[language]?.hero
  const hero = translatedHero || service.hero || {}
  const heroTitle = translatedHero?.title || (language === 'bg' ? hero.title || localizedName : localizedName)
  const heroSubtitle = translatedHero?.subtitle || localize(service, 'shortDescription') || (language === 'bg' ? hero.subtitle : undefined)
  const heroImageUrl = hero.imageUrl || service.imageUrl
  const heroImageAlt = language === 'ru'
    ? (hero.imageAltRu || service.imageAltRu || localizedName)
    : language === 'en'
      ? (hero.imageAltEn || service.imageAltEn || localizedName)
      : (hero.imageAlt || service.imageAlt || localizedName)
  const galleryImages = Array.isArray(service.galleryImages)
    ? service.galleryImages.filter((image) => Boolean(image?.url) && image.url !== heroImageUrl)
    : []
  const description = localize(service, 'description')
  const descriptionForRender = removeDuplicateHeroHeading(description, heroTitle)
  const descriptionHeadings = getDescriptionHeadings(descriptionForRender)
  const advantages = localize(service, 'advantages') || service.advantages || []
  const steps = localize(service, 'steps') || service.steps || []
  const showAdvantages = Array.isArray(advantages) && advantages.length > 0 && !descriptionHasSection(descriptionHeadings, 'advantages')
  const showSteps = Array.isArray(steps) && steps.length > 0 && !descriptionHasSection(descriptionHeadings, 'steps')
  const callToAction = localize(service, 'callToAction') || service.callToAction || {}
  const showCallToAction = Boolean(callToAction.title || callToAction.text || callToAction.buttonLabel || callToAction.buttonText) && !descriptionHasSection(descriptionHeadings, 'contact')
  const translatedLeadForm = language === 'bg' ? service.leadForm : service.translations?.[language]?.leadForm
  const leadForm = translatedLeadForm || service.leadForm || {}
  const leadFormFields = Array.isArray(leadForm.fields) ? leadForm.fields : []
  const leadFormTitle = translatedLeadForm?.title || (language === 'bg' ? leadForm.title : undefined) || (language === 'ru' ? 'Заявка на услугу' : language === 'en' ? 'Service enquiry' : 'Запитване за услуга')
  const leadFormSubmitLabel = translatedLeadForm?.submitLabel || (language === 'bg' ? leadForm.submitLabel : undefined) || (language === 'ru' ? 'Отправить заявку' : language === 'en' ? 'Send enquiry' : 'Изпрати запитване')
  const leadFormReady = Boolean(leadFormFields.length > 0 && service.slug?.current)
  const direction = SERVICE_DIRECTION_BY_CATEGORY[service.serviceCategory || '']

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leadFormReady || leadSubmissionStatus === 'submitting' || leadSubmissionStatus === 'success') return
    const formData = new FormData(event.currentTarget)
    const fields: Record<string, string> = {}
    for (const field of leadFormFields) {
      const fieldName = typeof field?.name === 'string' ? field.name : ''
      if (fieldName) fields[fieldName] = String(formData.get(fieldName) || '')
    }
    setLeadSubmissionStatus('submitting')
    setLeadSubmissionMessage('')
    try {
      const response = await fetch('/api/service-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: service.slug?.current,
          locale: language,
          fields,
          website: String(formData.get('website') || ''),
          idempotencyKey: leadIdempotencyKey,
        }),
      })
      const result = await response.json().catch(() => ({})) as { leadNumber?: string }
      if (!response.ok) throw new Error('Service enquiry failed')
      setLeadSubmissionNumber(typeof result.leadNumber === 'string' ? result.leadNumber : '')
      setLeadSubmissionMessage(
        leadForm.successMessage ||
        (language === 'ru' ? 'Спасибо! Ваша заявка получена. Команда Florial свяжется с вами.' : language === 'en' ? 'Thank you. Your enquiry has been received. The Florial team will contact you.' : 'Благодарим Ви! Получихме запитването. Екипът на Florial ще се свърже с Вас.'),
      )
      setLeadSubmissionStatus('success')
    } catch {
      setLeadSubmissionMessage(
        language === 'ru' ? 'Не удалось отправить заявку. Пожалуйста, попробуйте ещё раз.' : language === 'en' ? 'We could not send your enquiry. Please try again.' : 'Заявката не беше изпратена. Моля, опитайте отново.',
      )
      setLeadSubmissionStatus('error')
    }
  }

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
      imageUrl: service.imageUrl || service.hero?.imageUrl,
      noIndex: localizedSeo?.noIndex === true,
      alternates: baseUrl ? alternates : undefined,
    })

    if (baseUrl) {
      const serviceUrl = new URL(localizedHref(`/services/${encodeURIComponent(serviceSlug)}`, language), window.location.origin).toString()
      const directionUrl = direction ? new URL(localizedHref(`/services/category/${direction.slug}`, language), window.location.origin).toString() : undefined
      setStructuredData('service', {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': serviceUrl + '#service',
        name: localizedName,
        description: typeof shortDescription === 'string' ? shortDescription : localizedName,
        url: serviceUrl,
        serviceType: service.serviceCategory || localizedName,
        provider: { '@id': 'https://florial-bg.com/#organization' },
        areaServed: [
          { '@type': 'City', name: 'Nessebar' },
          { '@type': 'City', name: 'Ravda' },
          { '@type': 'City', name: 'Sunny Beach' },
          { '@type': 'City', name: 'Sveti Vlas' },
          { '@type': 'City', name: 'Aheloy' },
          { '@type': 'City', name: 'Pomorie' },
        ],
        ...(service.imageUrl ? { image: [service.imageUrl] } : {}),
      })
      setStructuredData('breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('Начало'), item: new URL(localizedHref('/', language), window.location.origin).toString() },
          { '@type': 'ListItem', position: 2, name: language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги', item: new URL(localizedHref('/services', language), window.location.origin).toString() },
          ...(direction && directionUrl ? [{ '@type': 'ListItem', position: 3, name: direction.title[language] || direction.title.bg, item: directionUrl }] : []),
          { '@type': 'ListItem', position: direction && directionUrl ? 4 : 3, name: localizedName, item: new URL(localizedHref(`/services/${encodeURIComponent(serviceSlug)}`, language), window.location.origin).toString() },
        ],
      })
    }
  }, [service, language, localize, t])

  // Legacy marker blocks and the automatic-irrigation gallery are rendered beside
  // the article headings they illustrate. Existing media assets remain in Sanity.
  const sourceBlocks = Array.isArray(service.contentBlocks) ? service.contentBlocks : []
  const isAutomaticIrrigationService = service.slug?.current === 'avtomatichno-napoyavane'
  const automaticIrrigationImageGroups: Record<string, string> = {
    img1: 'design',
    img2: 'trenches',
    img3: 'equipment',
    img4: 'testing',
  }
  const firstInformationImage = isAutomaticIrrigationService
    ? galleryImages.find((image) => image._key === 'img0')
    : undefined
  const firstInformationImageBlock: ServiceContentBlock | undefined = firstInformationImage
    ? {
        _key: firstInformationImage._key,
        imageUrl: firstInformationImage.url,
        imageAlt: firstInformationImage.alt,
        imageAltRu: firstInformationImage.altRu,
        imageAltEn: firstInformationImage.altEn,
        linkUrl: firstInformationImage.linkUrl,
      }
    : undefined
  const articleGalleryBlocks: ServiceContentBlock[] = isAutomaticIrrigationService
    ? galleryImages.flatMap((image) => {
        const group = automaticIrrigationImageGroups[image._key || '']
        if (!group || !image.url) return []
        return [{
          _key: image._key,
          title: `__gallery:${group}`,
          imageUrl: image.url,
          imageAlt: image.alt,
          imageAltRu: image.altRu,
          imageAltEn: image.altEn,
          linkUrl: image.linkUrl,
        }]
      })
    : []
  const landscapeGalleryImageGroups: Record<string, string> = service.slug?.current === 'landshaften-dizain' ? {
    dropLandscape2019: 'intro',
    dropProject2021: 'intro',
    img1: 'design',
    img2: 'design',
    projectMasterPlan: 'pipeline',
    projectDendroplan: 'equipment',
    projectPlantSchedule: 'equipment',
    dropHedge2020: 'trenches',
    img3: 'trenches',
    img4: 'trenches',
    projectIrrigationPlan: 'watering',
    projectVisualisations: 'automation',
  } : {}
  const landscapeArticleGalleryBlocks: ServiceContentBlock[] = galleryImages.flatMap((image) => {
    const group = landscapeGalleryImageGroups[image._key || '']
    if (!group || !image.url) return []
    return [{
      _key: image._key,
      title: `__gallery:${group}`,
      imageUrl: image.url,
      imageAlt: image.alt,
      imageAltRu: image.altRu,
      imageAltEn: image.altEn,
      linkUrl: image.linkUrl,
    }]
  })
  const sourceBlocksWithArticleGallery = [...sourceBlocks, ...articleGalleryBlocks, ...landscapeArticleGalleryBlocks]
  const imageGroups = sourceBlocksWithArticleGallery.reduce<Record<string, ServiceContentBlock[]>>((groups, block) => {
    const match = typeof block.title === 'string'
      ? block.title.match(/^__gallery:(intro|design|trenches|pipeline|equipment|automation|watering|testing)$/)
      : null
    if (!match || !block.imageUrl) return groups
    const group = match[1]
    groups[group] = [...(groups[group] || []), block]
    return groups
  }, {})
  const hasIntroGallery = Boolean(imageGroups.intro?.length) && service.slug?.current !== 'zasazhdane-na-rasteniya'
  // Keep legacy gallery-marker blocks in their article sections; render regular
  // image-and-text blocks as a separate section at the bottom of every service page.
  const additionalContentBlocks = sourceBlocks.filter((block) =>
    !/^__gallery:(intro|trenches|pipeline|equipment|automation|watering)$/.test(block.title || '') &&
    Boolean(block.imageUrl || block.title || block.text),
  )

  return (
    <main className="w-full flex-grow bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <a href={localizedHref('/', language)} className="hover:text-emerald-700 no-underline">{language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'}</a>
          <span aria-hidden="true">/</span>
          <a href={localizedHref('/services', language)} className="hover:text-emerald-700 no-underline">{language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги'}</a>
          {direction && (
            <>
              <span aria-hidden="true">/</span>
              <a href={localizedHref(`/services/category/${direction.slug}`, language)} className="hover:text-emerald-700 no-underline">{direction.title[language] || direction.title.bg}</a>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-slate-700">{localize(service, 'name')}</span>
        </nav>

        <header className="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">
          <span className="mb-3 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            {t("Услуги на Florial")}
          </span>
          <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              {heroSubtitle}
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
          : heroImageUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl bg-slate-100 shadow-sm md:mb-12">
              {hero.imageLinkUrl || service.imageLinkUrl
                ? <a href={(hero.imageLinkUrl || service.imageLinkUrl || '').startsWith('/') ? localizedHref(hero.imageLinkUrl || service.imageLinkUrl || '/', language) : (hero.imageLinkUrl || service.imageLinkUrl)} className="block">
                    <img {...getSanityImageProps(heroImageUrl, '(min-width: 896px) 896px, calc(100vw - 2rem)', 1200)} alt={heroImageAlt} loading="eager" fetchPriority="high" decoding="async" className="max-h-[560px] min-h-[220px] w-full object-cover" />
                  </a>
                : <img {...getSanityImageProps(heroImageUrl, '(min-width: 896px) 896px, calc(100vw - 2rem)', 1200)} alt={heroImageAlt} loading="eager" fetchPriority="high" decoding="async" className="max-h-[560px] min-h-[220px] w-full object-cover" />}
            </div>
          )}

        {isAutomaticIrrigationService
          ? firstInformationImageBlock && renderImageGallery([firstInformationImageBlock], 'intro', language)
          : service.slug?.current === 'landshaften-dizain'
            ? null
            : galleryImages.length > 0 && renderServiceGallery(galleryImages, language)}

        {description && (
          <div className="mx-auto max-w-4xl py-4 text-base md:py-6 md:text-lg">
            {renderPortableText(descriptionForRender, language, imageGroups)}
          </div>
        )}

        {Array.isArray(service.relatedContent) && service.relatedContent.filter((item) => item?.slug?.current && (item._type === 'service' ? item.isActive !== false : item._type === 'blogPost' ? item.isPublished === true : true)).length > 0 && (
          <section className="mx-auto my-8 max-w-5xl" aria-label={language === 'ru' ? 'Связанные материалы' : language === 'en' ? 'Related services and resources' : 'Свързани услуги и материали'}>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{language === 'ru' ? 'Возможно, вас заинтересует' : language === 'en' ? 'You may also be interested in' : 'Може да разгледате и'}</h2>
            <div className="grid gap-3">
              {service.relatedContent.filter((item) => item?.slug?.current && (item._type === 'service' ? item.isActive !== false : item._type === 'blogPost' ? item.isPublished === true : true)).map((item) => {
                const localized = language === 'bg' ? undefined : item.translations?.[language]
                const itemTitle = localized?.name || localized?.title || item.name || item.title || ''
                const itemDescription = localized?.shortDescription || item.shortDescription || ''
                const itemSlug = item.slug?.current || ''
                const path = item._type === 'service' ? '/services/' + itemSlug : item._type === 'blogPost' ? '/blog/' + itemSlug : item._type === 'category' ? '/category/' + itemSlug : '/product/' + itemSlug
                const itemAlt = language === 'ru' ? item.imageAltRu || itemTitle : language === 'en' ? item.imageAltEn || itemTitle : item.imageAlt || itemTitle
                return <a key={item._id} href={localizedHref(path, language)} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm">
                  {item.imageUrl && <img {...getSanityImageProps(item.imageUrl, '112px', 240)} alt={itemAlt} loading="lazy" decoding="async" className="h-20 w-24 shrink-0 rounded-lg object-cover sm:h-24 sm:w-28" />}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900 group-hover:text-emerald-800">{itemTitle}</span>
                    {itemDescription && <span className="mt-1 block text-sm leading-5 text-slate-600">{itemDescription}</span>}
                    <span className="mt-2 block text-xs font-semibold text-emerald-800">{language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Learn more →' : 'Научете повече →'}</span>
                  </span>
                </a>
              })}
            </div>
          </section>
        )}

        {showAdvantages && (
          <section className="mx-auto my-10 max-w-5xl">
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {language === 'ru' ? 'Преимущества' : language === 'en' ? 'Why choose us' : 'Предимства'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {advantages.map((item: any, index: number) => (
                <article key={item?._key || `advantage-${index}`} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  {item?.title && <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>}
                  {(item?.text || item?.description) && <p className="leading-7 text-slate-600">{item.text || item.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {showSteps && (
          <section className="mx-auto my-10 max-w-5xl">
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {language === 'ru' ? 'Этапы работы' : language === 'en' ? 'How it works' : 'Етапи на изпълнение'}
            </h2>
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((step: any, index: number) => (
                <li key={step?._key || `service-step-${index}`} className="flex gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-800">
                    {step?.stepNumber || index + 1}
                  </span>
                  <div>
                    {step?.title && <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>}
                    {(step?.text || step?.description) && <p className="leading-7 text-slate-600">{step.text || step.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {showCallToAction && (
          <section className="my-8 rounded-2xl bg-emerald-800 px-6 py-10 text-center text-white md:my-12 md:px-12">
            {callToAction.title && <h2 className="text-2xl font-bold md:text-3xl">{callToAction.title}</h2>}
            {callToAction.text && <p className="mx-auto mt-3 max-w-2xl leading-7 text-emerald-50">{callToAction.text}</p>}
            <a
              href={localizedHref('/contacts', language)}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800"
            >
              {callToAction.buttonLabel || callToAction.buttonText || (language === 'ru' ? 'Связаться с нами' : language === 'en' ? 'Contact us' : 'Свържете се с нас')}
            </a>
          </section>
        )}

        {additionalContentBlocks.length > 0 && (
          <section aria-label={language === 'ru' ? 'Дополнительная информация' : language === 'en' ? 'Additional information' : 'Допълнителна информация'}
            className="mx-auto mt-10 max-w-5xl space-y-8 md:mt-14">
            {additionalContentBlocks.map((block, index) => {
              const translated = language === 'bg' ? undefined : block.translations?.[language]
              const title = translated?.title || block.title
              const text = translated?.text || block.text
              const imageAlt = language === 'ru'
                ? (block.imageAltRu || block.imageAlt || title || '')
                : language === 'en'
                  ? (block.imageAltEn || block.imageAlt || title || '')
                  : (block.imageAlt || title || '')
              const imageFirst = block.imagePosition !== 'right'
              return (
                <article key={block._key || `service-content-${index}`}
                  className="grid items-center gap-5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-8">
                  {block.imageUrl && (
                    <div className={imageFirst ? 'md:order-1' : 'md:order-2'}>
                      {block.imageLinkUrl || block.linkUrl
                        ? <a href={(block.imageLinkUrl || block.linkUrl || '').startsWith('/') ? localizedHref(block.imageLinkUrl || block.linkUrl || '/', language) : (block.imageLinkUrl || block.linkUrl)} className="block">
                            <img {...getSanityImageProps(block.imageUrl, '(min-width: 768px) 768px, calc(100vw - 2rem)', 960)} alt={imageAlt} loading="lazy" decoding="async" className="max-h-[460px] min-h-48 w-full rounded-xl object-cover" />
                          </a>
                        : <img {...getSanityImageProps(block.imageUrl, '(min-width: 768px) 768px, calc(100vw - 2rem)', 960)} alt={imageAlt} loading="lazy" decoding="async" className="max-h-[460px] min-h-48 w-full rounded-xl object-cover" />}
                    </div>
                  )}
                  {(title || text) && (
                    <div className={imageFirst ? 'md:order-2' : 'md:order-1'}>
                      {title && <h2 className="mb-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{title}</h2>}
                      {text && <div className="leading-7 text-slate-600">{renderPortableText(text, language)}</div>}
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}

        {leadFormFields.length > 0 && (
          <section className="mx-auto my-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
              {leadFormTitle}
            </h2>
            <p className="mb-6 text-sm leading-6 text-slate-600">
              {language === 'ru' ? 'Кратко опишите проблему или задачу. Если для уточнения понадобится фотография, мы свяжемся с вами — её можно будет отправить через WhatsApp или другой удобный мессенджер.' : language === 'en' ? 'Briefly describe the issue or project. If a photo is needed, we will contact you and you can send it via WhatsApp or another messenger that suits you.' : 'Опишете накратко проблема или проекта. Ако е необходима снимка за уточнение, ще се свържем с Вас и ще можете да я изпратите чрез WhatsApp или друг удобен месинджър.'}
            </p>
            <p className="mb-5 text-xs leading-5 text-slate-500">
              {language === 'ru' ? 'Вашу заявку получит и обработает менеджер Florial. При необходимости мы свяжемся с вами по указанным контактам.' : language === 'en' ? 'Your enquiry will be received and handled by a Florial manager. If needed, we will contact you using the details you provided.' : 'Заявката Ви ще бъде получена и обработена от мениджър на Florial. При необходимост ще се свържем с Вас на посочените контакти.'}
            </p>
            <form className="grid gap-4" onSubmit={handleLeadSubmit}>
              {leadFormFields.map((field: any, index: number) => (
                <label key={field?._key || field?.name || `lead-field-${index}`} className="grid gap-2 text-sm font-medium text-slate-700">
                  <span>{language === 'bg' ? (field?.label || field?.name) : getLeadFieldLabel(field, language)}</span>
                  {field?.type === 'textarea' || field?.name === 'details'
                    ? <textarea name={field?.name} placeholder={field?.placeholder || ''} required={Boolean(field?.required)} disabled={!leadFormReady || leadSubmissionStatus === 'submitting' || leadSubmissionStatus === 'success'} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal disabled:bg-slate-100" />
                    : <input name={field?.name} type={field?.type === 'tel' || field?.name === 'phone' ? 'tel' : field?.type === 'email' || field?.name === 'email' ? 'email' : 'text'} placeholder={field?.placeholder || ''} required={Boolean(field?.required)} disabled={!leadFormReady || leadSubmissionStatus === 'submitting' || leadSubmissionStatus === 'success'} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal disabled:bg-slate-100" />}
                </label>
              ))}
              <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {leadSubmissionMessage && (
                <p role={leadSubmissionStatus === 'error' ? 'alert' : 'status'} className={leadSubmissionStatus === 'error' ? 'text-sm text-red-700' : 'text-sm text-emerald-800'}>
                  {leadSubmissionMessage}{leadSubmissionNumber ? ' (' + leadSubmissionNumber + ')' : ''}
                </p>
              )}
              <button type="submit" disabled={!leadFormReady || leadSubmissionStatus === 'submitting' || leadSubmissionStatus === 'success'} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">
                {leadSubmissionStatus === 'submitting' ? (language === 'ru' ? 'Отправка…' : language === 'en' ? 'Sending…' : 'Изпращане…') : leadFormSubmitLabel}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
