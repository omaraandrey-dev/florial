const LOCATIONS = [
  {
    key: 'nesebr',
    slug: 'Florial-nesebr',
    mapUrl: 'https://maps.app.goo.gl/pK8qGHh9b1xoCc4P9',
    names: {
      bg: 'Градински център Несебър',
      ru: 'Садовый центр Несебр',
      en: 'Garden Centre Nessebar',
    },
    addresses: {
      bg: 'ул. „Хан Крум“, 8230 Несебър (до магазин Janet)',
      ru: 'ул. «Хан Крум», 8230 Несебр (рядом с магазином Janet)',
      en: 'ul. "Khan Krum", 8230 Nessebar (next to Janet store)',
    },
  },
  {
    key: 'ravda',
    slug: 'Florial-ravda',
    mapUrl: 'https://maps.app.goo.gl/3fiLaRgwSLDTH77U6',
    names: {
      bg: 'Градински център Равда',
      ru: 'Садовый центр Равда',
      en: 'Garden Centre Ravda',
    },
    addresses: {
      bg: 'с. Равда, България',
      ru: 'Равда, Болгария',
      en: 'Ravda, Bulgaria',
    },
  },
]

const COPY = {
  bg: {
    back: 'Назад към началната страница',
    title: 'Контакти и локации',
    opening: 'Работни часове',
    address: 'Адрес и контакти',
    map: 'Виж на Google карти',
    noImage: 'Няма изображение',
    days: ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'],
    hours: '09:00 – 17:00',
    intro: 'Свържете се с нас за растения, оборудване за автоматично напояване и услуги по озеленяване в България.',
    languagePhone: 'ENG / UA / RU',
  },
  ru: {
    back: 'Вернуться на главную',
    title: 'Контакты и адреса',
    opening: 'Часы работы',
    address: 'Адрес и контакты',
    map: 'Посмотреть на Google Картах',
    noImage: 'Нет изображения',
    days: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
    hours: '09:00 – 17:00',
    intro: 'Свяжитесь с нами по вопросам растений, оборудования для автоматического полива и услуг по озеленению в Болгарии.',
    languagePhone: 'ENG / UA / RU',
  },
  en: {
    back: 'Back to home',
    title: 'Contacts & Locations',
    opening: 'Opening hours',
    address: 'Address and contacts',
    map: 'View on Google Maps',
    noImage: 'No image available',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    hours: '09:00 – 17:00',
    intro: 'Contact us about plants, automatic irrigation equipment and landscaping services in Bulgaria.',
    languagePhone: 'ENG / UA / RU',
  },
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function safeImageUrl(value) {
  const url = String(value || '').trim()
  return /^https:\/\/cdn\.sanity\.io\//i.test(url) ? url : ''
}

export function renderContactsHtml(language = 'bg', images = {}) {
  const lang = ['bg', 'ru', 'en'].includes(language) ? language : 'bg'
  const copy = COPY[lang]
  const cards = LOCATIONS.map((location) => {
    const imageUrl = safeImageUrl(images?.[location.key])
    const image = imageUrl
      ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(location.names[lang]) + '" loading="lazy" decoding="async" class="w-full h-full object-cover" />'
      : '<span class="text-slate-400 text-sm font-medium">' + escapeHtml(copy.noImage) + '</span>'
    return '<article data-florial-contact-location="' + location.key + '" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">' +
      '<div><div class="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">' + image + '</div>' +
      '<div class="p-6"><h2 class="text-xl font-bold text-slate-900 mb-2">' + escapeHtml(location.names[lang]) + '</h2>' +
      '<p class="text-slate-600 text-sm mb-4 leading-relaxed">' + escapeHtml(location.addresses[lang]) + '</p></div></div>' +
      '<div class="px-6 pb-6 pt-0"><a href="' + location.mapUrl + '" target="_blank" rel="noreferrer" class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-4 rounded-xl text-center text-sm transition border border-emerald-200 flex items-center justify-center gap-2">' +
      '🗺️ ' + escapeHtml(copy.map) + '</a></div></article>'
  }).join('')

  const hours = copy.days.map((day) =>
    '<li class="flex justify-between border-b border-amber-200/50 pb-2"><i>' + escapeHtml(day) +
    '</i><span>' + copy.hours + '</span></li>'
  ).join('')

  const phones = '<div class="space-y-2 text-sm">' +
    '<p><a href="tel:+359876777902" class="text-emerald-800 font-bold hover:underline">+359876777902</a></p>' +
    '<p><a href="tel:+359885834860" class="text-emerald-800 font-bold hover:underline">+359885834860</a> (' + copy.languagePhone + ')</p>' +
    (lang !== 'bg' ? '<p><a href="tel:+380674807486" class="text-emerald-800 font-bold hover:underline">+38 067 480 74 86</a></p>' : '') +
    '</div>'

  return '<main data-florial-ssr="contacts" class="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">' +
    '<a href="/" class="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition">← ' + escapeHtml(copy.back) + '</a>' +
    '<h1 class="text-3xl font-extrabold text-slate-900 mb-6">' + escapeHtml(copy.title) + '</h1>' +
    '<p class="sr-only">' + escapeHtml(copy.intro) + '</p>' +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">' + cards + '</div>' +
    '<section class="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">' +
    '<h2 class="text-2xl font-bold text-slate-900 mb-4">' + escapeHtml(copy.opening) + '</h2>' +
    '<ul class="space-y-2 text-slate-700 font-medium">' + hours + '</ul></section>' +
    '<section class="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6 space-y-4">' +
    '<h2 class="text-xl font-bold text-slate-900">' + escapeHtml(copy.address) + '</h2>' + phones + '</section>' +
    '</main>'
}
