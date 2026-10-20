import React, { useState } from 'react'
import { useI18n, type Language } from '../lib/i18n'
import type {
  ServiceItem,
  CategoryItem,
  CartItem,
  SiteSettings,
} from '../types'

interface HeaderProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  cart: CartItem[]
  siteSettings?: SiteSettings | null
  onNavigateHome: () => void
  onNavigateService: (slug?: string, id?: string) => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateContacts: () => void
  onNavigateCart: () => void
  onSearch: (query: string) => void
}

export function Header({
  services,
  categories,
  cart,
  siteSettings,
  onNavigateHome,
  onNavigateService,
  onNavigateCategory,
  onNavigateContacts,
  onNavigateCart,
  onSearch,
}: HeaderProps) {
  const { t, language, setLanguage } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + (item.product.priceEUR || 0) * item.quantity,
    0
  )

  const logoImageSrc = siteSettings?.logoUrl || '/logo.png'

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsCategoriesOpen(false)
    setIsServicesOpen(false)
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    closeMenu()
    onSearch(query)
  }

  const toggleCategories = () => {
    setIsCategoriesOpen((previous) => !previous)
    setIsServicesOpen(false)
  }

  const toggleServices = () => {
    setIsServicesOpen((previous) => !previous)
    setIsCategoriesOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="w-full px-3 sm:px-5 lg:px-8">
        <div className="grid min-h-[84px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-2 sm:gap-3 sm:py-3 md:min-h-[120px] md:gap-6 md:py-4">
          {/* Logo: увеличен и прижат к левому краю контейнера */}
          <button
            type="button"
            onClick={() => {
              closeMenu()
              onNavigateHome()
            }}
            aria-label="Florial — начална страница"
            className="flex h-full min-w-0 shrink-0 items-center justify-start text-left"
          >
            {siteSettings?.logoUrl ? (
              <img
                src={logoImageSrc}
                alt={siteSettings?.siteName || 'Florial'}
                className="block h-[60px] max-w-[100px] object-contain object-left sm:h-[78px] sm:max-w-[160px] md:h-[100px] md:max-w-[230px]"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span className="text-lg font-black tracking-tight text-emerald-800 sm:text-2xl md:text-3xl">
                FLORIAL<span className="text-emerald-500">.BG</span>
              </span>
            )}
          </button>

          {/* Поиск товаров по центру */}
          <form onSubmit={submitSearch} role="search" className="mx-auto flex w-full max-w-2xl items-center">
            <div className="flex w-full items-center overflow-hidden rounded-xl border border-slate-300 bg-slate-50 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
              <svg className="ml-3 h-5 w-5 shrink-0 text-slate-500 sm:ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('Търсене на продукти...')}
                aria-label={t('Търсене на продукти')}
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:px-3 sm:text-base"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="m-1 shrink-0 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                <span className="hidden sm:inline">{t('Търси')}</span>
                <svg className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>

          {/* Количка и меню */}
          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                closeMenu()
                onNavigateCart()
              }}
              aria-label={`Количка: ${totalCartCount} продукта`}
              className="relative flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-emerald-900 transition hover:bg-emerald-100 md:h-12 md:px-4"
            >
              <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M3 3h2l2.5 11h10l3-8H6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              <span className="hidden text-sm font-semibold lg:inline">{t('Количка')}</span>
              <span className="text-sm font-bold">{totalCartCount}</span>
              {totalCartPrice > 0 && (
                <span className="hidden rounded-md bg-emerald-200/60 px-2 py-0.5 text-xs font-extrabold text-emerald-800 xl:inline">
                  {totalCartPrice.toFixed(2)} €
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((previous) => !previous)
                setIsCategoriesOpen(false)
                setIsServicesOpen(false)
              }}
              aria-label={isMenuOpen ? (language === 'en' ? 'Close menu' : language === 'ru' ? 'Закрыть меню' : 'Затвори менюто') : (language === 'en' ? 'Open menu' : language === 'ru' ? 'Открыть меню' : 'Отвори менюто')}
              aria-expanded={isMenuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700 md:h-12 md:w-12"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Меню по умолчанию скрыто; подкатегории раскрываются отдельно */}
      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-slate-200 bg-white shadow-xl">
          <nav aria-label={language === 'en' ? 'Main navigation' : language === 'ru' ? 'Главная навигация' : 'Главна навигация'} className="mx-auto max-h-[calc(100vh-140px)] w-full max-w-7xl overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => { closeMenu(); onNavigateHome() }}
              className="flex w-full items-center rounded-lg px-4 py-3 text-left font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              Начало
            </button>

            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={toggleCategories}
                aria-expanded={isCategoriesOpen}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span>{t('Продукти')}</span>
                <svg className={`h-5 w-5 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isCategoriesOpen && (
                <div className="mb-3 ml-4 space-y-1 border-l-2 border-emerald-200 pl-3">
                  <button
                    type="button"
                    onClick={() => { closeMenu(); onNavigateCategory('vsichko-za-polivane') }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    {t("Всички продукти")}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => { closeMenu(); onNavigateCategory(category.slug?.current, category._id) }}
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={toggleServices}
                aria-expanded={isServicesOpen}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span>{t('Услуги')}</span>
                <svg className={`h-5 w-5 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isServicesOpen && (
                <div className="mb-3 ml-4 space-y-1 border-l-2 border-emerald-200 pl-3">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => { closeMenu(); onNavigateService(service.slug?.current, service._id) }}
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => { closeMenu(); onNavigateContacts() }}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                {t("Контакти")}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M7 17 17 7M7 7h10v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-3 border-t border-slate-100 px-4 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('Език')}</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'bg', label: 'Български', short: 'BG' },
                  { value: 'en', label: 'Английски', short: 'EN' },
                  { value: 'ru', label: 'Руски', short: 'RU' },
                ] as { value: Language; label: string; short: string }[]).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLanguage(item.value)}
                    aria-pressed={language === item.value}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${language === item.value ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}
                  >
                    <span className="block">{item.short}</span>
                    <span className="text-xs font-normal">{t(item.label)}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
