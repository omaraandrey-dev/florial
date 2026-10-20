import React from 'react'
import { useI18n } from '../lib/i18n'
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
  const { t, language, localize } = useI18n()
  // Сортируем категории так, чтобы главная ("Всичко за поливане") всегда была первой
  const sortedCategories = [...categories].sort((a, b) => {
    const isAAll = a.slug?.current === 'vsichko-za-polivane' || a.name.includes('Всичко за поливане')
    const isBAll = b.slug?.current === 'vsichko-za-polivane' || b.name.includes('Всичко за поливане')
    if (isAAll) return -1
    if (isBAll) return 1
    return (a.sortOrder || 0) - (b.sortOrder || 0)
  })

  return (
    <div>
      <section className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-center">
            {t('Градински център Флориал')}
          </h1>
          <p className="text-emerald-100 max-w-2xl mx-auto mb-10 text-sm md:text-base text-center">
            {localize(siteSettings, 'heroSubtitle') || '{t('Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.')}'}
          </p>

          <div className="mt-8 text-left">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">{t('Нашите услуги и готови комплекти')}</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{t('Професионални решения за градината')}</h3>
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
                        <img src={srv.imageUrl} alt={localize(srv, 'name')} className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-2 text-center">
                          <span className="font-bold text-white text-xs md:text-base block">{localize(srv, 'name')}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm md:text-xl font-bold mb-1 leading-snug">{localize(srv, 'name')}</h4>
                  </div>
                  <div className="pt-2 md:pt-4 border-t border-white/10 flex items-center justify-between mt-2">
                    {srv.startingPriceEUR ? (
                      <span className="text-[10px] md:text-xs text-emerald-200">{t('От')} <strong className="text-white text-xs md:text-base">{srv.startingPriceEUR} €</strong></span>
                    ) : (
                      <span className="text-[10px] md:text-xs text-emerald-300">{t('По оферта')}</span>
                    )}
                    <span className="hidden md:inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                      {t("Детайли →")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">{t('Каталог продукти')}</h3>

        {sortedCategories.length > 0 && (
          <div className="mb-12">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">{t('Изберете категория')}</span>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {sortedCategories.map((cat, index) => {
                const isMainCategory = cat.slug?.current === 'vsichko-za-polivane' || index === 0
                return (
                  <div
                    key={cat._id}
                    onClick={() => onNavigateCategory(cat.slug?.current, cat._id)}
                    className={`rounded-xl p-3 md:p-4 border transition cursor-pointer flex flex-col items-center text-center group ${
                      isMainCategory 
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm hover:shadow-md' 
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="w-full h-24 sm:h-32 md:h-36 bg-slate-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={localize(cat, 'name')} className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300" />
                      ) : (
                        <span className="text-xs text-slate-400">{t('Няма снимка')}</span>
                      )}
                    </div>
                    <h4 className={`font-bold text-xs sm:text-sm md:text-base group-hover:text-emerald-700 transition line-clamp-2 ${
                      isMainCategory ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                    }`}>
                      {cat.name}
                    </h4>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
