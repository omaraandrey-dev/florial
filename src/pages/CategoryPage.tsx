import React, { useEffect, useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'

interface CategoryPageProps {
  category: CategoryItem
  products: Product[]
  allCategories: CategoryItem[]
  onNavigateHome: () => void
  onNavigateCategory?: (slug?: string, id?: string) => void
  onSelectProduct: (product: Product) => void
}

export function CategoryPage({
  category,
  products,
  allCategories,
  onNavigateHome,
  onNavigateCategory,
  onSelectProduct,
}: CategoryPageProps) {
  const { t, language, localize } = useI18n()
  const isIrrigationCatalog = category.slug?.current === 'vsichko-za-polivane'

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

  // Подкатегории берём из дерева категорий Sanity, а не создаём локальные фильтры.
  const subCategories = useMemo(() => {
    const catalogRoot = allCategories.find((item) => item.slug?.current === 'vsichko-za-polivane')
    // На странице подкатегории показываем соседние подкатегории того же родителя.
    const linkGroupId = category.parentId && category.parentId !== catalogRoot?._id
      ? category.parentId
      : category._id
    return allCategories
      .filter((item) => item.parentId === linkGroupId && item._id !== category._id)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language))
  }, [allCategories, category._id, category.parentId, language])

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

  const displayedProducts = useMemo(() => [...products].sort((a, b) =>
    String(localize(a, 'name') || a.name).localeCompare(String(localize(b, 'name') || b.name), language)
  ), [products, language, localize])

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
        <section className="mb-10 space-y-8" aria-label={language === 'ru' ? 'Категории каталога' : language === 'en' ? 'Catalogue categories' : 'Категории в каталога'}>
          {catalogGroups.map((group) => {
            const children = allCategories
              .filter((item) => item.parentId === group._id)
              .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name, language))
            const groupHref = localizedHref(`/category/${encodeURIComponent(group.slug?.current || group._id)}`, language)
            return (
              <section key={group._id} className="rounded-2xl border border-[#E2E6D8] bg-white p-4 md:p-5">
                <a href={groupHref} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(group.slug?.current, group._id))} className="flex items-center gap-4 no-underline">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F3F5EC] sm:h-24 sm:w-28">
                    {group.imageUrl ? <img src={group.imageUrl} alt={localize(group, 'name')} className="h-full w-full object-contain p-2" loading="lazy" /> : null}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{localize(group, 'name')}</h2>
                    <span className="mt-1 inline-block text-sm font-semibold text-[#647746]">{language === 'ru' ? 'Открыть категорию' : language === 'en' ? 'Open category' : 'Разгледай категорията'} →</span>
                  </div>
                </a>
                {children.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {children.map((child) => (
                      <a key={child._id} href={localizedHref(`/category/${encodeURIComponent(child.slug?.current || child._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(child.slug?.current, child._id))} className="rounded-full border border-[#DDE3D0] bg-[#F7F8F1] px-4 py-2 text-sm font-medium text-slate-700 no-underline transition hover:border-[#B9C79C] hover:bg-[#EEF1E4]">
                        {localize(child, 'name')} →
                      </a>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </section>
      ) : subCategories.length > 0 ? (
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{language === 'ru' ? 'Подкатегории:' : language === 'en' ? 'Subcategories:' : 'Подкатегории:'}</p>
          <div className="flex flex-wrap gap-2">
            {subCategories.map((subCat) => (
              <a key={subCat._id} href={localizedHref(`/category/${encodeURIComponent(subCat.slug?.current || subCat._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory?.(subCat.slug?.current, subCat._id))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 no-underline transition hover:border-[#B9C79C] hover:bg-[#F7F8F1]">
                {localize(subCat, 'name')} →
              </a>
            ))}
          </div>
        </div>
      ) : null}

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
