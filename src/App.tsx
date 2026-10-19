import React, { useState, useEffect, useMemo } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ServicePage } from './pages/ServicePage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductPage } from './pages/ProductPage'
import { ContactsPage } from './pages/ContactsPage'
import { CartPage } from './pages/CartPage'

import type { CategoryItem, Product, ServiceItem, SiteSettings, CartItem } from './types'

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [loadingProductDetails, setLoadingProductDetails] = useState(false)
  
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(null)
  const [isContactsOpen, setIsContactsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Роутинг по URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/cart') {
        setIsCartOpen(true)
        setIsContactsOpen(false)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
      } else if (path === '/contacts') {
        setIsContactsOpen(true)
        setIsCartOpen(false)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
      } else if (path.startsWith('/services/')) {
        setActiveServiceSlug(path.replace('/services/', ''))
        setIsCartOpen(false)
        setIsContactsOpen(false)
      } else if (path.startsWith('/category/')) {
        setActiveCategorySlug(path.replace('/category/', ''))
        setIsCartOpen(false)
        setIsContactsOpen(false)
      } else if (path.startsWith('/product/') || path.startsWith('/products/')) {
        setActiveProductSlug(path.replace(/^\/(product|products)\//, ''))
        setIsCartOpen(false)
        setIsContactsOpen(false)
      } else {
        setIsCartOpen(false)
        setIsContactsOpen(false)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
      }
    }

    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Навигация в корзину
  const navigateToCart = () => {
    window.history.pushState({}, '', '/cart')
    setIsCartOpen(true)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Функции работы с корзиной
  const handleAddToCart = (product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id)
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId))
  }

  const handleClearCart = () => setCart([])

  // Первоначальная загрузка данных из Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cData = await sanityClient.fetch(`*[_type == "category"] | order(sortOrder asc) {
          _id, name, slug, sortOrder, "imageUrl": image.asset->url, description, seo
        }`)
        setCategories(cData || [])

        const pData = await sanityClient.fetch(`*[_type == "product" && isActive != false && defined(slug.current)] {
          _id, name, slug, sku, priceEUR, oldPriceEUR, stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "galleryImages": gallery[].asset->url,
          shortDescription, description, specifications,
          "category": category->name, "categoryId": category->_id, "categorySlug": category->slug.current,
          "categories": categories[]-> { _id, name, slug }
        }`)
        setProducts(pData || [])

        const sData = await sanityClient.fetch(`*[_type == "service" && isActive != false] {
          _id, name, slug, shortDescription, description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url),
          startingPriceEUR, advantages, steps, hero, callToAction, leadForm, seo
        }`)
        setServices(sData || [])


const settingsQuery = `*[_type == "siteSettings"][0]{
  siteName,
  heroTitle,
  heroSubtitle
}`


const logoQuery = `*[
  slug.current == "oficialno-logo-florial-gradinski-centar"
][0]{
  _id,
  _type,
  title,
  slug,
  "logoUrl": image.asset->url
}`
        
const [settData, logoData] = await Promise.all([
  sanityClient.fetch(settingsQuery),
  sanityClient.fetch(logoQuery)
])

console.log('Настройки сайта:', settData)
        console.log('Настройки logoData:', logoData)
console.log('URL логотипа:', logoData?.logoUrl)

setSiteSettings({
  ...settData,
  logoUrl: logoData?.logoUrl || null
})

      } catch (err) {
        console.error('Грешка при зареждане от Sanity:', err)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchData()
  }, [])

  // Переход по страницам
  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)
  }

  const navigateToContacts = () => {
    window.history.pushState({}, '', '/contacts')
    setIsContactsOpen(true)
    setIsCartOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
  }

  const navigateToCategory = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/category/${target}`)
    setActiveCategorySlug(target)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveProductSlug(null)
  }

  const navigateToService = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/services/${target}`)
    setActiveServiceSlug(target)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
  }

  const navigateToProduct = (slug: string) => {
    if (!slug) return
    window.history.pushState({}, '', `/product/${slug}`)
    setActiveProductSlug(slug)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
  }

  const currentService = services.find(s => s.slug?.current === activeServiceSlug || s._id === activeServiceSlug)
  const currentCategory = categories.find(c => c.slug?.current === activeCategorySlug || c._id === activeCategorySlug)

  const filteredProducts = useMemo(() => {
    if (!currentCategory) return products
    if (currentCategory.slug?.current === 'vsichko-za-polivane') return products
    return products.filter(p => {
      const isMainMatch = p.categoryId === currentCategory._id
      const isMultiMatch = p.categories && p.categories.some((cat: any) => cat._id === currentCategory._id)
      return isMainMatch || isMultiMatch
    })
  }, [products, currentCategory])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        services={services}
        categories={categories}
        cart={cart}
        onNavigateHome={navigateToHome}
        onNavigateService={navigateToService}
        onNavigateCategory={navigateToCategory}
        onNavigateContacts={navigateToContacts}
        onNavigateCart={navigateToCart}
        siteSettings={siteSettings}
      />

      {isCartOpen ? (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onNavigateHome={navigateToHome}
        />
      ) : isContactsOpen ? (
        <ContactsPage onNavigateHome={navigateToHome} />
      ) : activeServiceSlug && currentService ? (
        <ServicePage service={currentService} onNavigateHome={navigateToHome} />
      ) : activeCategorySlug && currentCategory ? (
        <CategoryPage 
          category={currentCategory} 
          products={filteredProducts} 
          onNavigateHome={navigateToHome}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={(p) => p.slug?.current && navigateToProduct(p.slug.current)}
        />
      ) : activeProductSlug ? (
        currentProduct ? (
          <ProductPage
            product={currentProduct}
            onNavigateHome={navigateToHome}
            onNavigateCategory={navigateToCategory}
            onNavigateProduct={navigateToProduct}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-medium">Зареждане на продукта...</p>
          </div>
        )
      ) : (
        <HomePage
          services={services}
          categories={categories}
          products={products}
          siteSettings={siteSettings}
          loadingProducts={loadingProducts}
          onNavigateService={navigateToService}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={(p) => p.slug?.current && navigateToProduct(p.slug.current)}
        />
      )}

      <Footer />
    </div>
  )
}
