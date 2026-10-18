import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'

export interface Product {
  _id: string
  name: string
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  imageUrl?: string
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
  description?: any // Portable Text (массив блоков) или строка
  imageUrl?: string
  startingPriceEUR?: number
  isActive?: boolean
  advantages?: Array<{ title: string; description?: string }>
  steps?: Array<{ stepNumber?: number; title: string; description?: string }>
  hero?: { title?: string; subtitle?: string }
  callToAction?: { title?: string; buttonText?: string }
  leadForm?: { formTitle?: string; submitButtonText?: string }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    seoTitle?: string
    seoDescription?: string
    keywords?: string[]
  }
}

export interface SiteSettings {
  siteName?: string
  heroTitle?: string
  heroSubtitle?: string
}

// Вспомогательный рендер для Sanity Portable Text (Rich Text / полное описание)
const renderPortableText = (content: any) => {
  if (!content) return null

  // Если описание заполнено обычной строкой
  if (typeof content === 'string') {
    return <p className="text-slate-700 leading-relaxed mb-4">{content}</p>
  }

  // Если описание — массив блоков Sanity Portable Text
  if (Array.isArray(content)) {
    return content.map((block: any, index: number) => {
      if (block._type !== 'block') return null

      const text = block.children?.map((child: any) => child.text).join('') || ''

      switch (block.style) {
        case 'h2':
          return <h2 key={block._key || index} className="text-2xl font-bold text-slate-900 mt-6 mb-3">{text}</h2>
        case 'h3':
          return <h3 key={block._key || index} className="text-xl font-bold text-slate-800 mt-5 mb-2">{text}</h3>
        case 'h4':
          return <h4 key={block._key || index} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{text}</h4>
        case 'blockquote':
          return (
            <blockquote key={block._key || index} className="border-l-4 border-emerald-600 pl-4 my-4 italic text-slate-600 bg-emerald-50/50 py-2 rounded-r">
              {text}
            </blockquote>
          )
        default:
          if (block.listItem === 'bullet') {
            return (
              <ul key={block._key || index} className="list-disc list-inside text-slate-700 mb-2 pl-2">
                <li>{text}</li>
              </ul>
            )
          }
          return <p key={block._key || index} className="text-slate-700 leading-relaxed mb-4 text-base">{text}</p>
      }
    })
  }

  return null
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Текущий slug открытой услуги
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)

  // Обработка маршрутизации
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/services/')) {
        const slug = path.replace('/services/', '')
        setActiveServiceSlug(slug)
      } else {
        setActiveServiceSlug(null)
      }
    }

    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToService = (slug?: string, id?: string) => {
    const targetSlug = slug || id
    if (!targetSlug) return
    window.history.pushState({}, '', `/services/${targetSlug}`)
    setActiveServiceSlug(targetSlug)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setActiveServiceSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Товары
        const productQuery = `*[_type == "product" && isActive != false] {
          _id,
          name,
          slug,
          sku,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          "imageUrl": mainImage.asset->url,
          shortDescription,
          description,
          specifications,
          "category": category->name
        }`
        const pData = await sanityClient.fetch(productQuery)
        setProducts(pData || [])

        if (pData) {
          const uniqueCats = Array.from(new Set(pData.map((p: Product) => p.category).filter(Boolean))) as string[]
          setCategories(uniqueCats)
        }

        // 2. Услуги с полным описанием и SEO-полями
        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id,
          name,
          slug,
          shortDescription,
          description,
          "imageUrl": image.asset->url,
          startingPriceEUR,
          advantages,
          steps,
          hero,
          callToAction,
          leadForm,
          seo
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

  // Поиск текущей выбранной услуги
  const currentService = services.find(
    s => s.slug?.current === activeServiceSlug || s._id === activeServiceSlug
  )

  // Управление SEO метатегами при смене страниц
  useEffect(() => {
    if (activeServiceSlug && currentService) {
      // Поддержка различных вариантов названия SEO-полей из Sanity
      const seoTitle = currentService.seo?.seoTitle || currentService.seo?.metaTitle || `${currentService.name} | Градински център Флориал`
      const seoDesc = currentService.seo?.seoDescription || currentService.seo?.metaDescription || currentService.shortDescription || ''

      document.title = seoTitle

      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', seoDesc)
    } else {
      document.title = 'Градински център Флориал | Поливни системи и ландшафтен дизайн'
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', siteSettings?.heroSubtitle || 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг.')
      }
    }
  }, [activeServiceSlug, currentService, siteSettings])

  // Страница отдельной услуги
  if (activeServiceSlug && currentService) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
          <button 
            onClick={navigateToHome}
            className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
          >
            ← Назад към началната страница
          </button>

          <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-10">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">Услуга Florial</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">{currentService.name}</h1>

            {currentService.imageUrl && (
              <div className="h-64 md:h-96 w-full bg-slate-100 rounded-xl overflow-hidden mb-8 border border-slate-100">
                <img src={currentService.imageUrl} alt={currentService.name} className="w-full h-full object-cover" />
              </div>
            )}

            {currentService.startingPriceEUR && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-8 flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-900">Начална цена на услугата:</span>
                <span className="text-2xl font-bold text-emerald-800">от {currentService.startingPriceEUR} €</span>
              </div>
            )}

            {/* Вывод КРАТКОГО описания (если оно есть как вступление) */}
            {currentService.shortDescription && (
              <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-600 mb-6 text-slate-700 font-medium leading-relaxed text-lg">
                {currentService.shortDescription}
              </div>
            )}

            {/* Вывод ПОЛНОГО описания услуги из Sanity (Portable Text) */}
            <div className="prose prose-emerald max-w-none mb-8">
              {renderPortableText(currentService.description)}
            </div>

            {/* Блок преимуществ */}
            {currentService.advantages && currentService.advantages.length > 0 && (
              <section className="mt-8 mb-8 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Предимства</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentService.advantages.map((adv, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-emerald-800 mb-1">{adv.title}</h4>
                      {adv.description && <p className="text-xs text-slate-600">{adv.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Блок этапов работы */}
            {currentService.steps && currentService.steps.length > 0 && (
              <section className="mt-8 mb-8 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Етапи на работа</h3>
                <div className="space-y-3">
                  {currentService.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="bg-emerald-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {step.stepNumber || idx + 1}
                      </span>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{step.title}</h5>
                        {step.description && <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
              <p className="text-sm text-slate-500">За повече информация и оглед на място, свържете се с нас.</p>
              <button 
                onClick={() => alert('Формата за контакт ще се отвори тук.')} 
                className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl transition cursor-pointer"
              >
                Заяви консултация
              </button>
            </div>
          </article>
        </main>
      </div>
    )
  }

  // Главная страница
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Шапка */}
      <Header />

      {/* Главный баннер (Hero + Услуги) */}
      <section className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-center">
            Градински център Флориал
          </h1>
          <p className="text-emerald-100 max-w-2xl mx-auto mb-10 text-sm md:text-base text-center">
            {siteSettings?.heroSubtitle || 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.'}
          </p>

          {/* Блок услуг */}
          <div className="mt-8 text-left">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">Нашите услуги и готови комплекти</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Професионални решения за градината</h3>
            </div>

            {/* Сетка услуг: 2 колонки на мобильных, 3 колонки на десктопе */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {services.map(srv => (
                <div 
                  key={srv._id} 
                  onClick={() => navigateToService(srv.slug?.current, srv._id)}
                  className="bg-white/10 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 shadow-lg flex flex-col justify-between hover:bg-white/15 transition cursor-pointer text-white"
                >
                  <div>
                    <div className="h-28 md:h-40 bg-emerald-950/40 rounded-lg mb-2 md:mb-4 flex items-center justify-center overflow-hidden border border-white/10">
                      {srv.imageUrl ? (
                        <img src={srv.imageUrl} alt={srv.name} className="h-full w-full object-cover" />
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

      {/* Каталог товаров */}
      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Каталог продукти</h3>

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
            {filteredProducts.map(product => (
              <div 
                key={product._id} 
                onClick={() => setSelectedProduct(product)}
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
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-contain p-4" />
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
    </div>
  )
}
