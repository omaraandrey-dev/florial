import React from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem, CategoryItem, Product, SiteSettings } from '../types'

interface HomePageProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  plantCategories: CategoryItem[]
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
  plantCategories,
  products,
  siteSettings,
  loadingProducts,
  onNavigateService,
  onNavigateCategory,
  onSelectProduct,
}: HomePageProps) {
  const { t, language, localize } = useI18n()
  const sortedPlantCategories = [...plantCategories].sort((a, b) => {
    const aRoot = a._id === 'plants-root' || a.slug?.current === 'rastenia'
    const bRoot = b._id === 'plants-root' || b.slug?.current === 'rastenia'
    if (aRoot && !bRoot) return -1
    if (bRoot && !aRoot) return 1
    return (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'bg')
  })
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
      <section className="bg-[#F7F8F1] text-slate-800 py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-[#71814F] mb-3">{t('Градински център Флориал')}</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-[#263323]">
            {t('Професионален ландшафтен дизайн, продажба на растения и поливна техника в Несебър, Равда, Слънчев бряг, Бургас')}
          </h1>
          <p className="text-slate-600 max-w-4xl mx-auto text-sm md:text-lg leading-relaxed">
            {t('Флориал е вашият доверен партньор с над 25 години опит в ландшафтния дизайн, озеленяването и автоматизираните системи за поливане. Проектираме и реализираме уникални градини за частни и обществени обекти „под ключ“ — с внимание към детайла и климатичните особености на региона.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mt-7 text-left max-w-4xl mx-auto">
            <div className="rounded-xl bg-white/90 border border-[#E5E8DB] p-4 shadow-sm"><span className="font-bold text-[#53643A]">{t('Индивидуален проект')}</span><p className="text-sm text-slate-600 mt-1">{t('според вашите желания')}</p></div>
            <div className="rounded-xl bg-white/90 border border-[#E5E8DB] p-4 shadow-sm"><span className="font-bold text-[#53643A]">{t('Пълен цикъл')}</span><p className="text-sm text-slate-600 mt-1">{t('от концепцията до поддръжката')}</p></div>
            <div className="rounded-xl bg-white/90 border border-[#E5E8DB] p-4 shadow-sm"><span className="font-bold text-[#53643A]">{t('Премиум качество')}</span><p className="text-sm text-slate-600 mt-1">{t('и висок професионализъм')}</p></div>
          </div>
        </div>
      </section>

      <section className="bg-[#EEF1E4] text-slate-800 py-10 md:py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mt-1 text-left">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-[#697A49] uppercase tracking-widest block">{t('Нашите услуги и готови комплекти')}</span>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{t('Професионални решения за градината')}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {services.map(srv => (
                <div 
                  key={srv._id} 
                  onClick={() => onNavigateService(srv.slug?.current, srv._id)}
                  className="bg-white/85 backdrop-blur-md p-3 md:p-6 rounded-xl border border-[#DDE3D0] shadow-sm flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800"
                >
                  <div>
                    <div className="h-28 md:h-40 bg-[#E9EDDB] rounded-lg mb-2 md:mb-4 flex items-center justify-center overflow-hidden border border-[#DDE4CC]">
                      {srv.imageUrl ? (
                        <img src={srv.imageUrl} alt={localize(srv, 'name')} className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-2 text-center">
                          <span className="font-bold text-slate-800 text-xs md:text-base block">{localize(srv, 'name')}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm md:text-xl font-bold mb-1 leading-snug">{localize(srv, 'name')}</h4>
                  </div>
                  <div className="pt-2 md:pt-4 border-t border-[#E2E7D9] flex items-center justify-between mt-2">
                    {srv.startingPriceEUR ? (
                      <span className="text-[10px] md:text-xs text-[#71824F]">{t('От')} <strong className="text-slate-900 text-xs md:text-base">{srv.startingPriceEUR} €</strong></span>
                    ) : (
                      <span className="text-[10px] md:text-xs text-[#71824F]">{t('По оферта')}</span>
                    )}
                    <span className="hidden md:inline-block bg-[#879663] hover:bg-[#71814F] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                      {t("Детайли →")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8F1] border-y border-[#E7EBDD]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{t('Градински център Флориал')}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{t('Растения за вашата градина')}</h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-600">{t('Палми, маслини, цитруси, декоративни дървета и цветя — избор за частни градини, хотели и професионално озеленяване.')}</p>
            </div>
            <button onClick={() => onNavigateCategory('rastenia')} className="shrink-0 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition">
              {t('Разгледайте всички растения')} →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[...plantCategories].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name)).map((cat, index) => (
              <button key={cat._id} onClick={() => onNavigateCategory(cat.slug?.current, cat._id)} className="group overflow-hidden rounded-xl border border-[#E2E6D8] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9C79C] hover:shadow-md">
                <div className="relative h-28 sm:h-36 md:h-44 overflow-hidden bg-gradient-to-br from-[#EEF1E4] via-[#F7F7F1] to-[#E7EBD9] flex items-center justify-center">
                  {cat.imageUrl ? <img src={cat.imageUrl} alt={localize(cat, 'name')} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span aria-hidden="true" className="text-5xl">{['🌴','🫒','🍋','🌲','🌹','🌵','🌳'][index % 7]}</span>}
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-[#647746]">{localize(cat, 'name')}</h3>
                  <span className="mt-2 inline-block text-xs font-semibold text-[#71814F]">{t('Разгледайте')} →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full bg-[#EEF1E4]">
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
                      {localize(cat, 'name')}
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
