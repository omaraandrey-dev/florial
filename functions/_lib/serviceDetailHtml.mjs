const SITE_URL = 'https://florial-bg.com'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function textValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function localized(service, field, language) {
  if (language !== 'bg') {
    const translated = service?.translations?.[language]?.[field]
    if (translated !== undefined && translated !== null && translated !== '') return translated
  }
  return service?.[field]
}

function localizedHref(value, language) {
  const href = textValue(value)
  if (!href.startsWith('/') || href.startsWith('//')) return href
  try {
    const url = new URL(href, SITE_URL)
    url.searchParams.delete('lang')
    if (language !== 'bg') url.searchParams.set('lang', language)
    return url.pathname + url.search + url.hash
  } catch {
    return ''
  }
}

function safeHref(value, language) {
  const href = textValue(value)
  if (!href || href.startsWith('//')) return ''
  if (href.startsWith('/')) return localizedHref(href, language)
  if (href.startsWith('#') || href.startsWith('?')) return href
  try {
    const url = new URL(href)
    if (url.username || url.password) return ''
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') return href
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    if (url.hostname === 'florial-bg.com' || url.hostname === 'www.florial-bg.com') {
      return localizedHref(url.pathname + url.search + url.hash, language)
    }
    return url.toString()
  } catch {
    return ''
  }
}

function responsiveImage(value, alt, sizes, className, loading = 'lazy', priority = false) {
  if (typeof value !== 'string' || !value.trim()) return ''
  let src = value
  let srcSet = ''
  let dimensions = ''
  try {
    const source = new URL(value)
    const match = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (source.protocol === 'https:' && source.hostname === 'cdn.sanity.io' &&
      /^\/images\/[^/]+\/[^/]+\//.test(source.pathname) && match) {
      const sourceWidth = Number(match[1])
      const sourceHeight = Number(match[2])
      const widths = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
        .map((width) => Math.min(width, sourceWidth))
        .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
        .sort((a, b) => a - b)
      const build = (width) => {
        const image = new URL(source)
        image.searchParams.set('w', String(Math.min(width, sourceWidth)))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', '72')
        return image.toString()
      }
      src = build(960)
      srcSet = widths.map((width) => build(width) + ' ' + width + 'w').join(', ')
      dimensions = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
    }
  } catch {
    return ''
  }
  return '<img src="' + escapeHtml(src) + '"' +
    (srcSet ? ' srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes || '100vw') + '"' : '') +
    dimensions + ' alt="' + escapeHtml(alt || '') + '" loading="' + loading + '"' +
    (priority ? ' fetchpriority="high"' : '') +
    ' decoding="async"' + (className ? ' class="' + className + '"' : '') + ' />'
}

const HEADING_GALLERIES = {
  bg: {
    intro: ['нашият подход към засаждането на маслини', 'планиране на засаждането и избор на растения', 'проектиране на система за автоматично поливане'],
    lawn: ['рулонен тревен чим и изграждане на тревни площи', 'полагане на тревния чим на терена'],
    flowerbeds: ['цветни лехи и растителни композиции', 'за кои растения е подходящо капковото напояване?'],
    design: ['проектиране и разделяне на поливни зони', 'как планираме системата за вашата градина?'],
    testing: ['проверка, настройка и пускане'],
    trenches: ['какво включва монтажът на автоматична поливна система', 'подготовка на мястото и посадъчната яма', 'подготовка на терена и почвата', 'оглед и подготовка на терена', 'подготовка на трасетата и полагане на тръбите'],
    pipeline: ['полагане на тръби и кабели', 'доставка и транспортиране на маслиновото дърво', 'трасировка на тръбопроводите', 'капкова тръба rain bird xfs dripline'],
    watering: ['поливане и грижи след засаждането', 'първоначално поливане и последващи грижи', 'калкулация и проектна документация', 'какво представлява капковото и микрокапковото напояване?'],
    equipment: ['монтаж на разпръсквачи и капково напояване', 'позициониране и засаждане с помощта на техника', 'засаждане на дървета, храсти и живи плетове', 'професионално засаждане на палмата', 'подбор на поливочно оборудване', 'монтаж на разпръсквачите и поливното оборудване', 'микроразпръсквачи и точково напояване'],
    automation: ['клапани, филтри и управление', 'първоначални грижи след засаждането', 'засаждане на цветя и декоративни треви', 'автоматизация на поливането', 'автоматично управление на капковото напояване'],
  },
  ru: {
    intro: ['наш подход к посадке оливковых деревьев', 'планирование посадки и выбор растений', 'проектирование системы автоматического полива'],
    lawn: ['рулонный газон и устройство газонных площадей', 'укладка рулонного газона на участке'],
    flowerbeds: ['цветники и цветочные композиции', 'для каких растений подходит капельный полив?'],
    design: ['проектирование и разделение на зоны полива', 'как мы планируем систему для конкретного сада?'],
    testing: ['проверка, настройка и запуск'],
    trenches: ['что включает монтаж системы автоматического полива', 'подготовка участка и посадочной ямы', 'подготовка участка и почвы', 'осмотр и подготовка участка', 'подготовка трасс и прокладка труб'],
    pipeline: ['прокладка труб и кабелей', 'доставка и транспортировка оливкового дерева', 'трассировка трубопроводов', 'капельная трубка rain bird xfs dripline'],
    watering: ['полив и уход после посадки', 'первый полив и уход после посадки', 'смета и проектная документация', 'что такое капельный и микрокапельный полив?'],
    equipment: ['монтаж дождевателей и капельного полива', 'позиционирование и посадка с помощью техники', 'посадка деревьев, кустарников и живых изгородей', 'технология посадки пальм', 'подбор оборудования для полива', 'установка дождевателей и поливного оборудования', 'микроразбрызгиватели и точечный полив'],
    automation: ['клапаны, фильтры и управление', 'первоначальный уход после посадки', 'посадка цветов и декоративных трав', 'автоматизация полива', 'автоматическое управление капельным поливом'],
  },
  en: {
    intro: ['our approach to olive tree planting', 'planning the planting and selecting suitable plants', 'designing an automatic irrigation system'],
    lawn: ['roll-out turf and lawn installation', 'laying rolled turf on site'],
    flowerbeds: ['flower beds and planting compositions', 'which plants can benefit from drip irrigation?'],
    design: ['system design and irrigation zones', 'how do we plan a system for your garden?'],
    testing: ['system testing, adjustment and commissioning'],
    trenches: ['what is included in an automatic irrigation system installation', 'site and planting pit preparation', 'preparing the site and soil', 'site assessment and preparation', 'route preparation and pipe installation'],
    pipeline: ['pipe and cable installation', 'delivery and transportation of the olive tree', 'irrigation pipe routing', 'rain bird xfs dripline'],
    watering: ['watering and aftercare', 'initial watering and aftercare', 'cost estimate and project documentation', 'what are drip and micro-irrigation systems?'],
    equipment: ['sprinkler and drip irrigation installation', 'positioning and planting with specialist equipment', 'planting trees, shrubs and hedges', 'the palm planting process', 'selecting irrigation equipment', 'installing sprinklers and irrigation equipment', 'micro-sprinklers and point-source watering'],
    automation: ['valves, filters and controls', 'initial care after planting', 'planting flowers and ornamental grasses', 'irrigation automation', 'automatic control for drip irrigation'],
  },
}

const DIRECTIONS = {
  landscaping: { slug: 'landshaften-arhitekt', title: { bg: 'Ландшафтен архитект', ru: 'Ландшафтный архитектор', en: 'Landscape architect' } },
  irrigation: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  maintenance: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  delivery: { slug: 'polivni-sistemi', title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' } },
  planting: { slug: 'gardinar', title: { bg: 'Градинар', ru: 'Садовник', en: 'Gardener' } },
  lawn: { slug: 'trevni-ploshti', title: { bg: 'Специалист по тревни площи', ru: 'Специалист по газонам', en: 'Lawn specialist' } },
}

function sectionForHeading(value, language) {
  const normalized = textValue(value).toLocaleLowerCase()
  const headings = HEADING_GALLERIES[language] || HEADING_GALLERIES.bg
  return Object.entries(headings).find(([, values]) => values.includes(normalized))?.[0]
}

function normalizeHeading(value) {
  return textValue(value).replace(/^#+\s*/, '').replace(/\s+/g, ' ').replace(/[.!:：]+$/g, '').toLocaleLowerCase()
}

function removeDuplicateHeroHeading(content, heroTitle) {
  const target = normalizeHeading(heroTitle)
  if (!target) return content
  if (typeof content === 'string') {
    const lines = content.split('\n')
    const first = lines.findIndex((line) => line.trim())
    if (first >= 0 && normalizeHeading(lines[first]) === target) lines.splice(first, 1)
    return lines.join('\n')
  }
  if (Array.isArray(content)) {
    let seen = false
    return content.filter((block) => {
      if (seen || block?._type !== 'block' || !['h1', 'h2', 'h3'].includes(block.style)) return true
      seen = true
      const heading = (block.children || []).map((child) => child.text || '').join('')
      return normalizeHeading(heading) !== target
    })
  }
  return content
}

function descriptionHasSection(headings, section) {
  const values = headings.map((heading) => textValue(heading).toLocaleLowerCase().replace(/[.!:：]+$/g, '').trim())
  if (section === 'advantages') return values.some((heading) => /^(предимства|преимущества|advantages|benefits|why choose us|why choose florial)$/.test(heading))
  if (section === 'steps') return values.some((heading) => /^(етапи на работа|етапи на изпълнение|этапы работы|этапы выполнения|how it works|how we work|our process|steps of the process)$/.test(heading))
  return values.some((heading) => /^(свържете се с florial|свържете се с нас|свяжитесь с florial|свяжитесь с нами|contact florial|contact us)$/.test(heading))
}

function inlineText(value, language, markDefs = [], marks = []) {
  const defs = Array.isArray(markDefs) ? markDefs : []
  const activeMarks = Array.isArray(marks) ? marks : []
  let html = escapeHtml(value)
  for (const mark of activeMarks) {
    if (mark === 'strong') html = '<strong>' + html + '</strong>'
    else if (mark === 'em') html = '<em>' + html + '</em>'
    else if (mark === 'underline') html = '<u>' + html + '</u>'
    else if (mark === 'strike-through') html = '<s>' + html + '</s>'
    else if (mark === 'code') html = '<code>' + html + '</code>'
  }
  const link = defs.find((definition) => definition?._type === 'link' && definition?._key && activeMarks.includes(definition._key))
  if (link?.href) {
    const href = safeHref(link.href, language)
    if (href) {
      const external = /^https?:\/\//i.test(href) && !href.includes('florial-bg.com')
      html = '<a href="' + escapeHtml(href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + html + '</a>'
    }
  }
  return html
}

function inlineMarkdown(value, language) {
  const tokens = String(value || '').split(/(<u>[^<]+<\/u>|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return tokens.map((part) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) return '<u>' + escapeHtml(part.slice(3, -4)) + '</u>'
    if (part.startsWith('**') && part.endsWith('**')) return '<strong>' + inlineMarkdown(part.slice(2, -2), language) + '</strong>'
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (match) {
      const href = safeHref(match[2], language)
      if (!href) return escapeHtml(match[1])
      const external = /^https?:\/\//i.test(href) && !href.includes('florial-bg.com')
      return '<a href="' + escapeHtml(href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + ' class="font-medium text-emerald-700 underline">' + escapeHtml(match[1]) + '</a>'
    }
    return escapeHtml(part)
  }).join('')
}

function galleryLabel(language, group) {
  const labels = {
    bg: 'Илюстрации към разделите на услугата',
    ru: 'Иллюстрации к разделам услуги',
    en: 'Service section illustrations',
  }
  return labels[language] || labels.bg
}

function renderGallery(images, group, language) {
  const valid = (images || []).filter((image) => image?.imageUrl)
  if (!valid.length) return ''
  const single = valid.length === 1
  const className = single
    ? 'my-8 flex justify-center'
    : group === 'intro'
      ? 'my-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'
      : 'my-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3'
  const cards = valid.map((image, index) => {
    const alt = language === 'ru'
      ? image.imageAltRu || image.imageAlt || ''
      : language === 'en'
        ? image.imageAltEn || image.imageAlt || ''
        : image.imageAlt || ''
    const imageHtml = responsiveImage(
      image.imageUrl,
      alt,
      single ? '(min-width: 768px) 672px, 100vw' : group === 'intro' ? '(min-width: 1024px) 25vw, 50vw' : '(min-width: 768px) 33vw, 50vw',
      single ? 'mx-auto max-h-[520px] w-full object-contain' : group === 'intro' ? 'h-36 w-full object-cover sm:h-44 lg:h-48' : 'h-40 w-full object-cover sm:h-52 md:h-56',
      group === 'intro' && index === 0 ? 'eager' : 'lazy',
      group === 'intro' && index === 0,
    )
    const link = safeHref(image.imageLinkUrl || image.linkUrl, language)
    const linked = link ? '<a href="' + escapeHtml(link) + '" class="block">' + imageHtml + '</a>' : imageHtml
    return '<figure class="' + (single ? 'w-full max-w-2xl overflow-hidden rounded-xl border border-slate-100 bg-slate-50' : 'min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm') + '">' +
      linked + (!single && alt ? '<figcaption class="px-3 py-2.5 text-xs leading-5 text-slate-600 sm:text-sm">' + escapeHtml(alt) + '</figcaption>' : '') + '</figure>'
  }).join('')
  return '<section aria-label="' + escapeHtml(galleryLabel(language, group)) + '" class="' + className + '">' + cards + '</section>'
}

function galleryBlocksFromImages(images, mapping) {
  return (images || []).flatMap((image) => {
    const group = mapping[image?._key || '']
    if (!group || !image.url) return []
    return [{
      _key: image._key,
      title: '__gallery:' + group,
      imageUrl: image.url,
      imageAlt: image.alt,
      imageAltRu: image.altRu,
      imageAltEn: image.altEn,
      linkUrl: image.linkUrl,
    }]
  })
}

function galleryMappings(slug) {
  if (slug === 'avtomatichno-napoyavane') return { img1: 'design', img2: 'trenches', img3: 'equipment', img4: 'testing' }
  if (slug === 'avtomatizirano-kapkovo-napoyavane') return { gallery1: 'design', gallery4: 'watering', gallery5: 'flowerbeds', '49e8b9ec3359': 'design' }
  if (slug === 'ozelenyavane') return { img1: 'intro', img2: 'intro', img3: 'intro', img4: 'intro', fbecf7b03cff: 'lawn', ed96b4f74e1a: 'lawn', '6f4c8223f1c0': 'lawn', bc772eab7d78: 'flowerbeds' }
  if (slug === 'landshaften-dizain') return { dropLandscape2019: 'intro', dropProject2021: 'intro', img1: 'design', img2: 'design', projectMasterPlan: 'pipeline', projectDendroplan: 'equipment', projectPlantSchedule: 'equipment', dropHedge2020: 'trenches', img3: 'trenches', img4: 'trenches', projectIrrigationPlan: 'watering', projectVisualisations: 'automation' }
  if (slug === 'landshaften-proekt-online') return { onlineGardenPhoto: 'design', onlineGardenConcept: 'design', onlineMasterPlan: 'pipeline', onlinePlantingPlan: 'pipeline', onlinePlantSchedule: 'pipeline', onlineIrrigationPlan: 'pipeline', online3DVisualisation: 'pipeline', onlineRealisation: 'design' }
  if (slug === 'rulonna-treva') return { img4: 'pipeline', f0a2082a4004: 'pipeline', '1f1a8f9bcdb0': 'lawn', '8f55ccf79674': 'pipeline', '75a8ab838130': 'lawn', a55a84ff65d2: 'lawn' }
  return {}
}

function renderPortableText(content, language, imageGroups) {
  if (!content) return ''
  if (typeof content === 'string') return renderMarkdown(content, language, imageGroups)
  if (!Array.isArray(content)) return ''
  return content.map((block, index) => {
    if (block?._type !== 'block') return ''
    const children = (block.children || []).map((child) =>
      inlineText(child?.text || '', language, block.markDefs, child?.marks),
    ).join('')
    const rawText = (block.children || []).map((child) => child?.text || '').join('')
    const key = block._key || index
    const marker = block.style === 'normal' ? rawText.trim().match(/^\[\[gallery:(intro|design|pipeline|equipment|trenches|watering|automation|testing|lawn|flowerbeds)\]\]$/) : null
    if (marker) return renderGallery(imageGroups[marker[1]] || [], marker[1], language)
    if (block.style === 'h1') return '<h2 class="mb-4 mt-8 text-2xl font-bold">' + children + '</h2>'
    if (block.style === 'h2') {
      const group = sectionForHeading(rawText, language)
      return '<h2 class="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">' + children + '</h2>' +
        (group ? renderGallery(imageGroups[group] || [], group, language) : '')
    }
    if (block.style === 'h3') {
      const group = sectionForHeading(rawText, language)
      return '<h3 class="mb-3 mt-6 text-xl font-bold text-slate-900">' + children + '</h3>' +
        (group ? renderGallery(imageGroups[group] || [], group, language) : '')
    }
    if (block.style === 'h4') return '<h4 class="mb-2 mt-5 text-lg font-semibold text-slate-900">' + children + '</h4>'
    if (block.listItem === 'number') return '<ol class="mb-4 list-decimal pl-6 text-slate-600"><li>' + children + '</li></ol>'
    if (block.listItem === 'bullet') return '<ul class="mb-4 list-disc pl-6 text-slate-600"><li>' + children + '</li></ul>'
    if (block.style === 'blockquote') return '<blockquote class="my-5 border-l-4 border-emerald-700 pl-4 italic text-slate-600">' + children + '</blockquote>'
    return '<p class="mb-4 leading-7 text-slate-600">' + children + '</p>'
  }).join('')
}

function renderMarkdown(content, language, imageGroups) {
  const chunks = String(content).split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean)
  return chunks.map((chunk) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    const first = lines[0]
    const marker = first.match(/^\[\[gallery:(intro|design|pipeline|equipment|trenches|watering|automation|testing|lawn|flowerbeds)\]\]$/)
    if (marker) return renderGallery(imageGroups[marker[1]] || [], marker[1], language)
    if (first.startsWith('## ')) {
      const heading = first.slice(3).trim()
      const group = sectionForHeading(heading, language)
      return '<h2 class="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">' + inlineMarkdown(heading, language) + '</h2>' +
        (group ? renderGallery(imageGroups[group] || [], group, language) : '')
    }
    if (first.startsWith('### ')) {
      const heading = first.slice(4).trim()
      const group = sectionForHeading(heading, language)
      return '<h3 class="mb-3 mt-6 text-xl font-bold text-slate-900">' + inlineMarkdown(heading, language) + '</h3>' +
        (group ? renderGallery(imageGroups[group] || [], group, language) : '')
    }
    if (lines.every((line) => /^[-•]\s/.test(line))) {
      return '<ul class="mb-5 list-disc space-y-2 pl-6 leading-7 text-slate-600">' +
        lines.map((line) => '<li>' + inlineMarkdown(line.replace(/^[-•]\s/, ''), language) + '</li>').join('') + '</ul>'
    }
    if (lines.every((line) => /^\d+\.\s/.test(line))) {
      return '<ol class="mb-5 list-decimal space-y-2 pl-6 leading-7 text-slate-600">' +
        lines.map((line) => '<li>' + inlineMarkdown(line.replace(/^\d+\.\s/, ''), language) + '</li>').join('') + '</ol>'
    }
    return '<p class="mb-4 leading-7 text-slate-600">' + inlineMarkdown(lines.join(' '), language) + '</p>'
  }).join('')
}

function getHeadingTexts(content) {
  if (typeof content === 'string') {
    return content.split('\n')
      .map((line) => line.trim())
      .filter((line) => /^#{2,3}\s/.test(line))
      .map((line) => line.replace(/^#{2,3}\s*/, '').trim())
      .filter(Boolean)
  }
  if (!Array.isArray(content)) return []
  return content.filter((block) => block?._type === 'block' && ['h2', 'h3'].includes(block.style))
    .map((block) => (block.children || []).map((child) => child?.text || '').join('').trim()).filter(Boolean)
}

function renderRegularGallery(images, language) {
  const valid = (images || []).filter((image) => image?.url)
  if (!valid.length) return ''
  const cards = valid.map((image) => {
    const alt = language === 'ru' ? image.altRu || image.alt || '' : language === 'en' ? image.altEn || image.alt || '' : image.alt || ''
    const img = responsiveImage(image.url, alt, '(min-width: 768px) 33vw, 50vw', 'h-40 w-full object-cover sm:h-52 md:h-56')
    const href = safeHref(image.linkUrl, language)
    return '<figure class="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">' +
      (href ? '<a class="block" href="' + escapeHtml(href) + '">' + img + '</a>' : img) + '</figure>'
  }).join('')
  return '<section class="my-8" aria-label="' + escapeHtml(language === 'ru' ? 'Галерея услуги' : language === 'en' ? 'Service gallery' : 'Галерия на услугата') + '">' +
    '<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">' + cards + '</div></section>'
}

function renderRelatedContent(items, language) {
  const valid = (items || []).filter((item) => item?.slug?.current &&
    (item._type === 'service' ? item.isActive !== false : item._type === 'blogPost' ? item.isPublished === true : true))
  if (!valid.length) return ''
  const title = language === 'ru' ? 'Возможно, вас заинтересует' : language === 'en' ? 'You may also be interested in' : 'Може да разгледате и'
  const cards = valid.map((item) => {
    const translated = language === 'bg' ? null : item.translations?.[language]
    const name = translated?.name || translated?.title || item.name || item.title || ''
    const description = translated?.shortDescription || item.shortDescription || ''
    const slug = item.slug.current
    const path = item._type === 'service' ? '/services/' + slug : item._type === 'blogPost' ? '/blog/' + slug : item._type === 'category' ? '/category/' + slug : '/product/' + slug
    const alt = language === 'ru' ? item.imageAltRu || name : language === 'en' ? item.imageAltEn || name : item.imageAlt || name
    const image = item.imageUrl ? responsiveImage(item.imageUrl, alt, '112px', 'h-20 w-24 shrink-0 rounded-lg object-cover sm:h-24 sm:w-28') : ''
    return '<a href="' + escapeHtml(localizedHref(path, language)) + '" class="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 no-underline">' +
      image + '<span class="min-w-0 flex-1"><span class="block font-semibold text-slate-900">' + escapeHtml(name) + '</span>' +
      (description ? '<span class="mt-1 block text-sm leading-5 text-slate-600">' + escapeHtml(description) + '</span>' : '') +
      '<span class="mt-2 block text-xs font-semibold text-emerald-800">' + escapeHtml(language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Learn more →' : 'Научете повече →') + '</span></span></a>'
  }).join('')
  return '<section class="mx-auto my-8 max-w-5xl" aria-label="' + escapeHtml(title) + '">' +
    '<h2 class="mb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">' + escapeHtml(title) + '</h2>' +
    '<div class="grid gap-3">' + cards + '</div></section>'
}

function renderAdvantages(items, language) {
  if (!Array.isArray(items) || !items.length) return ''
  const title = language === 'ru' ? 'Преимущества' : language === 'en' ? 'Why choose us' : 'Предимства'
  const cards = items.map((item) => '<article class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">' +
    (item?.title ? '<h3 class="mb-2 text-lg font-semibold text-slate-900">' + escapeHtml(item.title) + '</h3>' : '') +
    ((item?.text || item?.description) ? '<p class="leading-7 text-slate-600">' + escapeHtml(item.text || item.description) + '</p>' : '') +
    '</article>').join('')
  return '<section class="mx-auto my-10 max-w-5xl"><h2 class="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">' +
    escapeHtml(title) + '</h2><div class="grid gap-4 sm:grid-cols-2">' + cards + '</div></section>'
}

function renderSteps(items, language) {
  if (!Array.isArray(items) || !items.length) return ''
  const title = language === 'ru' ? 'Этапы работы' : language === 'en' ? 'How it works' : 'Етапи на изпълнение'
  const rows = items.map((item, index) => '<li class="flex gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">' +
    '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-800">' + escapeHtml(item?.stepNumber || index + 1) + '</span>' +
    '<div>' + (item?.title ? '<h3 class="mb-2 text-lg font-semibold text-slate-900">' + escapeHtml(item.title) + '</h3>' : '') +
    ((item?.text || item?.description) ? '<p class="leading-7 text-slate-600">' + escapeHtml(item.text || item.description) + '</p>' : '') +
    '</div></li>').join('')
  return '<section class="mx-auto my-10 max-w-5xl"><h2 class="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">' +
    escapeHtml(title) + '</h2><ol class="grid gap-4 sm:grid-cols-2">' + rows + '</ol></section>'
}

function renderServiceContentBlocks(blocks, language, slug) {
  if (slug === 'ozelenyavane' || slug === 'avtomatizirano-kapkovo-napoyavane' || slug === 'rulonna-treva') return ''
  const valid = (blocks || []).filter((block) =>
    !/^__gallery:(intro|design|trenches|pipeline|equipment|automation|watering|testing|lawn|flowerbeds)$/.test(block.title || '') &&
    Boolean(block.imageUrl || block.title || block.text))
  if (!valid.length) return ''
  const title = language === 'ru' ? 'Дополнительная информация' : language === 'en' ? 'Additional information' : 'Допълнителна информация'
  const articles = valid.map((block) => {
    const translated = language === 'bg' ? null : block.translations?.[language]
    const heading = translated?.title || block.title || ''
    const body = translated?.text || block.text
    const alt = language === 'ru' ? block.imageAltRu || block.imageAlt || heading : language === 'en' ? block.imageAltEn || block.imageAlt || heading : block.imageAlt || heading
    const image = block.imageUrl ? responsiveImage(block.imageUrl, alt, '(min-width: 768px) 768px, calc(100vw - 2rem)', 'max-h-[460px] min-h-48 w-full rounded-xl object-cover') : ''
    const link = safeHref(block.imageLinkUrl || block.linkUrl, language)
    const imageHtml = image ? (link ? '<a class="block" href="' + escapeHtml(link) + '">' + image + '</a>' : image) : ''
    const imageFirst = block.imagePosition !== 'right'
    return '<article class="grid items-center gap-5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-8">' +
      (imageHtml ? '<div class="' + (imageFirst ? 'md:order-1' : 'md:order-2') + '">' + imageHtml + '</div>' : '') +
      ((heading || body) ? '<div class="' + (imageFirst ? 'md:order-2' : 'md:order-1') + '">' +
        (heading ? '<h2 class="mb-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">' + escapeHtml(heading) + '</h2>' : '') +
        (body ? '<div class="leading-7 text-slate-600">' + renderPortableText(body, language, {}) + '</div>' : '') +
        '</div>' : '') + '</article>'
  }).join('')
  return '<section aria-label="' + escapeHtml(title) + '" class="mx-auto mt-10 max-w-5xl space-y-8 md:mt-14">' + articles + '</section>'
}

function getServiceDescription(service, language) {
  return localized(service, 'description', language) || service.description || ''
}

export function getServiceDetailMetadata(service, language = 'bg') {
  const lang = ['ru', 'en'].includes(language) ? language : 'bg'
  const translated = lang === 'bg' ? null : service?.translations?.[lang]
  const name = textValue(translated?.name) || textValue(service?.name) || textValue(service?.slugValue)
  const seo = lang === 'bg' ? service?.seo : translated?.seo
  const shortDescription = textValue(translated?.shortDescription) || textValue(service?.shortDescription)
  const slug = textValue(service?.slugValue || service?.slug?.current)
  const canonical = SITE_URL + '/services/' + encodeURIComponent(slug)
  const title = textValue(seo?.metaTitle) || (name + ' | Florial')
  const description = textValue(seo?.metaDescription) || shortDescription || (name + ' — ' + (lang === 'ru' ? 'услуги Florial в Болгарии' : lang === 'en' ? 'Florial services in Bulgaria' : 'услуги на Florial в България'))
  const noIndex = seo?.noIndex === true
  const alternates = { bg: SITE_URL + '/services/' + encodeURIComponent(slug), 'x-default': SITE_URL + '/services/' + encodeURIComponent(slug) }
  for (const locale of ['ru', 'en']) {
    const localeSeo = service?.translations?.[locale]?.seo
    if (service?.translations?.[locale]?.name && localeSeo?.metaTitle && localeSeo?.metaDescription && localeSeo?.noIndex !== true) {
      alternates[locale] = SITE_URL + '/services/' + encodeURIComponent(slug) + '?lang=' + locale
    }
  }
  return {
    language: lang,
    name,
    title,
    description,
    canonical,
    noIndex,
    image: service?.hero?.imageUrl || service?.imageUrl,
    alternates,
    shortDescription,
  }
}

export function buildServiceDetailStructuredData(service, language = 'bg') {
  const meta = getServiceDetailMetadata(service, language)
  const direction = DIRECTIONS[service?.serviceCategory || '']
  const items = [
    { '@type': 'ListItem', position: 1, name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: SITE_URL + (language === 'bg' ? '/' : '/?lang=' + language) },
    { '@type': 'ListItem', position: 2, name: language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги', item: SITE_URL + '/services' + (language === 'bg' ? '' : '?lang=' + language) },
  ]
  if (direction) items.push({
    '@type': 'ListItem',
    position: 3,
    name: direction.title[language] || direction.title.bg,
    item: SITE_URL + '/services/category/' + direction.slug + (language === 'bg' ? '' : '?lang=' + language),
  })
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: meta.name,
    item: meta.canonical + (language === 'bg' ? '' : '?lang=' + language),
  })
  const url = meta.canonical + (language === 'bg' ? '' : '?lang=' + language)
  const shortDescription = meta.shortDescription || meta.name
  return [
    {
      id: 'service',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': url + '#service',
        name: meta.name,
        description: shortDescription,
        url,
        serviceType: service?.serviceCategory || meta.name,
        provider: { '@id': SITE_URL + '/#organization' },
        areaServed: [
          { '@type': 'City', name: 'Nessebar' },
          { '@type': 'City', name: 'Ravda' },
          { '@type': 'City', name: 'Sunny Beach' },
          { '@type': 'City', name: 'Sveti Vlas' },
          { '@type': 'City', name: 'Aheloy' },
          { '@type': 'City', name: 'Pomorie' },
        ],
        ...(meta.image ? { image: [meta.image] } : {}),
      },
    },
    {
      id: 'breadcrumbs',
      data: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items },
    },
  ]
}

export function renderServiceDetailHtml(service, language = 'bg') {
  const lang = ['ru', 'en'].includes(language) ? language : 'bg'
  const meta = getServiceDetailMetadata(service, lang)
  const slug = textValue(service?.slugValue || service?.slug?.current)
  const translatedHero = lang === 'bg' ? null : service?.translations?.[lang]?.hero
  const hero = translatedHero || service?.hero || {}
  const heroTitle = textValue(translatedHero?.title) || (lang === 'bg' ? textValue(hero.title) || meta.name : meta.name)
  const heroSubtitle = textValue(translatedHero?.subtitle) || textValue(localized(service, 'shortDescription', lang)) || (lang === 'bg' ? textValue(hero.subtitle) : '')
  const heroImage = hero.imageUrl || service?.imageUrl || ''
  const heroAlt = lang === 'ru'
    ? hero.imageAltRu || service?.imageAltRu || meta.name
    : lang === 'en'
      ? hero.imageAltEn || service?.imageAltEn || meta.name
      : hero.imageAlt || service?.imageAlt || meta.name

  const description = getServiceDescription(service, lang)
  const descriptionForRender = removeDuplicateHeroHeading(description, heroTitle)
  const headings = getHeadingTexts(descriptionForRender)
  const advantages = localized(service, 'advantages', lang) || service?.advantages || []
  const steps = localized(service, 'steps', lang) || service?.steps || []
  const callToAction = localized(service, 'callToAction', lang) || service?.callToAction || {}
  const gallery = (service?.galleryImages || []).filter((image) => image?.url && image.url !== heroImage)
  const sourceBlocks = Array.isArray(service?.contentBlocks) ? service.contentBlocks : []
  const isAutomatic = slug === 'avtomatichno-napoyavane'
  const isDrip = slug === 'avtomatizirano-kapkovo-napoyavane'
  const isRolled = slug === 'rulonna-treva'
  const imageGroups = sourceBlocks.reduce((groups, block) => {
    const match = typeof block?.title === 'string' ? block.title.match(/^__gallery:(intro|design|trenches|pipeline|equipment|automation|watering|testing|lawn|flowerbeds)$/) : null
    if (match && block.imageUrl) groups[match[1]] = [...(groups[match[1]] || []), block]
    return groups
  }, {})
  const mapped = galleryBlocksFromImages(gallery, galleryMappings(slug))
  for (const block of mapped) imageGroups[block.title.slice(10)] = [...(imageGroups[block.title.slice(10)] || []), block]
  const firstInfoImage = isAutomatic ? gallery.find((image) => image._key === 'img0') : null
  const hasIntro = Boolean(imageGroups.intro?.length) && !['zasazhdane-na-rasteniya', 'landshaften-dizain', 'ozelenyavane'].includes(slug)

  const direction = DIRECTIONS[service?.serviceCategory || '']
  const crumbs = [
    '<a href="' + escapeHtml(localizedHref('/', lang)) + '">' + escapeHtml(lang === 'ru' ? 'Главная' : lang === 'en' ? 'Home' : 'Начало') + '</a>',
    '<a href="' + escapeHtml(localizedHref('/services', lang)) + '">' + escapeHtml(lang === 'ru' ? 'Все услуги' : lang === 'en' ? 'All services' : 'Всички услуги') + '</a>',
  ]
  if (direction) crumbs.push('<a href="' + escapeHtml(localizedHref('/services/category/' + direction.slug, lang)) + '">' + escapeHtml(direction.title[lang] || direction.title.bg) + '</a>')
  crumbs.push('<span aria-current="page">' + escapeHtml(meta.name) + '</span>')

  const heroHtml = '<header class="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">' +
    '<span class="mb-3 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">' + escapeHtml(lang === 'ru' ? 'Услуги Florial' : lang === 'en' ? 'Florial services' : 'Услуги на Florial') + '</span>' +
    '<h1 class="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">' + escapeHtml(heroTitle) + '</h1>' +
    (heroSubtitle ? '<p class="mx-auto max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">' + escapeHtml(heroSubtitle) + '</p>' : '') +
    (Number(service?.startingPriceEUR) > 0 ? '<div class="mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3"><span class="text-sm font-medium text-emerald-900">' + escapeHtml(lang === 'ru' ? 'Начальная цена:' : lang === 'en' ? 'Starting price:' : 'Начална цена:') + '</span><span class="text-2xl font-extrabold text-emerald-800">' + escapeHtml(lang === 'en' ? 'from ' : 'от ') + Number(service.startingPriceEUR).toLocaleString(lang === 'en' ? 'en-IE' : lang === 'ru' ? 'ru-RU' : 'bg-BG') + ' €</span></div>' : '') +
    '</header>'

  const heroImageHtml = hasIntro
    ? renderGallery(imageGroups.intro, 'intro', lang)
    : heroImage
      ? '<div class="mb-8 overflow-hidden rounded-2xl bg-slate-100 shadow-sm md:mb-12">' +
        (safeHref(hero.imageLinkUrl || service?.imageLinkUrl, lang)
          ? '<a class="block" href="' + escapeHtml(safeHref(hero.imageLinkUrl || service?.imageLinkUrl, lang)) + '">' + responsiveImage(heroImage, heroAlt, '(min-width: 896px) 896px, calc(100vw - 2rem)', 'max-h-[560px] min-h-[220px] w-full object-cover', 'eager', true) + '</a>'
          : responsiveImage(heroImage, heroAlt, '(min-width: 896px) 896px, calc(100vw - 2rem)', 'max-h-[560px] min-h-[220px] w-full object-cover', 'eager', true)) +
        '</div>'
      : ''

  const topGallery = isAutomatic && firstInfoImage
    ? renderGallery([{ imageUrl: firstInfoImage.url, imageAlt: firstInfoImage.alt, imageAltRu: firstInfoImage.altRu, imageAltEn: firstInfoImage.altEn, linkUrl: firstInfoImage.linkUrl }], 'intro', lang)
    : !isDrip && !isRolled && !['ozelenyavane', 'landshaften-dizain', 'landshaften-proekt-online'].includes(slug)
      ? renderRegularGallery(gallery, lang)
      : ''

  const descriptionHtml = descriptionForRender
    ? '<div class="mx-auto max-w-4xl py-4 text-base md:py-6 md:text-lg">' + renderPortableText(descriptionForRender, lang, imageGroups) + '</div>'
    : ''

  const showAdvantages = Array.isArray(advantages) && advantages.length > 0 && !descriptionHasSection(headings, 'advantages')
  const showSteps = Array.isArray(steps) && steps.length > 0 && !descriptionHasSection(headings, 'steps')
  const showCallToAction = Boolean(callToAction.title || callToAction.text || callToAction.buttonLabel || callToAction.buttonText) && !descriptionHasSection(headings, 'contact')
  const ctaHtml = showCallToAction
    ? '<section class="my-8 rounded-2xl bg-emerald-800 px-6 py-10 text-center text-white md:my-12">' +
      (callToAction.title ? '<h2 class="text-2xl font-bold md:text-3xl">' + escapeHtml(callToAction.title) + '</h2>' : '') +
      (callToAction.text ? '<p class="mx-auto mt-3 max-w-2xl leading-7 text-emerald-50">' + escapeHtml(callToAction.text) + '</p>' : '') +
      '<a href="' + escapeHtml(localizedHref('/contacts', lang)) + '" class="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-emerald-900">' + escapeHtml(callToAction.buttonLabel || callToAction.buttonText || (lang === 'ru' ? 'Связаться с нами' : lang === 'en' ? 'Contact us' : 'Свържете се с нас')) + '</a></section>'
    : ''
  const leadForm = localized(service, 'leadForm', lang) || service?.leadForm || {}
  const leadFields = Array.isArray(leadForm.fields) ? leadForm.fields : []
  const leadTitle = leadForm.title || (lang === 'ru' ? 'Заявка на услугу' : lang === 'en' ? 'Service enquiry' : 'Запитване за услуга')
  const leadHtml = leadFields.length
    ? '<section class="mx-auto my-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"><h2 class="mb-2 text-2xl font-bold tracking-tight text-slate-900">' + escapeHtml(leadTitle) + '</h2><p class="mb-5 text-sm leading-6 text-slate-600">' + escapeHtml(lang === 'ru' ? 'Свяжитесь с командой Florial, чтобы обсудить вашу задачу.' : lang === 'en' ? 'Contact the Florial team to discuss your project.' : 'Свържете се с екипа на Florial, за да обсъдим Вашия проект.') + '</p><a class="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white" href="' + escapeHtml(localizedHref('/contacts', lang)) + '">' + escapeHtml(lang === 'ru' ? 'Связаться с нами' : lang === 'en' ? 'Contact us' : 'Свържете се с нас') + '</a></section>'
    : ''

  return '<main data-florial-service-detail="true" class="w-full flex-grow bg-white"><div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">' +
    '<nav aria-label="Breadcrumb" class="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">' + crumbs.join('<span aria-hidden="true">/</span>') + '</nav>' +
    heroHtml + heroImageHtml + topGallery + descriptionHtml +
    renderRelatedContent(service?.relatedContent, lang) +
    (showAdvantages ? renderAdvantages(advantages, lang) : '') +
    (showSteps ? renderSteps(steps, lang) : '') +
    ctaHtml + renderServiceContentBlocks(sourceBlocks, lang, slug) + leadHtml +
    '</div></main>'
}
