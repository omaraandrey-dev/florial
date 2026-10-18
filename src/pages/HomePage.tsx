import React from 'react'
import type { ServiceItem, CategoryItem, Product, SiteSettings } from '../types'

interface HomePageProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  products: Product[]
  siteSettings: SiteSettings | null
  loadingProducts: boolean
  onNavigateService: (slug?: string, id?: string) => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onSelectProduct: (product: Product) => void
}

export function HomePage({
  services,
  categories,
  products,
  siteSettings,
  loadingProducts,
  onNavigateService,
  onNavigateCategory,
  onSelectProduct,
}: HomePageProps) {
  return (
    <div>
      <section className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-center">
            Градински център Флориал
          </h1>
          <p className="text-emerald-100 max-w-2xl mx-auto mb-10 text-sm md:text-base text-center">
            {siteSettings?.heroSubtitle || 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.'}
          </p>

          <div className="mt-8 text-left">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">Нашите услуги и готови комплекти</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Професионални решения за градината</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {services.map(srv => (
                <div 
                  key={srv._id} 
                  onClick={() => onNavigateService(srv.slug?.current, srv._id)}
                  className="bg-white/10 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 shadow-lg flex flex-col justify-between hover:bg-white/15 transition cursor-pointer text-white"
                >
                  <div>
                    <div className="h-28 md:h-40 bg-emerald-950/40 rounded-lg mb-2 md:mb-4 flex items-center justify-center overflow-hidden border border-white/10">
                      {srv.imageUrl ? (
                        <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-2 text-center">
                          <span className="font-bold text-white text-xs md:text-base block">{srv.name}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm md:text-xl font-bold mb-1 leading-snug">{srv.name}</h4>
                  </div>
                  <div className="pt-2 md:pt-4 border-t border-white/10 flex items-center justify-between mt-2">
                    {srv.startingPriceEUR ? (
                      <span className="text-[10px] md:text-xs text-emerald-200">От <strong className="text-white text-xs md:text-base">{srv.startingPriceEUR} €</strong></span>
                    ) : (
                      <span className="text-[10px] md:text-xs text-emerald-300">По оферта</span>
                    )}
                    <span className="hidden md:inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                      Детайли →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Каталог продукти</h3>

        {categories.length > 0 && (
          <div className="mb-12">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Изберете категория</span>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {categories.map(cat => (
                <div
                  key={cat._id}
                  onClick={() => onNavigateCategory(cat.slug?.current, cat._id)}
                  className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
                >
                  <div className="w-full h-24 sm:h-32 md:h-36 bg-slate-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <span className="text-xs text-slate-400">Няма снимка</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm md:text-base text-slate-800 group-hover:text-emerald-700 transition line-clamp-2">
                    {cat.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-slate-800">Всички продукти</h4>
        </div>

        {loadingProducts ? (
          <p className="text-slate-500">Зареждане на продукти от Sanity CMS...</p>
        ) : products.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-600 font-medium">Няма намерени продукти.</p>
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
                    <span>{product.category || 'Оборудване'}</span>
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
    </div>
  )
}
