import React, { useState, useEffect, useMemo } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ServicePage } from './pages/ServicePage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductPage } from './pages/ProductPage'
import { ContactsPage } from './pages/ContactsPage'

import type { CategoryItem, Product, ServiceItem, SiteSettings } from './types'

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  const [loadingProducts, setLoadingProducts] = useState(true)
  
  // Текущий открытый товар при детальном просмотре
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [loadingProductDetails, setLoadingProductDetails] = useState(false)
  
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(null)
  const [isContactsOpen, setIsContactsOpen] = useState(false)

  // Роутинг по URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/services/')) {
        setActiveServiceSlug(path.replace('/services/', ''))
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
        setIsContactsOpen(false)
        setCurrentProduct(null)
      } else if (path.startsWith('/category/')) {
        setActiveCategorySlug(path.replace('/category/', ''))
        setActiveServiceSlug(null)
        setActiveProductSlug(null)
        setIsContactsOpen(false)
        setCurrentProduct(null)
      } else if (path.startsWith('/product/') || path.startsWith('/products/')) {
        const slug = path.replace(/^\/(product|products)\//, '')
        setActiveProductSlug(slug)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setIsContactsOpen(false)
      } else if (path === '/contacts') {
        setIsContactsOpen(true)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
        setCurrentProduct(null)
      } else {
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
        setIsContactsOpen(false)
        setCurrentProduct(null)
      }
    }

    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Навигационные функции
  const navigateToService = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/services/${target}`)
    setActiveServiceSlug(target)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setIsContactsOpen(false)
    setCurrentProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToCategory = (slug?: string, id?: string) => {
    const target = slug || id
    if (!target) return
    window.history.pushState({}, '', `/category/${target}`)
    setActiveCategorySlug(target)
    setActiveServiceSlug(null)
    setActiveProductSlug(null)
    setIsContactsOpen(false)
    setCurrentProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToProduct = (slug: string) => {
    if (!slug) return
    window.history.pushState({}, '', `/product/${slug}`)
    setActiveProductSlug(slug)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setIsContactsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToContacts = () => {
    window.history.pushState({}, '', '/contacts')
    setIsContactsOpen(true)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setIsContactsOpen(false)
    setCurrentProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (product: Product, qty: number) => {
    console.log('Добавлено в количката:', product.name, 'Количество:', qty)
  }

  // Загрузка начальных данных из Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryQuery = `*[_type == "category"] | order(sortOrder asc) {
          _id, name, slug, sortOrder, "imageUrl": image.asset->url, description, seo
        }`
        const cData = await sanityClient.fetch(categoryQuery)
        setCategories(cData || [])

        const productQuery = `*[_type == "product" && isActive != false && defined(slug.current)] {
          _id, name, slug, sku, priceEUR, oldPriceEUR, stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "galleryImages": gallery[].asset->url,
          shortDescription, description, specifications,
          "category": category->name, "categoryId": category->_id, "categorySlug": category->slug.current,
          "categories": categories[]-> { _id, name, slug }
        }`
        const pData = await sanityClient.fetch(productQuery)
        setProducts(pData || [])

        const serviceQuery = `*[_type == "service" && isActive != false] {
          _id, name, slug, shortDescription, description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url),
          startingPriceEUR, advantages, steps, hero, callToAction, leadForm, seo
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

  // Загрузка подробной информации о товаре по slug или id
  useEffect(() => {
    if (!activeProductSlug) {
      setCurrentProduct(null)
      return
    }

    const foundInState = products.find(p => p.slug?.current === activeProductSlug || p._id === activeProductSlug)
    if (foundInState && foundInState.description && (foundInState.specifications || foundInState.galleryImages)) {
      setCurrentProduct(foundInState)
      return
    }

    const fetchSingleProduct = async () => {
      setLoadingProductDetails(true)
      try {
        const query = `*[_type == "product" && (slug.current == $slug || _id == $slug)][0] {
          _id,
          name,
          slug,
          sku,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "galleryImages": gallery[].asset->url,
          shortDescription,
          description,
          specifications,
          "category": category->name,
          "categoryId": category->_id,
          "categorySlug": category->slug.current,
          "categories": categories[]-> { _id, name, slug },
          documents[] {
            title,
            "fileUrl": file.asset->url
          },
          compatibleProducts[]-> {
            _id, name, slug, priceEUR, stockStatus,
            "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
            "category": category->name
          },
          relatedProducts[]-> {
            _id, name, slug, priceEUR, stockStatus,
            "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
            "category": category->name
          }
        }`
        const data = await sanityClient.fetch(query, { slug: activeProductSlug })
        setCurrentProduct(data || foundInState || null)
      } catch (err) {
        console.error('Грешка при зареждане на продукта:', err)
        setCurrentProduct(foundInState || null)
      } finally {
        setLoadingProductDetails(false)
      }
    }

    fetchSingleProduct()
  }, [activeProductSlug, products])

  const currentService = services.find(
    s => s.slug?.current === activeServiceSlug || s._id === activeServiceSlug
  )
  const currentCategory = categories.find(
    c => c.slug?.current === activeCategorySlug || c._id === activeCategorySlug
  )

  const filteredProducts = useMemo(() => {
    if (!currentCategory) return products
    if (currentCategory.slug?.current === 'vsichko-za-polivane') {
      return products
    }
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
        onNavigateHome={navigateToHome}
        onNavigateService={navigateToService}
        onNavigateCategory={navigateToCategory}
        onNavigateContacts={navigateToContacts}
      />

      {isContactsOpen ? (
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
        loadingProductDetails ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-medium">Зареждане на продукта...</p>
          </div>
        ) : currentProduct ? (
          <ProductPage
            product={currentProduct}
            onNavigateHome={navigateToHome}
            onNavigateCategory={navigateToCategory}
            onNavigateProduct={navigateToProduct}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Продуктът не е намерен</h2>
            <p className="text-slate-500 mb-6">Търсеният от вас продукт не съществува или е премахнат.</p>
            <button
              onClick={navigateToHome}
              className="bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              Към началната страница
            </button>
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
