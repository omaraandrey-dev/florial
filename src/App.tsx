import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'

export interface CategoryItem {
  _id: string
  name: string
  slug?: { current: string }
  imageUrl?: string
  description?: any
  seo?: {
    metaTitle?: string
    metaDescription?: string
    seoTitle?: string
    seoDescription?: string
  }
}

export interface Product {
  _id: string
  name: string
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  imageUrl?: string
  category?: string
  categoryId?: string
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
  }
}

export interface SiteSettings {
  siteName?: string
  heroTitle?: string
  heroSubtitle?: string
}

// Рендер Portable Text
const renderPortableText = (content: any) => {
  if (!content) return null
  if (typeof content === 'string') {
    return <p className="text-slate-700 leading-relaxed mb-4">{content}</p>
  }
  if (Array.isArray(content)) {
    return content.map((block: any, index: number) => {
      if (block._type !== 'block') return null
      const text = block.children?.map((child: any) => child.text).join('') || ''
      switch (block.style) {
        case 'h2':
          return <h2 key={block._key || index} className="text-2xl font-bold text-slate-900 mt-6 mb-3">{text}</h2>
        case 'h3':
          return <h3 key={block._key || index} className="text-xl font-bold text-slate-800 mt-5 mb-2">{text}</h3>
        default:
          return <p key={block._key || index} className="text-slate-700 leading-relaxed mb-4 text-base">{text}</p>
      }
    })
  }
  return null
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  const [loadingProducts, setLoadingProducts] = useState(true)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/services/')) {
        setActiveServiceSlug(path.replace('/services/', ''))
        setActiveCategorySlug(null)
      } else if (path.startsWith('/category/')) {
        setActiveCategorySlug(path.replace('/category/', ''))
        setActiveServiceSlug(null)
      } else {
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
      }
    }

    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToService = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/services/${target}`)
    setActiveServiceSlug(target)
    setActiveCategorySlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToCategory = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/category/${target}`)
    setActiveCategorySlug(target)
    setActiveServiceSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Категории: проверяем все возможные поля изображений (image, mainImage, photo, icon)
        const categoryQuery = `*[_type == "category"] {
          _id,
          name,
          slug,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url, photo.asset->url, icon.asset->url),
          description,
          seo
        }`
        const cData = await sanityClient.fetch(categoryQuery)
        setCategories(cData || [])

        // 2. Товары
        const productQuery = `*[_type == "product" && isActive != false] {
          _id,
          name,
          slug,
          sku,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          shortDescription,
          description,
          specifications,
          "category": category->name,
          "categoryId": category->_id,
          "categorySlug": category->slug.current
        }`
        const pData = await sanityClient.fetch(productQuery)
        setProducts(pData || [])

        // 3. Услуги
        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id,
          name,
          slug,
          shortDescription,
          description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url),
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

        // 4. Настройки сайта
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

  const currentService = services.find(
    s => s.slug?.current === activeServiceSlug || s._id === activeServiceSlug
  )
  const currentCategory = categories.find(
    c => c.slug?.current === activeCategorySlug || c._id === activeCategorySlug
  )

  const filteredProducts = currentCategory 
    ? products.filter(p => p.category === currentCategory.name || (p as any).categorySlug === currentCategory.slug?.current || p.categoryId === currentCategory._id)
    : products

  useEffect(() => {
    if (activeServiceSlug && currentService) {
      const seoTitle = currentService.seo?.seoTitle || currentService.seo?.metaTitle || `${currentService.name} | Градински център Флориал`
      const seoDesc = currentService.seo?.seoDescription || currentService.seo?.metaDescription || currentService.shortDescription || ''
      document.title = seoTitle
      updateMetaDescription(seoDesc)
    } else if (activeCategorySlug && currentCategory) {
      const seoTitle = currentCategory.seo?.seoTitle || currentCategory.seo?.metaTitle || `${currentCategory.name} | Градински център Флориал`
      const seoDesc = currentCategory.seo?.seoDescription || currentCategory.seo?.metaDescription || ''
      document.title = seoTitle
      updateMetaDescription(seoDesc)
    } else {
      document.title = 'Градински център Флориал | Поливни системи и ландшафтен дизайн'
      updateMetaDescription(siteSettings?.heroSubtitle || 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг.')
    }
  }, [activeServiceSlug, currentService, activeCategorySlug, currentCategory, siteSettings])

  const updateMetaDescription = (desc: string) => {
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', desc)
  }

  // Страница услуги
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
            {currentService.shortDescription && (
              <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-600 mb-6 text-slate-700 font-medium leading-relaxed text-lg">
                {currentService.shortDescription}
              </div>
            )}
            <div className="prose prose-emerald max-w-none mb-8">
              {renderPortableText(currentService.description)}
            </div>
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

  // Страница категории
  if (activeCategorySlug && currentCategory) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
          <button 
            onClick={navigateToHome}
            className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
          >
            ← Назад към началната страница
          </button>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row gap-8 items-center">
            {currentCategory.imageUrl && (
              <div className="w-full md:w-72 h-48 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                <img src={currentCategory.imageUrl} alt={currentCategory.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Категория продукти</span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1 mb-3">{currentCategory.name}</h1>
              <div className="text-slate-600 text-sm">
                {renderPortableText(currentCategory.description)}
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-6">Продукти в категорията</h3>
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              Няма намерени продукти в тази категория в момента.
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
                      <span>{product.category || currentCategory.name}</span>
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
      </div>
    )
  }

  // Главная страница
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header />

      {/* Баннер (Hero + Услуги) */}
      <section className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-center">
            Градински център Флориал
          </h1>
          <p className="text-emerald-100 max-w-2xl mx-auto mb-10 text-sm md:text-base text-center">
            {siteSettings?.heroSubtitle || 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.'}
          </p>

          <div className="mt-8 text-left">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">Нашите услуги и готови комплекти</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Професионални решения за градината</h3>
            </div>

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

      {/* Каталог продуктов и категории */}
      <main className="max-w-7xl mx-auto px-4 py-10 flex-grow w-full">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Каталог продукти</h3>

        {/* Сетка категорий */}
        {categories.length > 0 && (
          <div className="mb-12">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Изберете категория</span>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {categories.map(cat => (
                <div
                  key={cat._id}
                  onClick={() => navigateToCategory(cat.slug?.current, cat._id)}
                  className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
                >
                  <div className="w-full h-24 sm:h-32 md:h-36 bg-slate-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <span className="text-xs text-slate-400">Няма снимка</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm md:text-base text-slate-800 group-hover:text-emerald-700 transition line-clamp-2">
                    {cat.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-slate-800">Всички продукти</h4>
        </div>

        {loadingProducts ? (
          <p className="text-slate-500">Зареждане на продукти от Sanity CMS...</p>
        ) : products.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-600 font-medium">Няма намерени продукти.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
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
              <button onClick={() => setSelectedProduct(null)} className="bg-emerald-600 text-white font-bold py-3 rounded-lg">
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
