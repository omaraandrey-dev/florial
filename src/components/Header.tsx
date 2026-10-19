import React from 'react'
import type { ServiceItem, CategoryItem, CartItem } from '../types'

interface HeaderProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  cart: CartItem[]
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
  onNavigateHome,
  onNavigateService,
  onNavigateCategory,
  onNavigateContacts,
  onNavigateCart,
}: HeaderProps) {
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.priceEUR || 0) * item.quantity, 0)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Логотип */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="text-2xl font-black text-emerald-800 tracking-tight">
            FLORIAL<span className="text-emerald-500">.BG</span>
          </span>
        </div>

        {/* Навигация и кнопка корзины */}
        <div className="flex items-center gap-4">
          
          {/* Кнопка Корзины слева от меню */}
          <button
            onClick={onNavigateCart}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold px-3.5 py-2 rounded-xl transition cursor-pointer relative"
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
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md hidden md:inline">
                {totalCartPrice.toFixed(2)} €
              </span>
            )}
          </button>

          {/* Навигационные ссылки */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button onClick={onNavigateHome} className="hover:text-emerald-700 transition cursor-pointer">
              Начало
            </button>
            <button onClick={onNavigateContacts} className="hover:text-emerald-700 transition cursor-pointer">
              Контакти
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
