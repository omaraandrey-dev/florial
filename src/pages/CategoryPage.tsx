import React from 'react'
import { CategoryItem, Product } from '../types'

interface CategoryPageProps {
  category: CategoryItem
  products: Product[]
  onNavigateHome: () => void
  onSelectProduct: (product: Product) => void
}

const renderPortableText = (content: any) => {
  if (!content) return null
  if (typeof content === 'string') {
    return <p className="text-slate-700 leading-relaxed mb-4">{content}</p>
  }
  if (Array.isArray(content)) {
    return content.map((block: any, index: number) => {
      if (block._type !== 'block') return null
      const text = block.children?.map((child: any) => child.text).join('') || ''
      return <p key={block._key || index} className="text-slate-700 leading-relaxed mb-4 text-base">{text}</p>
    })
  }
  return null
}

export function CategoryPage({ category, products, onNavigateHome, onSelectProduct }: CategoryPageProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
      <button 
        onClick={onNavigateHome}
        className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
      >
        ← Назад към началната страница
      </button>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row gap-8 items-center">
        {category.imageUrl && (
          <div className="w-full md:w-72 h-48 bg-slate-100 rounded-xl overflow-hidden shrink-0">
            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Категория продукти</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1 mb-3">{category.name}</h1>
          <div className="text-slate-600 text-sm">
            {renderPortableText(category.description)}
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-6">Продукти в категорията</h3>
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          Няма намерени продукти в тази категория в момента.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div 
              key={product._id} 
              onClick={() => onSelectProduct(product)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
            >
              <div>
                <div className="h-40 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-sm overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400">Няма снимка</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                  <span>{product.category || category.name}</span>
                  {product.sku && <span className="text-slate-400">SKU: {product.sku}</span>}
                </div>
                <h4 className="font-bold text-slate-800 mb-2 leading-snug hover:text-emerald-700 transition">{product.name}</h4>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xl font-bold text-emerald-800">{(product.priceEUR || 0).toFixed(2)} €</span>
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer">
                  Преглед
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
