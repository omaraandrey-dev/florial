import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { createOrder } from './services/orderService'

// Простая и надежная функция генерации CDN-ссылок на картинки Sanity без сторонних библиотек
const urlFor = (source: any) => {
  if (!source || !source.asset || !source.asset._ref) return ''
  const ref = source.asset._ref // Пример: image-a1b2c3d4e5f6-800x600-png
  const parts = ref.split('-')
  if (parts.length < 4) return ''
  const id = parts[1]
  const dimensions = parts[2]
  const format = parts[3]
  
  // Берем ID проекта и датасет из клиента или глобального окружения
  const projectId = sanityClient.config().projectId || 'bxvcy0qs'
  const dataset = sanityClient.config().dataset || 'production'
  
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
  contactPhone?: string
  contactEmail?: string
  address?: string
  heroTitle?: string
  heroSubtitle?: string
}

export interface PageItem {
  _id: string
  title: string
  slug?: { current: string }
  excerpt?: string
  body?: any
}

export interface OrderItem {
  sku: string
  name: string
  qty: number
  price: number
}

// Вспомогательный рендеринг текста (строка или Block Content из Sanity)
const renderTextContent = (content: any, fallback: string = '') => {
  if (!content) return fallback
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (block._type === 'block' && block.children) {
          return block.children.map((c: any) => c.text).join('')
        }
        return ''
      })
      .filter(Boolean)
      .join('\n\n')
  }
  return fallback
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null)

  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('florial_cart')
    return saved ? JSON.parse(saved) : []
  })

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    delivery_method: 'Econt Courier',
    payment_method: 'Cash on delivery',
    comment: ''
  })

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
          mainImage,
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

        // 2. Услуги
        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id,
          name,
          slug,
          shortDescription,
          description,
          image,
          startingPriceEUR,
          advantages,
          steps,
          hero,
          callToAction,
          leadForm,
          "galleryCount": count(gallery)
        }`
        const sData = await sanityClient.fetch(serviceQuery)
        setServices(sData || [])

        // 3. Страницы
        const pagesQuery = `*[_type == "page"] { _id, title, slug, excerpt, body }`
        const pageData = await sanityClient.fetch(pagesQuery)
        setPages(pageData || [])

        // 4. Настройки
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

  useEffect(() => {
    localStorage.setItem('florial_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCart(prev => {
      const itemSku = product.sku || product._id
      const existing = prev.find(item => item.sku === itemSku)
      if (existing) {
        return prev.map(item => 
          item.sku === itemSku 
            ? { ...item, qty: item.qty + 1 } 
            : item
        )
      }
      return [...prev, {
        sku: itemSku,
        name: product.name,
        price: product.priceEUR || 0,
        qty: 1
      }]
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await createOrder({
        ...formData,
        items: cart,
        subtotal
      })

      setOrderSuccess(res.orderNumber)
      setCart([])
      localStorage.removeItem('florial_cart')
    } catch (err: any) {
      alert(err.message || 'Грешка при изпращане на поръчката')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Шапка */}
      <header className="bg-emerald-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-2xl leading-tight tracking-wide">{siteSettings?.siteName || 'FLORIAL'}</h1>
            <p className="text-xs text-emerald-200">ГРАДИНСКИ ЦЕНТЪР — Автоматично напояване & Озеленяване</p>
          </div>

          <nav className="hidden md:flex gap-4 text-sm font-medium text-emerald-100">
            {pages.map(pg => (
              <button key={pg._id} onClick={() => setSelectedPage(pg)} className="hover:text-white transition cursor-pointer">
                {pg.title}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="relative bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <span className="font-semibold">{subtotal.toFixed(2)} €</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

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

      {/* Каталог товаров */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
                    <div>
                      <span className="text-xl font-bold text-emerald-800">{(product.priceEUR || 0).toFixed(2)} €</span>
                    </div>
                    <button 
                      onClick={(e) => addToCart(product, e)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      Купи
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Раздел услуг */}
      <section className="bg-emerald-50/50 border-t border-b border-emerald-100 py-12 px-4 mt-8">
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
                    <div className="h-36 bg-emerald-100/60 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {srvImageUrl ? (
                        <img src={srvImageUrl} alt={srv.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-3 text-center">
                          <span className="font-bold text-emerald-900 text-lg block">{srv.name}</span>
                          {srv.hero?.subtitle && <span className="text-xs text-emerald-700 mt-1 line-clamp-1 block">{srv.hero.subtitle}</span>}
                        </div>
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-slate-800 mb-2">{srv.name}</h4>
                    <p className="text-sm text-slate-600 mb-4">{srv.shortDescription}</p>

                    {srv.advantages && srv.advantages.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Предимства:</span>
                        <ul className="space-y-1">
                          {srv.advantages.slice(0, 3).map((adv, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span><strong>{adv.title}</strong>{adv.description ? `: ${adv.description}` : ''}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {srv.startingPriceEUR ? (
                        <span className="text-xs text-slate-500">От <strong className="text-slate-800 text-base">{srv.startingPriceEUR} €</strong></span>
                      ) : (
                        <span className="text-xs text-slate-400">По оферта</span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedService(srv)
                      }}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      {srv.callToAction?.buttonText || 'Заяви консултация'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Модалка товара */}
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

            <div className="mb-6">
              <h4 className="font-bold text-slate-800 mb-2">Описание</h4>
              <p className="text-slate-600 text-sm whitespace-pre-line">
                {selectedProduct.shortDescription || renderTextContent(selectedProduct.description, 'Няма допълнително описание за този продукт в Sanity.')}
              </p>
            </div>

            {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-800 mb-2">Технически характеристики</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                  {selectedProduct.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between p-2 border-b border-slate-100 last:border-none bg-slate-50/50">
                      <span className="font-medium text-slate-600">{spec.name}</span>
                      <span className="text-slate-800">{spec.value} {spec.unit || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span className="text-2xl font-bold text-emerald-800">{(selectedProduct.priceEUR || 0).toFixed(2)} €</span>
                <span className="block text-xs text-slate-500">
                  Статус: <strong className="text-emerald-700">{selectedProduct.stockStatus || 'inStock'}</strong>
                </span>
              </div>
              <button 
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition cursor-pointer"
              >
                Добави в количката
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка страницы */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedPage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{selectedPage.title}</h3>
            <p className="text-slate-600 text-sm whitespace-pre-line">
              {selectedPage.excerpt || renderTextContent(selectedPage.body, 'Съдържанието се редактира през Sanity Studio.')}
            </p>
          </div>
        </div>
      )}

      {/* Модалка услуги */}
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
            <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{selectedService.hero?.title || selectedService.name}</h3>
            
            {urlFor(selectedService.image) && (
              <div className="h-56 bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img src={urlFor(selectedService.image)} alt={selectedService.name} className="h-full w-full object-cover" />
              </div>
            )}

            <p className="text-slate-600 text-sm mb-6 whitespace-pre-line">
              {selectedService.shortDescription || renderTextContent(selectedService.description, '')}
            </p>

            {selectedService.steps && selectedService.steps.length > 0 && (
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Етапи на изпълнение на услугата:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedService.steps.map((st, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                      <span className="text-xs font-bold text-emerald-700 block mb-0.5">Етап {st.stepNumber || idx + 1}</span>
                      <strong className="text-sm text-slate-800 block mb-1">{st.title}</strong>
                      {st.description && <p className="text-xs text-slate-500">{st.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedService.advantages && selectedService.advantages.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Защо да изберете Florial?</h4>
                <div className="space-y-2">
                  {selectedService.advantages.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-emerald-600 font-bold text-sm">✓</span>
                      <div>
                        <strong className="text-slate-800">{adv.title}</strong>
                        {adv.description && <span className="text-slate-600"> — {adv.description}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                setSelectedService(null)
                setIsCheckoutOpen(true)
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition cursor-pointer text-center"
            >
              {selectedService.leadForm?.submitButtonText || 'Изпрати запитване за тази услуга'}
            </button>
          </div>
        </div>
      )}

      {/* Оформление заказа */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {orderSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Заявката е приета!</h3>
                <p className="text-slate-600 mb-4">
                  Номер на поръчката: <strong className="text-emerald-700">{orderSuccess}</strong>
                </p>
                <button 
                  onClick={() => {
                    setOrderSuccess(null)
                    setIsCheckoutOpen(false)
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Затвори
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Запитване / Оформяне на поръчка</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Име и фамилия *</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-300 rounded p-2"
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Телефон *</label>
                    <input 
                      required 
                      type="tel" 
                      className="w-full border border-slate-300 rounded p-2"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input 
                      required 
                      type="email" 
                      className="w-full border border-slate-300 rounded p-2"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Град *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border border-slate-300 rounded p-2"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Адрес / Офис на Еконт *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border border-slate-300 rounded p-2"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Отказ
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Изпращане…' : 'Изпрати запитване'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}