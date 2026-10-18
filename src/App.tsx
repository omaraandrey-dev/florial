import React, { useState, useEffect } from 'react'
import { sanityClient } from './lib/sanity'
import { CategoryItem, Product, ServiceItem, SiteSettings } from './types'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { ServicePage } from './pages/ServicePage'
import { CategoryPage } from './pages/CategoryPage'
import { ContactsPage } from './pages/ContactsPage'

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Состояние активных страниц
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)
  const [isContactsOpen, setIsContactsOpen] = useState(false)

  // Маршрутизация по URL
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

  // Загрузка данных из Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        services={services}
        categories={categories}
        onNavigateHome={navigateToHome}
        onNavigateService={navigateToService}
        onNavigateCategory={navigateToCategory}
        onNavigateContacts={navigateToContacts}
      />

      {/* Выбор отображаемой страницы */}
      {isContactsOpen ? (
        <ContactsPage onNavigateHome={navigateToHome} />
      ) : activeServiceSlug && currentService ? (
        <ServicePage service={currentService} onNavigateHome={navigateToHome} />
      ) : activeCategorySlug && currentCategory ? (
        <CategoryPage 
          category={currentCategory} 
          products={filteredProducts} 
          onNavigateHome={navigateToHome}
          onSelectProduct={setSelectedProduct}
        />
      ) : (
        <HomePage
          services={services}
          categories={categories}
          products={products}
          siteSettings={siteSettings}
          loadingProducts={loadingProducts}
          onNavigateService={navigateToService}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={setSelectedProduct}
        />
      )}

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
              <button onClick={() => setSelectedProduct(null)} className="bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg">
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
