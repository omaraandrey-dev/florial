export type CategorySeoLocale = 'bg' | 'ru' | 'en'
export type CategoryCatalog = 'irrigation' | 'plants'

export type CategorySeoContext = {
  _id: string
  name: string
  slug?: string
  description?: unknown
  parentName?: string
  catalog: CategoryCatalog
  translations?: Partial<Record<'ru' | 'en', { name?: string; description?: unknown }>>
}

export type CategorySeoProposal = {
  h1: string
  metaTitle: string
  metaDescription: string
}

type LocalizedTerms = {
  phrase: Record<CategorySeoLocale, string>
  h1?: Record<CategorySeoLocale, string>
  description?: Record<CategorySeoLocale, string>
}

const TERMS: Record<string, LocalizedTerms> = {
  maslini: {
    phrase: { bg: 'Маслинови дървета', ru: 'Оливковые деревья', en: 'Olive Trees' },
    h1: {
      bg: 'Маслинови дървета за продажба от градински център Флориал',
      ru: 'Оливковые деревья для сада и участка',
      en: 'Olive Trees for Gardens and Landscapes',
    },
  },
  'palmi-i-yuki': {
    phrase: { bg: 'Палми и юки', ru: 'Пальмы и юкки', en: 'Palms and Yuccas' },
    h1: {
      bg: 'Палми и юки за продажба от градински център Флориал',
      ru: 'Пальмы и юкки для дома, терасата и градината',
      en: 'Palms and Yuccas for Homes, Terraces and Gardens',
    },
  },
  citrus: {
    phrase: { bg: 'Цитрусови дръвчета', ru: 'Цитрусовые деревья', en: 'Citrus Trees' },
    h1: {
      bg: 'Цитрусови дръвчета за дома, терасата и градината',
      ru: 'Цитрусовые деревья для дома, террасы и сада',
      en: 'Citrus Trees for Homes, Terraces and Gardens',
    },
  },
  rozi: {
    phrase: { bg: 'Рози за градината', ru: 'Розы для сада', en: 'Garden Roses' },
    h1: {
      bg: 'Рози за озеленяване и красиви градински пространства',
      ru: 'Розы для озеленения и оформления сада',
      en: 'Roses for Garden Design and Landscaping',
    },
  },
  controllers: {
    phrase: { bg: 'Контролери за поливане', ru: 'Контроллеры полива', en: 'Irrigation Controllers' },
    h1: {
      bg: 'Контролери за автоматично управление на поливни системи',
      ru: 'Контроллеры для автоматического управления системами полива',
      en: 'Controllers for Automatic Irrigation Systems',
    },
  },
  sprinklers: {
    phrase: { bg: 'Разпръсквачи за поливане', ru: 'Дождеватели для полива', en: 'Irrigation Sprinklers' },
    h1: {
      bg: 'Разпръсквачи за автоматично поливане на градини и тревни площи',
      ru: 'Дождеватели для автоматического полива садов и газонов',
      en: 'Sprinklers for Automatic Garden and Lawn Irrigation',
    },
  },
  'rotorni-razprskvachi': {
    phrase: { bg: 'Роторни разпръсквачи', ru: 'Роторные дождеватели', en: 'Rotor Sprinklers' },
    h1: {
      bg: 'Роторни разпръсквачи за равномерно поливане на тревни площи',
      ru: 'Роторные дождеватели для равномерного полива газонов',
      en: 'Rotor Sprinklers for Even Lawn Irrigation',
    },
  },
  'static-sprinklers': {
    phrase: { bg: 'Статични разпръсквачи', ru: 'Статические дождеватели', en: 'Spray Sprinklers' },
    h1: {
      bg: 'Статични разпръсквачи за малки и средни тревни площи',
      ru: 'Статические дождеватели для небольших и средних газонов',
      en: 'Spray Sprinklers for Small and Medium Lawns',
    },
  },
  nozzles: {
    phrase: { bg: 'Дюзи за поливни системи', ru: 'Форсунки для систем полива', en: 'Irrigation Nozzles' },
    h1: {
      bg: 'Дюзи за прецизно настройване на автоматичното поливане',
      ru: 'Форсунки для точной настройки автоматического полива',
      en: 'Nozzles for Precise Automatic Irrigation',
    },
  },
  'rotator-nozzles': {
    phrase: { bg: 'Ротаторни дюзи', ru: 'Ротаторные форсунки', en: 'Rotary Nozzles' },
    h1: {
      bg: 'Ротаторни дюзи за икономично и равномерно поливане',
      ru: 'Ротаторные форсунки для экономичного и равномерного полива',
      en: 'Rotary Nozzles for Efficient, Even Irrigation',
    },
  },
  klapani: {
    phrase: { bg: 'Електромагнитни клапани', ru: 'Электромагнитные клапаны', en: 'Solenoid Valves' },
    h1: {
      bg: 'Електромагнитни клапани за управление на поливни зони',
      ru: 'Электромагнитные клапаны для управления зонами полива',
      en: 'Solenoid Valves for Irrigation Zone Control',
    },
  },
  shahti: {
    phrase: { bg: 'Клапанни шахти', ru: 'Клапанные боксы', en: 'Valve Boxes' },
    h1: {
      bg: 'Клапанни шахти за защита и обслужване на поливни клапани',
      ru: 'Клапанные боксы для защиты и обслуживания клапанов',
      en: 'Valve Boxes for Irrigation Valve Protection and Access',
    },
  },
  'kapkovo-napoyavane': {
    phrase: { bg: 'Оборудване за капково напояване', ru: 'Оборудование для капельного полива', en: 'Drip Irrigation Equipment' },
    h1: {
      bg: 'Оборудване за капково напояване на градини и зелени площи',
      ru: 'Оборудование для капельного полива садов и зелёных насаждений',
      en: 'Drip Irrigation Equipment for Gardens and Landscapes',
    },
  },
  'trabi-fitingi-aksesoari': {
    phrase: { bg: 'Тръби и фитинги за поливане', ru: 'Трубы и фитинги для полива', en: 'Irrigation Pipes and Fittings' },
    h1: {
      bg: 'Тръби, фитинги и аксесоари за изграждане на поливни системи',
      ru: 'Трубы, фитинги и аксессуары для монтажа систем полива',
      en: 'Pipes, Fittings and Accessories for Irrigation Systems',
    },
  },
  'filtri-regulatori-nalyagane': {
    phrase: { bg: 'Филтри и регулатори на налягане', ru: 'Фильтры и регуляторы давления', en: 'Filters and Pressure Regulators' },
    h1: {
      bg: 'Филтри и регулатори на налягане за надеждно напояване',
      ru: 'Фильтры и регуляторы давления для надёжного полива',
      en: 'Filters and Pressure Regulators for Reliable Irrigation',
    },
  },
  'drugi-komponenti-za-polivane': {
    phrase: { bg: 'Компоненти за поливни системи', ru: 'Компоненты систем полива', en: 'Irrigation System Components' },
    h1: {
      bg: 'Допълнителни компоненти и аксесоари за поливни системи',
      ru: 'Дополнительные компоненты и аксессуары для систем полива',
      en: 'Additional Components and Accessories for Irrigation Systems',
    },
  },
  'gotovi-komplekti-za-polivane': {
    phrase: { bg: 'Комплекти за автоматично поливане', ru: 'Комплекты автоматического полива', en: 'Automatic Irrigation Kits' },
    h1: {
      bg: 'Готови комплекти за изграждане на автоматична поливна система',
      ru: 'Готовые комплекты для создания системы автоматического полива',
      en: 'Ready-Made Kits for Automatic Irrigation Systems',
    },
  },
}


const additionalTerms: Record<string, LocalizedTerms> = {
  'vsichko-za-polivane': { phrase: { bg: 'Оборудване за автоматично напояване', ru: 'Оборудование для автоматического полива', en: 'Automatic Irrigation Equipment' } },
  'tsitrusi': { phrase: { bg: 'Цитрусови дръвчета', ru: 'Цитрусовые деревья', en: 'Citrus Trees' }, h1: { bg: 'Цитрусови дръвчета за дома, терасата и градината', ru: 'Цитрусовые деревья для дома, террасы и сада', en: 'Citrus Trees for Homes, Terraces and Gardens' } },
  'igol_listni': { phrase: { bg: 'Иглолистни дървета и храсти', ru: 'Хвойные деревья и кустарники', en: 'Conifer Trees and Shrubs' } },
  'ekzotichni-rasteniya': { phrase: { bg: 'Екзотични растения', ru: 'Экзотические растения', en: 'Exotic Plants' } },
  'tsaftyashti-hrasti': { phrase: { bg: 'Цъфтящи декоративни храсти', ru: 'Цветущие декоративные кустарники', en: 'Flowering Ornamental Shrubs' } },
  'tsvetya-i-rozi': { phrase: { bg: 'Цветя и рози', ru: 'Цветы и розы', en: 'Flowers and Roses' } },
  'pochvopokrivni': { phrase: { bg: 'Почвопокривни растения', ru: 'Почвопокровные растения', en: 'Ground Cover Plants' } },
  'rasteniya-zhiv-plet': { phrase: { bg: 'Растения за жив плет', ru: 'Растения для живой изгороди', en: 'Hedge Plants' } },
  'interiorni-rasteniya': { phrase: { bg: 'Интериорни растения', ru: 'Комнатные растения', en: 'Indoor Plants' } },
  'dekorativni-trevi': { phrase: { bg: 'Декоративни треви и злаци', ru: 'Декоративные травы и злаки', en: 'Ornamental Grasses' } },
  'palmi-yuki': { phrase: { bg: 'Палми и юки', ru: 'Пальмы и юкки', en: 'Palms and Yuccas' }, h1: { bg: 'Палми и юки за продажба от градински център Флориал', ru: 'Пальмы и юкки для дома, террасы и сада', en: 'Palms and Yuccas for Homes, Terraces and Gardens' } },
  'mnogogodishni-tsvetya': { phrase: { bg: 'Многогодишни цветя', ru: 'Многолетние цветы', en: 'Perennial Flowers' } },
  'rastenia': { phrase: { bg: 'Растения за градината и дома', ru: 'Растения для сада и дома', en: 'Plants for Gardens and Homes' } },
  'sezonni-tsvetya': { phrase: { bg: 'Сезонни цветя', ru: 'Сезонные цветы', en: 'Seasonal Flowers' } },
  'soliteri-edrorazmerni': { phrase: { bg: 'Солитерни и едроразмерни растения', ru: 'Солитерные и крупномерные растения', en: 'Specimen and Large Plants' } },
  'darveta-i-hrasti': { phrase: { bg: 'Дървета и декоративни храсти', ru: 'Деревья и декоративные кустарники', en: 'Trees and Ornamental Shrubs' } },
  'shirokolistni-darveta': { phrase: { bg: 'Широколистни дървета', ru: 'Лиственные деревья', en: 'Broadleaf Trees' } },
  'nipel-reduktiven-plastmasov-vanshna-rezba': { phrase: { bg: 'Пластмасови редуктивни нипели с външна резба', ru: 'Пластиковые редукционные ниппели с наружной резьбой', en: 'Plastic Reducing Nipples with Male Thread' } },
  'adaptori-prehodi-vanshna-rezba-pn-10': { phrase: { bg: 'Преходи с външна резба PN 10', ru: 'Переходники с наружной резьбой PN 10', en: 'PN 10 Male Thread Adapters' } },
  'adaptori-prehodi-vatreshna-rezba-pn-10': { phrase: { bg: 'Преходи с вътрешна резба PN 10', ru: 'Переходники с внутренней резьбой PN 10', en: 'PN 10 Female Thread Adapters' } },
  'tapi-pn-10': { phrase: { bg: 'Тапи за тръбни фитинги PN 10', ru: 'Заглушки для трубных фитингов PN 10', en: 'PN 10 Pipe Fitting End Caps' } },
  'troynitsi-rezbovi-vatreshna-rezba-pn-10': { phrase: { bg: 'Тройници с вътрешна резба PN 10', ru: 'Тройники с внутренней резьбой PN 10', en: 'PN 10 Female Thread Tees' } },
  'vodovzemni-skobi-vatreshna-rezba': { phrase: { bg: 'Водовземни скоби с вътрешна резба', ru: 'Хомуты для врезки с внутренней резьбой', en: 'Saddle Clamps with Female Thread' } },
  'kolena-90-pn-10': { phrase: { bg: 'Колена 90° PN 10', ru: 'Угольники 90° PN 10', en: 'PN 10 90-Degree Elbows' } },
  'kolena-vatreshna-rezba-pn-10': { phrase: { bg: 'Колена с вътрешна резба PN 10', ru: 'Угольники с внутренней резьбой PN 10', en: 'PN 10 Female Thread Elbows' } },
  'plastmasovi-rezbovi-fitingi': { phrase: { bg: 'Пластмасови резбови фитинги', ru: 'Пластиковые резьбовые фитинги', en: 'Plastic Threaded Fittings' } },
  'barzi-fitingi-kompresionni-pe-pn10': { phrase: { bg: 'Бързи компресионни фитинги PE PN 10', ru: 'Быстросъёмные компрессионные фитинги PE PN 10', en: 'PE PN 10 Compression Fittings' } },
  'troynitsi-pn-10': { phrase: { bg: 'Тройници PN 10', ru: 'Тройники PN 10', en: 'PN 10 Tee Fittings' } },
  'mufa-nipel-plastmasova-vatreshna-vanshna-rezba': { phrase: { bg: 'Пластмасови муфи-нипели с вътрешна и външна резба', ru: 'Пластиковые муфты-ниппели с внутренней и наружной резьбой', en: 'Plastic Female-to-Male Threaded Couplings' } },
  'reduktivni-mufi-saediniteli-pn-10': { phrase: { bg: 'Редуктивни муфи и съединители PN 10', ru: 'Редукционные муфты и соединители PN 10', en: 'PN 10 Reducing Couplings and Connectors' } },
  'reduktivni-troynitsi-pn-10': { phrase: { bg: 'Редуктивни тройници PN 10', ru: 'Редукционные тройники PN 10', en: 'PN 10 Reducing Tee Fittings' } },
  'autonomous-controllers': { phrase: { bg: 'Автономни контролери за поливане', ru: 'Автономные контроллеры полива', en: 'Battery-Powered Irrigation Controllers' } },
  'kranove-za-kapkov-markuch': { phrase: { bg: 'Кранове за капков маркуч', ru: 'Краны для капельного шланга', en: 'Drip Hose Valves' } },
  'fitingi-16-mm-za-kapkov-markuch': { phrase: { bg: 'Фитинги 16 mm за капков маркуч', ru: 'Фитинги 16 мм для капельного шланга', en: '16 mm Drip Hose Fittings' } },
  'fitingi-6-mm-za-mikrotraba': { phrase: { bg: 'Фитинги 6 mm за микротръба', ru: 'Фитинги 6 мм для микротрубки', en: '6 mm Micro Tube Fittings' } },
  'nipel-plastmasov-vanshna-rezba': { phrase: { bg: 'Пластмасови нипели с външна резба', ru: 'Пластиковые ниппели с наружной резьбой', en: 'Plastic Male Thread Nipples' } },
  'mufa-plastmasova-vatreshna-rezba': { phrase: { bg: 'Пластмасови муфи с вътрешна резба', ru: 'Пластиковые муфты с внутренней резьбой', en: 'Plastic Female Thread Couplings' } },
  'nipel-mufa-plastmasova-vanshna-vatreshna-rezba': { phrase: { bg: 'Пластмасови нипел-муфи с резба', ru: 'Пластиковые ниппель-муфты с резьбой', en: 'Plastic Threaded Nipple Couplings' } },
  'kolena-rezbovi-vanshna-rezba-pn-10': { phrase: { bg: 'Колена с външна резба PN 10', ru: 'Угольники с наружной резьбой PN 10', en: 'PN 10 Male Thread Elbows' } },
  'kolena-90-plastmasovi-rezbovi': { phrase: { bg: 'Пластмасови резбови колена 90°', ru: 'Пластиковые резьбовые угольники 90°', en: 'Plastic Threaded 90-Degree Elbows' } },
  'mufi-saediniteli-pn-10': { phrase: { bg: 'Муфи и съединители PN 10', ru: 'Муфты и соединители PN 10', en: 'PN 10 Couplings and Connectors' } },
  'mufa-reduktivna-plastmasova-vatreshna-rezba': { phrase: { bg: 'Пластмасови редуктивни муфи с вътрешна резба', ru: 'Пластиковые редукционные муфты с внутренней резьбой', en: 'Plastic Reducing Female Thread Couplings' } },
  'vatreshno-reduktiven-nipel-vrn-plastmasovi-rezbovi': { phrase: { bg: 'Пластмасови вътрешно редуктивни нипели', ru: 'Пластиковые внутренние редукционные ниппели', en: 'Plastic Internal Reducing Nipples' } },
  'troynik-90-plastmasov-vatreshna-rezba': { phrase: { bg: 'Пластмасови тройници 90° с вътрешна резба', ru: 'Пластиковые тройники 90° с внутренней резьбой', en: 'Plastic 90-Degree Female Thread Tees' } },
  'spray-nozzles': { phrase: { bg: 'Веерни дюзи за поливане', ru: 'Веерные форсунки для полива', en: 'Spray Nozzles for Irrigation' } },
  'kontroleri-vatreshen-montazh': { phrase: { bg: 'Контролери за вътрешен монтаж', ru: 'Контроллеры для внутренней установки', en: 'Indoor Irrigation Controllers' } },
  'kontroleri-vanshen-montazh': { phrase: { bg: 'Контролери за външен монтаж', ru: 'Контроллеры для наружной установки', en: 'Outdoor Irrigation Controllers' } },
  'senzori-za-avtomatizatsiya': { phrase: { bg: 'Сензори за автоматизация на поливането', ru: 'Датчики автоматизации полива', en: 'Irrigation Automation Sensors' } },
  'kapkovo-napoyavane-fitingi': { phrase: { bg: 'Фитинги за капково напояване', ru: 'Фитинги для капельного полива', en: 'Drip Irrigation Fittings' } },
  'kapkovo-napoyavane-trabi': { phrase: { bg: 'Тръби за капково напояване', ru: 'Трубки для капельного полива', en: 'Drip Irrigation Tubing' } },
  'fitingi-za-praskachki': { phrase: { bg: 'Фитинги за разпръсквачи', ru: 'Фитинги для дождевателей', en: 'Sprinkler Fittings' } },
  'fitingi-za-klapani': { phrase: { bg: 'Фитинги за електромагнитни клапани', ru: 'Фитинги для электромагнитных клапанов', en: 'Solenoid Valve Fittings' } },
  'vodovzemni-skobi': { phrase: { bg: 'Водовземни скоби за поливни системи', ru: 'Хомуты для врезки в трубопровод', en: 'Irrigation Pipe Saddle Clamps' } },
  'kolyano-nipel-90-plastmasovi-rezbovi': { phrase: { bg: 'Пластмасови колена-нипели 90°', ru: 'Пластиковые угольники-ниппели 90°', en: 'Plastic 90-Degree Elbow Nipples' } },
  'electromagnetic-valves-24v': { phrase: { bg: 'Електромагнитни клапани 24 V', ru: 'Электромагнитные клапаны 24 В', en: '24V Solenoid Valves' } },
  'electromagnetic-valves-9v': { phrase: { bg: 'Електромагнитни клапани 9 V', ru: 'Электромагнитные клапаны 9 В', en: '9V Solenoid Valves' } },
}
Object.assign(TERMS, additionalTerms)

const clean = (value: unknown): string => {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim()
  if (!Array.isArray(value)) return ''
  return value.map((block: any) => {
    if (typeof block === 'string') return block
    return Array.isArray(block?.children) ? block.children.map((child: any) => child?.text || '').join(' ') : ''
  }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

const localeName = (category: CategorySeoContext, locale: CategorySeoLocale) =>
  locale === 'bg' ? category.name : category.translations?.[locale]?.name || category.name

const limitDescription = (value: string, maxLength = 160) => {
  const normalized = value.replace(/\\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const candidate = normalized.slice(0, maxLength - 1)
  const boundary = candidate.lastIndexOf(' ')
  return (boundary > 100 ? candidate.slice(0, boundary) : candidate).replace(/[,. ;:]+$/g, '') + '…'
}

const makeDescription = (category: CategorySeoContext, locale: CategorySeoLocale, phrase: string) => {
  const source = locale === 'bg' ? clean(category.description) : clean(category.translations?.[locale]?.description)
  if (source) {
    const compact = source.replace(/[.!?]+$/g, '')
    if (locale === 'bg') return limitDescription(compact + '. Разгледайте асортимента на Флориал.')
    if (locale === 'ru') return limitDescription(compact + '. Ассортимент Florial — с доставкой по Болгарии.')
    return limitDescription(compact + '. Explore the Florial range in Bulgaria.')
  }
  if (category.catalog === 'plants') {
    if (locale === 'bg') return limitDescription(phrase + ' за дома, терасата и градината. Разгледайте предложенията на градински център Флориал в България.')
    if (locale === 'ru') return limitDescription(phrase + ' для дома, террасы и сада. Выбирайте растения в Florial в Болгарии.')
    return limitDescription(phrase + ' for homes, terraces and gardens. Explore the Florial selection in Bulgaria.')
  }
  if (locale === 'bg') return limitDescription(phrase + ' за изграждане и поддръжка на автоматични поливни системи. Поръчайте онлайн от Флориал с доставка в България.')
  if (locale === 'ru') return limitDescription(phrase + ' для монтажа и обслуживания систем автоматического полива. Заказывайте в Florial с доставкой по Болгарии.')
  return limitDescription(phrase + ' for automatic irrigation systems. Order from Florial with delivery across Bulgaria.')
}

export function generateCategorySeo(category: CategorySeoContext, locale: CategorySeoLocale): CategorySeoProposal {
  const terms = TERMS[category.slug || '']
  const name = localeName(category, locale)
  const phrase = terms?.phrase[locale] || name
  const h1 = terms?.h1?.[locale] || (category.catalog === 'plants'
    ? locale === 'bg' ? phrase + ' за продажба от градински център Флориал' : locale === 'ru' ? phrase + ' для сада и озеленения' : phrase + ' for Gardens and Landscaping'
    : locale === 'bg' ? phrase + ' за автоматично напояване на градини и зелени площи' : locale === 'ru' ? phrase + ' для автоматического полива садов и газонов' : phrase + ' for Automatic Garden Irrigation')
  const brand = locale === 'bg' ? 'Флориал' : 'Florial'
  const titleCore = category.catalog === 'plants'
    ? locale === 'bg' ? phrase + ' за градината и двора' : locale === 'ru' ? phrase + ' для сада и участка' : phrase + ' for Gardens and Landscapes'
    : locale === 'bg' ? phrase + ' за автоматично напояване' : locale === 'ru' ? phrase + ' для автоматического полива' : phrase + ' for Automatic Irrigation'
  const metaTitle = titleCore + ' | ' + brand
  const metaDescription = makeDescription(category, locale, phrase)
  return {
    h1: h1.replace(/\s+/g, ' ').trim(),
    metaTitle: metaTitle.replace(/\s+/g, ' ').trim(),
    metaDescription: metaDescription.replace(/\s+/g, ' ').trim(),
  }
}

export function isBlankSeoValue(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

export function resolveCategorySeo(
  seo: Partial<CategorySeoProposal> | null | undefined,
  category: CategorySeoContext,
  locale: CategorySeoLocale,
) {
  const name = localeName(category, locale)
  const brand = locale === 'bg' ? 'Флориал' : 'Florial'
  const generatedFallback = generateCategorySeo(category, locale)
  return {
    h1: typeof seo?.h1 === 'string' && seo.h1.trim() ? seo.h1.trim() : name,
    metaTitle: typeof seo?.metaTitle === 'string' && seo.metaTitle.trim()
      ? seo.metaTitle.trim()
      : name + ' | ' + brand,
    metaDescription: typeof seo?.metaDescription === 'string' && seo.metaDescription.trim()
      ? seo.metaDescription.trim()
      : generatedFallback.metaDescription,
  }
}
