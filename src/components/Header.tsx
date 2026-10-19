import React, { useState } from 'react'
import type { ServiceItem, CategoryItem, CartItem, SiteSettings } from '../types'

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
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.priceEUR || 0) * item.quantity, 0)

  // Путь к изображению (из Sanity или статичный файл из public)
  const logoImageSrc = siteSettings?.logoUrl || '/logo.png' // заменятся автоматически при загрузке из Sanity

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Логотип как ИЗОБРАЖЕНИЕ */}
        {/* Логотип */}
<div 
  onClick={onNavigateHome}
  className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0"
>
  {siteSettings?.logoUrl ? (
    <img 
      src={siteSettings.logoUrl} 
      alt={siteSettings?.siteName || "Florial"} 
      className="h-9 md:h-11 w-auto object-contain"
      onError={(e) => {
        // Если картинка из Sanity не загрузилась, скрываем img и показываем текст
        e.currentTarget.style.display = 'none'
        const fallback = e.currentTarget.nextElementSibling as HTMLElement
        if (fallback) fallback.style.display = 'inline-block'
      }}
    />
  ) : null}

  {/* Текстовый логотип (показывается всегда, если нет картинки из Sanity) */}
  <span 
    style={{ display: siteSettings?.logoUrl ? 'none' : 'inline-block' }}
    className="text-2xl md:text-3xl font-black text-emerald-800 tracking-tight"
  >
    FLORIAL<span className="text-emerald-500">.BG</span>
  </span>
</div>
        {/* Правая часть: Корзина + Главное Меню + Мобильная гамбургер-кнопка */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Кнопка Корзины */}
          <button
            onClick={onNavigateCart}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold px-3 py-2 md:px-3.5 md:py-2 rounded-xl transition cursor-pointer relative flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-emerald-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            <span className="hidden sm:inline text-sm">
              Количка ({totalCartCount})
            </span>
            {totalCartCount > 0 && (
              <span className="sm:hidden bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {totalCartCount}
              </span>
            )}
            {totalCartPrice > 0 && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md hidden lg:inline">
                {totalCartPrice.toFixed(2)} €
              </span>
            )}
          </button>

          {/* Главное Десктопное Меню */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button onClick={onNavigateHome} className="hover:text-emerald-700 transition cursor-pointer">
              Начало
            </button>

            {categories.length > 0 && (
              <div 
                className="relative group"
                onMouseEnter={() => setIsCategoriesOpen(true)}
                onMouseLeave={() => setIsCategoriesOpen(false)}
              >
                <button 
                  onClick={() => onNavigateCategory('vsichko-za-polivane')}
                  className="hover:text-emerald-700 py-2 flex items-center gap-1 transition cursor-pointer"
                >
                  Каталог
                  <span className="text-xs">▾</span>
                </button>
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          onNavigateCategory(cat.slug?.current, cat._id)
                          setIsCategoriesOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {services.length > 0 && (
              <div 
                className="relative group"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <button className="hover:text-emerald-700 py-2 flex items-center gap-1 transition cursor-pointer">
                  Услуги
                  <span className="text-xs">▾</span>
                </button>
                {isServicesOpen && (
                  <div className="absolute top-full left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                    {services.map((srv) => (
                      <button
                        key={srv._id}
                        onClick={() => {
                          onNavigateService(srv.slug?.current, srv._id)
                          setIsServicesOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                      >
                        {srv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={onNavigateContacts} className="hover:text-emerald-700 transition cursor-pointer">
              Контакти
            </button>
          </nav>

          {/* Гамбургер для мобильных */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
            aria-label="Меню"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Выпадающее меню мобильных */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-3 shadow-md">
          <button
            onClick={() => {
              onNavigateHome()
              setIsMenuOpen(false)
            }}
            className="block w-full text-left py-2 font-semibold text-slate-800 hover:text-emerald-700"
          >
            Начало
          </button>

          {categories.length > 0 && (
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Категории
              </span>
              <div className="pl-2 space-y-1 border-l-2 border-emerald-100">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      onNavigateCategory(cat.slug?.current, cat._id)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left py-1.5 text-sm text-slate-700 hover:text-emerald-700"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Услуги
              </span>
              <div className="pl-2 space-y-1 border-l-2 border-emerald-100">
                {services.map((srv) => (
                  <button
                    key={srv._id}
                    onClick={() => {
                      onNavigateService(srv.slug?.current, srv._id)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left py-1.5 text-sm text-slate-700 hover:text-emerald-700"
                  >
                    {srv.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onNavigateContacts()
              setIsMenuOpen(false)
            }}
            className="block w-full text-left py-2 font-semibold text-slate-800 hover:text-emerald-700"
          >
            Контакти
          </button>
        </div>
      )}
    </header>
  )
}
