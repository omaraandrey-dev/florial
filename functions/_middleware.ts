import { resolveCategorySeo } from '../src/lib/categorySeo'
import { getBlogServiceRedirectPath } from '../src/lib/blogServiceRedirects.mjs'
import { collectDescendantCategoryIds, buildPlantCategoryEntries, buildEquipmentCategoryEntries, renderPlantCategoryListing, renderEquipmentCategoryListing } from './_lib/plantCategoryHtml.mjs'
import { renderEquipmentCategoryNavigation, renderEquipmentCategorySeoContent, renderEquipmentCategoryHelpBlock } from './_lib/equipmentCategoryPageHtml.mjs'
import { buildProductOffer, getServerProductPrice } from './_lib/productJsonLd.mjs'
import { getOrderedServiceEntries } from '../src/lib/servicesOrder'
import { renderHomepageHtml } from './_lib/homepageHtml.mjs'
import { getServicesDirectoryMetadata, renderServicesDirectoryHtml } from './_lib/servicesDirectoryHtml.mjs'
import { buildServiceDetailStructuredData, getServiceDetailMetadata, renderServiceDetailHtml } from './_lib/serviceDetailHtml.mjs'
import { getBlogIndexMetadata, renderBlogIndexHtml, serializeBlogIndexPayload } from './_lib/blogIndexHtml.mjs'
import { getBlogArticleMetadata, renderBlogArticleHtml, serializeBlogArticlePayload } from './_lib/blogArticleHtml.mjs'
import { buildEquipmentProductStructuredData, renderEquipmentProductHtml } from './_lib/equipmentProductHtml.mjs'
import { buildPlantProductStructuredData, renderPlantProductHtml, renderPortableText } from './_lib/plantProductHtml.mjs'
import { renderContactsHtml } from './_lib/contactsHtml.mjs'
import { renderAboutHtml } from './_lib/aboutHtml.mjs'
import { ABOUT_PAGE_CONTENT, ABOUT_PAGE_CENTRES, ABOUT_PAGE_TEAM } from '../src/content/aboutPageContent'

const SITE_NAME = 'Florial'
const SITE_URL = 'https://florial-bg.com'
const LOGO_URL = 'https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png'
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_API_VERSION = '2024-01-01'

type PagesContext = {
  request: Request
  next: () => Promise<Response>
}

type SeoPlantProduct = {
  _id: string
  name?: string
  sku?: string
  imageUrl?: string
  galleryImageUrls?: string[]
  plantCare?: { minWinterTempC?: number }
  _catalogVariant?: { name?: string; nameEn?: string; nameRu?: string; priceEUR?: number; oldPriceEUR?: number; stockStatus?: string; saleHeightCm?: number; containerVolumeL?: number }
  categoryId?: string
  categoryIds?: string[]
  slugValue?: string
  priceEUR?: number
  stockStatus?: string
  translations?: Record<string, { name?: string; shortDescription?: string; seo?: { h1?: string } } | undefined>
  seo?: { h1?: string }
  saleVariants?: Array<{
    _key?: string
    name?: string
    nameEn?: string
    nameRu?: string
    sku?: string
    priceEUR?: number
    oldPriceEUR?: number
    stockQuantity?: number
    stockStatus?: string
    saleHeightCm?: number
    containerVolumeL?: number
  }>
}

type ServiceDetailDocument = SeoDocument & {
  slugValue?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  imageLinkUrl?: string
  startingPriceEUR?: number
  hero?: { title?: string; subtitle?: string; imageUrl?: string; imageAlt?: string; imageAltEn?: string; imageAltRu?: string; imageLinkUrl?: string }
  galleryImages?: Array<{ _key?: string; url?: string; alt?: string; altEn?: string; altRu?: string; linkUrl?: string }>
  contentBlocks?: Array<Record<string, any>>
  relatedContent?: Array<Record<string, any>>
  advantages?: Array<Record<string, any>>
  steps?: Array<Record<string, any>>
  callToAction?: Record<string, any>
  leadForm?: Record<string, any>
}

type SeoCategoryNode = {
  _id: string
  parentId?: string
  slugValue?: string
  name?: string
  sortOrder?: number
  productCount?: number
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  imageTitle?: string
  imageTitleEn?: string
  imageTitleRu?: string
  translations?: Record<string, { name?: string } | undefined>
}

type SeoDocument = {
  _id: string
  _dataset?: string
  name?: string
  title?: string
  slugValue?: string
  publishedAt?: string
  isPublished?: boolean
  shortDescription?: string
  description?: unknown
  priceEUR?: number
  productType?: string
  saleVariants?: Array<{ priceEUR?: number; stockStatus?: string; name?: string }>
  sku?: string
  stockStatus?: string
  serviceCategory?: string
  imageUrl?: string
  coverUrl?: string
  _updatedAt?: string
  brandName?: string
  seo?: Record<string, unknown> | null
  translations?: Record<string, Record<string, any>>
  seoContent?: unknown[]
  helpBlock?: Record<string, any>
}

type EquipmentProductDocument = SeoDocument & {
  oldPriceEUR?: number
  vatIncluded?: boolean
  stockQuantity?: number
  weightKg?: number
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  galleryImages?: Array<{ _key?: string; url?: string; alt?: string; altEn?: string; altRu?: string }>
  specifications?: Array<Record<string, any>>
  compatibility?: string[]
  manualPDFUrl?: string
  catalogPDFUrl?: string
  categoryId?: string
  categoryIds?: string[]
  relatedProducts?: Array<Record<string, any>>
  relatedContent?: Array<Record<string, any>>
  kitComponents?: Array<Record<string, any>>
}

const categoryFallbacks: Record<string, Record<'ru' | 'en', { name: string; description: string }>> = {
  controllers: {
    ru: { name: 'Контроллеры', description: 'Контроллеры управляют расписанием автоматического полива: задают время, продолжительность и зоны полива. В категории представлены контроллеры Rain Bird для наружной и внутренней установки, а также автономные модели на батарейках.' },
    en: { name: 'Controllers', description: 'Controllers automate irrigation schedules by setting when, how long and in which zones the system waters. This category includes Rain Bird outdoor, indoor and battery-powered controllers.' },
  },
  sprinklers: {
    ru: { name: 'Дождеватели', description: 'Дождеватели для автоматического полива газонов и садов. Выбирайте роторные и статические модели Rain Bird с учётом площади, сектора полива и давления воды.' },
    en: { name: 'Sprinklers', description: 'Sprinklers for automatic watering of lawns and gardens. Choose Rain Bird rotor and spray models to suit the area, watering arc and available water pressure.' },
  },
  'rotorni-razprskvachi': {
    ru: { name: 'Роторные дождеватели', description: 'Роторные дождеватели Rain Bird равномерно поливают средние и большие газоны, сады и парки. Сектор полива регулируется; модели предназначены для подземных систем автоматического полива.' },
    en: { name: 'Rotor Sprinklers', description: 'Rain Bird rotor sprinklers provide even coverage for medium and large lawns, gardens and parks. The watering arc is adjustable, and the models are designed for underground irrigation systems.' },
  },
  'static-sprinklers': {
    ru: { name: 'Статические дождеватели', description: 'Статические дождеватели одновременно подают воду на всю выбранную зону. Они подходят для небольших и средних газонов, углов и узких полос в саду.' },
    en: { name: 'Spray Sprinklers', description: 'Spray sprinklers water the selected area simultaneously and are well suited to small and medium lawns, corners and narrow garden strips.' },
  },
  'autonomous-controllers': {
    ru: { name: 'Автономные контроллеры', description: 'Автономные контроллеры работают от батареек и не требуют подключения к электросети. Они подходят для участков без электричества и управляют поливом по заданной программе.' },
    en: { name: 'Battery-Powered Controllers', description: 'Battery-powered controllers do not require mains electricity. They suit locations without a power supply and manage irrigation according to a programmed schedule.' },
  },
  nozzles: {
    ru: { name: 'Форсунки', description: 'Форсунки определяют дальность, сектор и интенсивность подачи воды. В категории представлены веерные и ротаторные форсунки Rain Bird для точной настройки полива под форму газона.' },
    en: { name: 'Nozzles', description: 'Nozzles determine spray distance, arc and application rate. This category includes Rain Bird spray and rotary nozzles for fine-tuning irrigation to the shape of the lawn.' },
  },
  'spray-nozzles': {
    ru: { name: 'Веерные форсунки', description: 'Веерные форсунки создают равномерный поток на небольшом расстоянии. Они подходят для небольших участков, цветников и узких полос; у регулируемых моделей можно настроить сектор полива.' },
    en: { name: 'Spray Nozzles', description: 'Spray nozzles create an even fan-shaped spray over short distances. They suit small areas, flower beds and narrow lawn strips; adjustable models allow the watering arc to be set.' },
  },
  'rotator-nozzles': {
    ru: { name: 'Ротаторные форсунки', description: 'Ротаторные форсунки распределяют воду несколькими тонкими вращающимися струями, обеспечивая равномерный и бережный полив. Устанавливаются на корпуса статических дождевателей.' },
    en: { name: 'Rotary Nozzles', description: 'Rotary nozzles distribute water through several thin, rotating streams for even and gentle application. They fit spray sprinkler bodies.' },
  },
  shahti: {
    ru: { name: 'Клапанные боксы', description: 'Клапанные боксы защищают клапаны и соединения и обеспечивают удобный доступ для осмотра и обслуживания системы полива.' },
    en: { name: 'Valve Boxes', description: 'Valve boxes protect valves and their connections while providing convenient access for inspection and irrigation system maintenance.' },
  },
  klapani: {
    ru: { name: 'Клапаны', description: 'Электромагнитные клапаны по команде контроллера открывают и перекрывают воду в отдельных зонах. Выбирайте модель с учётом напряжения, диаметра подключения и требований системы.' },
    en: { name: 'Valves', description: 'Solenoid valves open and shut off water to individual zones when commanded by the controller. Choose a model based on voltage, connection size and system requirements.' },
  },
  'electromagnetic-valves': {
    ru: { name: 'Электромагнитные клапаны', description: 'Электромагнитные клапаны управляются контроллером и подают воду в отдельные зоны. В категории представлены клапаны Rain Bird серии 100, включая версии с соленоидом 9 В для автономных контроллеров.' },
    en: { name: 'Solenoid Valves', description: 'Controller-operated solenoid valves supply water to individual irrigation zones. This category includes Rain Bird 100 Series valves, including 9V versions for battery-powered controllers.' },
  },
  'trabi-fitingi-aksesoari': {
    ru: { name: 'Трубы, фитинги и аксессуары', description: 'Трубы, гибкие подводки, фитинги и соединители для надёжного монтажа и обслуживания систем автоматического полива.' },
    en: { name: 'Pipes, Fittings and Accessories', description: 'Pipes, flexible connections, fittings and connectors for reliable installation and maintenance of automatic irrigation systems.' },
  },
  'drugi-komponenti-za-polivane': {
    ru: { name: 'Другие компоненты для полива', description: 'Дополнительные комплектующие для сборки, соединения и обслуживания систем автоматического полива.' },
    en: { name: 'Other Irrigation Components', description: 'Additional components for assembling, connecting and maintaining automatic irrigation systems.' },
  },
  'filtri-regulatori-nalyagane': {
    ru: { name: 'Фильтры и регуляторы давления', description: 'Фильтры защищают компоненты капельного полива от загрязнений, а регуляторы поддерживают подходящее рабочее давление.' },
    en: { name: 'Filters and Pressure Regulators', description: 'Filters protect drip irrigation components from debris, while pressure regulators maintain suitable operating pressure.' },
  },
  'kapkovo-napoyavane': {
    ru: { name: 'Капельный полив', description: 'Капельные шланги, трубки и фитинги подают воду непосредственно к корням растений, обеспечивая точный и экономичный полив с меньшими потерями на испарение и сток.' },
    en: { name: 'Drip Irrigation', description: 'Drip hoses, tubing and fittings deliver water directly to plant root zones for precise, water-efficient irrigation with less evaporation and runoff.' },
  },
  'vsichko-za-polivane': {
    ru: { name: 'Всё для полива', description: 'Всё необходимое для создания и обслуживания системы автоматического полива в одном месте: дождеватели, форсунки, контроллеры, электромагнитные клапаны, трубы, фитинги и другие комплектующие.' },
    en: { name: 'All Irrigation Equipment', description: 'Everything needed to build and maintain an automatic irrigation system in one place, including sprinklers, nozzles, controllers, solenoid valves, pipes, fittings and other components.' },
  },
  'electromagnetic-valves-24v': {
    ru: { name: 'Электромагнитные клапаны 24 В', description: 'Электромагнитные клапаны с соленоидом 24 В для управления отдельными зонами автоматического полива.' },
    en: { name: '24V Solenoid Valves', description: '24V solenoid valves for controlling individual zones in automatic irrigation systems.' },
  },
  'electromagnetic-valves-9v': {
    ru: { name: 'Электромагнитные клапаны 9 В', description: 'Электромагнитные клапаны с соленоидом 9 В для зон полива, управляемых автономными контроллерами.' },
    en: { name: '9V Solenoid Valves', description: '9V solenoid valves for irrigation zones controlled by battery-powered controllers.' },
  },
  'kapkovo-napoyavane-trabi': {
    ru: { name: 'Трубы для капельного полива', description: 'Капельные и компенсированные трубки для точной подачи воды к растениям.' },
    en: { name: 'Drip Irrigation Tubing', description: 'Drip and pressure-compensating tubing for precise, targeted irrigation of plants.' },
  },
  'kapkovo-napoyavane-fitingi': {
    ru: { name: 'Фитинги для капельного полива', description: 'Фитинги и соединители для монтажа и расширения линий капельного полива.' },
    en: { name: 'Drip Irrigation Fittings', description: 'Fittings and connectors for installing and extending drip irrigation tubing.' },
  },
  'kontroleri-vanshen-montazh': {
    ru: { name: 'Контроллеры наружной установки', description: 'Контроллеры автоматического полива, предназначенные для установки на улице.' },
    en: { name: 'Outdoor Controllers', description: 'Automatic irrigation controllers designed for outdoor installation.' },
  },
  'kontroleri-vatreshen-montazh': {
    ru: { name: 'Контроллеры для помещений', description: 'Контроллеры автоматического полива, предназначенные для установки внутри помещений.' },
    en: { name: 'Indoor Controllers', description: 'Automatic irrigation controllers designed for installation indoors.' },
  },
  'senzori-za-avtomatizatsiya': {
    ru: { name: 'Датчики автоматизации полива', description: 'Датчики и аксессуары для контроля, дистанционного управления и автоматизации системы полива.' },
    en: { name: 'Irrigation Automation Sensors', description: 'Sensors and accessories for monitoring, remote control and automation of irrigation systems.' },
  },
  'fitingi-za-klapani': {
    ru: { name: 'Фитинги для клапанов', description: 'Коллекторы, адаптеры и фитинги для монтажа и подключения электромагнитных клапанов.' },
    en: { name: 'Valve Fittings', description: 'Manifolds, adapters and fittings for installing and connecting solenoid valves.' },
  },
  'fitingi-za-praskachki': {
    ru: { name: 'Фитинги для дождевателей', description: 'Гибкие соединения и фитинги для монтажа дождевателей в системах полива.' },
    en: { name: 'Sprinkler Fittings', description: 'Flexible connections and fittings for installing sprinklers in irrigation systems.' },
  },
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}

function serializeInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

function plainText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value.map((block: any) => {
    if (typeof block === 'string') return block
    if (Array.isArray(block?.children)) return block.children.map((child: any) => child?.text || '').join('')
    return ''
  }).filter(Boolean).join(' ').trim()
}

function notFoundResponse(language: string | null): Response {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const copy = lang === 'ru'
    ? { title: 'Страница не найдена', body: 'Запрошенная страница не существует или была перемещена.', home: 'На главную' }
    : lang === 'en'
      ? { title: 'Page not found', body: 'The requested page does not exist or has been moved.', home: 'Go to homepage' }
      : { title: 'Страницата не е намерена', body: 'Тази страница не съществува или е преместена.', home: 'Към началната страница' }

  const html = '<!doctype html>' +
    '<html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + copy.title + ' | ' + SITE_NAME + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta name="description" content="' + escapeHtml(copy.body) + '">' +
    '<meta property="og:title" content="' + copy.title + ' | ' + SITE_NAME + '">' +
    '<meta property="og:description" content="' + escapeHtml(copy.body) + '">' +
    '<meta property="og:image" content="https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '</head><body style="margin:0;font-family:Arial,sans-serif;background:#f7f8f1;color:#263323">' +
    '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center">' +
    '<section style="max-width:560px;background:#fff;border:1px solid #e5e8db;border-radius:18px;padding:40px 28px;box-shadow:0 8px 30px #26332312">' +
    '<p style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#71824f;font-weight:700">Florial</p>' +
    '<h1 style="font-size:30px;margin:12px 0">' + copy.title + '</h1>' +
    '<p style="line-height:1.65;color:#647067">' + escapeHtml(copy.body) + '</p>' +
    '<a href="/" style="display:inline-block;margin-top:16px;padding:12px 20px;background:#53643a;color:white;border-radius:9px;text-decoration:none;font-weight:700">' + copy.home + '</a>' +
    '</section></main></body></html>'

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function unavailableResponse(language: string | null): Response {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const copy = lang === 'ru'
    ? { title: 'Каталог временно недоступен', body: 'Не удалось получить данные каталога. Пожалуйста, повторите попытку позже.' }
    : lang === 'en'
      ? { title: 'Catalogue temporarily unavailable', body: 'The catalogue could not be loaded. Please try again shortly.' }
      : { title: 'Каталогът временно не е достъпен', body: 'Данните за каталога не могат да бъдат заредени. Моля, опитайте отново след малко.' }
  const html = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + copy.title + ' | ' + SITE_NAME + '</title>' +
    '<meta name="robots" content="noindex, nofollow"></head>' +
    '<body><main><h1>' + copy.title + '</h1><p>' + copy.body + '</p><a href="/">Florial</a></main></body></html>'
  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '30',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


function blogUnavailableResponse(language: string | null): Response {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const copy = lang === 'ru'
    ? { title: 'Блог временно недоступен', body: 'Не удалось загрузить опубликованные материалы. Пожалуйста, повторите попытку позже.', home: 'На главную' }
    : lang === 'en'
      ? { title: 'Blog temporarily unavailable', body: 'Published articles could not be loaded. Please try again shortly.', home: 'Go to homepage' }
      : { title: 'Блогът временно не е достъпен', body: 'Публикуваните материали не могат да бъдат заредени. Моля, опитайте отново след малко.', home: 'Към началната страница' }
  const html = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + escapeHtml(copy.title) + ' | ' + SITE_NAME + '</title>' +
    '<meta name="robots" content="noindex, nofollow"></head>' +
    '<body><main><h1>' + escapeHtml(copy.title) + '</h1><p>' + escapeHtml(copy.body) + '</p>' +
    '<a href="' + (lang === 'bg' ? '/' : '/?lang=' + lang) + '">' + escapeHtml(copy.home) + '</a></main></body></html>'
  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '30',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getSanityRequestTag(dataset: string, cachePath: string): string {
  const family = cachePath.startsWith('homepage/')
    ? 'homepage'
    : cachePath.startsWith('blog/')
      ? 'blog'
      : cachePath.startsWith('services/')
        ? 'services'
        : cachePath.includes('category-products')
          ? 'catalogue'
          : cachePath.includes('product-detail')
            ? 'product'
            : cachePath.includes('category-tree')
              ? 'category'
              : 'content'
  return 'florial.ssr.' + family + '.' + dataset
}

const sanityQueryInFlight = new Map<string, Promise<unknown>>()

type HeaderProductionSeed = {
  equipmentCategories: any[]
  services: any[]
  siteSettings: Record<string, unknown> | null
  logo: Record<string, unknown> | null
  headerBlogPosts: any[]
}

async function fetchHeaderSeed(language: 'bg' | 'ru' | 'en'): Promise<Record<string, unknown>> {
  const productionQuery = `{
    "equipmentCategories": *[_type == "category"] | order(sortOrder asc, name asc) {
      _id, name, translations { bg { name }, ru { name }, en { name } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder, "parentId": parent->_id,
      "productCount": count(*[_type == "product" && isActive != false && defined(slug) && (category._ref == ^._id || ^._id in categories[]._ref)]),
      "imageUrl": image.asset->url,
      "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu,
      "imageTitle": image.title, "imageTitleEn": image.titleEn, "imageTitleRu": image.titleRu,
      "isPlantCategory": false
    },
    "services": *[_type == "service" && isActive != false] | order(sortOrder asc, name asc) {
      _id, name, shortDescription,
      translations { bg { name, shortDescription }, ru { name, shortDescription }, en { name, shortDescription } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder, serviceCategory, serviceLayout,
      "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
      "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
      "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
      "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu)
    },
    "siteSettings": *[_type == "siteSettings"][0] { siteName },
    "logo": *[_type == "photo" && coalesce(slug.current, slug) == "oficialno-logo-florial-gradinski-centar"][0] {
      title, titleEn, titleRu,
      "logoUrl": image.asset->url,
      "logoAlt": image.alt, "logoAltEn": image.altEn, "logoAltRu": image.altRu,
      "logoAssetTitle": image.asset->title, "logoAssetAltText": image.asset->altText,
      "logoWidth": image.asset->metadata.dimensions.width,
      "logoHeight": image.asset->metadata.dimensions.height
    },
    "headerBlogPosts": *[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc)[0...3] {
      _id, slug, publishedAt, tags,
      "cover": { "asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption },
      "translations": {
        "${language}": {
          "title": coalesce(translations.${language}.title, translations.bg.title),
          "shortDescription": coalesce(translations.${language}.shortDescription, translations.bg.shortDescription),
          "coverAlt": coalesce(translations.${language}.coverAlt, translations.bg.coverAlt)
        }
      }
    }
  }`
  const plantQuery = `
    *[_type == "category" && defined(coalesce(slug.current, slug))] | order(sortOrder asc, name asc) {
      _id, name, translations { bg { name }, ru { name }, en { name } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder, "parentId": parent->_id,
      "productCount": count(*[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false && (category._ref == ^._id || ^._id in categories[]._ref)]),
      "imageUrl": coalesce(image.asset->url, externalImageUrl),
      "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu,
      "imageTitle": image.title, "imageTitleEn": image.titleEn, "imageTitleRu": image.titleRu,
      "isPlantCategory": true
    }
  `
  const [production, plants] = await Promise.all([
    querySanityData<HeaderProductionSeed>('production', productionQuery, {}, 'header/production/shell-v1/' + language, 300),
    querySanityData<any[]>('plants', plantQuery, {}, 'header/plants/categories-v1', 300),
  ])
  if (!production || !Array.isArray(production.equipmentCategories) ||
      !Array.isArray(production.services) || !Array.isArray(production.headerBlogPosts) ||
      !Array.isArray(plants)) {
    throw new Error('Sanity header seed is incomplete')
  }
  const logo = production.logo || {}
  return {
    language,
    equipmentCategories: production.equipmentCategories,
    plantCategories: plants,
    services: production.services,
    siteSettings: {
      ...(production.siteSettings || {}),
      logoUrl: logo.logoUrl || null,
      logoAlt: logo.logoAlt || null,
      logoAltEn: logo.logoAltEn || null,
      logoAltRu: logo.logoAltRu || null,
      logoAssetTitle: logo.logoAssetTitle || null,
      logoAssetAltText: logo.logoAssetAltText || null,
      logoTitle: logo.title || null,
      logoTitleEn: logo.titleEn || null,
      logoTitleRu: logo.titleRu || null,
      logoWidth: logo.logoWidth || null,
      logoHeight: logo.logoHeight || null,
    },
    headerBlogPosts: production.headerBlogPosts,
  }
}

async function querySanityData<T>(
  dataset: string,
  query: string,
  params: Record<string, unknown>,
  cachePath: string,
  ttlSeconds: number | ((result: T) => number),
): Promise<T> {
  const cacheStorage = (globalThis as typeof globalThis & { caches?: { default?: Cache } }).caches
  const cache = cacheStorage?.default
  const cacheKey = new Request(SITE_URL + '/__edge-cache/' + cachePath, { method: 'GET' })

  if (cache) {
    try {
      const cached = await cache.match(cacheKey)
      if (cached) {
        const cachedBody = (await cached.json()) as { result?: T }
        if (cachedBody && Object.prototype.hasOwnProperty.call(cachedBody, 'result')) {
          return cachedBody.result as T
        }
      }
    } catch {
      // A cache failure must not prevent the live Sanity lookup.
    }
  }

  const inFlightKey = cachePath
  const existingRequest = sanityQueryInFlight.get(inFlightKey)
  if (existingRequest) return existingRequest as Promise<T>

  const requestPromise = (async (): Promise<T> => {
  const url = new URL('https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v' + SANITY_API_VERSION + '/data/query/' + dataset)
  url.searchParams.set('query', query)
  url.searchParams.set('perspective', 'published')
  url.searchParams.set('tag', getSanityRequestTag(dataset, cachePath))
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set('$' + key, JSON.stringify(value))
  })

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Sanity ' + dataset + ' query failed: ' + response.status)
  const body = (await response.json()) as { result?: T }
  if (!Object.prototype.hasOwnProperty.call(body, 'result')) {
    throw new Error('Sanity ' + dataset + ' query returned no result field')
  }

  const cacheTtlSeconds = typeof ttlSeconds === 'function' ? ttlSeconds(body.result as T) : ttlSeconds

  if (cache) {
    try {
      const cachedResponse = new Response(JSON.stringify({ result: body.result }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=' + cacheTtlSeconds,
        },
      })
      await cache.put(cacheKey, cachedResponse)
    } catch {
      // Cache write errors are non-fatal; the live response remains usable.
    }
  }

  return body.result as T
  })()
  sanityQueryInFlight.set(inFlightKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    if (sanityQueryInFlight.get(inFlightKey) === requestPromise) sanityQueryInFlight.delete(inFlightKey)
  }
}

async function fetchContactsHtml(language: string): Promise<{ html: string; images: Record<string, string> }> {
  const query = `
    *[_type == "photo" && (
      lower(slug) in ["florial-nesebr", "florial-ravda"] ||
      lower(slug.current) in ["florial-nesebr", "florial-ravda"]
    )] {
      "slugValue": coalesce(slug.current, slug),
      "imageUrl": image.asset->url
    }
  `
  const photos = await querySanityData<Array<{ slugValue?: string; imageUrl?: string }>>(
    'production',
    query,
    {},
    'sanity/production/contacts-location-photos-v1',
    300,
  )
  if (!Array.isArray(photos)) throw new Error('Sanity contacts photo query is not an array')
  const images: Record<string, string> = {}
  for (const photo of photos) {
    const slug = String(photo?.slugValue || '').toLowerCase()
    if (slug === 'florial-nesebr') images.nesebr = photo.imageUrl || ''
    if (slug === 'florial-ravda') images.ravda = photo.imageUrl || ''
  }
  return { html: renderContactsHtml(language, images), images }
}

type AboutPhotoDocument = {
  slugValue?: string
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
}

type AboutCategoryDocument = {
  slugValue?: string
  imageUrl?: string
}

async function fetchAboutHtml(language: 'bg' | 'ru' | 'en'): Promise<{ html: string; complete: boolean }> {
  const photoQuery = `
    *[_type == "photo" && isActive != false && (
      coalesce(slug.current, slug) in [
        "landshaften-arhitekt",
        "inzhener-polivni-sistemi",
        "gardinar",
        "specialist-trevni-ploshti"
      ] ||
      lower(slug) in ["florial-nesebr", "florial-ravda"] ||
      lower(slug.current) in ["florial-nesebr", "florial-ravda"]
    )] | order(coalesce(slug.current, slug) asc) {
      "slugValue": coalesce(slug.current, slug),
      "imageUrl": image.asset->url,
      "imageAlt": image.alt,
      "imageAltEn": image.altEn,
      "imageAltRu": image.altRu
    }
  `
  const equipmentCategoryQuery = `
    *[_type == "category" && coalesce(slug.current, slug) == "vsichko-za-polivane"] {
      "slugValue": coalesce(slug.current, slug),
      "imageUrl": image.asset->url
    }
  `
  const plantCategoryQuery = `
    *[_type == "category" && coalesce(slug.current, slug) == "rastenia"] {
      "slugValue": coalesce(slug.current, slug),
      "imageUrl": coalesce(image.asset->url, externalImageUrl)
    }
  `

  const [photosResult, equipmentResult, plantsResult] = await Promise.allSettled([
    querySanityData<AboutPhotoDocument[]>(
      'production',
      photoQuery,
      {},
      'sanity/production/about-photos-v1',
      300,
    ),
    querySanityData<AboutCategoryDocument[]>(
      'production',
      equipmentCategoryQuery,
      {},
      'sanity/production/about-equipment-category-v1',
      300,
    ),
    querySanityData<AboutCategoryDocument[]>(
      'plants',
      plantCategoryQuery,
      {},
      'sanity/plants/about-plant-category-v1',
      300,
    ),
  ])

  const photos = photosResult.status === 'fulfilled' && Array.isArray(photosResult.value)
    ? photosResult.value
    : []
  const equipmentCategories = equipmentResult.status === 'fulfilled' && Array.isArray(equipmentResult.value)
    ? equipmentResult.value
    : []
  const plantCategories = plantsResult.status === 'fulfilled' && Array.isArray(plantsResult.value)
    ? plantsResult.value
    : []
  const categories = [...equipmentCategories, ...plantCategories]
  const requiredPhotoSlugs = [
    'landshaften-arhitekt',
    'inzhener-polivni-sistemi',
    'gardinar',
    'specialist-trevni-ploshti',
    'florial-nesebr',
    'florial-ravda',
  ]
  const hasSafeSanityImage = (value?: string) =>
    typeof value === 'string' && /^https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/(?:production|plants)\//.test(value)
  const availablePhotoSlugs = new Set(photos.filter((photo) => hasSafeSanityImage(photo.imageUrl)).map((photo) => String(photo.slugValue || '').toLowerCase()))
  const availableCategorySlugs = new Set(categories.filter((category) => hasSafeSanityImage(category.imageUrl)).map((category) => String(category.slugValue || '').toLowerCase()))
  const complete =
    photosResult.status === 'fulfilled' && Array.isArray(photosResult.value) &&
    equipmentResult.status === 'fulfilled' && Array.isArray(equipmentResult.value) &&
    plantsResult.status === 'fulfilled' && Array.isArray(plantsResult.value) &&
    requiredPhotoSlugs.every((slug) => availablePhotoSlugs.has(slug)) &&
    availableCategorySlugs.has('vsichko-za-polivane') &&
    availableCategorySlugs.has('rastenia')

  if (!complete) {
    console.error('Florial About SSR Sanity data incomplete; rendering published text with available image fallbacks')
  }

  const copy = ABOUT_PAGE_CONTENT[language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg']
  return {
    html: renderAboutHtml(copy, {
      photos,
      categories,
      team: ABOUT_PAGE_TEAM,
      centres: ABOUT_PAGE_CENTRES,
    }, language),
    complete,
  }
}

async function fetchCategoryProducts(dataset: 'production' | 'plants', categoryId: string, onCategoryTree?: (categories: SeoCategoryNode[]) => void): Promise<SeoPlantProduct[]> {
  const categoryQuery = '*[_type == "category"] | order(sortOrder asc) {_id,name,translations{bg{name},ru{name},en{name}},"parentId":parent->_id,"slugValue":coalesce(slug.current,slug),sortOrder,"productCount":count(*[_type == "product" && isActive != false && defined(slug) && (category._ref == ^._id || ^._id in categories[]._ref)]),"imageUrl":coalesce(image.asset->url,externalImageUrl),"imageAlt":image.alt,"imageAltEn":image.altEn,"imageAltRu":image.altRu,"imageTitle":image.title,"imageTitleEn":image.titleEn,"imageTitleRu":image.titleRu}'
  const categories = await querySanityData<SeoCategoryNode[]>(
    dataset,
    categoryQuery,
    {},
    'sanity/' + dataset + '/category-tree-v4',
    300,
  )
  if (!Array.isArray(categories)) throw new Error('Sanity ' + dataset + ' category tree is not an array')
  onCategoryTree?.(categories)

  const categoryIds = collectDescendantCategoryIds(categoryId, categories)
  const plantFilter = dataset === 'plants'
    ? 'productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] &&'
    : ''
  const productQuery = `
    *[
      _type == "product" &&
      ${plantFilter}
      isActive != false &&
      defined(slug.current) &&
      references($categoryIds)
    ] | order(sortOrder asc) {
      _id,
      name,
      translations { bg { name, shortDescription }, ru { name, shortDescription, seo { h1 } }, en { name, shortDescription, seo { h1 } } },
      seo { h1 },
      "slugValue": slug.current,
      "categoryId": category->_id,
      "categoryIds": categories[]._ref,
      sku,
      "imageUrl": mainImage.asset->url,
      "galleryImageUrls": gallery[].asset->url,
      plantCare { minWinterTempC },
      priceEUR,
      stockStatus,
      saleVariants[] { _key, name, nameEn, nameRu, sku, priceEUR, oldPriceEUR, stockStatus, stockQuantity, saleHeightCm, containerVolumeL }
    }
  `
  const products = await querySanityData<SeoPlantProduct[]>(
    dataset,
    productQuery,
    { categoryIds },
    'sanity/' + dataset + '/category-products-v2/' + encodeURIComponent(categoryId),
    30,
  )
  if (!Array.isArray(products)) throw new Error('Sanity ' + dataset + ' category products is not an array')
  return products
}

async function fetchPlantCategoryProducts(categoryId: string, onCategoryTree?: (categories: SeoCategoryNode[]) => void): Promise<SeoPlantProduct[]> {
  return fetchCategoryProducts('plants', categoryId, onCategoryTree)
}

async function queryDocument(dataset: string, type: string, slug: string): Promise<SeoDocument | null> {
  const query = '*[_type == $type && (slug.current == $slug || slug == $slug || _id == $slug) && (!defined(isActive) || isActive != false) && ($type != "blogPost" || isPublished == true)][0]{_id,name,title,"slugValue":coalesce(slug.current,slug,_id),shortDescription,description,priceEUR,productType,saleVariants[]{priceEUR,stockStatus,name},serviceCategory,sku,stockStatus,publishedAt,_updatedAt,isPublished,"coverUrl":cover.asset->url,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,imageUrl,externalImageUrl,cover.asset->url),"brandName":brand->name,seo,seoContent,helpBlock,translations}'
  const result = await querySanityData<SeoDocument | null>(
    dataset,
    query,
    { type, slug },
    'sanity/' + (type === 'category' ? 'category-document-v2/' : '') + encodeURIComponent(dataset) + '/' +
      encodeURIComponent(type) + '/' + encodeURIComponent(slug),
    (document) => document ? 300 : 60,
  )

  return result ? { ...result, _dataset: dataset } : null
}
type PlantProductDocument = SeoDocument & {
  scientificName?: string
  vatIncluded?: boolean
  mainImage?: { asset?: { url?: string; metadata?: { dimensions?: { width?: number; height?: number } } }; alt?: string; altEn?: string; altRu?: string }
  gallery?: Array<{ _key?: string; asset?: { url?: string }; alt?: string; altEn?: string; altRu?: string }>
  plantCare?: Record<string, any>
  careGuide?: unknown[]
  recommendedIrrigation?: { irrigationType?: string; productSlug?: string }
  relatedContentBySlug?: Array<{ contentType?: string; slug?: string; label?: string }>
  category?: { _id?: string; name?: string; slugValue?: string; translations?: Record<string, { name?: string } | undefined> }
  saleVariants?: Array<{ _key?: string; name?: string; nameEn?: string; nameRu?: string; sku?: string; priceEUR?: number; oldPriceEUR?: number; stockStatus?: string; stockQuantity?: number; saleHeightCm?: number; containerVolumeL?: number }>
}

async function queryPlantProductDocument(slug: string): Promise<PlantProductDocument | null> {
  const query = `
    *[
      _type == "product" &&
      productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] &&
      isActive != false &&
      (coalesce(slug.current, slug) == $slug || _id == $slug)
    ][0] {
      _id, name, sku, productType, scientificName, shortDescription, description, careGuide,
      plantCare, recommendedIrrigation, relatedContentBySlug,
      priceEUR, oldPriceEUR, vatIncluded, stockStatus,
      "slugValue": coalesce(slug.current, slug, _id),
      "imageUrl": mainImage.asset->url,
      mainImage { asset->{url, metadata{dimensions{width,height}}}, alt, altEn, altRu, hotspot, crop },
      gallery[] { _key, asset->{url, metadata{dimensions{width,height}}}, alt, altEn, altRu, hotspot, crop },
      saleVariants[] { _key, name, nameEn, nameRu, sku, priceEUR, oldPriceEUR, stockStatus, stockQuantity, saleHeightCm, containerVolumeL },
      seo { h1, metaTitle, metaDescription, noIndex },
      translations {
        bg { name, shortDescription, description, careGuide, seo { h1, metaTitle, metaDescription, noIndex } },
        ru { name, shortDescription, description, careGuide, seo { h1, metaTitle, metaDescription, noIndex } },
        en { name, shortDescription, description, careGuide, seo { h1, metaTitle, metaDescription, noIndex } }
      },
      "category": category->{ _id, name, "slugValue": coalesce(slug.current, slug), translations { bg { name }, ru { name }, en { name } } }
    }
  `
  const result = await querySanityData<PlantProductDocument | null>(
    'plants',
    query,
    { slug },
    'sanity/plants/plant-product-detail-v1/' + encodeURIComponent(slug),
    60,
  )
  return result ? { ...result, _dataset: 'plants' } : null
}

async function queryEquipmentProductDocument(slug: string): Promise<EquipmentProductDocument | null> {
  const query = `
    *[
      _type == "product" &&
      isActive != false &&
      (coalesce(slug.current, slug) == $slug || _id == $slug)
    ][0] {
      _id, name, sku, priceEUR, oldPriceEUR, vatIncluded, stockStatus, stockQuantity, weightKg,
      "slugValue": coalesce(slug.current, slug, _id),
      "brandName": brand->name,
      shortDescription, description, seo,
      translations {
        bg { name, shortDescription, description, formattedDescription, seo },
        ru { name, shortDescription, description, formattedDescription, seo },
        en { name, shortDescription, description, formattedDescription, seo }
      },
      "imageUrl": coalesce(mainImage.asset->url, image.asset->url, category->image.asset->url, category->externalImageUrl, category->parent->image.asset->url, category->parent->externalImageUrl),
      "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
      "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
      "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
      "galleryImages": gallery[] { _key, "url": asset->url, alt, altEn, altRu },
      specifications[] { _key, name, value, unit, translations },
      compatibility,
      "manualPDFUrl": manualPDF.asset->url,
      "catalogPDFUrl": catalogPDF.asset->url,
      "categoryId": category->_id,
      "categoryIds": categories[]._ref,
      "relatedProducts": relatedProducts[]-> {
        _id, name, translations { bg { name }, ru { name }, en { name } },
        "slugValue": coalesce(slug.current, slug, _id),
        sku, priceEUR, oldPriceEUR, stockStatus,
        "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
        "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
        "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
        "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name)
      },
      "relatedContent": relatedContent[]-> {
        _id, _type, name, title, translations,
        "slugValue": coalesce(slug.current, slug, _id),
        shortDescription, isActive, isPublished,
        "imageUrl": coalesce(image.asset->url, cover.asset->url, hero.image.asset->url),
        "imageAlt": coalesce(image.alt, cover.alt, name, translations.bg.title, title),
        "imageAltEn": coalesce(image.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
        "imageAltRu": coalesce(image.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
      },
      "kitComponents": kitComponents[] {
        _key, quantity, unit, note { bg, ru, en },
        "product": product-> {
          _id, name, translations { bg { name }, ru { name }, en { name } },
          "slugValue": coalesce(slug.current, slug, _id),
          sku, isActive
        }
      }
    }
  `
  const result = await querySanityData<EquipmentProductDocument | null>(
    'production',
    query,
    { slug },
    'sanity/production/equipment-product-detail-v1/' + encodeURIComponent(slug),
    60,
  )
  return result ? { ...result, _dataset: 'production' } : null
}

async function fetchEquipmentProductCategoryTree(): Promise<SeoCategoryNode[]> {
  const query = `
    *[_type == "category"] {
      _id, name, translations { bg { name }, ru { name }, en { name } },
      "parentId": parent->_id,
      "slugValue": coalesce(slug.current, slug)
    }
  `
  const result = await querySanityData<SeoCategoryNode[]>(
    'production',
    query,
    {},
    'sanity/production/product-category-tree-v1',
    300,
  )
  if (!Array.isArray(result)) throw new Error('Sanity production product category tree is not an array')
  return result
}

async function queryServiceDocument(slug: string): Promise<ServiceDetailDocument | null> {
  const query = `
    *[
      _type == "service" &&
      isActive != false &&
      (coalesce(slug.current, slug) == $slug || _id == $slug)
    ][0] {
      _id, name,
      "slugValue": coalesce(slug.current, slug, _id),
      shortDescription, description, startingPriceEUR, serviceCategory, serviceLayout,
      "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
      "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
      "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
      "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu),
      "imageLinkUrl": coalesce(image.linkUrl, mainImage.linkUrl),
      hero {
        title, subtitle,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt,
        "imageAltEn": image.altEn,
        "imageAltRu": image.altRu,
        "imageLinkUrl": image.linkUrl
      },
      "galleryImages": gallery[] { _key, "url": asset->url, alt, altEn, altRu, linkUrl },
      contentBlocks[] {
        _key, title, text, imagePosition,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu,
        "imageLinkUrl": image.linkUrl,
        "translations": {
          "ru": { "title": translations.ru.title, "text": translations.ru.text, "imageAlt": translations.ru.imageAlt },
          "en": { "title": translations.en.title, "text": translations.en.text, "imageAlt": translations.en.imageAlt }
        }
      },
      "relatedContent": relatedContent[]->{
        _id, _type, name, title,
        "translations": {
          "ru": { "name": translations.ru.name, "title": translations.ru.title, "shortDescription": translations.ru.shortDescription },
          "en": { "name": translations.en.name, "title": translations.en.title, "shortDescription": translations.en.shortDescription }
        },
        "slug": { "current": coalesce(slug.current, slug) },
        shortDescription, isActive, isPublished,
        "imageUrl": coalesce(image.asset->url, mainImage.asset->url, cover.asset->url, hero.image.asset->url),
        "imageAlt": coalesce(image.alt, mainImage.alt, cover.alt, name, translations.bg.title, title),
        "imageAltEn": coalesce(image.altEn, mainImage.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
        "imageAltRu": coalesce(image.altRu, mainImage.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
      },
      advantages[] { _key, title, text },
      steps[] { _key, stepNumber, title, text },
      callToAction { title, text, buttonLabel, buttonText },
      leadForm {
        title, submitLabel, successMessage,
        "fields": fields[] { _key, name, type, label, placeholder, required }
      },
      seo { metaTitle, metaDescription, noIndex, keywords },
      "translations": {
        "ru": {
          name, shortDescription, description,
          hero { title, subtitle },
          advantages[] { _key, title, text },
          steps[] { _key, stepNumber, title, text },
          callToAction { title, text, buttonLabel, buttonText },
          leadForm {
            title, submitLabel, successMessage,
            "fields": fields[] { _key, name, type, label, placeholder, required }
          },
          seo { metaTitle, metaDescription, noIndex, keywords }
        },
        "en": {
          name, shortDescription, description,
          hero { title, subtitle },
          advantages[] { _key, title, text },
          steps[] { _key, stepNumber, title, text },
          callToAction { title, text, buttonLabel, buttonText },
          leadForm {
            title, submitLabel, successMessage,
            "fields": fields[] { _key, name, type, label, placeholder, required }
          },
          seo { metaTitle, metaDescription, noIndex, keywords }
        }
      }
    }
  `
  const service = await querySanityData<ServiceDetailDocument | null>(
    'production', query, { slug }, 'services/detail-v1/' + encodeURIComponent(slug), 60,
  )
  return service ? { ...service, _dataset: 'production' } : null
}

function hasTranslation(doc: SeoDocument, type: string, language: string): boolean {
  if (language === 'bg') return true
  const translated = doc.translations?.[language]
  if (type === 'blogPost') return Boolean(translated?.title && translated?.shortDescription && translated?.seoTitle && translated?.seoDescription)
  if (!translated?.name || translated.seo?.noIndex === true) return false
  if (type === 'category') {
    const fallback = categoryFallbacks[doc.slugValue || '']?.[language as 'ru' | 'en']
    return Boolean((translated.name || fallback?.name) && (translated.description || fallback?.description) && translated.seo?.noIndex !== true)
  }
  if (type === 'product' || type === 'service') {
    return Boolean(translated.shortDescription && translated.seo?.noIndex !== true)
  }
  return Boolean(translated.seo?.metaTitle && translated.seo?.metaDescription)
}

function setMetaTag(html: string, attribute: string, name: string, content: string): string {
  let found = false
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (tag.includes(attribute + '="' + name + '"') || tag.includes(attribute + "='" + name + "'")) {
      found = true
      return '<meta ' + attribute + '="' + name + '" content="' + escapeHtml(content) + '" />'
    }
    return tag
  })
  if (found) return next
  return next.replace(/<\/head>/i, '<meta ' + attribute + '="' + name + '" content="' + escapeHtml(content) + '" />\n</head>')
}

function setCanonical(html: string, canonical: string): string {
  const tag = '<link rel="canonical" href="' + escapeHtml(canonical) + '" />'
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag)
  }
  return html.replace(/<\/head>/i, tag + '\n</head>')
}

function setPageHead(
  sourceHtml: string,
  options: {
    language: string
    title: string
    description: string
    canonical: string
    image?: string
    noIndex?: boolean
    alternates?: Record<string, string>
    structuredData?: Array<{ id: string; data: Record<string, unknown> }>
    pageType?: string
  },
): string {
  let html = sourceHtml
  if (options.pageType === 'product' || options.pageType === 'equipment-product' || options.pageType === 'blog' || options.pageType === 'article' || options.pageType === 'service' || options.pageType === 'about') {
    const resourceHints = options.pageType === 'blog' || options.pageType === 'article'
      ? [
          '<link rel="preconnect" href="https://cdn.sanity.io" crossorigin />',
          '<link rel="preconnect" href="https://bxvcy0qs.apicdn.sanity.io" crossorigin />',
        ]
      : [
          '<link rel="preconnect" href="https://cdn.sanity.io" crossorigin />',
          '<link rel="preconnect" href="https://bxvcy0qs.api.sanity.io" crossorigin />',
          '<link rel="preconnect" href="https://bxvcy0qs.apicdn.sanity.io" crossorigin />',
        ]
    html = html.replace(/<\/head>/i, resourceHints.join('\n') + '\n</head>')
  }
  if ((options.pageType === 'article' || options.pageType === 'service' || options.pageType === 'equipment-product' || options.pageType === 'product') && options.image) {
    const preload = renderResponsiveSanityImagePreload(options.image, options.pageType === 'equipment-product' ? '(min-width: 768px) 50vw, 100vw' : undefined)
    if (preload && !/<link\b[^>]*rel=["']preload["'][^>]*as=["']image["']/i.test(html)) {
      html = html.replace(/<\/head>/i, preload + '\n</head>')
    }
  }
  html = html.replace(/<html\b[^>]*>/i, (tag) => {
    if (/\blang=["'][^"']*["']/i.test(tag)) return tag.replace(/\blang=["'][^"']*["']/i, 'lang="' + options.language + '"')
    return tag.replace(/>$/, ' lang="' + options.language + '">')
  })
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(options.title) + '</title>')
  html = setMetaTag(html, 'name', 'description', options.description)
  html = setMetaTag(html, 'name', 'robots', options.noIndex ? 'noindex, nofollow' : 'index, follow')
  html = setMetaTag(html, 'property', 'og:title', options.title)
  html = setMetaTag(html, 'property', 'og:description', options.description)
  html = setMetaTag(html, 'property', 'og:type', options.pageType === 'service' || options.pageType === 'about' ? 'website' : options.pageType || 'website')
  html = setMetaTag(html, 'property', 'og:url', options.canonical)
  html = setMetaTag(html, 'property', 'og:locale', options.language === 'ru' ? 'ru_RU' : options.language === 'en' ? 'en_US' : 'bg_BG')
  html = setMetaTag(html, 'property', 'og:image', options.image || 'https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png')
  const defaultLogoAlt = options.language === 'ru'
    ? 'Официальный логотип Florial — садовый центр и магазин оборудования для автоматического полива'
    : options.language === 'en'
      ? 'Official Florial logo — garden centre and automatic irrigation store'
      : 'Официално лого на Florial — градински център и магазин за автоматично напояване'
  html = setMetaTag(html, 'property', 'og:image:alt', options.image ? options.title : defaultLogoAlt)
  if (options.image) {
    html = html.replace(/<meta\b[^>]*property=["']og:image:(width|height)["'][^>]*>/gi, '')
  } else {
    html = setMetaTag(html, 'property', 'og:image:width', '1547')
    html = setMetaTag(html, 'property', 'og:image:height', '581')
  }
  html = setMetaTag(html, 'name', 'twitter:card', 'summary_large_image')
  html = setMetaTag(html, 'name', 'twitter:image', options.image || 'https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png')
  html = setMetaTag(html, 'name', 'twitter:title', options.title)
  html = setMetaTag(html, 'name', 'twitter:description', options.description)
  html = setCanonical(html, options.canonical)
  html = html.replace(/<link\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=)[^>]*>/gi, '')
  html = html.replace(/<script\b(?=[^>]*data-florial-jsonld=)[^>]*>[\s\S]*?<\/script>/gi, '')

  const additions: string[] = []
  Object.entries(options.alternates || {}).forEach(([language, href]) => {
    additions.push('<link rel="alternate" hreflang="' + escapeHtml(language) + '" href="' + escapeHtml(href) + '" />')
  })
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE_URL + '/#organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 1547,
      height: 581,
    },
    areaServed: { '@type': 'Country', name: 'Bulgaria' },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      merchantReturnLink: SITE_URL + '/terms',
    },
  }
  const structured = options.structuredData || []
  structured.forEach((entry) => {
    const json = JSON.stringify(entry.data).replace(/</g, '\\u003c')
    additions.push('<script type="application/ld+json" data-florial-jsonld="' + escapeHtml(entry.id) + '">' + json + '</script>')
  })
  if (!structured.some((entry) => entry.id === 'organization')) {
    additions.push('<script type="application/ld+json" data-florial-jsonld="organization">' + JSON.stringify(organization).replace(/</g, '\\u003c') + '</script>')
  }
  if (additions.length) html = html.replace(/<\/head>/i, additions.join('\n') + '\n</head>')
  return html
}

function renderRoot(html: string, body: string): string {
  return html.replace(/<div id="root"><\/div>/i, '<div id="root">' + body + '</div>')
}

async function transformHtmlResponse(response: Response, transform: (html: string) => string, cacheControl = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'): Promise<Response> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') || response.status !== 200) return response
  const html = transform(await response.text())
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('content-encoding')
  headers.delete('etag')
  headers.set('Cache-Control', cacheControl)
  return new Response(html, { status: response.status, statusText: response.statusText, headers })
}

const HOMEPAGE_PINNED_SLUGS = [
  'podroben-landshaften-proekt-gradina',
  'cena-sistema-avtomatichno-napoyavane-burgas',
]

function homepageBlogProjection(language: string): string {
  return ' { _id, slug, publishedAt, tags, "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption}, "translations": {"' +
    language + '": {"title": coalesce(translations.' + language + '.title, translations.bg.title), "shortDescription": coalesce(translations.' +
    language + '.shortDescription, translations.bg.shortDescription), "coverAlt": coalesce(translations.' + language +
    '.coverAlt, translations.bg.coverAlt)}} }'
}

async function fetchHomepageHtml(language: string): Promise<{ html: string; payload: Record<string, unknown> }> {
  const equipmentCategoryQuery = `
    *[_type == "category"] | order(sortOrder asc) {
      _id, name, translations { bg { name }, ru { name }, en { name } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder, "parentId": parent->_id,
      "productCount": count(*[_type == "product" && isActive != false && defined(slug) &&
        (category._ref == ^._id || ^._id in categories[]._ref)]),
      "imageUrl": image.asset->url,
      "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu,
      "imageTitle": image.title, "imageTitleEn": image.titleEn, "imageTitleRu": image.titleRu
    }
  `
  const plantCategoryQuery = `
    *[_type == "category" && defined(coalesce(slug.current, slug))] | order(sortOrder asc, name asc) {
      _id,
      name,
      translations { bg { name }, ru { name }, en { name } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder,
      "parentId": parent->_id,
      "productCount": count(*[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false && (category._ref == ^._id || ^._id in categories[]._ref)]),
      "imageUrl": coalesce(image.asset->url, externalImageUrl),
      "imageAlt": image.alt,
      "imageAltEn": image.altEn,
      "imageAltRu": image.altRu,
      "imageTitle": image.title,
      "imageTitleEn": image.titleEn,
      "imageTitleRu": image.titleRu,
      "isPlantCategory": true
    }
  `
  const featuredPlantsQuery = `
    *[_type == "product" && !(_id in path("drafts.**")) &&
      productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] &&
      isActive != false && isFeatured == true &&
      defined(coalesce(slug.current, slug)) && defined(mainImage.asset)] | order(sortOrder asc, name asc)[0...8] {
        _id, name, productType, scientificName,
        "slug": { "current": coalesce(slug.current, slug) },
        translations { bg { name }, ru { name, seo { h1 } }, en { name, seo { h1 } } },
        seo { h1 },
        priceEUR, vatIncluded, stockStatus,
        saleVariants[]{_key, name, nameEn, nameRu, priceEUR, stockStatus, stockQuantity, saleHeightCm, containerVolumeL},
        "imageUrl": mainImage.asset->url,
        "imageAlt": mainImage.alt, "imageAltEn": mainImage.altEn, "imageAltRu": mainImage.altRu
      }
  `
  const featuredEquipmentQuery = `
    *[_type == "product" && isActive != false && references("6709cd41-18c6-4c5f-bc27-90d55d685dec") &&
      stockStatus != "outOfStock" && defined(coalesce(slug.current, slug)) &&
      defined(mainImage.asset) && defined(priceEUR) && priceEUR > 0] | order(priceEUR asc, name asc)[0...20] {
        _id, name,
        "slug": { "current": coalesce(slug.current, slug) },
        translations { bg { name }, ru { name }, en { name } },
        priceEUR, vatIncluded, stockStatus,
        "imageUrl": mainImage.asset->url,
        "imageAlt": mainImage.alt, "imageAltEn": mainImage.altEn, "imageAltRu": mainImage.altRu
      }
  `
  const serviceQuery = `
    *[_type == "service" && isActive != false] | order(sortOrder asc, name asc) {
      _id, name, shortDescription,
      translations { bg { name, shortDescription }, ru { name, shortDescription }, en { name, shortDescription } },
      "slug": { "current": coalesce(slug.current, slug) },
      sortOrder, serviceCategory, serviceLayout,
      "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
      "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
      "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
      "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu)
    }
  `
  const heroQuery = `
    *[_type == "photo" && slug == "florial-homepage-hero-background" && isActive == true][0] {
      "imageUrl": image.asset->url
    }
  `
  const headerSettingsQuery = `{
    "siteName": *[_type == "siteSettings"][0].siteName,
    "logo": *[_type == "photo" && coalesce(slug.current, slug) == "oficialno-logo-florial-gradinski-centar"][0] {
      title, titleEn, titleRu,
      "logoUrl": image.asset->url,
      "logoAlt": image.alt, "logoAltEn": image.altEn, "logoAltRu": image.altRu,
      "logoAssetTitle": image.asset->title, "logoAssetAltText": image.asset->altText,
      "logoWidth": image.asset->metadata.dimensions.width,
      "logoHeight": image.asset->metadata.dimensions.height
    }
  }`
  const blogProjection = homepageBlogProjection(language)
  const pinnedQuery = '*[_type == "blogPost" && isPublished == true && defined(publishedAt) && slug.current in $slugs]' + blogProjection
  const latestQuery = '*[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc)[0...10]' + blogProjection

  const [
    equipmentCategories,
    plantCategories,
    featuredPlants,
    featuredEquipment,
    services,
    hero,
    pinnedPosts,
    latestPosts,
    headerSettings,
  ] = await Promise.all([
    querySanityData<any[]>('production', equipmentCategoryQuery, {}, 'homepage/equipment-categories-v1', 300),
    querySanityData<any[]>('plants', plantCategoryQuery, {}, 'homepage/plant-categories-v2', 300),
    querySanityData<any[]>('plants', featuredPlantsQuery, {}, 'homepage/featured-plants-v1', 30),
    querySanityData<any[]>('production', featuredEquipmentQuery, {}, 'homepage/featured-equipment-v1', 30),
    querySanityData<any[]>('production', serviceQuery, {}, 'homepage/services-v1', 60),
    querySanityData<{ imageUrl?: string } | null>('production', heroQuery, {}, 'homepage/hero-v1', 300),
    querySanityData<any[]>('production', pinnedQuery, { slugs: HOMEPAGE_PINNED_SLUGS }, 'homepage/blog-pinned-' + language + '-v1', 60),
    querySanityData<any[]>('production', latestQuery, {}, 'homepage/blog-latest-' + language + '-v1', 60),
    querySanityData<any>('production', headerSettingsQuery, {}, 'homepage/header-settings-v1', 300),
  ])

  const collections = [
    equipmentCategories, plantCategories, featuredPlants, featuredEquipment,
    services, pinnedPosts, latestPosts,
  ]
  if (collections.some((items) => !Array.isArray(items))) {
    throw new Error('Homepage Sanity query returned an invalid collection')
  }

  const pinnedBySlug = new Map(pinnedPosts.map((post) => [post.slug?.current || post.slug, post]))
  const orderedPinnedPosts = HOMEPAGE_PINNED_SLUGS.flatMap((slug) => {
    const post = pinnedBySlug.get(slug)
    return post ? [post] : []
  })

  if (!headerSettings || typeof headerSettings !== 'object') {
    throw new Error('Homepage header settings query returned an invalid result')
  }

  const logo = (headerSettings as any).logo || {}
  const headerSiteSettings = {
    siteName: (headerSettings as any).siteName || null,
    logoUrl: logo.logoUrl || null,
    logoAlt: logo.logoAlt || null,
    logoAltEn: logo.logoAltEn || null,
    logoAltRu: logo.logoAltRu || null,
    logoAssetTitle: logo.logoAssetTitle || null,
    logoAssetAltText: logo.logoAssetAltText || null,
    logoTitle: logo.title || null,
    logoTitleEn: logo.titleEn || null,
    logoTitleRu: logo.titleRu || null,
    logoWidth: logo.logoWidth || null,
    logoHeight: logo.logoHeight || null,
  }

  const html = renderHomepageHtml({
    equipmentCategories,
    plantCategories,
    featuredPlants,
    featuredEquipment,
    serviceEntries: getOrderedServiceEntries(services as any[]),
    heroImageUrl: hero?.imageUrl || null,
    pinnedPosts: orderedPinnedPosts,
    latestPosts,
  }, language)

  return {
    html,
    payload: {
      language,
      equipmentCategories,
      plantCategories,
      featuredPlants,
      featuredEquipment,
      services,
      heroImageUrl: hero?.imageUrl || null,
      pinnedPosts: orderedPinnedPosts,
      latestPosts,
      headerSiteSettings,
    },
  }
}

function staticPageMetadata(path: string, language: string) {
  if (path === '/about') {
    const copy = ABOUT_PAGE_CONTENT[language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg']
    return {
      title: copy.seoTitle,
      description: copy.seoDescription,
      body: '<main><h1>' + escapeHtml(copy.title) + '</h1><p>' + escapeHtml(copy.intro) + '</p></main>',
    }
  }
  if (path === '/contacts') {
    if (language === 'ru') return {
      title: 'Контакты Florial — садовые центры в Несебре и Равде',
      description: 'Адреса и контакты садовых центров Florial в Несебре и Равде, Болгария. Растения, оборудование для полива и услуги по озеленению.',
      body: '<main><h1>Контакты Florial</h1><p>Свяжитесь с нами по вопросам растений, оборудования для автоматического полива и ландшафтных услуг в Болгарии.</p></main>',
    }
    if (language === 'en') return {
      title: 'Contact Florial — Garden Centres in Nessebar & Ravda',
      description: 'Find Florial garden centre locations in Nessebar and Ravda, Bulgaria. Contact us about plants, irrigation equipment and landscaping services.',
      body: '<main><h1>Contact Florial</h1><p>Contact us about plants, automatic irrigation equipment and landscaping services in Bulgaria.</p></main>',
    }
    return {
      title: 'Контакти Florial — градински центрове в Несебър и Равда',
      description: 'Адреси и контакти на градинските центрове Florial в Несебър и Равда. Растения, оборудване за напояване и услуги по озеленяване.',
      body: '<main><h1>Контакти Florial</h1><p>Свържете се с нас за растения, оборудване за автоматично напояване и услуги по озеленяване в България.</p></main>',
    }
  }
  if (language === 'ru') return {
    title: 'Florial — садовый центр и магазин систем автополива в Болгарии',
    description: 'Растения, оборудование для автоматического полива, ландшафтный дизайн и озеленение в Несебре, Равде, Солнечном Береге и Бургасе.',
    body: '<main><h1>Florial — садовый центр и магазин автополива</h1><p>Растения, оборудование для автоматического полива и услуги по озеленению в Болгарии.</p></main>',
  }
  if (language === 'en') return {
    title: 'Florial — Garden Centre & Irrigation Shop in Bulgaria',
    description: 'Plants, automatic irrigation equipment, landscape design and gardening services in Nessebar, Ravda, Sunny Beach and Burgas.',
    body: '<main><h1>Florial — Garden Centre & Irrigation Shop</h1><p>Plants, automatic irrigation equipment, landscape design and gardening services in Bulgaria.</p></main>',
  }
  return {
    title: 'Florial — градински център и системи за напояване',
    description: 'Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в Несебър, Равда, Слънчев бряг и Бургас.',
    body: '<main><h1>Градински център Флориал</h1><p>Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в България.</p></main>',
  }
}

function localizedRouteUrl(path: string, language: string): string {
  return SITE_URL + path + (language === 'ru' || language === 'en' ? '?lang=' + language : '')
}

function renderResponsiveProductImage(imageUrl: string, alt: string): string {
  let src = imageUrl
  let srcSet = ''
  let dimensions = ''

  try {
    const source = new URL(imageUrl)
    const imageDimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (source.protocol === 'https:' && source.hostname === 'cdn.sanity.io' &&
      /^\/images\/[^/]+\/[^/]+\//.test(source.pathname) && imageDimensions) {
      const sourceWidth = Number(imageDimensions[1])
      const sourceHeight = Number(imageDimensions[2])
      const buildUrl = (width: number) => {
        const image = new URL(source)
        image.searchParams.set('w', String(Math.min(width, sourceWidth)))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', '75')
        return image.toString()
      }
      const candidates = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
        .map((width) => Math.min(width, sourceWidth))
        .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
        .sort((a, b) => a - b)
      src = buildUrl(1200)
      srcSet = candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', ')
      dimensions = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
    }
  } catch {
    // Keep a valid original image URL if it is not a standard Sanity CDN asset.
  }

  const responsive = srcSet
    ? ' srcset="' + escapeHtml(srcSet) + '" sizes="(min-width: 1024px) 50vw, 100vw"'
    : ''
  return '<img src="' + escapeHtml(src) + '"' + responsive + dimensions +
    ' alt="' + escapeHtml(alt) + '" loading="eager" fetchpriority="high" decoding="async"' +
    ' style="max-width:100%;height:auto;max-height:360px;object-fit:contain" />'
}

function renderResponsiveSanityImagePreload(imageUrl: string, sizes = '(min-width: 896px) 864px, calc(100vw - 2rem)'): string {
  try {
    const source = new URL(imageUrl)
    const dimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (source.protocol !== 'https:' || source.hostname !== 'cdn.sanity.io' ||
      !/^\/images\/[^/]+\/[^/]+\//.test(source.pathname) || !dimensions) return ''

    const sourceWidth = Number(dimensions[1])
    const buildUrl = (width: number) => {
      const image = new URL(source)
      image.searchParams.set('w', String(Math.min(width, sourceWidth)))
      image.searchParams.set('fit', 'max')
      image.searchParams.set('auto', 'format')
      image.searchParams.set('q', '68')
      return image.toString()
    }
    const candidates = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
      .map((width) => Math.min(width, sourceWidth))
      .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
      .sort((a, b) => a - b)
    const srcSet = candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', ')
    return '<link rel="preload" as="image" href="' + escapeHtml(buildUrl(960)) +
      '" imagesrcset="' + escapeHtml(srcSet) +
      '" imagesizes="' + escapeHtml(sizes) + '" fetchpriority="high" />'
  } catch {
    return ''
  }
}

function renderPlantCategoryNavigation(categories: SeoCategoryNode[], currentId: string, language: string): string {
  const children = (Array.isArray(categories) ? categories : [])
    .filter((category) => category.parentId === currentId && category.slugValue)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || String(a.name || '').localeCompare(String(b.name || ''), language))
  if (!children.length) return ''
  const heading = language === 'ru' ? 'Категории растений' : language === 'en' ? 'Plant categories' : 'Категории растения'
  const cards = children.map((category) => {
    const name = category.translations?.[language]?.name || category.name || category.slugValue || ''
    const alt = language === 'ru' ? category.imageAltRu : language === 'en' ? category.imageAltEn : category.imageAlt
    const image = category.imageUrl
      ? '<img src="' + escapeHtml(category.imageUrl) + '" alt="' + escapeHtml(alt || name) + '" loading="lazy" decoding="async" style="width:100%;height:112px;object-fit:cover;border-radius:8px" />'
      : ''
    const url = SITE_URL + '/category/' + encodeURIComponent(category.slugValue!)
    return '<li><a href="' + escapeHtml(url) + '" style="display:block;border:1px solid #e5e7eb;border-radius:12px;padding:10px;text-decoration:none;color:inherit">' +
      image + '<h2 style="font-size:15px;margin:8px 0 0">' + escapeHtml(name) + '</h2></a></li>'
  }).join('')
  return '<section data-florial-server-category-navigation="plants" style="margin:24px 0"><h2>' + heading + '</h2><ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;list-style:none;padding:0">' + cards + '</ul></section>'
}

function documentBody(doc: SeoDocument, type: string, name: string, description: string, language: 'bg' | 'ru' | 'en', h1 = name, plantProducts?: SeoPlantProduct[], equipmentProducts?: SeoPlantProduct[], equipmentCategoryTree?: SeoCategoryNode[], plantCategoryTree?: SeoCategoryNode[]): string {
  // Category hero imagery is rendered responsively by the client app; service detail pages use their dedicated SSR renderer.
  // Do not emit a second raw image into the initial HTML: it is replaced on hydration,
  // can trigger a duplicate/oversized download, and has no reserved responsive sizing.
  // Keep the product fallback image for product-page no-JS content.
  const image = type === 'product' && doc.imageUrl
    ? renderResponsiveProductImage(doc.imageUrl, name)
    : ''
  let extra = ''
  if (type === 'product') {
    const plantVariant = doc._dataset === 'plants' ? doc.saleVariants?.[0] : undefined
    const displayPrice = getServerProductPrice(doc)
    const displayStockStatus = doc._dataset === 'plants' ? (plantVariant?.stockStatus || doc.stockStatus) : doc.stockStatus
    const price = typeof displayPrice === 'number' && displayPrice > 0
      ? '<p><strong>' + (language === 'ru' ? 'Цена' : language === 'en' ? 'Price' : 'Цена') + ': ' + displayPrice.toFixed(2) + ' EUR</strong></p>'
      : ''
    const sku = doc.sku ? '<p>SKU: ' + escapeHtml(doc.sku) + '</p>' : ''
    const stockLabel = displayStockStatus === 'inStock'
      ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност')
      : displayStockStatus === 'outOfStock'
        ? (language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан')
        : (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')
    extra = price + sku + '<p>' + stockLabel + '</p>'
  }
  const mainStyle = type === 'product' || type === 'blogPost'
    ? 'max-width:1100px;min-height:100svh;margin:0 auto;padding:24px;color:#263323;font-family:Arial,sans-serif'
    : 'max-width:1100px;margin:0 auto;padding:24px;color:#263323;font-family:Arial,sans-serif'
  const isEquipmentCategory = type === 'category' && doc._dataset === 'production'
  const rootCatalog = doc.slugValue === 'vsichko-za-polivane'
  const plantCategoryNavigation = type === 'category' && doc._dataset === 'plants' && Array.isArray(plantCategoryTree)
    ? renderPlantCategoryNavigation(plantCategoryTree, doc._id, language)
    : ''
  const categoryNavigation = isEquipmentCategory && Array.isArray(equipmentCategoryTree)
    ? renderEquipmentCategoryNavigation(equipmentCategoryTree, doc._id, language, SITE_URL, { rootCatalog })
    : ''
  const categorySeoContent = isEquipmentCategory
    ? renderEquipmentCategorySeoContent(doc, language, SITE_URL)
    : ''
  const categoryHelpBlock = isEquipmentCategory
    ? renderEquipmentCategoryHelpBlock(doc, language, SITE_URL)
    : ''
  return '<main style="' + mainStyle + '">' +
    '<h1>' + escapeHtml(h1) + '</h1>' + image +
    (description ? '<p style="line-height:1.7">' + escapeHtml(description) + '</p>' : '') +
    extra + categoryNavigation + plantCategoryNavigation +
    (type === 'category' && doc._dataset === 'plants' ? renderPlantCategoryListing(plantProducts || [], language, SITE_URL) : '') +
    (type === 'category' && doc._dataset === 'plants' ? renderPortableText(language === 'bg' ? doc.seoContent : doc.translations?.[language]?.seoContent || doc.seoContent) : '') +
    (isEquipmentCategory && Array.isArray(equipmentProducts) ? renderEquipmentCategoryListing(equipmentProducts, language, SITE_URL, { rootCatalog, categories: equipmentCategoryTree || [] }) : '') +
    categorySeoContent + categoryHelpBlock + '<p><a href="/">Florial</a></p></main>'
}

function makeBreadcrumb(path: string, name: string, language: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: localizedRouteUrl('/', language) },
      { '@type': 'ListItem', position: 2, name, item: localizedRouteUrl(path, language) },
    ],
  }
}

function makeProductJsonLd(doc: SeoDocument, name: string, description: string, url: string): Record<string, unknown> {
  const offer = buildProductOffer(doc, url)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(doc.imageUrl ? { image: [doc.imageUrl] } : {}),
    ...(doc.sku ? { sku: doc.sku } : {}),
    ...(doc.brandName ? { brand: { '@type': 'Brand', name: doc.brandName } } : {}),
    ...(offer ? { offers: offer } : {}),
  }
}

function makeServiceJsonLd(doc: Pick<SeoDocument, 'serviceCategory' | 'imageUrl'>, name: string, description: string, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url + '#service',
    name,
    description,
    url,
    serviceType: doc.serviceCategory || name,
    provider: { '@id': SITE_URL + '/#organization' },
    areaServed: [
      { '@type': 'City', name: 'Nessebar' },
      { '@type': 'City', name: 'Ravda' },
      { '@type': 'City', name: 'Sunny Beach' },
      { '@type': 'City', name: 'Sveti Vlas' },
      { '@type': 'City', name: 'Aheloy' },
      { '@type': 'City', name: 'Pomorie' },
    ],
    ...(doc.imageUrl ? { image: [doc.imageUrl] } : {}),
  }
}

function makeBlogPostingJsonLd(doc: SeoDocument, name: string, description: string, url: string, language: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: name,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(doc.publishedAt ? { datePublished: doc.publishedAt } : {}),
    ...(doc._updatedAt ? { dateModified: doc._updatedAt } : {}),
    ...(doc.coverUrl ? { image: [doc.coverUrl] } : {}),
    author: { '@id': SITE_URL + '/#organization' },
    publisher: { '@id': SITE_URL + '/#organization' },
    inLanguage: language,
  }
}

function makeCategoryCollectionJsonLd(name: string, description: string, url: string, products: SeoPlantProduct[], language: string): Record<string, unknown> {
  const entries = (products || []).filter((product) => product?._id && product.slugValue)
    .slice(0, 20)
    .map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: (product.translations?.[language]?.name || product.name || product.slugValue) + (product._catalogVariant?.name ? ' — ' + (language === 'ru' ? product._catalogVariant.nameRu || product._catalogVariant.name : language === 'en' ? product._catalogVariant.nameEn || product._catalogVariant.name : product._catalogVariant.name) : ''),
      url: SITE_URL + '/product/' + encodeURIComponent(product.slugValue!) + (language === 'ru' || language === 'en' ? '?lang=' + language : ''),
    }))
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    ...(entries.length ? {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: entries.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: entries,
      },
    } : {}),
  }
}

async function handleRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const languageParam = url.searchParams.get('lang')

  // Preserve old blog URLs and their query parameters while moving service content.
  const serviceRedirectPath = getBlogServiceRedirectPath(path)
  if (serviceRedirectPath) {
    const destination = new URL(context.request.url)
    destination.pathname = serviceRedirectPath
    return new Response(null, {
      status: 301,
      headers: {
        Location: destination.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // The internal Manager is a separate SPA entry selected in src/main.tsx.
  // Keep the Pages SPA fallback, but apply server-side noindex before the client app runs.
  if (path === '/manager' || path.startsWith('/manager/')) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')

    const contentType = headers.get('content-type') || ''
    if (context.request.method !== 'HEAD' && contentType.includes('text/html') && response.status === 200) {
      let html = await response.text()
      const robotsMeta = '<meta name="robots" content="noindex, nofollow, noarchive">'
      const robotsMetaPattern = /<meta\b(?=[^>]*\bname\s*=\s*(["'])robots\1)[^>]*>/i
      if (robotsMetaPattern.test(html)) {
        html = html.replace(robotsMetaPattern, robotsMeta)
      } else {
        html = html.replace(/<\/head>/i, robotsMeta + '</head>')
      }
      const managerManifest = '<link rel="manifest" href="/manager/manifest.webmanifest">'
      if (!/<link\b(?=[^>]*\brel\s*=\s*(["'])manifest\1)/i.test(html)) {
        html = html.replace(/<\/head>/i, managerManifest + '</head>')
      }
      const appleTouchIcon = '<link rel="apple-touch-icon" sizes="192x192" href="/manager/icons/icon-192.png">'
      if (!/<link\b(?=[^>]*\brel\s*=\s*(["'])apple-touch-icon\1)/i.test(html)) {
        html = html.replace(/<\/head>/i, appleTouchIcon + '</head>')
      }
      const managerThemeColor = '<meta name="theme-color" content="#166534">'
      const themeColorPattern = /<meta\b(?=[^>]*\bname\s*=\s*(["'])theme-color\1)[^>]*>/i
      if (themeColorPattern.test(html)) html = html.replace(themeColorPattern, managerThemeColor)
      else html = html.replace(/<\/head>/i, managerThemeColor + '</head>')
      headers.set('Cache-Control', 'no-store')
      headers.delete('content-length')
      headers.delete('content-encoding')
      headers.delete('etag')
      return new Response(html, { status: response.status, statusText: response.statusText, headers })
    }

    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  if (path === '/irrigation-assistant') {
    const response = await transformHtmlResponse(
      await context.next(),
      (html) => setMetaTag(html, 'name', 'robots', 'noindex, nofollow'),
    )
    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  const language: 'bg' | 'ru' | 'en' = languageParam === 'ru' ? 'ru' : languageParam === 'en' ? 'en' : 'bg'

  if (
    path.startsWith('/api/') ||
    path === '/sitemap.xml' ||
    path === '/robots.txt' ||
    path === '/favicon.png' ||
    path === '/index.html' ||
    /^\/google[a-z0-9_-]+\.html$/i.test(path)
  ) return context.next()

  if (path === '/withdrawal') {
    const meta = language === 'ru'
      ? {
          title: 'Отказ от договора | Florial',
          description: 'Онлайн-заявление об отказе от договора, заключённого дистанционно через интерфейс Florial.',
          body: '<main><h1>Откажитесь от договора здесь</h1><p>Онлайн-функция для подачи заявления об отказе от дистанционного договора с подтверждением даты и времени получения.</p></main>',
        }
      : language === 'en'
        ? {
            title: 'Contract Withdrawal | Florial',
            description: 'Submit an online withdrawal declaration for a distance contract concluded through the Florial interface.',
            body: '<main><h1>Withdraw from the contract here</h1><p>Online function for submitting a distance-contract withdrawal declaration with confirmation of receipt date and time.</p></main>',
          }
        : {
            title: 'Отказ от договор | Florial',
            description: 'Онлайн заявление за отказ от договор, сключен от разстояние чрез интерфейса на Florial.',
            body: '<main><h1>Откажете се от договора тук</h1><p>Онлайн функция за подаване на заявление за отказ от договор от разстояние с потвърждение за дата и час на получаване.</p></main>',
          }
    const canonical = localizedRouteUrl('/withdrawal', language)
    return transformHtmlResponse(await context.next(), (html) => setPageHead(renderRoot(html, meta.body), {
      language,
      title: meta.title,
      description: meta.description,
      canonical,
      noIndex: true,
      pageType: 'website',
    }))
  }

  if (path === '/terms') {
    const meta = language === 'ru'
      ? {
          title: 'Общие условия использования и покупки | Florial',
          description: 'Общие условия Florial: товары, заказы, оплата, доставка, живые растения, отказ от договора, рекламации и садовые услуги.',
          body: '<main><h1>Общие условия использования и покупки</h1><p>Проект общих условий Florial на болгарском языке для юридического рассмотрения.</p></main>',
        }
      : language === 'en'
        ? {
            title: 'Terms of Use and Purchase | Florial',
            description: 'Florial terms covering products, orders, payment, delivery, live plants, contract withdrawal, complaints and garden services.',
            body: '<main><h1>Terms of Use and Purchase</h1><p>Bulgarian draft terms and conditions for legal review.</p></main>',
          }
        : {
            title: 'Общи условия за ползване и покупка | Florial',
            description: 'Общи условия на Florial за продукти, поръчки, плащане, доставка, живи растения, отказ от договор, рекламации и градински услуги.',
            body: '<main><h1>Общи условия за ползване и покупка от Florial</h1><p>Проект за юридически преглед на условията за използване на сайта, покупки и услуги.</p></main>',
          }
    const canonical = localizedRouteUrl('/terms', language)
    const base = SITE_URL + '/terms'
    const alternates = language === 'bg' ? {
      bg: base,
      'x-default': base,
    } : undefined
    return transformHtmlResponse(await context.next(), (html) => setPageHead(renderRoot(html, meta.body), {
      language,
      title: meta.title,
      description: meta.description,
      canonical,
      alternates,
      noIndex: language !== 'bg',
      pageType: 'website',
    }))
  }

  if (path === '/privacy-policy') {
    const meta = language === 'ru'
      ? {
          title: 'Политика конфиденциальности | Florial',
          description: 'Как Florial обрабатывает персональные данные покупателей и посетителей сайта: заказы, обращения, техническая статистика, права по GDPR и контакты оператора.',
          body: '<main><h1>Политика конфиденциальности</h1><p>Информация об обработке персональных данных при просмотре сайта Florial, оформлении заказов и отправке обращений. Полная версия доступна на болгарском, русском и английском языках.</p></main>',
        }
      : language === 'en'
        ? {
            title: 'Privacy Policy | Florial',
            description: 'How Florial processes personal data of website visitors and customers, including orders, enquiries, technical statistics, GDPR rights and controller contact details.',
            body: '<main><h1>Privacy Policy</h1><p>Information about personal data processing when browsing Florial, placing orders and sending enquiries. The full policy is available in Bulgarian, Russian and English.</p></main>',
          }
        : {
            title: 'Политика за поверителност | Florial',
            description: 'Информация как Florial обработва личните данни на посетителите и клиентите: поръчки, запитвания, техническа статистика, права по GDPR и контакти на администратора.',
            body: '<main><h1>Политика за поверителност</h1><p>Информация за обработването на лични данни при разглеждане на сайта Florial, подаване на поръчки и изпращане на запитвания. Пълната политика е достъпна на български, руски и английски език.</p></main>',
          }
    const canonical = localizedRouteUrl('/privacy-policy', language)
    const base = SITE_URL + '/privacy-policy'
    const alternates = {
      bg: base,
      ru: base + '?lang=ru',
      en: base + '?lang=en',
      'x-default': base,
    }
    return transformHtmlResponse(await context.next(), (html) => setPageHead(renderRoot(html, meta.body), {
      language,
      title: meta.title,
      description: meta.description,
      canonical,
      alternates,
      pageType: 'website',
    }))
  }

  if (path === '/blog') {
    const metadata = getBlogIndexMetadata(language)
    const blogIndexQuery = '*[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc) {' +
      '_id, slug, publishedAt, tags, ' +
      '"cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption}, ' +
      '"translations": {"' + language + '": {' +
        '"title": coalesce(translations.' + language + '.title, translations.bg.title), ' +
        '"shortDescription": coalesce(translations.' + language + '.shortDescription, translations.bg.shortDescription), ' +
        '"coverAlt": coalesce(translations.' + language + '.coverAlt, translations.bg.coverAlt)' +
      '}}' +
    '}'
    try {
      const posts = await querySanityData<any[]>(
        'production',
        blogIndexQuery,
        {},
        'blog/index-v1/' + language,
        60,
      )
      if (!Array.isArray(posts)) throw new Error('Blog index Sanity query returned an invalid collection')
      const rendered = renderBlogIndexHtml({ posts, language })
      return transformHtmlResponse(await context.next(), (html) => {
        const root = renderRoot(html, rendered.body)
        const headed = setPageHead(root, {
          language,
          title: metadata.title,
          description: metadata.description,
          canonical: metadata.canonical,
          alternates: metadata.alternates,
          image: rendered.image,
          pageType: 'blog',
          structuredData: rendered.structuredData,
        })
        const initialData = '<script id="florial-blog-ssr-data" type="application/json">' +
          serializeBlogIndexPayload(posts, language) + '</script>'
        return headed.replace(/<\/head>/i, initialData + '\n</head>')
      }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=120')
    } catch {
      // Never turn a Sanity outage into a successful empty blog index.
      return blogUnavailableResponse(language)
    }
  }

  if (path.startsWith('/blog/')) {
    const rawArticleSlug = path.slice('/blog/'.length)
    let articleSlug = ''
    try {
      articleSlug = decodeURIComponent(rawArticleSlug)
    } catch {
      return notFoundResponse(language)
    }
    if (!articleSlug || articleSlug.includes('/')) return notFoundResponse(language)

    const articleQuery = '*[_type == "blogPost" && isPublished == true && defined(publishedAt) && (slug.current == $slug || slug == $slug || _id == $slug)][0...1]{' +
      '_id, slug, publishedAt, _updatedAt, tags, ' +
      '"cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption}, ' +
      '"gallery": gallery[]{"asset": asset->{"url": url}, alt, altRu, altEn, caption}, ' +
      '"translations": {"' + language + '": {' +
        '"title": coalesce(translations.' + language + '.title, translations.bg.title), ' +
        '"shortDescription": coalesce(translations.' + language + '.shortDescription, translations.bg.shortDescription), ' +
        '"body": coalesce(translations.' + language + '.body, translations.bg.body)[]{' +
          '_key, _type, style, listItem, children[]{_key, text, marks}, markDefs[]{_key, _type, href, blank}, ' +
          '_type == "image" => {"assetUrl": asset->url, alt, altRu, altEn, caption}, ' +
          '_type == "youtubeEmbed" => {url, title, caption}' +
        '}, ' +
        '"seoTitle": coalesce(translations.' + language + '.seoTitle, translations.bg.seoTitle), ' +
        '"seoDescription": coalesce(translations.' + language + '.seoDescription, translations.bg.seoDescription), ' +
        '"coverAlt": coalesce(translations.' + language + '.coverAlt, translations.bg.coverAlt)' +
      '}}' +
    '}'

    try {
      const matches = await querySanityData<any[]>(
        'production',
        articleQuery,
        { slug: articleSlug },
        'blog/article-v1/' + language + '/' + encodeURIComponent(articleSlug),
        60,
      )
      const post = Array.isArray(matches) ? matches[0] : null
      if (!post) return notFoundResponse(language)

      let relatedPosts: any[] = []
      try {
        const relatedQuery = '*[_type == "blogPost" && isPublished == true && defined(publishedAt) && _id != $excludeId]{' +
          '"sharedTagCount": count(tags[@ in $tags]), ' +
          '_id, slug, publishedAt, tags, ' +
          '"cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption}, ' +
          '"translations": {"' + language + '": {' +
            '"title": coalesce(translations.' + language + '.title, translations.bg.title), ' +
            '"shortDescription": coalesce(translations.' + language + '.shortDescription, translations.bg.shortDescription), ' +
            '"coverAlt": coalesce(translations.' + language + '.coverAlt, translations.bg.coverAlt)' +
          '}}' +
        '} | order(sharedTagCount desc, publishedAt desc)[0...3]{_id, slug, publishedAt, tags, cover, translations}'
        const result = await querySanityData<any[]>(
          'production',
          relatedQuery,
          { excludeId: post._id, tags: Array.isArray(post.tags) ? post.tags : [] },
          'blog/article-related-v1/' + language + '/' + encodeURIComponent(post._id),
          60,
        )
        if (Array.isArray(result)) relatedPosts = result
      } catch {
        // Related content is optional; an unavailable related query must not hide a valid article.
      }

      const metadata = getBlogArticleMetadata(post, language)
      const rendered = renderBlogArticleHtml({ post, relatedPosts, language })
      return transformHtmlResponse(await context.next(), (html) => {
        const root = renderRoot(html, rendered.body)
        const headed = setPageHead(root, {
          language,
          title: metadata.title,
          description: metadata.description,
          canonical: metadata.canonical,
          alternates: metadata.alternates,
          image: rendered.image,
          noIndex: false,
          structuredData: rendered.structuredData,
          pageType: 'article',
        })
        const initialData = '<script id="florial-blog-article-data" type="application/json">' +
          serializeBlogArticlePayload(post, relatedPosts, language) + '</script>'
        return headed.replace(/<\/head>/i, initialData + '\n</head>')
      }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=120')
    } catch {
      // Do not turn a Sanity outage into a successful empty article or a false 404.
      return blogUnavailableResponse(language)
    }
  }

  if (path === '/services') {
    const metadata = getServicesDirectoryMetadata(language)
    const serviceQuery = `
      *[_type == "service" && isActive != false] | order(sortOrder asc, name asc) {
        _id, name, shortDescription,
        translations { bg { name, shortDescription }, ru { name, shortDescription }, en { name, shortDescription } },
        "slug": { "current": coalesce(slug.current, slug) },
        sortOrder, serviceCategory, serviceLayout,
        "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
        "imageAlt": coalesce(image.alt, mainImage.alt),
        "imageAltEn": coalesce(image.altEn, mainImage.altEn),
        "imageAltRu": coalesce(image.altRu, mainImage.altRu)
      }
    `
    const serviceRolePhotosQuery = `
      *[
        _type == "photo" &&
        isActive != false &&
        coalesce(slug.current, slug) in [
          "landshaften-arhitekt",
          "inzhener-polivni-sistemi",
          "gardinar",
          "specialist-trevni-ploshti"
        ]
      ] {
        "slug": coalesce(slug.current, slug),
        title,
        titleEn,
        titleRu,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt,
        "imageAltEn": image.altEn,
        "imageAltRu": image.altRu
      }
    `

    try {
      const [services, rolePhotos] = await Promise.all([
        querySanityData<any[]>('production', serviceQuery, {}, 'services/directory-services-v1', 60),
        querySanityData<any[]>('production', serviceRolePhotosQuery, {}, 'services/directory-role-photos-v1', 300),
      ])
      if (!Array.isArray(services) || !Array.isArray(rolePhotos)) {
        throw new Error('Services directory Sanity query returned an invalid collection')
      }
      const entries = getOrderedServiceEntries(services)
      const rendered = renderServicesDirectoryHtml({ entries, rolePhotos, language })
      return transformHtmlResponse(await context.next(), (html) => {
        const headed = setPageHead(
          renderRoot(html, rendered.body),
          {
            language,
            title: metadata.title,
            description: metadata.description,
            canonical: metadata.canonical,
            alternates: metadata.alternates,
            pageType: 'website',
            structuredData: [...metadata.structuredData, ...rendered.structuredData],
          },
        )
        const initialData = '<script id="florial-services-ssr-data" type="application/json">' +
          serializeInlineJson({ language, services, rolePhotos }) + '</script>'
        return headed.replace(/<\/head>/i, initialData + '\n</head>')
      }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=120')
    } catch {
      // Preserve a meaningful static fallback; never cache an empty directory after an upstream failure.
      const fallbackBody = language === 'ru'
        ? '<main><h1>Услуги садового центра Florial</h1><p>Ландшафтный дизайн, автоматический полив, озеленение и обслуживание садов в Болгарии.</p></main>'
        : language === 'en'
          ? '<main><h1>Florial Garden Centre Services</h1><p>Landscape design, automatic irrigation, planting and garden maintenance in Bulgaria.</p></main>'
          : '<main><h1>Услуги на градински център Florial</h1><p>Ландшафтен дизайн, автоматично напояване, озеленяване и поддръжка на градини в България.</p></main>'
      return transformHtmlResponse(await context.next(), (html) => setPageHead(renderRoot(html, fallbackBody), {
        language,
        title: metadata.title,
        description: metadata.description,
        canonical: metadata.canonical,
        alternates: metadata.alternates,
        pageType: 'website',
        structuredData: metadata.structuredData,
      }), 'no-store')
    }
  }

  if (path === '/services/dostavka-poliv') {
    const meta = language === 'ru'
      ? {
          title: 'Доставка оборудования для полива и консультация инженера | Florial',
          description: 'Доставка оборудования для автоматического полива в 30 населённых пунктов района Несебра и Поморие: тарифы от 0 до 25 €. Бесплатная консультация инженера на объекте. Ремонт от 30 €.',
          body: '<main><h1>Оборудование для полива с доставкой и помощью инженера</h1><p>Бесплатная доставка в Солнечном Береге. По 10 €: Несебр, Святой Влас, Тънково, Равда, Кошарица, Ахелой, Александрово, Оризаре, Гюльовца, Медово, Порой и Каблешково. По 15 €: Поморие, Каменар, Лъка, Баня, Бата, Гълъбец и Габерово. Дъбник — 17 €. По 20 €: Горица, Белодол, Емона, Страцин и Обзор. По 25 €: Приселци, Козичино, Раковсково и Паницово. Бесплатная консультация инженера на объекте. Ремонт от 30 €.</p></main>',
        }
      : language === 'en'
        ? {
            title: 'Irrigation Equipment Delivery & Engineer Consultation | Florial',
            description: 'Irrigation equipment delivery to 30 locations around Nessebar and Pomorie, with rates from €0 to €25. Free on-site engineer consultation. Repairs from €30.',
            body: '<main><h1>Irrigation equipment delivered, with help from an engineer</h1><p>Free delivery in Sunny Beach. €10: Nessebar, Sveti Vlas, Tankovo, Ravda, Kosharitsa, Aheloy, Alexandrovo, Orizare, Gyulyovtsa, Medovo, Poroy and Kableshkovo. €15: Pomorie, Kamenar, Laka, Banya, Bata, Galabets and Gaberovo. Dubnik — €17. €20: Goritsa, Belodol, Emona, Stratsin and Obzor. €25: Priseltsi, Kozichino, Rakovskovo and Panitsovo. Free on-site engineer consultation. Repairs from €30.</p></main>',
          }
        : {
            title: 'Доставка на оборудване за поливане и консултация с инженер | Florial',
            description: 'Доставка на оборудване за напояване до 30 населени места в района на Несебър и Поморие, с цени от 0 до 25 €. Безплатна консултация с инженер на място. Ремонт от 30 €.',
            body: '<main><h1>Оборудване за поливане с доставка и помощ от инженер</h1><p>Безплатна доставка в Слънчев бряг. По 10 €: Несебър, Свети Влас, Тънково, Равда, Кошарица, Ахелой, Александрово, Оризаре, Гюльовца, Медово, Порой и Каблешково. По 15 €: Поморие, Каменар, Лъка, Баня, Бата, Гълъбец и Габерово. Дъбник — 17 €. По 20 €: Горица, Белодол, Емона, Страцин и Обзор. По 25 €: Приселци, Козичино, Раковсково и Паницово. Безплатна консултация с инженер на място. Ремонт от 30 €.</p></main>',
          }
    const base = SITE_URL + '/services/dostavka-poliv'
    const canonical = localizedRouteUrl('/services/dostavka-poliv', language)
    const alternates = {
      bg: base,
      ru: base + '?lang=ru',
      en: base + '?lang=en',
      'x-default': base,
    }
    return transformHtmlResponse(await context.next(), (html) => setPageHead(renderRoot(html, meta.body), {
      language,
      title: meta.title,
      description: meta.description,
      canonical,
      alternates,
      pageType: 'website',
      structuredData: [{
        id: 'service',
        data: makeServiceJsonLd(
          { serviceCategory: 'delivery' },
          meta.title,
          meta.description,
          canonical,
        ),
      }],
    }))
  }

  if (path === '/' || path === '/contacts' || path === '/about') {
    const meta = staticPageMetadata(path, language)
    const canonical = localizedRouteUrl(path, language)
    const alternates = {
      bg: SITE_URL + path,
      ru: SITE_URL + path + '?lang=ru',
      en: SITE_URL + path + '?lang=en',
      'x-default': SITE_URL + path,
    }
    let body = meta.body
    let cacheControl: string | undefined
    let homepageSeedScript = ''
    let contactsSeedScript = ''
    if (path === '/') {
      try {
        const homepage = await fetchHomepageHtml(language)
        body = homepage.html
        homepageSeedScript = '<script id="florial-homepage-ssr-data" type="application/json">' +
          serializeInlineJson(homepage.payload) + '</script>'
        cacheControl = 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'
      } catch (error) {
        console.error('Florial homepage SSR data unavailable; serving the existing static fallback:', error)
        cacheControl = 'no-store'
      }
    } else if (path === '/contacts') {
      try {
        const contacts = await fetchContactsHtml(language)
        body = contacts.html
        contactsSeedScript = '<script id="florial-contacts-ssr-data" type="application/json">' +
          serializeInlineJson({ language, images: contacts.images }) + '</script>'
        cacheControl = 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'
      } catch (error) {
        console.error('Florial contacts SSR images unavailable; serving contact details without images:', error)
        body = renderContactsHtml(language)
        cacheControl = 'no-store'
      }
    } else if (path === '/about') {
      const about = await fetchAboutHtml(language)
      body = about.html
      cacheControl = about.complete
        ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'
        : 'no-store'
    }
    return transformHtmlResponse(await context.next(), (html) => {
      const root = renderRoot(html, body + homepageSeedScript + contactsSeedScript)
      return setPageHead(root, {
        language,
        title: meta.title,
        description: meta.description,
        canonical,
        alternates,
        pageType: path === '/about' ? 'about' : 'website',
        structuredData: [{
          id: 'organization',
          data: {
            '@context': 'https://schema.org',
            '@type': 'OnlineStore',
            '@id': SITE_URL + '/#organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: {
              '@type': 'ImageObject',
              url: LOGO_URL,
              width: 1547,
              height: 581,
            },
            areaServed: { '@type': 'Country', name: 'Bulgaria' },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              merchantReturnLink: SITE_URL + '/terms',
            },
          },
        }, {
          id: 'website',
          data: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': SITE_URL + '/#website',
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: language,
            publisher: { '@id': SITE_URL + '/#organization' },
          },
        }, ...(path === '/about' ? [{
          id: 'about-page',
          data: {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            '@id': canonical + '#about',
            url: canonical,
            name: meta.title,
            description: meta.description,
            inLanguage: language,
            about: { '@id': SITE_URL + '/#organization' },
            mainEntity: { '@id': SITE_URL + '/#organization' },
          },
        }] : []), {
          id: 'local-business-nessebar',
          data: {
            '@context': 'https://schema.org',
            '@type': 'GardenStore',
            '@id': SITE_URL + '/#store-nessebar',
            name: 'Florial — градински център Несебър',
            url: SITE_URL + '/contacts',
            telephone: '+359885834860',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. „Хан Крум“',
              postalCode: '8230',
              addressLocality: 'Несебър',
              addressCountry: 'BG',
            },
            openingHoursSpecification: [{
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: [
                'https://schema.org/Monday',
                'https://schema.org/Tuesday',
                'https://schema.org/Wednesday',
                'https://schema.org/Thursday',
                'https://schema.org/Friday',
                'https://schema.org/Saturday',
                'https://schema.org/Sunday',
              ],
              opens: '09:00',
              closes: '17:00',
            }],
            parentOrganization: { '@id': SITE_URL + '/#organization' },
          },
        }, {
          id: 'local-business-ravda',
          data: {
            '@context': 'https://schema.org',
            '@type': 'GardenStore',
            '@id': SITE_URL + '/#store-ravda',
            name: 'Florial — градински център Равда',
            url: SITE_URL + '/contacts',
            telephone: '+359877055605',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Чешме тарла',
              postalCode: '8238',
              addressLocality: 'Равда',
              addressCountry: 'BG',
            },
            openingHoursSpecification: [{
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: [
                'https://schema.org/Monday',
                'https://schema.org/Tuesday',
                'https://schema.org/Wednesday',
                'https://schema.org/Thursday',
                'https://schema.org/Friday',
                'https://schema.org/Saturday',
                'https://schema.org/Sunday',
              ],
              opens: '09:00',
              closes: '17:00',
            }],
            parentOrganization: { '@id': SITE_URL + '/#organization' },
          },
        }],
      })
    }, cacheControl)
  }

  if (path === '/cart' || path === '/search') {
    const meta = path === '/cart'
      ? language === 'ru'
        ? { title: 'Корзина | Florial', description: 'Содержимое корзины интернет-магазина Florial.' }
        : language === 'en'
          ? { title: 'Shopping Cart | Florial', description: 'Your Florial online shop shopping cart.' }
          : { title: 'Количка | Florial', description: 'Съдържание на количката в онлайн магазина Florial.' }
      : language === 'ru'
        ? { title: 'Поиск товаров | Florial', description: 'Поиск оборудования для полива и растений в магазине Florial.' }
        : language === 'en'
          ? { title: 'Product Search | Florial', description: 'Search irrigation equipment and plants in the Florial shop.' }
          : { title: 'Търсене на продукти | Florial', description: 'Търсете оборудване за напояване и растения в магазина Florial.' }
    return transformHtmlResponse(await context.next(), (html) => setPageHead(html, {
      language,
      title: meta.title,
      description: meta.description,
      canonical: SITE_URL + path,
      noIndex: true,
      pageType: 'website',
    }))
  }

  // Specialist landing pages are client-rendered routes with three path segments.
  // Let the Pages SPA fallback serve index.html; the two-segment Sanity resolver below must not 404 them.
  if (/^\/services\/category\/[^/]+$/.test(path)) {
    const response = await context.next()
    if (path !== '/services/category/landshaften-arhitekt') return response

    return transformHtmlResponse(response, (html) => {
      const resourceHints = [
        '<link rel="preconnect" href="https://bxvcy0qs.apicdn.sanity.io" crossorigin />',
        '<link rel="preconnect" href="https://cdn.sanity.io" crossorigin />',
      ]
      const missingHints = resourceHints.filter((hint) => !html.includes(hint))
      return missingHints.length
        ? html.replace(/<\/head>/i, missingHints.join('\n') + '\n</head>')
        : html
    }, response.headers.get('Cache-Control') || undefined)
  }

  const parts = path.split('/').filter(Boolean)
  const route = parts[0]
  const rawSlug = parts[1]
  let slug: string | null = null
  try {
    slug = rawSlug ? decodeURIComponent(rawSlug) : null
  } catch {
    return notFoundResponse(language)
  }

  if (
    parts.length === 2 &&
    slug &&
    (route === 'product' || route === 'products' || route === 'category' || route === 'services' || route === 'blog')
  ) {
    try {
      let doc: SeoDocument | null = null
      let type = route === 'services' ? 'service' : route === 'category' ? 'category' : route === 'blog' ? 'blogPost' : 'product'
      if (route === 'services') {
        doc = await queryServiceDocument(slug)
      } else if (route === 'category') {
        doc = await queryDocument('production', type, slug) || await queryDocument('plants', type, slug)
      } else if (type === 'product') {
        doc = await queryEquipmentProductDocument(slug) || await queryPlantProductDocument(slug)
      } else {
        doc = await queryDocument('production', type, slug) || await queryDocument('plants', type, slug)
      }
      if (!doc) return notFoundResponse(language)

      // Category pages receive server-side product data for collection structured data.
      // Plant category listings are also rendered into the initial HTML; React remains interactive.
      let categoryProducts: SeoPlantProduct[] | null = null
      let equipmentCategoryTree: SeoCategoryNode[] | undefined
      let plantCategoryTree: SeoCategoryNode[] | undefined
      let equipmentProductCategories: SeoCategoryNode[] = []
      if (type === 'product' && doc._dataset === 'production') {
        try {
          equipmentProductCategories = await fetchEquipmentProductCategoryTree()
        } catch {
          // Product detail content remains renderable if category breadcrumbs cannot be enriched.
          equipmentProductCategories = []
        }
      }
      if (type === 'category') {
        if (doc._dataset === 'plants') {
          // Preserve the existing fail-closed behavior for plant category SSR.
          categoryProducts = await fetchPlantCategoryProducts(doc._id, (categories) => { plantCategoryTree = categories })
        } else {
          // Equipment categories use the same fetched catalogue for CollectionPage data and initial HTML.
          // React remains responsible for the interactive catalogue; a temporary query failure must not turn a valid category page into 503.
          try {
            categoryProducts = await fetchCategoryProducts('production', doc._id, (categories) => { equipmentCategoryTree = categories })
          } catch {
            categoryProducts = null
          }
        }
      }

      const localized = language === 'bg' ? null : doc.translations?.[language]
      const categoryFallback = type === 'category' ? categoryFallbacks[doc.slugValue || '']?.[language as 'ru' | 'en'] : undefined
      const name = String(type === 'blogPost' ? (localized?.title || doc.translations?.bg?.title || doc.title || slug) : (localized?.name || categoryFallback?.name || doc.name || slug))
      const translatedDescription = localized?.shortDescription || localized?.description || categoryFallback?.description
      const description = plainText(translatedDescription || doc.shortDescription || doc.description)
      const seo = (type === 'blogPost'
        ? {metaTitle: localized?.seoTitle || doc.translations?.bg?.seoTitle, metaDescription: localized?.seoDescription || doc.translations?.bg?.seoDescription}
        : (language === 'bg' ? doc.seo : localized?.seo)) as Record<string, any> | null | undefined
      const categorySeo = type === 'category' ? resolveCategorySeo(seo, {
        _id: doc._id,
        name: doc.name || name,
        slug: doc.slugValue,
        description: doc.description,
        catalog: doc._dataset === 'plants' ? 'plants' : 'irrigation',
        translations: doc.translations,
      }, language as 'bg' | 'ru' | 'en') : null
      const brand = language === 'bg' ? 'Флориал' : 'Florial'
      const title = String(categorySeo?.metaTitle || seo?.metaTitle || seo?.title || (name + ' | ' + (type === 'service' ? 'Florial' : brand)))
      const serviceDescriptionFallback = type === 'service'
        ? (localized?.shortDescription || doc.shortDescription || (name + ' — ' + (language === 'ru' ? 'профессиональные услуги Florial в Болгарии' : language === 'en' ? 'professional Florial services in Bulgaria' : 'професионални услуги на Florial в България')))
        : description || (name + ' — ' + brand)
      const metaDescription = String(categorySeo?.metaDescription || seo?.metaDescription || seo?.description || serviceDescriptionFallback)
      const noIndex = seo?.noIndex === true || categorySeo?.noIndex === true
      const canonicalRoute = route === 'products' ? 'product' : route
      const pagePath = '/' + canonicalRoute + '/' + encodeURIComponent(doc.slugValue || slug)
      const canonicalUrl = localizedRouteUrl(pagePath, language)
      const alternates: Record<string, string> = {}
      if (hasTranslation(doc, type, 'bg')) alternates.bg = localizedRouteUrl(pagePath, 'bg')
      if (hasTranslation(doc, type, 'ru')) alternates.ru = localizedRouteUrl(pagePath, 'ru')
      if (hasTranslation(doc, type, 'en')) alternates.en = localizedRouteUrl(pagePath, 'en')
      alternates['x-default'] = localizedRouteUrl(pagePath, 'bg')
      if (type === 'service') {
        const serviceMetadata = getServiceDetailMetadata(doc as ServiceDetailDocument, language)
        Object.assign(alternates, serviceMetadata.alternates)
      }

      const equipmentCategoryOptions = {
        rootCatalog: doc.slugValue === 'vsichko-za-polivane',
        categories: equipmentCategoryTree || [],
      }
      const categoryStructuredProducts = doc._dataset === 'production' && categoryProducts !== null
        ? buildEquipmentCategoryEntries(categoryProducts || [], language, equipmentCategoryOptions)
        : doc._dataset === 'plants' && categoryProducts !== null
          ? buildPlantCategoryEntries(categoryProducts || [], language)
          : categoryProducts || []

      const structuredData: Array<{ id: string; data: Record<string, unknown> }> = type === 'service'
        ? buildServiceDetailStructuredData(doc as ServiceDetailDocument, language)
        : type === 'product' && doc._dataset === 'production'
          ? []
          : [{ id: 'breadcrumbs', data: makeBreadcrumb(pagePath, name, language) }]
      if (type === 'category') {
        structuredData.push({
          id: 'collection-page',
          data: makeCategoryCollectionJsonLd(name, metaDescription, canonicalUrl, categoryStructuredProducts, language),
        })
      }
      if (type === 'product' && doc._dataset === 'production') {
        const productStructuredData = buildEquipmentProductStructuredData(doc as EquipmentProductDocument, equipmentProductCategories, language, canonicalUrl)
        structuredData.push({ id: 'product', data: productStructuredData[0] })
        structuredData.push({ id: 'breadcrumbs', data: productStructuredData[1] })
      } else if (type === 'product' && doc._dataset === 'plants') {
        const productStructuredData = buildPlantProductStructuredData(doc as PlantProductDocument, language, canonicalUrl)
        structuredData.push({ id: 'product', data: productStructuredData[0] })
        structuredData.push({ id: 'breadcrumbs', data: productStructuredData[1] })
      } else if (type === 'product') {
        structuredData.push({ id: 'product', data: makeProductJsonLd(doc, name, metaDescription, canonicalUrl) })
      }
      if (type === 'blogPost') {
        structuredData.push({ id: 'blog-posting', data: makeBlogPostingJsonLd(doc, name, metaDescription, canonicalUrl, language) })
      }
      const pageH1 = type === 'product' ? String(seo?.h1 || name) : categorySeo?.h1 || name
      const body = type === 'service'
        ? renderServiceDetailHtml(doc as ServiceDetailDocument, language)
        : type === 'product' && doc._dataset === 'production'
          ? renderEquipmentProductHtml(doc as EquipmentProductDocument, equipmentProductCategories, language)
          : type === 'product' && doc._dataset === 'plants'
            ? renderPlantProductHtml(doc as PlantProductDocument, language, SITE_URL)
            : documentBody(doc, type, name, description, language, pageH1, doc._dataset === 'plants' ? categoryProducts || undefined : undefined, doc._dataset === 'production' && categoryProducts !== null ? categoryProducts : undefined, doc._dataset === 'production' && categoryProducts !== null ? equipmentCategoryTree : undefined, doc._dataset === 'plants' && categoryProducts !== null ? plantCategoryTree : undefined)
      return transformHtmlResponse(await context.next(), (html) => {
        const root = renderRoot(html, body)
        const headed = setPageHead(root, {
          language,
          title,
          description: metaDescription,
          canonical: canonicalUrl,
          image: type === 'blogPost' ? (doc?.coverUrl || doc?.imageUrl) : doc?.imageUrl,
          noIndex,
          alternates,
          structuredData,
          pageType: type === 'product' && doc._dataset === 'production' ? 'equipment-product' : type === 'product' ? 'product' : type === 'blogPost' ? 'article' : type === 'service' ? 'service' : 'website',
        })
        if (type === 'service') {
          const serviceDocument = doc as ServiceDetailDocument
          const service = {
            ...serviceDocument,
            slug: { current: serviceDocument.slugValue || slug },
            _dataset: 'production',
          }
          const initialData = '<script id="florial-service-detail-data" type="application/json">' +
            serializeInlineJson({ slug: serviceDocument.slugValue || slug, language, service }) + '</script>'
          return headed.replace(/<\/head>/i, initialData + '\n</head>')
        }
        if (type === 'product' && (doc._dataset === 'production' || doc._dataset === 'plants')) {
          // The server already resolved the product's exact dataset and ID. Pass only
          // this small identity to React so the browser does not repeat both slug lookups.
          const initialData = '<script id="florial-product-route-data" type="application/json">' +
            serializeInlineJson({
              slug: doc.slugValue || slug,
              language,
              dataset: doc._dataset,
              id: doc._id,
            }) + '</script>'
          return headed.replace(/<\/head>/i, initialData + '\n</head>')
        }
        return headed
      }, type === 'category' && categoryProducts === null
        ? 'no-store'
        : type === 'service' || (type === 'product' && (doc._dataset === 'production' || doc._dataset === 'plants'))
          ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'
          : categoryProducts !== null
            ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
            : undefined)
    } catch {
      // Do not turn an upstream Sanity outage into a false 200 or false 404.
      return unavailableResponse(language)
    }
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  const lastSegment = path.split('/').pop() || ''
  const looksLikeFile = /\.[a-zA-Z0-9]{1,8}$/.test(lastSegment)
  if (looksLikeFile) return contentType.includes('text/html') ? notFoundResponse(language) : response
  return notFoundResponse(language)
}


const applySecurityHeaders = (response: Response, request: Request): Response => {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (new URL(request.url).protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  let response = await handleRequest(context)
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const isHomepage = path === '/' || path === '/index.html'
  const isManager = path === '/manager' || path.startsWith('/manager/')
  const contentType = response.headers.get('content-type') || ''

  if (
    context.request.method === 'GET' &&
    response.status === 200 &&
    contentType.includes('text/html') &&
    !isHomepage &&
    !isManager &&
    !path.startsWith('/api/')
  ) {
    try {
      const languageParam = url.searchParams.get('lang')
      const language: 'bg' | 'ru' | 'en' = languageParam === 'ru' ? 'ru' : languageParam === 'en' ? 'en' : 'bg'
      const seed = await fetchHeaderSeed(language)
      const seedScript = '<script id="florial-header-ssr-data" type="application/json">' +
        serializeInlineJson(seed) + '</script>'
      const html = await response.text()
      if (!html.includes('id="florial-header-ssr-data"') && html.includes('</head>')) {
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        headers.delete('content-encoding')
        headers.delete('etag')
        headers.delete('content-md5')
        response = new Response(html.replace(/<\/head>/i, seedScript + '</head>'), {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }
    } catch (error) {
      console.error('Florial shared header SSR seed unavailable; browser fallback remains enabled:', error)
    }
  }

  return applySecurityHeaders(response, context.request)
}
