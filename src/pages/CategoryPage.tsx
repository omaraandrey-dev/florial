import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import { getProductImageText } from '../lib/productImageSeo'

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

    applyPageSeo({
      seo: language === 'bg' ? category.seo : undefined,
      language,
      fallbackTitle: `${localizedName} | Florial`,
      fallbackDescription: description,
      noIndex: false,
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
      'controllers', 'sprinklers', 'nozzles', 'shahti', 'klapani',
      'kapkovo-napoyavane', 'trabi-fitingi-aksesoari',
      'drugi-komponenti-za-polivane', 'filtri-regulatori-nalyagane',
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

  const renderCategoryBranch = (parentId: string, depth = 0): React.ReactNode => {
    const children = visibleCategories
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language))
    if (children.length === 0) return null
    return (
      <div className={depth === 0
        ? 'mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3'
        : 'ml-2 mt-2 grid grid-cols-2 gap-2 border-l border-[#E2E6D8] pl-2'
      }>
        {children.map((child) => (
          <div key={child._id} className="min-w-0">
            <a
              href={localizedHref(`/category/${encodeURIComponent(child.slug?.current || child._id)}`, language)}
              onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(child.slug?.current, child._id))}
              className="flex min-h-14 items-center gap-2 rounded-xl border border-[#E5E8DC] bg-white p-2 text-sm font-semibold text-slate-700 no-underline transition hover:border-[#B9C79C] hover:bg-[#F7F8F1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#91A66B]"
            >
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#F3F5EC]">
                {child.imageUrl ? <img src={child.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}
              </span>
              <span className="min-w-0 line-clamp-2 leading-snug">{localize(child, 'name')}</span>
            </a>
            {renderCategoryBranch(child._id, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  const plantFilterOptions = useMemo(() => ({
    types: [...new Set(products.map((product) => product.productType).filter((value): value is string => Boolean(value)))].sort(),
    lights: [...new Set(products.map((product) => product.plantCare?.light).filter((value): value is string => Boolean(value)))].sort(),
    waterNeeds: [...new Set(products.map((product) => product.plantCare?.waterNeeds).filter((value): value is string => Boolean(value)))].sort(),
    coast: [...new Set(products.map((product) => product.plantCare?.blackSeaCoast).filter((value): value is string => Boolean(value)))].sort(),
    winterTemps: [...new Set(products.map((product) => product.plantCare?.minWinterTempC).filter((value): value is number => typeof value === 'number'))].sort((a, b) => a - b),
  }), [products])

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
    return [...products]
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
  }, [products, language, localize, plantSearch, plantTypeFilter, plantLightFilter, plantWaterFilter, plantCoastFilter, plantWinterFilter])

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

      {/* Заголовок категории */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {localize(category, 'name')}
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

      {/* Категории каталога сгруппированы; ссылки открывают отдельные SEO-страницы. */}
      {isIrrigationCatalog ? (
        <section className="mb-10" aria-label={language === 'ru' ? 'Категории каталога' : language === 'en' ? 'Catalogue categories' : 'Категории в каталога'}>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {catalogGroups.map((group) => {
            const children = visibleCategories
              .filter((item) => item.parentId === group._id)
              .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language))
            const groupHref = localizedHref(`/category/${encodeURIComponent(group.slug?.current || group._id)}`, language)
            return (
              <section key={group._id} className="min-w-0 rounded-xl border border-[#E2E6D8] bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-4">
                <a href={groupHref} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(group.slug?.current, group._id))} className="flex min-h-14 items-center gap-2 no-underline sm:gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F3F5EC] sm:h-16 sm:w-16">
                    {group.imageUrl ? <img src={group.imageUrl} alt={localize(group, 'name')} className="h-full w-full object-contain p-1" loading="lazy" decoding="async" /> : null}
                  </div>
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-base">{localize(group, 'name')}</h2>
                    <span className="mt-1 inline-block text-[10px] font-semibold text-[#647746] sm:text-xs">{language === 'ru' ? 'Открыть' : language === 'en' ? 'Open' : 'Разгледай'} →</span>
                  </div>
                </a>
                {children.length > 0 && renderCategoryBranch(group._id)}
              </section>
            )
          })}
          </div>
        </section>
      ) : subCategories.length > 0 ? (
        <section className="mb-9" aria-label={language === 'ru' ? 'Подкатегории растений' : language === 'en' ? 'Plant subcategories' : 'Подкатегории растения'}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{language === 'ru' ? 'Подкатегории:' : language === 'en' ? 'Subcategories:' : 'Подкатегории:'}</p>
          {category.isPlantCategory ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {subCategories.map((subCat) => {
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
                        <img src={subCat.imageUrl} alt={name} title={name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-slate-400">
                          {language === 'ru' ? 'Нет фото' : language === 'en' ? 'No photo' : 'Няма снимка'}
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#647746] sm:text-sm">
                      {name}
                    </span>
                    <span aria-hidden="true" className="ml-auto shrink-0 text-sm text-[#82936A]">→</span>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subCategories.map((subCat) => (
                <a key={subCat._id} href={localizedHref(`/category/${encodeURIComponent(subCat.slug?.current || subCat._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(subCat.slug?.current, subCat._id))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 no-underline transition hover:border-[#B9C79C] hover:bg-[#F7F8F1]">
                  {localize(subCat, 'name')} →
                </a>
              ))}
            </div>
          )}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProducts.map((product) => (
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
                      src={product.imageUrl}
                      alt={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'alt')}
                      title={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'title')}
                      className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-slate-400 text-sm">{t('Няма снимка')}</span>
                  )}
                  {product.stockStatus && (
                    <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                      {localize(product, 'stockStatus')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                  {product.categoryTranslations?.[language]?.name || (product.categoryId ? localize(allCategories.find((item) => item._id === product.categoryId), 'name') : undefined) || product.category || localize(category, 'name')}
                </span>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {localize(product, 'name')}
                </h3>
                <p className="text-slate-500 text-[11px] sm:text-xs line-clamp-2 mb-2 sm:mb-4">
                  {localize(product, 'shortDescription') ||
                    t('Висококачествен продукт за поливни системи.')}
                </p>
              </div>

              <div className="pt-2 sm:pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-xl font-bold text-emerald-800">
                    {category.isPlantCategory
                      ? (() => {
                          const prices = (product.saleVariants || []).map((variant) => variant.priceEUR).filter((price): price is number => typeof price === 'number' && price > 0)
                          return prices.length
                            ? (language === 'ru' ? 'от ' : language === 'en' ? 'From ' : 'от ') + Math.min(...prices).toFixed(2) + ' €'
                            : (language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване')
                        })()
                      : (product.priceEUR || 0).toFixed(2) + ' €'}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {t("Виж детайли")}
                  </span>
                </div>
                {(!category.isPlantCategory || product.saleVariants?.some((variant) => typeof variant.priceEUR === 'number' && variant.priceEUR > 0)) && <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>}
              </div>
            </a>
          ))}
        </div>
      )}

      {!category.isPlantCategory && category.helpBlock && (() => {
        const help = language === 'bg' ? category.helpBlock : (category.helpBlock.translations?.[language] || category.helpBlock)
        const title = help?.title || (language === 'ru' ? 'Наши специалисты помогут вам с установкой системы автополива' : language === 'en' ? 'Our specialists can help install your automatic irrigation system' : 'Нашите специалисти ще ви помогнат с изграждането на система за автоматично напояване')
        const text = help?.text || (language === 'ru' ? 'Обратитесь к нам, чтобы получить помощь в подборе оборудования для вашей системы автоматического полива. Мы можем подготовить проект-схему и выполнить монтаж оборудования на объекте.' : language === 'en' ? 'Contact us for help choosing equipment for your automatic irrigation system. We can prepare an irrigation design plan and install the equipment at your property.' : 'Свържете се с нас за помощ при избора на оборудване за вашата система за автоматично напояване. Можем да изготвим проект и схема и да монтираме оборудването на място.')
        const buttonLabel = help?.buttonLabel || (language === 'ru' ? 'Автоматический полив' : language === 'en' ? 'Automatic irrigation' : 'Автоматично напояване')
        return (
          <section className="mt-12 rounded-2xl border border-[#DDE3D0] bg-[#F3F5EC] p-6 md:p-10">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mb-6 max-w-4xl leading-7 text-slate-700">{text}</p>
            <a href={localizedHref('/services/avtomatichno-napoyavane', language)} className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 no-underline">
              {buttonLabel} →
            </a>
          </section>
        )
      })()}
    </main>
  )
}
