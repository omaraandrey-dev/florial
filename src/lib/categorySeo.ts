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

const makeDescription = (category: CategorySeoContext, locale: CategorySeoLocale, phrase: string) => {
  const source = locale === 'bg' ? clean(category.description) : clean(category.translations?.[locale]?.description)
  if (source) {
    const compact = source.replace(/[.!?]+$/g, '')
    if (locale === 'bg') return compact + '. Разгледайте асортимента и изберете подходящо решение от Флориал.'
    if (locale === 'ru') return compact + '. Ознакомьтесь с ассортиментом и выберите подходящее решение в Florial.'
    return compact + '. Explore the range and find a suitable option at Florial.'
  }
  if (category.catalog === 'plants') {
    if (locale === 'bg') return phrase + ' за дома, терасата и градината. Разгледайте предложенията на градински център Флориал в България.'
    if (locale === 'ru') return phrase + ' для дома, террасы и сада. Выбирайте растения в садовом центре Florial в Болгарии.'
    return phrase + ' for homes, terraces and gardens. Explore the Florial garden centre selection in Bulgaria.'
  }
  if (locale === 'bg') return phrase + ' за изграждане и поддръжка на автоматични поливни системи. Поръчайте онлайн от Флориал с доставка в България.'
  if (locale === 'ru') return phrase + ' для монтажа и обслуживания систем автоматического полива. Заказывайте онлайн в Florial с доставкой по Болгарии.'
  return phrase + ' for installing and maintaining automatic irrigation systems. Order online from Florial with delivery across Bulgaria.'
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
