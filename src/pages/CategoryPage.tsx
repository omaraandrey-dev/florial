import React, { useEffect } from 'react'
import type { CategoryItem, Product } from '../types'

interface CategoryPageProps {
  category: CategoryItem
  products: Product[]
  onNavigateHome: () => void
  onSelectProduct: (product: Product) => void
}

export function CategoryPage({
  category,
  products,
  onNavigateHome,
  onSelectProduct,
}: CategoryPageProps) {
  // Динамическое обновление SEO-метаданных для страницы категории
  useEffect(() => {
    if (!category) return

    // Формирование заголовка страницы
    const pageTitle =
      category.seo?.seoTitle ||
      category.seo?.metaTitle ||
      `${category.name} | Флориал`
    document.title = pageTitle

    // Формирование мета-описания
    let descriptionMeta = document.querySelector('meta[name="description"]')
    const descriptionText =
      category.seo?.seoDescription ||
      category.seo?.metaDescription ||
      (typeof category.description === 'string'
        ? category.description
        : `Разгледайте категория ${category.name} в нашия магазин.`)

    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }
    descriptionMeta.setAttribute('content', descriptionText)
  }, [category])

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Хлебные крошки / Навигация назад */}
      <nav className="mb-6 flex items-center text-sm text-slate-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-emerald-700 transition-colors cursor-pointer"
        >
          Начало
        </button>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">{category.name}</span>
      </nav>

      {/* Заголовок категории */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <div className="mt-2 text-slate-600 text-base max-w-3xl">
            {typeof category.description === 'string' ? (
              <p>{category.description}</p>
            ) : (
              /* Рендеринг Portable Text, если используется структурированный контент Sanity */
              <p>Разгледайте продуктите в тази категория.</p>
            )}
          </div>
        )}
      </div>

      {/* Сетка товаров */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-lg">
            В тази категория все още няма налични продукти.
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-4 inline-block bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Към началната страница
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
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
                      alt={product.name}
                      className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-slate-400 text-sm">Няма снимка</span>
                  )}
                  {product.stockStatus && (
                    <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                      {product.stockStatus}
                    </span>
                  )}
                </div>
                <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                  {product.category || category.name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                  {product.shortDescription || 'Висококачествен продукт за поливни системи.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xl font-bold text-emerald-800">
                  {(product.priceEUR || 0).toFixed(2)} €
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  Виж детайли
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
