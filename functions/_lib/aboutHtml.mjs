const SECTION_CLASS = 'rounded-3xl border border-[#E2E7D9] bg-white p-6 shadow-sm md:p-9'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function localizedHref(path, language) {
  return language === 'bg' ? path : path + '?lang=' + language
}

function safeImageUrl(value) {
  const url = String(value || '').trim()
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn.sanity.io' && /^\/images\/bxvcy0qs\/(?:production|plants)\//.test(parsed.pathname)
      ? parsed.toString()
      : ''
  } catch {
    return ''
  }
}

function imageProps(imageUrl, sizes, preferredWidth = 640, quality = 75) {
  const safe = safeImageUrl(imageUrl)
  if (!safe) return null
  try {
    const source = new URL(safe)
    const dimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    const sourceWidth = dimensions ? Number(dimensions[1]) : undefined
    const sourceHeight = dimensions ? Number(dimensions[2]) : undefined
    const buildUrl = (width) => {
      const image = new URL(source)
      image.searchParams.set('w', String(sourceWidth ? Math.min(width, sourceWidth) : width))
      image.searchParams.set('fit', 'max')
      image.searchParams.set('auto', 'format')
      image.searchParams.set('q', String(Math.min(100, Math.max(1, Math.round(quality)))))
      return image.toString()
    }
    const candidates = [160, 240, 320, 480, 640, 720, 800, 960, 1200, 1600]
      .map((width) => sourceWidth ? Math.min(width, sourceWidth) : width)
      .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
      .sort((a, b) => a - b)
    const fallbackWidth = sourceWidth ? Math.min(preferredWidth, sourceWidth) : preferredWidth
    return {
      src: buildUrl(fallbackWidth),
      srcSet: candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', '),
      sizes,
      width: sourceWidth,
      height: sourceHeight,
    }
  } catch {
    return null
  }
}

function renderImage(imageUrl, alt, sizes, preferredWidth, quality, className, title) {
  const props = imageProps(imageUrl, sizes, preferredWidth, quality)
  if (!props) return ''
  const dimensions = props.width && props.height
    ? ' width="' + props.width + '" height="' + props.height + '"'
    : ''
  return '<img src="' + escapeHtml(props.src) + '" srcset="' + escapeHtml(props.srcSet) +
    '" sizes="' + escapeHtml(props.sizes) + '"' + dimensions +
    ' alt="' + escapeHtml(alt) + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') +
    ' loading="lazy" decoding="async" class="' + escapeHtml(className) + '" />'
}

function renderCatalogImage(slug, title, categories, language, locations) {
  const category = categories.find((item) => String(item?.slugValue || '').toLowerCase() === slug)
  if (!category?.imageUrl) return ''
  const imageTitle = title + ' — ' + locations + ' | Florial'
  const image = renderImage(
    category.imageUrl,
    imageTitle,
    '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
    640,
    75,
    'h-52 w-full object-cover sm:h-64',
    imageTitle,
  )
  if (!image) return ''
  return '<a href="' + escapeHtml(localizedHref('/category/' + encodeURIComponent(slug), language)) +
    '" aria-label="' + escapeHtml(title) +
    '" class="mt-5 block overflow-hidden rounded-2xl no-underline shadow-sm transition hover:shadow-md">' +
    image + '</a>'
}

export function renderAboutHtml(copy, data = {}, language = 'bg') {
  const lang = ['bg', 'ru', 'en'].includes(language) ? language : 'bg'
  const categories = Array.isArray(data.categories) ? data.categories : []
  const photos = Array.isArray(data.photos) ? data.photos : []
  const team = Array.isArray(data.team) ? data.team : []
  const centres = Array.isArray(data.centres) ? data.centres : []
  const findPhoto = (slug) => photos.find((item) => String(item?.slugValue || '').toLowerCase() === slug)
  const locations = lang === 'ru'
    ? 'Несебр, Равда, Солнечный Берег и Святой Влас'
    : lang === 'en'
      ? 'Nessebar, Ravda, Sunny Beach and Sveti Vlas'
      : 'Несебър, Равда, Слънчев бряг и Свети Влас'

  const offersHeading = lang === 'ru' ? 'Что мы предлагаем' : lang === 'en' ? 'What we offer' : 'Какво предлагаме'
  const teamHeading = lang === 'ru' ? 'Наша команда' : lang === 'en' ? 'Our team' : 'Нашият екип'
  const centresHeading = lang === 'ru' ? 'Посетите садовый центр Florial' : lang === 'en' ? 'Visit Florial Garden Centre' : 'Посетете градински център Florial'
  const registrationHeading = lang === 'ru' ? 'Регистрационные данные' : lang === 'en' ? 'Company registration' : 'Регистрационни данни'
  const bankHeading = lang === 'ru' ? 'Банковские реквизиты' : lang === 'en' ? 'Bank details' : 'Банкови реквизити'
  const contactsHeading = lang === 'ru' ? 'Контакты и торговый объект' : lang === 'en' ? 'Contact and garden centre' : 'Контакти и търговски обект'
  const legalHeading = lang === 'ru' ? 'Юридические и банковские реквизиты' : lang === 'en' ? 'Company and bank details' : 'Фирмени данни и банкови реквизити'
  const legalName = '„Флориал“ ООД (FLORIAL OOD / FLORIAL LTD)'
  const registeredAddress = lang === 'ru'
    ? 'г. Несебр, ул. «Черно море», №28, Болгария'
    : lang === 'en'
      ? '28 Cherno More St, Nessebar, Bulgaria'
      : 'гр. Несебър, ул. „Черно море“ №28, България'
  const gardenAddress = lang === 'ru'
    ? '«Флориал», ул. «Хан Крум», 8230 Несебр, Болгария (рядом с магазином Janet)'
    : lang === 'en'
      ? 'Florial, Khan Krum St, 8230 Nessebar, Bulgaria (next to Janet store)'
      : '„Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet)'
  const nameLabel = lang === 'ru' ? 'Наименование' : lang === 'en' ? 'Legal name' : 'Наименование'
  const managerLabel = lang === 'ru' ? 'Управитель (МОЛ)' : lang === 'en' ? 'Company manager' : 'Управител (МОЛ)'
  const registeredAddressLabel = lang === 'ru' ? 'Юридический адрес' : lang === 'en' ? 'Registered address' : 'Адрес на регистрация'
  const bankLabel = lang === 'ru' ? 'Банк' : lang === 'en' ? 'Bank' : 'Банка'
  const phoneLabel = lang === 'ru' ? 'Телефон' : lang === 'en' ? 'Phone' : 'Телефон'
  const gardenCentreLabel = lang === 'ru' ? 'Садовый центр' : lang === 'en' ? 'Garden centre' : 'Градински център'
  const copyIbanLabel = lang === 'ru' ? 'Копировать IBAN' : lang === 'en' ? 'Copy IBAN' : 'Копирай IBAN'

  const offerCards = [
    {
      slug: 'rastenia',
      title: copy.plantSalesTitle,
      description: lang === 'ru'
        ? 'Декоративные деревья, кустарники, цветы и растения для сада и террасы.'
        : lang === 'en'
          ? 'Ornamental trees, shrubs, flowers and plants for gardens and terraces.'
          : 'Декоративни дървета, храсти, цветя и растения за градината и терасата.',
    },
    {
      slug: 'vsichko-za-polivane',
      title: copy.irrigationEquipmentTitle,
      description: lang === 'ru'
        ? 'Профессиональное оборудование и комплектующие для автоматического полива.'
        : lang === 'en'
          ? 'Professional equipment and components for automatic irrigation systems.'
          : 'Професионално оборудване и компоненти за системи за автоматично напояване.',
    },
  ]

  const offers = offerCards.map((card) =>
    '<article class="' + SECTION_CLASS + '">' +
      '<h3 class="text-lg font-extrabold text-[#263323] md:text-2xl"><a href="' +
      escapeHtml(localizedHref('/category/' + card.slug, lang)) +
      '" class="text-inherit no-underline transition hover:text-[#647746]">' + escapeHtml(card.title) + '</a></h3>' +
      renderCatalogImage(card.slug, card.title, categories, lang, locations) +
      '<p class="mt-4 text-sm leading-6 text-slate-600 md:text-base">' + escapeHtml(card.description) + '</p>' +
    '</article>'
  ).join('')

  const teamCards = team.map((member) => {
    const photo = findPhoto(member.slug)
    const title = member.title[lang]
    const alt = lang === 'ru' ? photo?.imageAltRu : lang === 'en' ? photo?.imageAltEn : photo?.imageAlt
    const image = photo?.imageUrl
      ? renderImage(photo.imageUrl, alt || title, '(min-width: 768px) 25vw, 50vw', 480, 70, 'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]')
      : '<div class="flex h-full items-center justify-center p-3 text-xs text-slate-500">' +
        (lang === 'ru' ? 'Фото скоро появится' : lang === 'en' ? 'Photo coming soon' : 'Снимката скоро ще бъде добавена') +
        '</div>'
    return '<a href="' + escapeHtml(localizedHref(member.href, lang)) +
      '" class="group min-w-0 overflow-hidden rounded-2xl border border-[#E2E7D9] bg-[#F8F9F3] text-center no-underline transition hover:-translate-y-1 hover:shadow-md">' +
      '<div class="aspect-[4/5] overflow-hidden bg-[#E9EDDB]">' + image + '</div>' +
      '<div class="p-3 md:p-4"><h3 class="text-sm font-extrabold leading-5 text-[#263323] md:text-base">' +
      escapeHtml(title) + '</h3><p class="mt-2 text-xs leading-5 text-slate-600 md:text-sm">' +
      escapeHtml(member.text[lang]) + '</p></div></a>'
  }).join('')

  const centreCards = centres.map((centre) => {
    const photo = findPhoto(centre.key === 'nesebr' ? 'florial-nesebr' : 'florial-ravda')
    const image = photo?.imageUrl
      ? renderImage(photo.imageUrl, centre.name[lang], '(min-width: 768px) 50vw, 100vw', 900, 75, 'h-full w-full object-cover')
      : '<div class="flex h-full items-center justify-center text-sm text-slate-500">' +
        (lang === 'ru' ? 'Фото садового центра' : lang === 'en' ? 'Garden centre photo' : 'Снимка на градинския център') +
        '</div>'
    const mapLabel = lang === 'ru' ? 'Открыть на карте' : lang === 'en' ? 'View on Google Maps' : 'Вижте в Google Карти'
    return '<article class="overflow-hidden rounded-2xl border border-[#E2E7D9] bg-[#F8F9F3]">' +
      '<div class="aspect-[16/9] overflow-hidden bg-[#E9EDDB]">' + image + '</div>' +
      '<div class="p-5"><h3 class="text-lg font-extrabold text-[#263323]">' + escapeHtml(centre.name[lang]) +
      '</h3><p class="mt-2 text-sm leading-6 text-slate-600">' + escapeHtml(centre.address[lang]) +
      '</p><a href="' + centre.map + '" target="_blank" rel="noreferrer" class="mt-4 inline-flex items-center rounded-xl bg-[#647746] px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-[#53643A]">' +
      mapLabel + '</a></div></article>'
  }).join('')

  const processSteps = copy.steps.map((step, index) =>
    '<li class="flex gap-4 rounded-2xl bg-[#F5F7EF] p-4"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#647746] text-sm font-bold text-white">' +
    (index + 1) + '</span><span class="pt-1 text-sm leading-6 text-slate-700">' + escapeHtml(step) + '</span></li>'
  ).join('')

  return '<main data-florial-ssr="about" class="flex-grow bg-[#F8F9F3]">' +
    '<section class="relative overflow-hidden bg-[#E9EDDB] px-4 py-14 md:py-20"><div class="mx-auto max-w-5xl text-center">' +
      '<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#647746]">' + escapeHtml(copy.eyebrow) + '</p>' +
      '<h1 class="mt-4 text-3xl font-extrabold tracking-tight text-[#263323] sm:text-4xl md:text-6xl">' + escapeHtml(copy.title) + '</h1>' +
      '<p class="mx-auto mt-5 max-w-3xl text-xl font-semibold leading-relaxed text-[#53643A] md:text-2xl">' + escapeHtml(copy.subtitle) + '</p>' +
      '<p class="mx-auto mt-6 max-w-4xl text-base leading-8 text-slate-700 md:text-lg">' + escapeHtml(copy.intro) + '</p>' +
    '</div></section>' +
    '<section class="mx-auto max-w-7xl space-y-7 px-4 py-10 md:space-y-9 md:py-16">' +
      '<section aria-labelledby="about-offerings-heading"><h2 id="about-offerings-heading" class="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">' +
        offersHeading + '</h2><div class="grid grid-cols-1 gap-4">' + offers + '</div></section>' +
      '<section aria-labelledby="about-team-heading" class="' + SECTION_CLASS + '">' +
        '<h2 id="about-team-heading" class="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">' + teamHeading + '</h2>' +
        '<div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">' + teamCards + '</div></section>' +
      '<section aria-labelledby="about-centres-heading" class="' + SECTION_CLASS + '">' +
        '<h2 id="about-centres-heading" class="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">' + centresHeading + '</h2>' +
        '<div class="grid gap-4 md:grid-cols-2">' + centreCards + '</div></section>' +
      '<section aria-labelledby="about-company-details-heading" class="' + SECTION_CLASS + '">' +
        '<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div>' +
          '<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#647746]">FLORIAL OOD</p>' +
          '<h2 id="about-company-details-heading" class="mt-2 text-2xl font-extrabold text-[#263323] md:text-3xl">' + legalHeading + '</h2>' +
        '</div><p class="text-sm text-slate-500">„Флориал“ ООД · FLORIAL OOD / FLORIAL LTD</p></div>' +
        '<div class="mt-6 grid gap-5 md:grid-cols-2">' +
          '<div class="rounded-2xl bg-[#F5F7EF] p-5"><h3 class="text-base font-extrabold text-[#263323]">' + registrationHeading + '</h3>' +
            '<dl class="mt-4 space-y-3 text-sm">' +
              '<div><dt class="text-slate-500">' + nameLabel + '</dt><dd class="mt-0.5 font-semibold text-[#263323]">' + escapeHtml(legalName) + '</dd></div>' +
              '<div><dt class="text-slate-500">ЕИК / UIC</dt><dd class="mt-0.5 font-semibold text-[#263323]">206978288</dd></div>' +
              '<div><dt class="text-slate-500">ДДС № / VAT №</dt><dd class="mt-0.5 font-semibold text-[#263323]">BG206978288</dd></div>' +
              '<div><dt class="text-slate-500">' + managerLabel + '</dt><dd class="mt-0.5 font-semibold text-[#263323]">Десислав Бараков</dd></div>' +
              '<div><dt class="text-slate-500">' + registeredAddressLabel + '</dt><dd class="mt-0.5 font-semibold leading-6 text-[#263323]">' + escapeHtml(registeredAddress) + '</dd></div>' +
            '</dl></div>' +
          '<div class="rounded-2xl bg-[#F5F7EF] p-5"><h3 class="text-base font-extrabold text-[#263323]">' + bankHeading + '</h3>' +
            '<dl class="mt-4 space-y-3 text-sm">' +
              '<div><dt class="text-slate-500">' + bankLabel + '</dt><dd class="mt-0.5 font-semibold text-[#263323]">Банка ДСК (DSK Bank)</dd></div>' +
              '<div><dt class="text-slate-500">IBAN</dt><dd class="mt-1 flex flex-wrap items-center gap-2">' +
                '<span class="break-all font-semibold tracking-wide text-[#263323]">BG88STSA93000029605234</span>' +
                '<button type="button" class="inline-flex items-center rounded-lg border border-[#C9D3B8] bg-white px-3 py-1.5 text-xs font-bold text-[#34452D] transition hover:bg-[#E9EDDB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#647746]">' +
                  copyIbanLabel + '</button></dd></div>' +
              '<div><dt class="text-slate-500">BIC / SWIFT</dt><dd class="mt-0.5 font-semibold text-[#263323]">STSABGSF</dd></div>' +
            '</dl></div>' +
        '</div>' +
        '<div class="mt-5 border-t border-[#E2E7D9] pt-5"><h3 class="text-base font-extrabold text-[#263323]">' + contactsHeading + '</h3>' +
          '<div class="mt-3 grid gap-3 text-sm sm:grid-cols-2">' +
            '<div><p class="text-slate-500">' + phoneLabel + '</p><a href="tel:+359876777902" class="mt-0.5 inline-block font-semibold text-[#34452D] underline underline-offset-4">+359 876 777 902</a></div>' +
            '<div><p class="text-slate-500">Email</p><a href="mailto:barakov1971@abv.bg" class="mt-0.5 inline-block break-all font-semibold text-[#34452D] underline underline-offset-4">barakov1971@abv.bg</a></div>' +
            '<div class="sm:col-span-2"><p class="text-slate-500">' + gardenCentreLabel + '</p><p class="mt-0.5 font-semibold leading-6 text-[#263323]">' + escapeHtml(gardenAddress) + '</p></div>' +
          '</div></div>' +
      '</section>' +
      '<section class="' + SECTION_CLASS + '"><h2 class="text-2xl font-extrabold text-[#263323] md:text-3xl">' + escapeHtml(copy.approachTitle) + '</h2>' +
        '<ol class="mt-6 grid gap-4 sm:grid-cols-2">' + processSteps + '</ol></section>' +
      '<section class="rounded-3xl bg-[#263323] px-6 py-9 text-white md:px-10 md:py-12">' +
        '<h2 class="text-2xl font-extrabold md:text-3xl">' + escapeHtml(copy.areasTitle) + '</h2>' +
        '<p class="mt-4 max-w-4xl leading-8 text-white/80">' + escapeHtml(copy.areas) + '</p>' +
        '<div class="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">' +
          '<p class="max-w-2xl text-sm leading-6 text-white/75">' + escapeHtml(copy.ctaText) + '</p>' +
          '<a href="' + escapeHtml(localizedHref('/contacts', lang)) + '" class="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#A9B88A] px-6 py-3.5 font-bold text-[#263323] transition hover:bg-[#C0CCA9] no-underline">' +
            escapeHtml(copy.cta) + ' <span aria-hidden="true">→</span></a></div>' +
      '</section>' +
    '</section>' +
  '</main>'
}
