import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import { getProductImageText } from '../lib/productImageSeo'
import { getCategoryImageText } from '../lib/categoryImageSeo'
import { getSanityImageProps } from '../lib/sanityImage'
import { resolveCategorySeo } from '../lib/categorySeo'
import { toPlainText } from '../lib/richTextUtils.mjs'

interface CategoryPageProps {
  category: CategoryItem
  products: Product[]
  allCategories: CategoryItem[]
  visibleCategories: CategoryItem[]
  onNavigateHome: () => void
  onNavigateCategory?: (slug?: string, id?: string) => void
  onSelectProduct: (product: Product) => void
}

export function CategoryPage({
  category,
  products,
  allCategories,
  visibleCategories,
  onNavigateHome,
  onNavigateCategory,
  onSelectProduct,
}: CategoryPageProps) {
  const { t, language, localize } = useI18n()
  const isIrrigationCatalog = category.slug?.current === 'vsichko-za-polivane'
  const [plantSearch, setPlantSearch] = useState('')
  const [plantTypeFilter, setPlantTypeFilter] = useState('')
  const [plantLightFilter, setPlantLightFilter] = useState('')
  const [plantWaterFilter, setPlantWaterFilter] = useState('')
  const [plantCoastFilter, setPlantCoastFilter] = useState('')
  const [plantWinterFilter, setPlantWinterFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const productGridRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToProducts = useRef(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [category._id, products, plantSearch, plantTypeFilter, plantLightFilter, plantWaterFilter, plantCoastFilter, plantWinterFilter])

  useEffect(() => {
    if (!shouldScrollToProducts.current) return
    shouldScrollToProducts.current = false
    productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPage])

  // SEO is localized only when this category actually has translated content.
  useEffect(() => {
    if (!category) return
    const localizedName = String(localize(category, 'name') || category.name)
    const localizedDescription = localize(category, 'description')
    const description = typeof localizedDescription === 'string'
      ? localizedDescription
      : `Разгледайте категория ${localizedName} в нашия магазин.`
    const categoryPath = `/category/${encodeURIComponent(category.slug?.current || category._id)}`
    const languageContentExists = (locale: 'ru' | 'en') =>
      Boolean(category.translations?.[locale]?.name && category.translations?.[locale]?.description)
    const alternates: Record<string, string> = {
      bg: new URL(categoryPath, 'https://florial-bg.com').toString(),
      'x-default': new URL(categoryPath, 'https://florial-bg.com').toString(),
    }
    if (languageContentExists('ru')) alternates.ru = new URL(localizedHref(categoryPath, 'ru'), 'https://florial-bg.com').toString()
    if (languageContentExists('en')) alternates.en = new URL(localizedHref(categoryPath, 'en'), 'https://florial-bg.com').toString()

    const localizedSeo = language === 'bg' ? category.seo : category.translations?.[language]?.seo
    const categorySeoContext = {
      _id: category._id,
      name: category.name,
      slug: category.slug?.current,
      description: category.description,
      catalog: category.isPlantCategory ? 'plants' as const : 'irrigation' as const,
      translations: category.translations,
    }
    const resolvedSeo = resolveCategorySeo(localizedSeo, categorySeoContext, language)

    applyPageSeo({
      seo: { ...localizedSeo, metaTitle: resolvedSeo.metaTitle, metaDescription: resolvedSeo.metaDescription },
      language,
      fallbackTitle: resolvedSeo.metaTitle,
      fallbackDescription: resolvedSeo.metaDescription,
      noIndex: Boolean(localizedSeo?.noIndex),
      alternates,
    })

    const catalogRoot = category.isPlantCategory
      ? allCategories.find((item) => item.slug?.current === 'rastenia' || item._id === 'plants-root')
      : allCategories.find((item) => item.slug?.current === 'vsichko-za-polivane')
    const catalogPath = category.isPlantCategory ? '/category/rastenia' : '/category/vsichko-za-polivane'
    const parentCategory = category.parentId ? allCategories.find((item) => item._id === category.parentId) : undefined
    const breadcrumbItems = [
      { name: t('Начало'), item: new URL(localizedHref('/', language), window.location.origin).toString() },
      { name: t('Каталог'), item: new URL(localizedHref(catalogPath, language), window.location.origin).toString() },
      ...(parentCategory && parentCategory._id !== catalogRoot?._id ? [{ name: String(localize(parentCategory, 'name') || parentCategory.name), item: new URL(localizedHref(`/category/${encodeURIComponent(parentCategory.slug?.current || parentCategory._id)}`, language), window.location.origin).toString() }] : []),
      { name: localizedName, item: new URL(localizedHref(categoryPath, language), window.location.origin).toString() },
    ]
    setStructuredData('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.name, item: item.item,
      })),
    })
  }, [category, allCategories, language, localize, t])

  // Показываем только непосредственные дочерние категории текущей категории.
  // Для конечной категории не подставляем соседние разделы каталога.
  const subCategories = useMemo(() => {
    return visibleCategories
      .filter((item) => item.parentId === category._id)
      .sort((a, b) =>
        (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language)
      )
  }, [visibleCategories, category._id, language])

  const catalogGroups = useMemo(() => {
    if (!isIrrigationCatalog) return []
    const preferredOrder = [
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
    return subCategories.slice().sort((a, b) => {
      const ai = preferredOrder.indexOf(a.slug?.current || '')
      const bi = preferredOrder.indexOf(b.slug?.current || '')
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language)
    })
  }, [isIrrigationCatalog, subCategories, language])

  const plantFilterOptions = useMemo(() => ({
    types: [...new Set(products.map((product) => product.productType).filter((value): value is string => Boolean(value)))].sort(),
    lights: [...new Set(products.map((product) => product.plantCare?.light).filter((value): value is string => Boolean(value)))].sort(),
    waterNeeds: [...new Set(products.map((product) => product.plantCare?.waterNeeds).filter((value): value is string => Boolean(value)))].sort(),
    coast: [...new Set(products.map((product) => product.plantCare?.blackSeaCoast).filter((value): value is string => Boolean(value)))].sort(),
    winterTemps: [...new Set(products.map((product) => product.plantCare?.minWinterTempC).filter((value): value is number => typeof value === 'number'))].sort((a, b) => a - b),
  }), [products])

  const getStockIndicator = (product: Product): 'inStock' | 'onRequest' | null => {
    if (product.stockStatus === 'inStock' || product.stockStatus === 'onRequest') return product.stockStatus
    const variantStatuses = (product.saleVariants || []).map((variant) => variant.stockStatus)
    if (variantStatuses.includes('inStock')) return 'inStock'
    if (variantStatuses.includes('onRequest')) return 'onRequest'
    return null
  }

  const getCardPrice = (product: Product) => {
    if (category.isPlantCategory) {
      const pricedVariants = (product.saleVariants || []).filter((variant) => typeof variant.priceEUR === 'number' && variant.priceEUR > 0).sort((x, y) => (x.priceEUR || 0) - (y.priceEUR || 0))
      const lowest = pricedVariants[0]
      return lowest
        ? { label: (language === 'ru' ? 'от ' : language === 'en' ? 'From ' : 'от ') + lowest.priceEUR!.toFixed(2) + ' €', oldValue: typeof lowest.oldPriceEUR === 'number' && lowest.oldPriceEUR > lowest.priceEUR! ? lowest.oldPriceEUR : undefined }
        : { label: language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване' }
    }
    const price = Number(product.priceEUR || 0)
    return { label: price.toFixed(2) + ' €', oldValue: typeof product.oldPriceEUR === 'number' && product.oldPriceEUR > price ? product.oldPriceEUR : undefined }
  }

  const plantFilterLabel = (kind: string, value: string) => {
    const labels: Record<string, Record<string, { bg: string; ru: string; en: string }>> = {
      type: {
        citrus: { bg: 'Цитруси', ru: 'Цитрусовые', en: 'Citrus' },
        conifer: { bg: 'Иглолистни', ru: 'Хвойные', en: 'Conifers' },
        flower: { bg: 'Цветя', ru: 'Цветы', en: 'Flowers' },
        other: { bg: 'Други', ru: 'Другие', en: 'Other' },
        palm: { bg: 'Палми', ru: 'Пальмы', en: 'Palms' },
        perennial: { bg: 'Многогодишни', ru: 'Многолетники', en: 'Perennials' },
        tree: { bg: 'Дървета', ru: 'Деревья', en: 'Trees' },
        shrub: { bg: 'Храсти', ru: 'Кустарники', en: 'Shrubs' },
        indoor: { bg: 'Интериорни', ru: 'Комнатные', en: 'Indoor plants' },
        fruit: { bg: 'Плодни', ru: 'Плодовые', en: 'Fruit plants' },
        succulent: { bg: 'Сукуленти', ru: 'Суккуленты', en: 'Succulents' },
        climber: { bg: 'Катерливи', ru: 'Вьющиеся', en: 'Climbers' },
        ornamentalGrass: { bg: 'Декоративни треви', ru: 'Декоративные травы', en: 'Ornamental grasses' },
        groundcover: { bg: 'Почвопокривни', ru: 'Почвопокровные', en: 'Groundcovers' },
        bulb: { bg: 'Луковични', ru: 'Луковичные', en: 'Bulbs' },
        herb: { bg: 'Билки', ru: 'Травы', en: 'Herbs' },
        aquatic: { bg: 'Водни', ru: 'Водные', en: 'Aquatic plants' },
        plant: { bg: 'Растения', ru: 'Растения', en: 'Plants' },
      },
      light: {
        sun: { bg: 'Слънце', ru: 'Солнце', en: 'Full sun' },
        partialShade: { bg: 'Полусянка', ru: 'Полутень', en: 'Partial shade' },
        shade: { bg: 'Сянка', ru: 'Тень', en: 'Shade' },
      },
      water: {
        low: { bg: 'Ниска', ru: 'Низкая', en: 'Low' },
        medium: { bg: 'Умерена', ru: 'Средняя', en: 'Medium' },
        high: { bg: 'Висока', ru: 'Высокая', en: 'High' },
      },
      coast: {
        suitable: { bg: 'Подходящо', ru: 'Подходит', en: 'Suitable' },
        notSuitable: { bg: 'Неподходящо', ru: 'Не подходит', en: 'Not suitable' },
        needsVerification: { bg: 'Нужна проверка', ru: 'Требует проверки', en: 'Needs verification' },
      },
    }
    return labels[kind]?.[value]?.[language] || value
  }

  const hasActivePlantFilters = Boolean(
    plantSearch.trim() || plantTypeFilter || plantLightFilter ||
    plantWaterFilter || plantCoastFilter || plantWinterFilter
  )

  const resetPlantFilters = () => {
    setPlantSearch('')
    setPlantTypeFilter('')
    setPlantLightFilter('')
    setPlantWaterFilter('')
    setPlantCoastFilter('')
    setPlantWinterFilter('')
  }

  const displayedProducts = useMemo(() => {
    const search = plantSearch.trim().toLocaleLowerCase(language)
    const filtered = [...products]
      .filter((product) => {
        if (search) {
          const searchableText = [
            localize(product, 'name'),
            product.name,
            product.scientificName,
          ].filter(Boolean).join(' ').toLocaleLowerCase(language)
          if (!searchableText.includes(search)) return false
        }
        if (plantTypeFilter && product.productType !== plantTypeFilter) return false
        if (plantLightFilter && product.plantCare?.light !== plantLightFilter) return false
        if (plantWaterFilter && product.plantCare?.waterNeeds !== plantWaterFilter) return false
        if (plantCoastFilter && product.plantCare?.blackSeaCoast !== plantCoastFilter) return false
        if (plantWinterFilter) {
          const minimumTemperature = product.plantCare?.minWinterTempC
          if (typeof minimumTemperature !== 'number' || minimumTemperature > Number(plantWinterFilter)) return false
        }
        return true
      })
      .sort((a, b) =>
        String(localize(a, 'name') || a.name).localeCompare(String(localize(b, 'name') || b.name), language)
      )

    if (!isIrrigationCatalog) return filtered

    // For the all-irrigation storefront, rotate through the six key sales
    // categories so each early page contains a balanced mix of priority goods.
    const prioritySlugs = [
      'controllers',
      'gotovi-komplekti-za-polivane',
      'sprinklers',
      'nozzles',
      'klapani',
      'shahti',
    ]
    const priorityIds = prioritySlugs
      .map((slug) => allCategories.find((item) => item.slug?.current === slug)?._id)
      .filter((id): id is string => Boolean(id))
    const priorityIdSet = new Set(priorityIds)
    const parentById = new Map(allCategories.map((item) => [item._id, item.parentId] as const))

    const getRootCategoryId = (categoryId?: string): string | undefined => {
      let currentId = categoryId
      const visited = new Set<string>()
      while (currentId && !visited.has(currentId)) {
        if (priorityIdSet.has(currentId)) return currentId
        visited.add(currentId)
        const parentId = parentById.get(currentId)
        if (!parentId) return undefined
        if (priorityIdSet.has(parentId)) return parentId
        currentId = parentId
      }
      return undefined
    }

    const buckets = new Map<string, Product[]>()
    priorityIds.forEach((id) => buckets.set(id, []))
    const otherProducts: Product[] = []

    filtered.forEach((product) => {
      const categoryCandidates = [
        product.categoryId,
        ...(product.categories || []).map((item) => item._id),
      ].filter((id): id is string => Boolean(id))
      const matchingPriorityId = categoryCandidates
        .map((id) => getRootCategoryId(id))
        .find((id): id is string => Boolean(id))

      if (matchingPriorityId) buckets.get(matchingPriorityId)?.push(product)
      else otherProducts.push(product)
    })

    // Keep the nozzle queue grouped by Rain Bird series. The existing
    // category round-robin remains unchanged; within the nozzle category,
    // all R-VAN products are served first, then HE-VAN, then VAN, then others.
    const nozzlesCategoryId = allCategories.find((item) => item.slug?.current === 'nozzles')?._id
    const nozzlesBucket = nozzlesCategoryId ? buckets.get(nozzlesCategoryId) : undefined
    if (nozzlesBucket) {
      const getNozzleSeriesRank = (product: Product): number => {
        const productText = [
          product.name,
          localize(product, 'name'),
          product.sku,
        ].filter(Boolean).join(' ').toLocaleUpperCase()
        if (/\bR[\s-]?VAN\b/.test(productText)) return 0
        if (/\bHE[\s-]?VAN\b/.test(productText)) return 1
        if (/\bVAN\b/.test(productText)) return 2
        return 3
      }
      nozzlesBucket.sort((a, b) => getNozzleSeriesRank(a) - getNozzleSeriesRank(b))
    }

    const priorityProducts: Product[] = []
    let hasMorePriorityProducts = true
    while (hasMorePriorityProducts) {
      hasMorePriorityProducts = false
      priorityIds.forEach((id) => {
        const nextProduct = buckets.get(id)?.shift()
        if (nextProduct) {
          priorityProducts.push(nextProduct)
          hasMorePriorityProducts = true
        }
      })
    }

    return [...priorityProducts, ...otherProducts]
  }, [products, allCategories, isIrrigationCatalog, language, localize, plantSearch, plantTypeFilter, plantLightFilter, plantWaterFilter, plantCoastFilter, plantWinterFilter])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / pageSize))

  const goToPage = (page: number) => {
    shouldScrollToProducts.current = true
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }
  const productsToRender = displayedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstVisibleProduct = displayedProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastVisibleProduct = Math.min(currentPage * pageSize, displayedProducts.length)

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Хлебни трохи: начало / каталог / родителска категория / текуща категория */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-y-1 text-sm text-slate-500">
        <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="hover:text-emerald-700 transition-colors no-underline">{t('Начало')}</a>
        <span className="mx-2">/</span>
        <a href={localizedHref(category.isPlantCategory ? '/category/rastenia' : '/category/vsichko-za-polivane', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(category.isPlantCategory ? 'rastenia' : 'vsichko-za-polivane'))} className="hover:text-emerald-700 transition-colors no-underline">{category.isPlantCategory ? (language === 'ru' ? 'Растения' : language === 'en' ? 'Plants' : 'Растения') : t('Каталог')}</a>
        {(() => {
          const parent = category.parentId ? allCategories.find((item) => item._id === category.parentId) : undefined
          const catalogRoot = category.isPlantCategory
            ? allCategories.find((item) => item.slug?.current === 'rastenia' || item._id === 'plants-root')
            : allCategories.find((item) => item.slug?.current === 'vsichko-za-polivane')
          return parent && parent._id !== catalogRoot?._id ? (
            <>
              <span className="mx-2">/</span>
              <a href={localizedHref(`/category/${encodeURIComponent(parent.slug?.current || parent._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(parent.slug?.current, parent._id))} className="hover:text-emerald-700 transition-colors no-underline">{localize(parent, 'name')}</a>
            </>
          ) : null
        })()}
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-800">{localize(category, 'name')}</span>
      </nav>

      {/* Заголовок и изображение категории: две трети контента и одна треть изображения на desktop. */}
      <div className={`mb-6 grid grid-cols-1 items-center gap-6 ${category.imageUrl ? 'lg:grid-cols-3' : ''}`}>
        <div className={category.imageUrl ? 'lg:col-span-2' : ''}>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {resolveCategorySeo(language === 'bg' ? category.seo : category.translations?.[language]?.seo, { _id: category._id, name: category.name, slug: category.slug?.current, description: category.description, catalog: category.isPlantCategory ? 'plants' : 'irrigation', translations: category.translations }, language).h1}
          </h1>
          {category.description && (
            <div className="mt-2 text-slate-600 text-base max-w-3xl">
              {typeof localize(category, 'description') === 'string' ? (
                <p>{localize(category, 'description')}</p>
              ) : (
                <p>{t("Разгледайте продуктите в тази категория.")}</p>
              )}
            </div>
          )}
        </div>
        {category.imageUrl && (
          <div className="hidden overflow-hidden rounded-2xl bg-[#F3F5EC] lg:col-span-1 lg:block">
            <img
              {...getSanityImageProps(category.imageUrl, '(min-width: 1024px) 30vw, 100vw', 960)}
              alt={getCategoryImageText(category, language, 'alt') || ''}
              title={getCategoryImageText(category, language, 'title')}
              loading="eager"
              decoding="async"
              className="aspect-[4/3] max-h-64 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Категории каталога сгруппированы; ссылки открывают отдельные SEO-страницы. */}
      {(isIrrigationCatalog ? catalogGroups : subCategories).length > 0 ? (
        <section
          className="mb-9"
          aria-label={language === 'ru' ? 'Категории каталога' : language === 'en' ? 'Catalogue categories' : 'Категории в каталога'}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {(isIrrigationCatalog ? catalogGroups : subCategories).map((subCat) => {
              const name = String(localize(subCat, 'name') || subCat.name)
              return (
                <a
                  key={subCat._id}
                  href={localizedHref(`/category/${encodeURIComponent(subCat.slug?.current || subCat._id)}`, language)}
                  onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(subCat.slug?.current, subCat._id))}
                  className="group flex min-h-16 min-w-0 items-center gap-2 rounded-xl border border-[#E5E8DC] bg-white p-2 text-slate-800 no-underline shadow-sm transition duration-200 hover:border-[#B9C79C] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#91A66B] focus-visible:ring-offset-2 sm:gap-3 sm:rounded-2xl sm:p-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F3F5EC] sm:h-14 sm:w-14">
                    {subCat.imageUrl ? (
                      <img {...getSanityImageProps(subCat.imageUrl, '56px', 160)} alt={getCategoryImageText(subCat, language, 'alt')} title={getCategoryImageText(subCat, language, 'title')} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-slate-400">
                        {language === 'ru' ? 'Нет фото' : language === 'en' ? 'No photo' : 'Няма снимка'}
                      </div>
                    )}
                  </div>
                  <h2 className="min-w-0 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#647746] sm:text-sm">{name}</h2>
                  <span aria-hidden="true" className="ml-auto shrink-0 text-sm text-[#82936A]">→</span>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {category.isPlantCategory && products.length > 0 && (
        <section className="mb-7 rounded-2xl border border-[#E2E6D8] bg-[#F8F9F4] p-4 md:p-5" aria-label={language === 'ru' ? 'Фильтры растений' : language === 'en' ? 'Plant filters' : 'Филтри за растения'}>
          <details>
            <summary className="cursor-pointer list-none text-base font-semibold text-slate-800">
              <span className="inline-flex items-center gap-2">
                {language === 'ru' ? 'Подобрать растения' : language === 'en' ? 'Find the right plants' : 'Избери подходящи растения'}
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#647746]">
                  {language === 'ru' ? 'Фильтры' : language === 'en' ? 'Filters' : 'Филтри'}
                </span>
              </span>
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Поиск по названию' : language === 'en' ? 'Search by name' : 'Търсене по име'}
                <input
                  type="search"
                  value={plantSearch}
                  onChange={(event) => setPlantSearch(event.target.value)}
                  placeholder={language === 'ru' ? 'Название или латинское имя' : language === 'en' ? 'Common or botanical name' : 'Име или латинско наименование'}
                  className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#91A66B] focus:ring-2 focus:ring-[#DDE6CE]"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Тип растения' : language === 'en' ? 'Plant type' : 'Тип растение'}
                <select value={plantTypeFilter} onChange={(event) => setPlantTypeFilter(event.target.value)} className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal">
                  <option value="">{language === 'ru' ? 'Все типы' : language === 'en' ? 'All types' : 'Всички типове'}</option>
                  {plantFilterOptions.types.map((value) => <option key={value} value={value}>{plantFilterLabel('type', value)}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Освещение' : language === 'en' ? 'Light' : 'Осветеност'}
                <select value={plantLightFilter} onChange={(event) => setPlantLightFilter(event.target.value)} className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal">
                  <option value="">{language === 'ru' ? 'Любое' : language === 'en' ? 'Any' : 'Всички'}</option>
                  {plantFilterOptions.lights.map((value) => <option key={value} value={value}>{plantFilterLabel('light', value)}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Потребность в воде' : language === 'en' ? 'Water needs' : 'Нужда от вода'}
                <select value={plantWaterFilter} onChange={(event) => setPlantWaterFilter(event.target.value)} className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal">
                  <option value="">{language === 'ru' ? 'Любая' : language === 'en' ? 'Any' : 'Всички'}</option>
                  {plantFilterOptions.waterNeeds.map((value) => <option key={value} value={value}>{plantFilterLabel('water', value)}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Подходит для Черноморского побережья' : language === 'en' ? 'Black Sea coast suitability' : 'Подходящо за Черноморието'}
                <select value={plantCoastFilter} onChange={(event) => setPlantCoastFilter(event.target.value)} className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal">
                  <option value="">{language === 'ru' ? 'Все оценки' : language === 'en' ? 'All assessments' : 'Всички оценки'}</option>
                  {plantFilterOptions.coast.map((value) => <option key={value} value={value}>{plantFilterLabel('coast', value)}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                {language === 'ru' ? 'Зимоустойчивость' : language === 'en' ? 'Winter hardiness' : 'Зимоустойчивост'}
                <select value={plantWinterFilter} onChange={(event) => setPlantWinterFilter(event.target.value)} className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-2.5 font-normal">
                  <option value="">{language === 'ru' ? 'Без ограничения' : language === 'en' ? 'Any' : 'Всички растения'}</option>
                  {plantFilterOptions.winterTemps.map((value) => (
                    <option key={value} value={String(value)}>
                      {language === 'ru' ? `Выдерживает до ${value}°C или ниже` : language === 'en' ? `Tolerates ${value}°C or colder` : `Издържа до ${value}°C или по-ниско`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {language === 'ru' ? 'Найдено растений:' : language === 'en' ? 'Plants found:' : 'Намерени растения:'}
                {' '}<strong className="text-slate-900">{displayedProducts.length}</strong>
                {' '}{language === 'ru' ? 'из' : language === 'en' ? 'of' : 'от'}{' '}
                <strong className="text-slate-900">{products.length}</strong>
              </p>
              <button type="button" onClick={resetPlantFilters} disabled={!hasActivePlantFilters} className="rounded-lg border border-[#DDE3D0] bg-white px-4 py-2 text-sm font-semibold text-[#52643A] transition hover:bg-[#EEF1E4] disabled:cursor-not-allowed disabled:opacity-40">
                {language === 'ru' ? 'Сбросить фильтры' : language === 'en' ? 'Clear filters' : 'Изчисти филтрите'}
              </button>
            </div>
          </details>
        </section>
      )}

      {/* Сетка товаров */}
      {displayedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-lg">
            {category.isPlantCategory && products.length > 0
              ? language === 'ru' ? 'По выбранным параметрам растения не найдены.' : language === 'en' ? 'No plants match the selected filters.' : 'Няма растения, които да отговарят на избраните филтри.'
              : 'В тази категория все още няма налични продукти.'}
          </p>
          {category.isPlantCategory && products.length > 0 && (
            <button type="button" onClick={resetPlantFilters} className="mt-4 rounded-lg bg-[#647746] px-5 py-2.5 font-semibold text-white transition hover:bg-[#52643A]">
              {language === 'ru' ? 'Сбросить фильтры' : language === 'en' ? 'Clear filters' : 'Изчисти филтрите'}
            </button>
          )}
          <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="mt-4 inline-block bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors no-underline">
            {t("Към началната страница")}
          </a>
        </div>
      ) : (
        <div ref={productGridRef} id="category-products-grid" className="scroll-mt-24 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {productsToRender.map((product, index) => (
            <a
              key={product._id}
              href={localizedHref(`/product/${encodeURIComponent(product.slug?.current || product._id)}`, language)}
              onClick={(event) => handleInternalLinkClick(event, () => onSelectProduct(product))}
              className="min-w-0 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-2 sm:p-4 flex flex-col justify-between cursor-pointer group no-underline"
            >
              <div>
                <div className="h-32 sm:h-48 bg-slate-50 rounded-lg mb-2 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                  {product.imageUrl ? (
                    <img
                      {...getSanityImageProps(product.imageUrl, '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw')}
                      alt={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'alt')}
                      title={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'title')}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full rounded-md object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-slate-400 text-sm">{t('Няма снимка')}</span>
                  )}
                  {getStockIndicator(product) && (
                    <span
                      aria-label={getStockIndicator(product) === 'inStock' ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност') : (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')}
                      title={getStockIndicator(product) === 'inStock' ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност') : (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')}
                      className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white ${getStockIndicator(product) === 'inStock' ? 'bg-emerald-500' : 'bg-sky-500'}`}
                    />
                  )}
                </div>
                <h3 className="mt-1 mb-1.5 line-clamp-2 break-words text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-base">
                  {localize(product, 'name')}
                </h3>
                <p className="mb-2 line-clamp-2 text-[11px] text-slate-500 sm:mb-3 sm:text-xs">
                  {toPlainText(localize(product, 'shortDescription') || product.shortDescription || '') || t('Висококачествен продукт за поливни системи.')}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2">
                {(() => {
                  const cardPrice = getCardPrice(product)
                  const categoryName = product.categoryTranslations?.[language]?.name || (product.categoryId ? localize(allCategories.find((item) => item._id === product.categoryId), 'name') : undefined) || product.category || localize(category, 'name')
                  return (
                    <>
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        {cardPrice.oldValue !== undefined && <span className="text-[10px] text-slate-400 line-through sm:text-xs">{cardPrice.oldValue.toFixed(2)} €</span>}
                        <span className="text-sm font-bold text-emerald-800 sm:text-lg">{cardPrice.label}</span>
                      </div>
                      <span className="mt-2 block rounded-lg bg-emerald-50 px-2 py-2 text-center text-[11px] font-semibold text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white sm:text-xs">{t("Виж детайли")}</span>
                      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[9px] leading-tight text-slate-400 sm:text-[10px]" title={String(categoryName)}>{categoryName}</p>
                    </>
                  )
                })()}
              </div>
            </a>
          ))}
        </div>
      )}
      {displayedProducts.length > pageSize && (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label={language === 'ru' ? 'Страницы товаров' : language === 'en' ? 'Product pages' : 'Страници с продукти'}>
          <p className="text-xs text-slate-500 sm:text-sm">
            {category.isPlantCategory ? (language === 'ru' ? 'Показаны растения' : language === 'en' ? 'Showing plants' : 'Показани растения') : (language === 'ru' ? 'Показаны товары' : language === 'en' ? 'Showing products' : 'Показани продукти')} {firstVisibleProduct}–{lastVisibleProduct} {language === 'ru' ? 'из' : language === 'en' ? 'of' : 'от'} {displayedProducts.length}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-[#DDE3D0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#F7F8F1] disabled:cursor-not-allowed disabled:opacity-40">{language === 'en' ? 'Previous' : language === 'ru' ? 'Назад' : 'Назад'}</button>
            <span className="min-w-16 text-center text-xs font-semibold text-slate-600">{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg border border-[#DDE3D0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#F7F8F1] disabled:cursor-not-allowed disabled:opacity-40">{language === 'en' ? 'Next' : language === 'ru' ? 'Далее' : 'Напред'}</button>
          </div>
        </nav>
      )}

      {category.helpBlock && (() => {
        const help = language === 'bg' ? category.helpBlock : (category.helpBlock.translations?.[language] || category.helpBlock)
        const isPlantCategory = Boolean(category.isPlantCategory)
        const title = help?.title || (isPlantCategory
          ? (language === 'ru' ? 'Нужна помощь с выбором и посадкой растений?' : language === 'en' ? 'Need help choosing and planting the right plants?' : 'Нуждаете се от помощ при избора и засаждането на растения?')
          : (language === 'ru' ? 'Нужна помощь с подбором и монтажом оборудования для автополива?' : language === 'en' ? 'Need help selecting and installing irrigation equipment?' : 'Нуждаете се от помощ при избора и монтажа на оборудване за автоматично напояване?'))
        const text = help?.text || (isPlantCategory
          ? (language === 'ru' ? 'Свяжитесь с Florial для консультации по выбору растений, подготовке места и профессиональной посадке. Мы поможем подобрать подходящие виды и организовать работы в вашем саду.' : language === 'en' ? 'Contact Florial for advice on plant selection, site preparation and professional planting. We can help choose suitable varieties and arrange the work in your garden.' : 'Свържете се с Florial за консултация при избора на растения, подготовката на мястото и професионалното засаждане. Ще помогнем с подходящите видове и организацията на работата във вашата градина.')
          : (language === 'ru' ? 'Обратитесь к Florial за помощью в подборе оборудования, проектировании и монтаже системы автоматического полива с учётом участка, давления и расхода воды.' : language === 'en' ? 'Contact Florial for help selecting equipment, designing and installing an automatic irrigation system suited to your garden, water pressure and flow.' : 'Свържете се с Florial за помощ при избора на оборудване, проектирането и монтажа на автоматична поливна система според вашата градина, налягането и дебита на водата.'))
        const buttonLabel = help?.buttonLabel || (isPlantCategory
          ? (language === 'ru' ? 'Посадка растений' : language === 'en' ? 'Planting Services' : 'Услуги по засаждане')
          : (language === 'ru' ? 'Монтаж на поливни системи' : language === 'en' ? 'Irrigation Installation' : 'Монтаж на поливни системи'))
        const configuredUrl = typeof category.helpBlock.buttonUrl === 'string' ? category.helpBlock.buttonUrl.trim() : ''
        const buttonUrl = configuredUrl.startsWith('/services/') || configuredUrl.startsWith('/blog/')
          ? configuredUrl
          : (isPlantCategory ? '/services/zasazhdane-na-rasteniya' : '/services/avtomatichno-napoyavane')
        return (
          <section className="mt-12 rounded-2xl border border-[#DDE3D0] bg-[#F3F5EC] p-6 md:p-10">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mb-6 max-w-4xl leading-7 text-slate-700">{text}</p>
            <a href={localizedHref(buttonUrl, language)} className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 no-underline">
              {buttonLabel} →
            </a>
          </section>
        )
      })()}
    </main>
  )
}
