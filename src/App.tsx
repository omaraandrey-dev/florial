import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'

export interface CategoryItem {
  _id: string
  name: string
  slug?: { current: string }
  imageUrl?: string
  description?: any
  sortOrder?: number
  seo?: {
    metaTitle?: string
    metaDescription?: string
    noIndex?: boolean
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
  
  // Переключатели страниц
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)
  const [isContactsOpen, setIsContactsOpen] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/services/')) {
        setActiveServiceSlug(path.replace('/services/', ''))
        setActiveCategorySlug(null)
        setIsContactsOpen(false)
      } else if (path.startsWith('/category/')) {
        setActiveCategorySlug(path.replace('/category/', ''))
        setActiveServiceSlug(null)
        setIsContactsOpen(false)
      } else if (path === '/contacts') {
        setIsContactsOpen(true)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
      } else {
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setIsContactsOpen(false)
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
    setIsContactsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToCategory = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/category/${target}`)
    setActiveCategorySlug(target)
    setActiveServiceSlug(null)
    setIsContactsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToContacts = () => {
    window.history.pushState({}, '', '/contacts')
    setIsContactsOpen(true)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setIsContactsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Категории
        const categoryQuery = `*[_type == "category"] | order(sortOrder asc) {
          _id,
          name,
          slug,
          sortOrder,
          "imageUrl": image.asset->url,
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

        // 4. Настройки
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

  // Шапка сайта через компонент Header
  const renderHeader = () => (
    <Header
      services={services}
      categories={categories}
      onNavigateHome={navigateToHome}
      onNavigateService={navigateToService}
      onNavigateCategory={navigateToCategory}
      onNavigateContacts={navigateToContacts}
    />
  )

  // 1. Страница контактов
  if (isContactsOpen) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
        {renderHeader()}
        <main className="max-w-3xl mx-auto px-4 py-8 flex-grow w-full">
          <button 
            onClick={navigateToHome}
            className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
          >
            ← Назад към началната страница
          </button>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Работни часове</h2>
            <ul className="space-y-2 text-slate-700 font-medium">
              <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>понеделник</i> <span>9:00 – 18.00</span></li>
              <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>вторник</i> <span>9:00 – 18.00</span></li>
              <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>сряда</i> <span>9:00 – 18.00</span></li>
              <li className="flex justify-between border
