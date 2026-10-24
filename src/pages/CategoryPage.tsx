import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'

interface CategoryPageProps {
  category: CategoryItem
  products: Product[]
  onNavigateHome: () => void
  onNavigateCategory?: (slug?: string, id?: string) => void
  onSelectProduct: (product: Product) => void
}

export function CategoryPage({
  category,
  products,
  onNavigateHome,
  onNavigateCategory,
  onSelectProduct,
}: CategoryPageProps) {
  const { t, language, localize } = useI18n()
  // Локальные фильтры каталога: категория, поиск, бренд и сортировка.
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedSpecification, setSelectedSpecification] = useState('all')
  const [selectedSpecificationValue, setSelectedSpecificationValue] = useState('all')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'price-asc' | 'price-desc'>('name-asc')
  const isIrrigationCatalog = category.slug?.current === 'vsichko-za-polivane'

  // Сбрасываем фильтры при переходе в другую категорию.
  useEffect(() => {
    setSelectedSubCategory('all')
    setSearchTerm('')
    setSelectedBrand('all')
    setSelectedSpecification('all')
    setSelectedSpecificationValue('all')
    setSortOrder('name-asc')
  }, [category?._id])

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
      noIndex: language !== 'bg' && !languageContentExists(language),
      alternates,
    })

    setStructuredData('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('Начало'), item: new URL(localizedHref('/', language), window.location.origin).toString() },
        { '@type': 'ListItem', position: 2, name: localizedName, item: new URL(localizedHref(categoryPath, language), window.location.origin).toString() },
      ],
    })
  }, [category, language, localize, t])

  // Показываем только реальные дочерние категории выбранной категории.
  const subCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string; translations?: Record<string, any> }>()

    products.forEach((product) => {
      product.categories?.forEach((cat: any) => {
        if (cat?._id && cat.parentId === category._id && cat.name) {
          map.set(cat._id, {
            id: cat._id,
            name: cat.name,
            slug: cat.slug?.current,
            translations: cat.translations,
          })
        }
      })

      const parentId = (product as any).categoryParentId
      if (product.categoryId && parentId === category._id && product.category) {
        map.set(product.categoryId, {
          id: product.categoryId,
          name: product.category,
          slug: product.categorySlug,
          translations: product.categoryTranslations,
        })
      }
    })

    return Array.from(map.values())
  }, [products, category])

  const brandOptions = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brand).filter((brand): brand is string => Boolean(brand))))
      .sort((a, b) => a.localeCompare(b, language))
  }, [products, language])

  const specificationOptions = useMemo(() => {
    const names = products.flatMap((product) => {
      const specs = localize(product, 'specifications')
      return Array.isArray(specs) ? specs.map((spec: any) => String(localize(spec, 'name') || spec.name || '')).filter(Boolean) : []
    })
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, language))
  }, [products, language, localize])

  const specificationValueOptions = useMemo(() => {
    if (selectedSpecification === 'all') return []
    const values = products.flatMap((product) => {
      const specs = localize(product, 'specifications')
      if (!Array.isArray(specs)) return []
      return specs
        .filter((spec: any) => String(localize(spec, 'name') || spec.name || '') === selectedSpecification)
        .map((spec: any) => String(localize(spec, 'value') || spec.value || ''))
        .filter(Boolean)
    })
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, language))
  }, [products, selectedSpecification, language, localize])

  // Филтрите работят върху реалните данни от Sanity; не променят каталога в базата.
  const displayedProducts = useMemo(() => {
    let result = selectedSubCategory === 'all'
      ? [...products]
      : products.filter((product) =>
          product.categoryId === selectedSubCategory ||
          product.categories?.some((cat: any) => cat._id === selectedSubCategory)
        )

    const query = searchTerm.trim().toLocaleLowerCase(language)
    if (query) {
      result = result.filter((product) => {
        const searchable = [
          localize(product, 'name'),
          product.sku,
          product.brand,
          localize(product, 'shortDescription'),
        ].map((value) => String(value || '').toLocaleLowerCase(language)).join(' ')
        return searchable.includes(query)
      })
    }

    if (selectedBrand !== 'all') {
      result = result.filter((product) => product.brand === selectedBrand)
    }

    if (selectedSpecification !== 'all') {
      result = result.filter((product) => {
        const specs = localize(product, 'specifications')
        if (!Array.isArray(specs)) return false
        return specs.some((spec: any) => {
          const name = String(localize(spec, 'name') || spec.name || '')
          const value = String(localize(spec, 'value') || spec.value || '')
          return name === selectedSpecification && (selectedSpecificationValue === 'all' || value === selectedSpecificationValue)
        })
      })
    }

    return result.sort((a, b) => {
      if (sortOrder === 'price-asc') return (a.priceEUR || 0) - (b.priceEUR || 0)
      if (sortOrder === 'price-desc') return (b.priceEUR || 0) - (a.priceEUR || 0)
      return String(localize(a, 'name') || a.name).localeCompare(String(localize(b, 'name') || b.name), language)
    })
  }, [products, selectedSubCategory, searchTerm, selectedBrand, selectedSpecification, selectedSpecificationValue, sortOrder, language, localize])

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Хлебные крошки */}
      <nav className="mb-6 flex items-center text-sm text-slate-500">
        <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="hover:text-emerald-700 transition-colors no-underline">
          Начало
        </a>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">{localize(category, 'name')}</span>
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

      {isIrrigationCatalog && (
        <section aria-label={language === 'ru' ? 'Фильтры каталога' : language === 'en' ? 'Catalogue filters' : 'Филтри на каталога'} className="mb-6 rounded-2xl border border-[#DDE3D0] bg-[#F7F8F1] p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm font-semibold text-slate-700">
              {language === 'ru' ? 'Поиск по названию или артикулу' : language === 'en' ? 'Search by name or SKU' : 'Търсене по име или артикул'}
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={language === 'ru' ? 'Например, Rain Bird или A43905' : language === 'en' ? 'For example, Rain Bird or A43905' : 'Например Rain Bird или A43905'}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {language === 'ru' ? 'Бренд' : language === 'en' ? 'Brand' : 'Марка'}
              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">{language === 'ru' ? 'Все бренды' : language === 'en' ? 'All brands' : 'Всички марки'}</option>
                {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {language === 'ru' ? 'Характеристика' : language === 'en' ? 'Specification' : 'Характеристика'}
              <select
                value={selectedSpecification}
                onChange={(event) => { setSelectedSpecification(event.target.value); setSelectedSpecificationValue('all') }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">{language === 'ru' ? 'Все характеристики' : language === 'en' ? 'All specifications' : 'Всички характеристики'}</option>
                {specificationOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {language === 'ru' ? 'Значение' : language === 'en' ? 'Value' : 'Стойност'}
              <select
                value={selectedSpecificationValue}
                onChange={(event) => setSelectedSpecificationValue(event.target.value)}
                disabled={selectedSpecification === 'all'}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="all">{language === 'ru' ? 'Любое значение' : language === 'en' ? 'Any value' : 'Всички стойности'}</option>
                {specificationValueOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {language === 'ru' ? 'Сортировка' : language === 'en' ? 'Sort by' : 'Подреждане'}
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as 'name-asc' | 'price-asc' | 'price-desc')}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="name-asc">{language === 'ru' ? 'Название: А–Я' : language === 'en' ? 'Name: A–Z' : 'Име: А–Я'}</option>
                <option value="price-asc">{language === 'ru' ? 'Сначала дешевле' : language === 'en' ? 'Price: low to high' : 'Цена: възходяща'}</option>
                <option value="price-desc">{language === 'ru' ? 'Сначала дороже' : language === 'en' ? 'Price: high to low' : 'Цена: низходяща'}</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>{language === 'ru' ? 'Найдено товаров: ' + displayedProducts.length : language === 'en' ? 'Products found: ' + displayedProducts.length : 'Намерени продукти: ' + displayedProducts.length}</span>
            {(searchTerm || selectedBrand !== 'all' || selectedSubCategory !== 'all' || selectedSpecification !== 'all' || selectedSpecificationValue !== 'all') && (
              <button type="button" onClick={() => { setSearchTerm(''); setSelectedBrand('all'); setSelectedSubCategory('all'); setSelectedSpecification('all'); setSelectedSpecificationValue('all') }} className="font-semibold text-emerald-800 underline underline-offset-2">
                {language === 'ru' ? 'Сбросить фильтры' : language === 'en' ? 'Clear filters' : 'Изчисти филтрите'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Категории и подкатегории, определённые по связям товаров с Sanity */}
      {subCategories.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {isIrrigationCatalog
              ? (language === 'ru' ? 'Категории оборудования:' : language === 'en' ? 'Equipment categories:' : 'Категории на оборудването:')
              : (language === 'ru' ? 'Подкатегории:' : language === 'en' ? 'Subcategories:' : 'Подкатегории:')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                selectedSubCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Всички ({products.length})
            </button>

            {subCategories.map((subCat) => {
              const isSelected = selectedSubCategory === subCat.id
              return (
                <button
                  key={subCat.id}
                  onClick={() => {
                    // Если передана функция глобального перехода на категорию, можем переходить,
                    // либо фильтровать локально для удобства быстрого просмотра
                    setSelectedSubCategory(subCat.id)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {localize(subCat, 'name')}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Сетка товаров */}
      {displayedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-lg">
            В тази категория все още няма налични продукти.
          </p>
          <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="mt-4 inline-block bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors no-underline">
            {t("Към началната страница")}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <a
              key={product._id}
              href={localizedHref(`/product/${encodeURIComponent(product.slug?.current || product._id)}`, language)}
              onClick={(event) => handleInternalLinkClick(event, () => onSelectProduct(product))}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between cursor-pointer group no-underline"
            >
              <div>
                <div className="h-48 bg-slate-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={localize(product, 'name')}
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
                  {product.category || category.name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {localize(product, 'name')}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                  {localize(product, 'shortDescription') ||
                    t('Висококачествен продукт за поливни системи.')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-800">
                    {(product.priceEUR || 0).toFixed(2)} €
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {t("Виж детайли")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
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
