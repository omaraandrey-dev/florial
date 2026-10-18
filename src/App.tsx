import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'

// Правильная функция генерации CDN-ссылок на картинки Sanity для нашего проекта
const urlFor = (source: any) => {
  if (!source || !source.asset || !source.asset._ref) return ''
  const ref = source.asset._ref // Пример: image-a1b2c3d4e5f6-800x600-png
  const parts = ref.split('-')
  if (parts.length < 4) return ''
  const id = parts[1]
  const dimensions = parts[2]
  const format = parts[3]
  
  // Строго используем правильный ID проекта и датасет
  const projectId = 'kjkc2aazayha1zdg3opyp8uc'
  const dataset = 'production'
  
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`
}

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
        // 1. Товары
        const productQuery = `*[_type == "product" && isActive != false] {
          _id, name, slug, sku, priceEUR, oldPriceEUR, stockStatus, mainImage, shortDescription, description, specifications, "category": category->name
        }`
        const pData = await sanityClient.fetch(productQuery)
        setProducts(pData || [])

        if (pData) {
          const uniqueCats = Array.from(new Set(pData.map((p: Product) => p.category).filter(Boolean))) as string[]
          setCategories(uniqueCats)
        }

        // 2. Услуги
        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id, name, slug, shortDescription, description, image, startingPriceEUR, advantages, steps, hero, callToAction, leadForm
        }`
        const sData = await sanityClient.fetch(serviceQuery)
        setServices(sData || [])

        // 3. Настройки сайта
        const settingsQuery = `*[_type == "siteSettings"][0]`
        const settData = await sanityClient.fetch(settingsQuery)
        setSiteSettings(settData || null)
      } catch (err) {
        console.error('Ошибка при загрузке из Sanity:', err)
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
      {/* Динамическая шапка с логотипом из Sanity */}
      <Header />

      {/* Главный баннер */}
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

      {/* Раздел товаров */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-2xl font-bold text-slate-900">Каталог продукти</h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Всички
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-emerald-800 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
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
            {filteredProducts.map(product => {
              const imageUrl = urlFor(product.mainImage)
              return (
                <div 
                  key={product._id} 
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="h-40 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-sm overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="h-full w-full object-contain p-2" />
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
              )
            })}
          </div>
        )}

        {/* Раздел Услуги */}
        <section className="bg-emerald-50/50 border-t border-b border-emerald-100 py-12 px-4 mt-12 rounded-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Професионални услуги Florial</span>
              <h3 className="text-3xl font-bold text-slate-900 mt-1 mb-3">Услуги и Готови комплекти</h3>
              <p className="text-slate-600 text-sm">
                Проектиране, монтаж и поддръжка за поливни системи и озеленяване в района на Бургас и Слънчев бряг.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(srv => {
                const srvImageUrl = urlFor(srv.image)
                return (
                  <div 
                    key={srv._id} 
                    onClick={() => setSelectedService(srv)}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer"
                  >
                    <div>
                      <div className="h-44 bg-emerald-100/60 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {srvImageUrl ? (
                          <img src={srvImageUrl} alt={srv.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="p-3 text-center">
                            <span className="font-bold text-emerald-900 text-lg block">{srv.name}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-xl font-bold text-slate-800 mb-2">{srv.name}</h4>
                      <p className="text-sm text-slate-600 mb-4">{srv.shortDescription}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {srv.startingPriceEUR ? (
                          <span className="text-xs text-slate-500">От <strong className="text-slate-800 text-base">{srv.startingPriceEUR} €</strong></span>
                        ) : (
                          <span className="text-xs text-slate-400">По оферта</span>
                        )}
                      </div>

                      <button className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer">
                        Заяви консултация
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Модальное окно просмотра товара */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">{selectedProduct.category || 'Оборудване'}</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{selectedProduct.name}</h3>
            {selectedProduct.sku && <p className="text-sm text-slate-400 mb-4">Артикул (SKU): {selectedProduct.sku}</p>}

            <div className="h-64 bg-slate-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
              {urlFor(selectedProduct.mainImage) ? (
                <img src={urlFor(selectedProduct.mainImage)} alt={selectedProduct.name} className="h-full w-full object-contain p-4" />
              ) : (
                <span className="text-slate-400 text-sm">Няма снимка</span>
              )}
            </div>

            <p className="text-slate-600 text-sm mb-6">{selectedProduct.shortDescription || 'Няма допълнително описание.'}</p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-2xl font-bold text-emerald-800">{(selectedProduct.priceEUR || 0).toFixed(2)} €</span>
              <button onClick={() => setSelectedProduct(null)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра услуги */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Услуга Florial</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{selectedService.name}</h3>

            {urlFor(selectedService.image) && (
              <div className="h-56 bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img src={urlFor(selectedService.image)} alt={selectedService.name} className="h-full w-full object-cover" />
              </div>
            )}

            <p className="text-slate-600 text-sm mb-6">{selectedService.shortDescription}</p>

            <button onClick={() => setSelectedService(null)} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg">
              Затвори
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
