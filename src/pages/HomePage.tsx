import { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { getOrderedServiceEntries } from '../lib/servicesOrder'
import { applyPageSeo } from '../lib/seo'
import { BlogSection } from '../components/BlogSection'
import { getCategoryImageText } from '../lib/categoryImageSeo'
import { getSanityImageProps } from '../lib/sanityImage'
import { getProductImageText } from '../lib/productImageSeo'
import { getPlantDisplayName, getPlantStockStatus } from '../lib/plantCatalogUtils'
import { getPlantPrice } from '../lib/homepageFeatured.mjs'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import type { ServiceItem, CategoryItem, Product } from '../types'

interface HomePageProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  plantCategories: CategoryItem[]
  heroImageUrl: string | null
  featuredPlants: Product[]
  featuredEquipment: Product[]
  onNavigateService: (slug?: string, id?: string) => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateProduct: (slug: string) => void
}


export function HomePage({
  services,
  categories,
  plantCategories,
  heroImageUrl,
  featuredPlants,
  featuredEquipment,
  onNavigateService,
  onNavigateCategory,
  onNavigateProduct,
}: HomePageProps) {
  const { t, language, localize } = useI18n()

  useEffect(() => {
    const metadata = language === 'ru'
      ? {
          title: 'Florial — садовый центр и системы автополива в Болгарии',
          description: 'Растения, оборудование для автоматического полива, ландшафтный дизайн и озеленение в Несебре, Равде, Солнечном Береге и Бургасе.',
        }
      : language === 'en'
        ? {
            title: 'Florial — Garden Centre & Irrigation Shop in Bulgaria',
            description: 'Plants, automatic irrigation equipment, landscape design and gardening services in Nessebar, Ravda, Sunny Beach and Burgas.',
          }
        : {
            title: 'Florial — градински център и системи за напояване',
            description: 'Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в Несебър, Равда, Слънчев бряг и Бургас.',
          }
    applyPageSeo({
      fallbackTitle: metadata.title,
      fallbackDescription: metadata.description,
      language,
      alternates: {
        bg: 'https://florial-bg.com/',
        ru: 'https://florial-bg.com/?lang=ru',
        en: 'https://florial-bg.com/?lang=en',
        'x-default': 'https://florial-bg.com/',
      },
    })
  }, [language])
  // На главной показываем только корневые категории, без подкатегорий.
  const catalogRootId = categories.find((category) => category.slug?.current === 'vsichko-za-polivane')?._id
  const rootCategories = categories.filter((category) => !category.parentId || category.parentId === catalogRootId)
  const categoryOrder = [
    'vsichko-za-polivane',
    'gotovi-komplekti-za-polivane',
    'controllers',
    'sprinklers',
    'nozzles',
    'klapani',
    'shahti',
    'kapkovo-napoyavane',
    'filtri-regulatori-nalyagane',
    'trabi-fitingi-aksesoari',
    'drugi-komponenti-za-polivane',
  ]
  const sortedCategories = [...rootCategories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug?.current || '')
    const bIndex = categoryOrder.indexOf(b.slug?.current || '')
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return (a.sortOrder || 999) - (b.sortOrder || 999) || a.name.localeCompare(b.name, 'bg')
  })
  // Keep the homepage concise; the catalogue pages retain the complete category lists.

  const homepagePlantCategoryIds = [
    'plants-root',
    'plants-palms',
    'plants-olives',
    'plants-trees-shrubs',
    'plants-solitaires',
    'plants-flowers',
  ]
  const visiblePlantCategories = homepagePlantCategoryIds
    .map((id) => plantCategories.find((category) => category._id === id))
    .filter((category): category is CategoryItem => Boolean(category))
  const visibleEquipmentCategories = sortedCategories.slice(0, 6)
  const plantRootCategory = plantCategories.find((category) => category._id === 'plants-root' || category.slug?.current === 'rastenia')
  const readyKitsCategory = categories.find((category) => category.slug?.current === 'gotovi-komplekti-za-polivane')
  const visibleFeaturedEquipment = featuredEquipment
    .filter((product) => product.stockStatus !== 'outOfStock')
    .filter((product) => Number.isFinite(product.priceEUR) && product.priceEUR > 0 && Boolean(product.imageUrl))
    .slice(0, 4)
  const visibleFeaturedPlants = featuredPlants
    .filter((product) => getPlantStockStatus(product) !== 'outOfStock')
    .filter((product) => {
      const variants = product.saleVariants || []
      const variantPrices = variants.filter((variant) => variant.stockStatus !== 'outOfStock').map((variant) => variant.priceEUR).filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
      return variants.length > 0 ? variantPrices.length > 0 : Number.isFinite(product.priceEUR) && product.priceEUR > 0
    })
    .slice(0, 4)

  const getServiceSummary = (service: ServiceItem) => {
    const summary = localize(service, 'shortDescription')
    if (typeof summary === 'string' && summary.trim()) return summary.trim()
    const summaries: Record<string, Record<string, string>> = {
      landscaping: { bg: 'Индивидуални проекти и цялостно оформление на красиви градини.', ru: 'Индивидуальные проекты и комплексное оформление красивых садов.', en: 'Tailored designs and complete planning for beautiful gardens.' },
      planting: { bg: 'Професионално засаждане на растения и озеленяване на терени.', ru: 'Профессиональная посадка растений и озеленение участков.', en: 'Professional planting and landscaping for outdoor spaces.' },
      irrigation: { bg: 'Проектиране, монтаж и настройка на автоматизирани системи.', ru: 'Проектирование, монтаж и настройка автоматических систем.', en: 'Design, installation and setup of automatic irrigation systems.' },
      lawn: { bg: 'Подготовка на терена и полагане на естествен тревен чим.', ru: 'Подготовка участка и укладка натурального рулонного газона.', en: 'Ground preparation and installation of natural turf.' },
      maintenance: { bg: 'Грижа за растенията и сезонна поддръжка на градината.', ru: 'Уход за растениями и сезонное обслуживание сада.', en: 'Plant care and seasonal garden maintenance.' },
      delivery: { bg: 'Доставка на оборудване и консултация с инженер.', ru: 'Доставка оборудования и консультация инженера.', en: 'Equipment delivery and consultation with an irrigation engineer.' },
    }
    return summaries[service.serviceCategory || '']?.[language] || ''
  }

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[#F7F8F1] text-slate-800 py-12 md:py-16 px-4">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <img
            {...getSanityImageProps(
              heroImageUrl || 'https://cdn.sanity.io/images/bxvcy0qs/production/460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957.png',
              '100vw',
              1600,
            )}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(247, 248, 241, 0.68)' }}
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight text-[#263323]">
            {t('Градински център Флориал')}
          </h1>
          <h2 className="text-xl md:text-3xl font-bold mb-5 tracking-tight text-[#263323]">
            {t('Професионален ландшафтен дизайн, продажба на растения и поливна техника в Несебър, Равда, Слънчев бряг, Бургас')}
          </h2>
          <p className="text-[#11150F] max-w-4xl mx-auto text-sm md:text-lg leading-relaxed font-semibold">
            {t('Флориал е вашият доверен партньор с над 25 години опит в ландшафтния дизайн, озеленяването и автоматизираните системи за поливане. Проектираме и реализираме уникални градини за частни и обществени обекти „под ключ“ — с внимание към детайла и климатичните особености на региона.')}
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a href={localizedHref('/category/rastenia', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('rastenia'))} className="inline-flex w-4/5 max-w-[208px] items-center justify-start gap-3 rounded-xl bg-[#647746] px-3 py-3 text-left text-base font-bold text-white shadow-lg shadow-[#647746]/20 transition hover:-translate-y-0.5 hover:bg-[#53643A] hover:shadow-xl no-underline sm:w-[208px]">
              {plantRootCategory?.imageUrl && <img {...getSanityImageProps(plantRootCategory.imageUrl, '48px')} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
              <span className="flex-1">{t('Разгледайте растенията')}</span><span aria-hidden="true">→</span>
            </a>
            <a href={localizedHref('/category/vsichko-za-polivane', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('vsichko-za-polivane'))} className="inline-flex w-4/5 max-w-[208px] items-center justify-start gap-3 rounded-xl border-2 border-[#647746] bg-white/95 px-3 py-[10px] text-left text-base font-bold text-[#34452D] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F3F5EC] no-underline sm:w-[208px]">
              {readyKitsCategory?.imageUrl && <img {...getSanityImageProps(readyKitsCategory.imageUrl, '48px')} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
              <span className="flex-1">{t('Поливно оборудване')}</span><span aria-hidden="true">→</span>
            </a>
          </div>
          <a href={localizedHref('/about', language)} className="mt-4 inline-flex text-sm font-semibold text-[#34452D] underline decoration-[#B9C79C] underline-offset-4 transition hover:text-[#263323] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53643A]">{t('Повече за нас')}</a>
        </div>
      </section>

      <section aria-label={t('Предимствата на Florial')} className="border-b border-[#E4E8DA] bg-white px-4 py-5 md:py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {[
            { mark: '25+', title: t('25+ години опит'), detail: t('Професионализъм и опит') },
            { mark: '🌿', title: t('Растения и поливно оборудване'), detail: t('За градината на едно място') },
            { mark: '⌖', title: t('Несебър и региона'), detail: t('Местно обслужване') },
            { mark: '✓', title: t('Проектиране и монтаж'), detail: t('От идеята до реализацията') },
          ].map((item) => <div key={item.title} className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DDE3D0] bg-[#F3F5EC] text-base font-extrabold text-[#647746]">{item.mark}</span>
            <div className="min-w-0"><p className="text-sm font-bold leading-snug text-[#34452D]">{item.title}</p><p className="mt-0.5 text-xs leading-snug text-slate-500">{item.detail}</p></div>
          </div>)}
        </div>
      </section>

      <section className="bg-[#EEF1E4] text-slate-800 py-5 md:py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mt-1 text-left">
            <div className="mb-5">
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                <span className="order-1 block text-[10px] font-bold uppercase tracking-widest text-left text-[#697A49] md:text-xs">{language === 'ru' ? 'Выполняем работы' : language === 'en' ? 'Our services' : 'Извършваме дейности'}</span>
                <h3 className="order-3 col-span-2 mt-0 text-center text-xl font-bold text-slate-900 md:order-2 md:col-span-1 md:whitespace-nowrap md:text-2xl">{t('Професионални решения за градината')}</h3>
                <a href={localizedHref('/services', language)} className="order-2 inline-flex shrink-0 items-center justify-self-end rounded-lg border border-[#B9C79C] bg-white px-3 py-2 text-sm font-bold text-[#34452D] shadow-sm transition hover:border-[#8E9F6C] hover:bg-[#F3F5EC] md:order-3 md:justify-self-end md:px-4 md:font-semibold">
                  {language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги'} →
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {getOrderedServiceEntries(services).slice(0, 6).map((entry) => {
                if (entry.kind === 'delivery') {
                  return (
                    <a key="service-delivery" href={localizedHref('/services/dostavka-poliv', language)} className="overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 shadow-sm backdrop-blur-md flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800 no-underline">
                      <div>
                        <div className="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-[#E9EDDB]">
                          <img
                            {...getSanityImageProps(
                              'https://cdn.sanity.io/images/bxvcy0qs/production/97ebd01d7dc8a7e709720377e58cee7662223b26-1536x1024.jpg',
                              '(min-width: 768px) 33vw, 50vw',
                            )}
                            alt={language === 'ru' ? 'Доставка оборудования и консультация инженера' : language === 'en' ? 'Equipment delivery and engineer consultation' : 'Доставка на оборудване и консултация с инженер'}
                            width={800}
                            height={600}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="p-3 md:p-4">
                          <h4 className="text-sm md:text-xl font-bold mb-1 leading-snug">{language === 'ru' ? 'Доставка оборудования и консультация инженера' : language === 'en' ? 'Equipment delivery & engineer consultation' : 'Доставка на оборудване и консултация с инженер'}</h4>
                          <p className="text-xs leading-relaxed text-slate-600 md:text-sm">{t('Доставка на оборудване и консултация с инженер.')}</p>
                          <span className="mt-3 inline-flex text-xs font-bold text-[#647746]">{t('Научете повече')} →</span>
                        </div>
                      </div>
                    </a>
                  )
                }
                const srv = entry.service
                return (
                  <a
                    key={srv._id}
                    href={localizedHref(`/services/${encodeURIComponent(srv.slug?.current || srv._id)}`, language)}
                    onClick={(event) => handleInternalLinkClick(event, () => onNavigateService(srv.slug?.current, srv._id))}
                    className="overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 shadow-sm backdrop-blur-md flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800 no-underline"
                  >
                    <div>
                      <div className="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-[#E9EDDB]">
                        {srv.imageUrl ? (
                          <img
                            {...getSanityImageProps(srv.imageUrl, '(min-width: 768px) 33vw, 50vw')}
                            alt={localize(srv, 'name')}
                            width={800}
                            height={600}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center">
                            <span className="font-bold text-slate-800 text-xs md:text-base block">{localize(srv, 'name')}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <h4 className="text-sm md:text-xl font-bold mb-1 leading-snug">{localize(srv, 'name')}</h4>
                        {getServiceSummary(srv) && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 md:text-sm">{getServiceSummary(srv)}</p>}
                        <span className="mt-3 inline-flex text-xs font-bold text-[#647746]">{t('Научете повече')} →</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8F1] border-y border-[#E7EBDD]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{t('Растения за вашата градина')}</h3>
            <p className="mt-0 max-w-2xl text-sm md:text-base text-slate-600 sm:max-w-[48%] sm:text-right">{t('Палми, маслини, цитруси, декоративни дървета и цветя — избор за частни градини, хотели и професионално озеленяване.')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {visiblePlantCategories.map((cat, index) => (
              <a key={cat._id} href={localizedHref(`/category/${encodeURIComponent(cat.slug?.current || cat._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(cat.slug?.current, cat._id))} className="group overflow-hidden rounded-xl border border-[#E2E6D8] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9C79C] hover:shadow-md no-underline">
                <div className="relative h-28 sm:h-36 md:h-44 overflow-hidden bg-gradient-to-br from-[#EEF1E4] via-[#F7F7F1] to-[#E7EBD9] flex items-center justify-center">
                  {cat.imageUrl ? (
                    <img
                      {...getSanityImageProps(cat.imageUrl, '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw')}
                      alt={getCategoryImageText(cat, language, 'alt')}
                      title={getCategoryImageText(cat, language, 'title')}
                      width={800}
                      height={600}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : <span aria-hidden="true" className="text-5xl">{['🌴','🫒','🍋','🌲','🌹','🌵','🌳'][index % 7]}</span>}
                </div>
                <div className="p-3 md:p-4">
                  <h4 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-[#647746]">{localize(cat, 'name')}</h4>
                  <span className="mt-2 inline-block text-xs font-semibold text-[#71814F]">{t('Разгледайте')} →</span>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a
              href={localizedHref('/category/rastenia', language)}
              onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('rastenia'))}
              className="inline-flex items-center justify-center rounded-lg bg-[#647746] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#53643A] no-underline"
            >
              {language === 'ru' ? 'Перейти в каталог растений' : language === 'en' ? 'View all plants' : 'Към каталога с растения'} →
            </a>
          </div>
        </div>
      </section>

      {visibleFeaturedPlants.length > 0 && (
        <section className="border-b border-[#E7EBDD] bg-white px-4 py-10 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div><h3 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{t('Избрани растения')}</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{t('Подбрани растения от нашия каталог с актуални цени и наличност.')}</p></div>
              <a href={localizedHref('/category/rastenia', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('rastenia'))} className="inline-flex w-fit items-center text-sm font-bold text-[#647746] no-underline hover:text-[#34452D]">{t('Разгледайте всички растения')} →</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {visibleFeaturedPlants.map((product) => {
                const plantPrice = getPlantPrice(product)!
                const price = plantPrice.price
                const pricePrefix = plantPrice.from ? t('Цена от') + ' ' : ''
                const name = getPlantDisplayName(product, localize(product, 'name'), language)
                const stockStatus = getPlantStockStatus(product)
                const availability = stockStatus === 'inStock' ? t('В наличност') : stockStatus === 'onRequest' ? t('По заявка') : t('Проверете наличността')
                const productSlug = product.slug?.current || product._id
                return <article key={product._id} className="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <a href={localizedHref(`/product/${encodeURIComponent(productSlug)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(productSlug))} className="block text-left no-underline">
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#F7F8F1]">
                      {product.imageUrl ? <img {...getSanityImageProps(product.imageUrl, '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw')} alt={getProductImageText(name, language, 0, 'alt')} loading="lazy" decoding="async" className="h-full w-full object-contain p-2 transition duration-300 hover:scale-[1.02] sm:p-4" /> : <span className="text-sm text-slate-400">{t('Няма снимка')}</span>}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 sm:text-base">{name}</h4>
                      {product.scientificName && <p className="mt-1 line-clamp-1 text-xs italic text-slate-500">{product.scientificName}</p>}
                      <p className="mt-3 text-base font-extrabold text-[#34452D] sm:text-lg">{pricePrefix}{price.toFixed(2)} €</p>
                      {product.vatIncluded === true && <p className="mt-1 text-xs text-slate-500">{t('Цената е с включен ДДС.')}</p>}
                      <p className={`mt-2 text-xs font-semibold ${stockStatus === 'inStock' ? 'text-emerald-700' : 'text-amber-700'}`}>{availability}</p>
                      <span className="mt-3 inline-flex text-sm font-bold text-[#647746]">{t('Виж растението')} →</span>
                    </div>
                  </a>
                </article>
              })}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-5 flex-grow w-full bg-[#EEF1E4]">
        <div className="relative mb-4 flex flex-col items-center gap-3 md:block">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 text-center">{language === 'ru' ? 'Продажа оборудования для полива' : language === 'en' ? 'Irrigation Equipment Sales' : 'Продажба на поливно оборудване'}</h3>
        </div>

        {visibleEquipmentCategories.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
              {visibleEquipmentCategories.map((cat, index) => {
                const isMainCategory = cat.slug?.current === 'vsichko-za-polivane' || index === 0
                return (
                  <a
                    key={cat._id}
                    href={localizedHref(`/category/${encodeURIComponent(cat.slug?.current || cat._id)}`, language)}
                    onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(cat.slug?.current, cat._id))}
                    className={`overflow-hidden rounded-xl border transition cursor-pointer flex flex-col items-center text-center group no-underline ${
                      isMainCategory 
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm hover:shadow-md' 
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-white flex items-center justify-center">
                      {cat.imageUrl ? (
                        <img
                          {...getSanityImageProps(cat.imageUrl, '(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw')}
                          alt={getCategoryImageText(cat, language, 'alt')}
                          title={getCategoryImageText(cat, language, 'title')}
                          width={800}
                          height={600}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">{t('Няма снимка')}</span>
                      )}
                    </div>
                    <div className="w-full p-3 text-center md:p-4">
                      <h4 className={`font-bold text-xs sm:text-sm md:text-base group-hover:text-emerald-700 transition line-clamp-2 ${
                        isMainCategory ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                      }`}>
                        {localize(cat, 'name')}
                      </h4>
                    </div>
                  </a>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <a
                href={localizedHref('/category/vsichko-za-polivane', language)}
                onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('vsichko-za-polivane'))}
                className="inline-flex items-center justify-center rounded-lg bg-[#647746] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#53643A] no-underline"
              >
                {language === 'ru' ? 'Перейти в каталог оборудования' : language === 'en' ? 'View all irrigation equipment' : 'Към каталога с поливно оборудване'} →
              </a>
            </div>
          </div>
        )}

        {visibleFeaturedEquipment.length > 0 && (
          <section className="mt-10 border-t border-[#DDE3D0] pt-8 pb-3">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{language === 'ru' ? 'Избранное оборудование для полива' : language === 'en' ? 'Featured irrigation equipment' : 'Избрано оборудване за поливане'}</h3>
                <p className="mt-1 text-sm text-slate-600">{t('Комплекти за поливане с актуални цени и наличност.')}</p>
              </div>
              <a href={localizedHref('/category/gotovi-komplekti-za-polivane', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('gotovi-komplekti-za-polivane'))} className="inline-flex w-fit items-center text-sm font-bold text-[#53643A] underline decoration-[#B9C79C] underline-offset-4 hover:text-[#34452D]">{t('Разгледайте всички готови комплекти')} →</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {visibleFeaturedEquipment.map((product) => {
                const name = localize(product, 'name')
                const productSlug = product.slug?.current || product._id
                const availability = product.stockStatus === 'inStock' ? t('В наличност') : product.stockStatus === 'outOfStock' ? t('Изчерпан') : t('По заявка')
                return (
                  <article key={product._id} className="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <a href={localizedHref('/product/' + encodeURIComponent(productSlug), language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(productSlug))} className="block text-left no-underline">
                      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#F7F8F1]">
                        <img {...getSanityImageProps(product.imageUrl!, '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw')} alt={getProductImageText(name, language, 0, 'alt')} loading="lazy" decoding="async" className="h-full w-full object-contain p-2 transition duration-300 hover:scale-[1.02] sm:p-4" />
                      </div>
                      <div className="p-3 sm:p-4">
                        <h4 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 sm:text-base">{name}</h4>
                        <p className="mt-3 text-base font-extrabold text-[#34452D] sm:text-lg">{product.priceEUR.toFixed(2)} €</p>
                        {product.vatIncluded === true && <p className="mt-1 text-xs text-slate-500">{t('Цената е с включен ДДС.')}</p>}
                        <p className={"mt-2 text-xs font-semibold " + (product.stockStatus === 'inStock' ? 'text-emerald-700' : 'text-amber-700')}>{availability}</p>
                        <span className="mt-3 inline-flex text-sm font-bold text-[#647746]">{t('Виж комплекта')} →</span>
                      </div>
                    </a>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </section>
      <BlogSection />
    </main>
  )
}
