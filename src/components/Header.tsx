import React, { useState, useEffect } from 'react'
import { sanityClient } from '../lib/sanity'
import type { ServiceItem, CategoryItem } from '../types'

export interface HeaderProps {
  services: ServiceItem[]
  categories: CategoryItem[]
  onNavigateHome: () => void
  onNavigateService: (slug?: string, id?: string) => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateContacts: () => void
}

export function Header({
  services,
  categories,
  onNavigateHome,
  onNavigateService,
  onNavigateCategory,
  onNavigateContacts,
}: HeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isServicesOpenDropdown, setIsServicesOpenDropdown] = useState(false)
  const [isCatalogOpenDropdown, setIsCatalogOpenDropdown] = useState(false)

  useEffect(() => {
    const logoQuery = `*[defined(image.asset) && (category == "home" || title match "*Logo*" || title match "*лого*")][0]{
      "url": image.asset->url
    }`
    sanityClient.fetch(logoQuery).then((data) => {
      if (data?.url) setLogoUrl(data.url)
    })
  }, [])

  return (
    <header className="bg-amber-100/90 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50 shadow-sm h-16 flex items-center justify-between px-0">
      <div 
        onClick={() => { onNavigateHome(); setIsMenuOpen(false); }} 
        className="h-full flex items-center bg-white border-r border-amber-200 px-3 cursor-pointer shrink-0"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Градински център Флориал" className="h-12 object-contain" />
        ) : (
          <span className="font-bold text-emerald-900 text-sm">Флориал</span>
        )}
      </div>

      <div className="flex items-center px-4">
        <h2 className="text-amber-950 font-bold text-sm md:text-lg tracking-wide hidden sm:block mr-4">
          Градински център Флориал
        </h2>

        <div className="relative">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            className="p-2 text-slate-800 hover:text-emerald-800 focus:outline-none flex items-center gap-2 cursor-pointer"
          >
            <div className="space-y-1.5 w-7 pointer-events-none">
              <div className="h-0.5 bg-slate-900 w-full"></div>
              <div className="h-0.5 bg-slate-900 w-full"></div>
              <div className="h-0.5 bg-slate-900 w-full"></div>
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800">
              <button 
                type="button"
                onClick={() => { onNavigateHome(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 font-bold hover:bg-slate-50 transition border-b border-slate-100 cursor-pointer"
              >
                Начална страница
              </button>

              <div className="border-b border-slate-100">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsServicesOpenDropdown(!isServicesOpenDropdown)
                  }}
                  className="w-full text-left px-4 py-2.5 font-bold hover:bg-slate-50 transition flex justify-between items-center cursor-pointer"
                >
                  <span>Услуги</span>
                  <span className="text-xs">{isServicesOpenDropdown ? '▲' : '▼'}</span>
                </button>
                {isServicesOpenDropdown && (
                  <div className="bg-slate-50 py-1 pl-4 space-y-1">
                    {services.map(srv => (
                      <button
                        key={srv._id}
                        type="button"
                        onClick={() => {
                          onNavigateService(srv.slug?.current, srv._id)
                          setIsMenuOpen(false)
                          setIsServicesOpenDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition block truncate cursor-pointer"
                      >
                        • {srv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-b border-slate-100">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCatalogOpenDropdown(!isCatalogOpenDropdown)
                  }}
                  className="w-full text-left px-4 py-2.5 font-bold hover:bg-slate-50 transition flex justify-between items-center cursor-pointer"
                >
                  <span>Каталог</span>
                  <span className="text-xs">{isCatalogOpenDropdown ? '▲' : '▼'}</span>
                </button>
                {isCatalogOpenDropdown && (
                  <div className="bg-slate-50 py-1 pl-4 max-h-60 overflow-y-auto space-y-1">
                    {categories.map(cat => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          onNavigateCategory(cat.slug?.current, cat._id)
                          setIsMenuOpen(false)
                          setIsCatalogOpenDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition block truncate cursor-pointer"
                      >
                        • {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={() => { onNavigateContacts(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Контакти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
