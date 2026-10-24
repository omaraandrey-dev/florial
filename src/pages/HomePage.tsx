import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
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

  useEffect(() => {
    const metadata = language === 'ru'
      ? {
          title: 'Florial — садовый центр и системы автополива в Болгарии',
          description: 'Растения, оборудование для автоматического полива, ландшафтный дизайн и озеленение в Несебре, Равде, Солнечном Береге и Бургасе.',
        }
      : language === 'en'
        ? {
            title: 'Florial — Garden Centre & Irrigation Shop in Bulgaria',
            description: 'Plants, automatic irrigation equipment, landscape design and gardening services in Nessebar, Ravda, Sunny Beach and Burgas.',
          }
        : {
            title: 'Florial — градински център и системи за напояване',
            description: 'Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в Несебър, Равда, Слънчев бряг и Бургас.',
          }
    applyPageSeo({
      fallbackTitle: metadata.title,
      fallbackDescription: metadata.description,
      language,
      alternates: {
        bg: 'https://florial-bg.com/',
        ru: 'https://florial-bg.com/?lang=ru',
        en: 'https://florial-bg.com/?lang=en',
        'x-default': 'https://florial-bg.com/',
      },
    })
  }, [language])
  const sortedPlantCategories = [...plantCategories].sort((a, b) => {
    const aRoot = a._id === 'plants-root' || a.slug?.current === 'rastenia'
    const bRoot = b._id === 'plants-root' || b.slug?.current === 'rastenia'
    if (aRoot && !bRoot) return -1
    if (bRoot && !aRoot) return 1
    return (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'bg')
  })
  // На главной показываем только корневые категории, без подкатегорий.
  const catalogRootId = categories.find((category) => category.slug?.current === 'vsichko-za-polivane')?._id
  const rootCategories = categories.filter((category) => !category.parentId || category.parentId === catalogRootId)
  const categoryOrder = [
    'vsichko-za-polivane',
    'controllers',
    'sprinklers',
    'nozzles',
    'shahti',
    'klapani',
    'kapkovo-napoyavane',
    'trabi-fitingi-aksesoari',
    'drugi-komponenti-za-polivane',
    'filtri-regulatori-nalyagane',
  ]
  const sortedCategories = [...rootCategories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug?.current || '')
    const bIndex = categoryOrder.indexOf(b.slug?.current || '')
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return (a.sortOrder || 999) - (b.sortOrder || 999) || a.name.localeCompare(b.name, 'bg')
  })

  return (
    <div>
      <section className="bg-[#F7F8F1] text-slate-800 py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight text-[#263323]">
            {t('Градински център Флориал')}
          </h1>
          <h2 className="text-xl md:text-3xl font-bold mb-5 tracking-tight text-[#263323]">
            {t('Професионален ландшафтен дизайн, продажба на растения и поливна техника в Несебър, Равда, Слънчев бряг, Бургас')}
          </h2>
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

            <div className="mb-4 flex justify-end">
              <a
                href={localizedHref('/services', language)}
                className="inline-flex items-center rounded-lg border border-[#B9C79C] bg-white px-4 py-2 text-sm font-semibold text-[#53643A] transition hover:bg-[#F3F5EC] no-underline"
              >
                {language === 'ru' ? 'Все услуги' : language === 'en' ? 'All services' : 'Всички услуги'} →
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {services.map(srv => (
                <a
                  key={srv._id}
                  href={localizedHref(`/services/${encodeURIComponent(srv.slug?.current || srv._id)}`, language)}
                  onClick={(event) => handleInternalLinkClick(event, () => onNavigateService(srv.slug?.current, srv._id))}
                  className="bg-white/85 backdrop-blur-md p-3 md:p-6 rounded-xl border border-[#DDE3D0] shadow-sm flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800 no-underline"
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
                </a>
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
            <a href={localizedHref('/category/rastenia', language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory('rastenia'))} className="shrink-0 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition no-underline">
              {t('Разгледайте всички растения')} →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[...plantCategories].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name)).map((cat, index) => (
              <a key={cat._id} href={localizedHref(`/category/${encodeURIComponent(cat.slug?.current || cat._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(cat.slug?.current, cat._id))} className="group overflow-hidden rounded-xl border border-[#E2E6D8] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9C79C] hover:shadow-md no-underline">
                <div className="relative h-28 sm:h-36 md:h-44 overflow-hidden bg-gradient-to-br from-[#EEF1E4] via-[#F7F7F1] to-[#E7EBD9] flex items-center justify-center">
                  {cat.imageUrl ? <img src={cat.imageUrl} alt={localize(cat, 'name')} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span aria-hidden="true" className="text-5xl">{['🌴','🫒','🍋','🌲','🌹','🌵','🌳'][index % 7]}</span>}
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-[#647746]">{localize(cat, 'name')}</h3>
                  <span className="mt-2 inline-block text-xs font-semibold text-[#71814F]">{t('Разгледайте')} →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full bg-[#EEF1E4]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('Каталог продукти')}</h2>
          <a href={localizedHref('/category/vsichko-za-polivane', language)} className="inline-flex w-fit items-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 no-underline">
            {language === 'ru' ? 'Все оборудование для полива' : language === 'en' ? 'Browse all irrigation equipment' : 'Всички продукти за напояване'} →
          </a>
        </div>

        {sortedCategories.length > 0 && (
          <div className="mb-12">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">{t('Изберете категория')}</span>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {sortedCategories.map((cat, index) => {
                const isMainCategory = cat.slug?.current === 'vsichko-za-polivane' || index === 0
                return (
                  <a
                    key={cat._id}
                    href={localizedHref(`/category/${encodeURIComponent(cat.slug?.current || cat._id)}`, language)}
                    onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(cat.slug?.current, cat._id))}
                    className={`rounded-xl p-3 md:p-4 border transition cursor-pointer flex flex-col items-center text-center group no-underline ${
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
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
