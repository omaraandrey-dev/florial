import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { createOrder } from './services/orderService'
import { Header } from './components/Header'

export interface Product {
  _id: string
  name: string
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  mainImage?: any
  category?: string
  stockStatus?: string
  description?: any
  shortDescription?: string
  specifications?: Array<{ name: string; value: string; unit?: string }>
}

export interface ServiceItem {
  _id: string
  name: string
  slug?: { current: string }
  shortDescription?: string
  description?: any
  image?: any
  startingPriceEUR?: number
  isActive?: boolean
  advantages?: Array<{ title: string; description?: string }>
  steps?: Array<{ stepNumber?: number; title: string; description?: string }>
  hero?: { title?: string; subtitle?: string }
  callToAction?: { title?: string; buttonText?: string }
  leadForm?: { formTitle?: string; submitButtonText?: string }
  galleryCount?: number
}

export interface SiteSettings {
  siteName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  heroTitle?: string
  heroSubtitle?: string
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productQuery = `*[_type == "product" && isActive != false] {
          _id, name, slug, sku, priceEUR, oldPriceEUR, stockStatus, mainImage, shortDescription, description, specifications, "category": category->name
        }`
        const pData = await sanityClient.fetch(productQuery)
        setProducts(pData || [])

        if (pData) {
          const uniqueCats = Array.from(new Set(pData.map((p: Product) => p.category).filter(Boolean))) as string[]
          setCategories(uniqueCats)
        }

        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id, name, slug, shortDescription, description, image, startingPriceEUR, advantages, steps, hero, callToAction, leadForm
        }`
        const sData = await sanityClient.fetch(serviceQuery)
        setServices(sData || [])

        const settingsQuery = `*[_type == "siteSettings"][0]`
        const settData = await sanityClient.fetch(settingsQuery)
        setSiteSettings(settData || null)
      } catch (err) {
        console.error('Грешка при зареждане от Sanity:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Подключаем вашу красивую универсальную шапку с логотипом из Sanity */}
      <Header />

      {/* Баннер */}
      <section className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {siteSettings?.heroTitle || 'Професионално напояване и ландшафтен дизайн в Бургас и Слънчев бряг'}
          </h2>
          <p className="text-emerald-100 max-w-2xl mb-6">
            {siteSettings?.heroSubtitle || 'Rain Bird оборудване, капкови маркучи, изграждане на поливни системи и рулонен райграс с гаранция.'}
          </p>
        </div>
      </section>

      {/* Основной контент (каталог) */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-2xl font-bold text-slate-900">Каталог продукти</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                selectedCategory === 'all' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Всички
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  selectedCategory === cat ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <p className="text-slate-500">Зареждане на продукти от Sanity CMS...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-600 font-medium">Няма намерени продукти в тази категория.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product._id} 
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 leading-snug hover:text-emerald-700 transition">{product.name}</h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-800">{(product.priceEUR || 0).toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
