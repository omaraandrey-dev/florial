const ROOT_CATEGORY_ORDER = [
  'gotovi-komplekti-za-polivane',
  'controllers',
  'sprinklers',
  'nozzles',
  'klapani',
  'shahti',
  'kapkovo-napoyavane',
  'trabi-fitingi-aksesoari',
  'filtri-regulatori-nalyagane',
  'drugi-komponenti-za-polivane',
]

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}

function localizedCategoryName(category, language) {
  const translated = category?.translations?.[language]?.name
  return typeof translated === 'string' && translated.trim()
    ? translated.trim()
    : String(category?.name || '').trim()
}

function localizedRoute(path, language, siteUrl) {
  try {
    const url = new URL(path, siteUrl)
    if (language === 'ru' || language === 'en') url.searchParams.set('lang', language)
    return url.toString()
  } catch {
    return siteUrl + '/'
  }
}

function resizedCategoryImage(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && url.hostname === 'cdn.sanity.io' && /^\/images\/[^/]+\/[^/]+\//.test(url.pathname)) {
      url.searchParams.set('w', '160')
      url.searchParams.set('h', '160')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('auto', 'format')
      url.searchParams.set('q', '65')
    }
    return url.toString()
  } catch {
    return ''
  }
}

function localizedCategoryImageText(category, language, kind) {
  const field = kind === 'alt'
    ? language === 'ru' ? category.imageAltRu : language === 'en' ? category.imageAltEn : category.imageAlt
    : language === 'ru' ? category.imageTitleRu : language === 'en' ? category.imageTitleEn : category.imageTitle
  if (typeof field === 'string' && field.trim()) return field.trim()
  return kind === 'alt' ? localizedCategoryName(category, language) : ''
}

function getVisibleCategoryIds(categories) {
  const byId = new Map((Array.isArray(categories) ? categories : []).map((category) => [category._id, category]))
  const visibleIds = new Set()
  for (const category of Array.isArray(categories) ? categories : []) {
    if ((category?.productCount || 0) <= 0) continue
    let current = category
    const visited = new Set()
    while (current && !visited.has(current._id)) {
      visited.add(current._id)
      visibleIds.add(current._id)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
  }
  return visibleIds
}

function sortCategoryChildren(children, rootCatalog, language) {
  return children.slice().sort((a, b) => {
    if (rootCatalog) {
      const ai = ROOT_CATEGORY_ORDER.indexOf(a.slugValue || '')
      const bi = ROOT_CATEGORY_ORDER.indexOf(b.slugValue || '')
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
    }
    const orderDifference = (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
    if (orderDifference !== 0) return orderDifference
    return String(a.name || '').localeCompare(String(b.name || ''), language)
  })
}

export function renderEquipmentCategoryNavigation(categories, currentCategoryId, language = 'bg', siteUrl = 'https://florial-bg.com', options = {}) {
  const categoryList = Array.isArray(categories) ? categories : []
  const visibleIds = getVisibleCategoryIds(categoryList)
  const children = sortCategoryChildren(
    categoryList.filter((category) =>
      category &&
      category.parentId === currentCategoryId &&
      category.slugValue &&
      category.slugValue !== 'electromagnetic-valves' &&
      visibleIds.has(category._id)
    ),
    options.rootCatalog === true,
    language,
  )
  if (!children.length) return ''

  const labels = {
    bg: 'Категории в каталога',
    ru: 'Категории каталога',
    en: 'Catalogue categories',
  }
  const noImage = { bg: 'Няма снимка', ru: 'Нет фото', en: 'No photo' }
  const cards = children.map((category) => {
    const name = localizedCategoryName(category, language) || category.slugValue
    const href = localizedRoute('/category/' + encodeURIComponent(category.slugValue), language, siteUrl)
    const imageUrl = resizedCategoryImage(category.imageUrl)
    const alt = localizedCategoryImageText(category, language, 'alt')
    const title = localizedCategoryImageText(category, language, 'title')
    const image = imageUrl
      ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(alt) + '"' +
        (title ? ' title="' + escapeHtml(title) + '"' : '') +
        ' loading="lazy" decoding="async" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:8px" />'
      : '<span aria-hidden="true" style="display:flex;width:56px;height:56px;align-items:center;justify-content:center;border-radius:8px;background:#f3f5ec;font-size:9px;color:#64748b">' + noImage[language] + '</span>'

    return '<li style="min-width:0"><a href="' + escapeHtml(href) + '" style="display:flex;min-height:64px;align-items:center;gap:12px;padding:10px;border:1px solid #e5e8dc;border-radius:12px;color:#263323;text-decoration:none;background:#fff">' +
      image + '<h2 style="margin:0;font-size:14px;line-height:1.35;font-weight:600">' + escapeHtml(name) + '</h2>' +
      '<span aria-hidden="true" style="margin-left:auto;color:#82936a">→</span></a></li>'
  }).join('')

  return '<section aria-label="' + labels[language] + '" data-florial-category-subcategories="true" style="margin:24px 0">' +
    '<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;list-style:none;padding:0;margin:0">' +
    cards + '</ul></section>'
}

function safePortableTextHref(value, language, siteUrl) {
  if (typeof value !== 'string' || !value.trim()) return null
  const href = value.trim()
  if (href.startsWith('/') && !href.startsWith('//')) return localizedRoute(href, language, siteUrl)
  if (/^https:\/\/[^\s]+$/i.test(href)) {
    try {
      const url = new URL(href)
      return url.username || url.password ? null : url.toString()
    } catch {
      return null
    }
  }
  return null
}

function renderPortableTextChildren(block, language, siteUrl) {
  const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
  return (Array.isArray(block.children) ? block.children : []).map((child) => {
    let text = escapeHtml(child?.text || '')
    for (const mark of Array.isArray(child?.marks) ? child.marks : []) {
      if (mark === 'strong') {
        text = '<strong>' + text + '</strong>'
      } else if (mark === 'em') {
        text = '<em>' + text + '</em>'
      } else {
        const definition = markDefs.find((item) => item?._key === mark && item?._type === 'link')
        const href = safePortableTextHref(definition?.href, language, siteUrl)
        if (href) text = '<a href="' + escapeHtml(href) + '">' + text + '</a>'
      }
    }
    return text
  }).join('')
}

function renderPortableText(blocks, language, siteUrl) {
  if (!Array.isArray(blocks)) return ''
  const output = []
  let index = 0
  while (index < blocks.length) {
    const block = blocks[index]
    if (!block || block._type !== 'block') {
      index += 1
      continue
    }
    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const listType = block.listItem
      const items = []
      while (index < blocks.length && blocks[index]?._type === 'block' && blocks[index]?.listItem === listType) {
        items.push('<li>' + renderPortableTextChildren(blocks[index], language, siteUrl) + '</li>')
        index += 1
      }
      output.push((listType === 'number' ? '<ol>' : '<ul>') + items.join('') + (listType === 'number' ? '</ol>' : '</ul>'))
      continue
    }
    const content = renderPortableTextChildren(block, language, siteUrl)
    if (content) {
      const tag = block.style === 'h2' ? 'h2' : block.style === 'h3' ? 'h3' : 'p'
      output.push('<' + tag + '>' + content + '</' + tag + '>')
    }
    index += 1
  }
  return output.join('')
}

export function renderEquipmentCategorySeoContent(category, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const blocks = language === 'bg'
    ? category?.seoContent
    : category?.translations?.[language]?.seoContent
  if (!Array.isArray(blocks) || !blocks.length) return ''
  const label = language === 'ru' ? 'SEO-текст категории' : language === 'en' ? 'Category information' : 'Информация за категорията'
  return '<section aria-label="' + label + '" data-florial-category-seo-content="true" data-block-count="' + blocks.length + '" style="margin:40px 0;max-width:900px;line-height:1.75;color:#334155">' +
    renderPortableText(blocks, language, siteUrl) + '</section>'
}

export function renderEquipmentCategoryHelpBlock(category, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const source = category?.helpBlock
  if (!source || typeof source !== 'object') return ''
  const help = language === 'bg' ? source : (source.translations?.[language] || source)
  const title = help?.title || (language === 'ru'
    ? 'Нужна помощь с подбором и монтажом оборудования для автополива?'
    : language === 'en'
      ? 'Need help selecting and installing irrigation equipment?'
      : 'Нуждаете се от помощ при избора и монтажа на оборудване за автоматично напояване?')
  const text = help?.text || (language === 'ru'
    ? 'Обратитесь к Florial за помощью в подборе оборудования, проектировании и монтаже системы автоматического полива с учётом участка, давления и расхода воды.'
    : language === 'en'
      ? 'Contact Florial for help selecting equipment, designing and installing an automatic irrigation system suited to your garden, water pressure and flow.'
      : 'Свържете се с Florial за помощ при избора на оборудване, проектирането и монтажа на автоматична поливна система според вашата градина, налягането и дебита на водата.')
  const buttonLabel = help?.buttonLabel || (language === 'ru'
    ? 'Монтаж на поливни системи'
    : language === 'en'
      ? 'Irrigation Installation'
      : 'Монтаж на поливни системи')
  const configuredUrl = typeof source.buttonUrl === 'string' ? source.buttonUrl.trim() : ''
  const targetPath = /^\/(services|blog)\/[^/]+\/?$/.test(configuredUrl)
    ? configuredUrl
    : '/services/avtomatichno-napoyavane'
  const href = localizedRoute(targetPath, language, siteUrl)

  return '<section data-florial-category-help="true" style="margin:48px 0;padding:28px;border:1px solid #dde3d0;border-radius:16px;background:#f3f5ec">' +
    '<h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#172033">' + escapeHtml(title) + '</h2>' +
    '<p style="margin:0 0 22px;max-width:900px;line-height:1.7;color:#334155">' + escapeHtml(text) + '</p>' +
    '<a href="' + escapeHtml(href) + '" style="display:inline-flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #dde3d0;border-radius:10px;background:#fff;color:#263323;text-decoration:none;font-weight:600">' +
    escapeHtml(buttonLabel) + ' <span aria-hidden="true">→</span></a></section>'
}
