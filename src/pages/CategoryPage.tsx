import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo } from '../lib/seo'

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
  // Выбранный локальный фильтр по подкатегории ("all" = все товары текущей категории)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all')

  // Сбрасываем локальный фильтр при смене основной категории
  useEffect(() => {
    setSelectedSubCategory('all')
  }, [category?._id])

  // Use the same canonical Sanity SEO fields as the Studio schema: metaTitle/metaDescription.
  useEffect(() => {
    if (!category) return
    const localizedDescription = localize(category, 'description')
    applyPageSeo({
      seo: localize(category, 'seo'),
      fallbackTitle: `${localize(category, 'name')} | Florial`,
      fallbackDescription: typeof localizedDescription === 'string'
        ? localizedDescription
        : `Разгледайте категория ${localize(category, 'name')} в нашия магазин.`,
    })
  }, [category, language, localize])

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

  // Фильтрираме по ID, за да не зависи резултатът от езика на интерфейса.
  const displayedProducts = useMemo(() => {
    if (selectedSubCategory === 'all') return products

    return products.filter((product) =>
      product.categoryId === selectedSubCategory ||
      product.categories?.some((cat: any) => cat._id === selectedSubCategory)
    )
  }, [products, selectedSubCategory])

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Хлебные крошки */}
      <nav className="mb-6 flex items-center text-sm text-slate-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-emerald-700 transition-colors cursor-pointer"
        >
          Начало
        </button>
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

      {/* Кнопки переключения подкатегорий (выводятся, если найдена хотя бы одна подкатегория) */}
      {subCategories.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Подкатегории:
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
          <button
            onClick={onNavigateHome}
            className="mt-4 inline-block bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            {t("Към началната страница")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => onSelectProduct(product)}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between cursor-pointer group"
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

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xl font-bold text-emerald-800">
                  {(product.priceEUR || 0).toFixed(2)} €
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {t("Виж детайли")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
