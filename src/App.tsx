
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { sanityClient, sanityLiveClient, plantsClient, publicPlantsClient } from './lib/sanity'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { useI18n } from './lib/i18n'
import { HomePage } from './pages/HomePage'
import { handleInternalLinkClick, localizedHref } from './lib/navigation'
import { getSanityImageProps } from './lib/sanityImage'
import { applyPageSeo } from './lib/seo'
import { getProductImageText } from './lib/productImageSeo'
import { toPlainText } from './lib/richTextUtils.mjs'
import { trackEvent } from './services/trackingService'
import { loadCart, saveCart } from './lib/cartStorage'

import type {
  CategoryItem,
  Product,
  ServiceItem,
  ServiceRolePhoto,
  SiteSettings,
  CartItem,
} from './types'

// Keep the homepage in the initial bundle; load other page modules only when their route is active.
const ServicePage = React.lazy(() => import('./pages/ServicePage').then(({ ServicePage }) => ({ default: ServicePage })))
const CategoryPage = React.lazy(() => import('./pages/CategoryPage').then(({ CategoryPage }) => ({ default: CategoryPage })))
const ProductPage = React.lazy(() => import('./pages/ProductPage').then(({ ProductPage }) => ({ default: ProductPage })))
const ContactsPage = React.lazy(() => import('./pages/ContactsPage').then(({ ContactsPage }) => ({ default: ContactsPage })))
const ServicesListPage = React.lazy(() => import('./pages/ServicesListPage').then(({ ServicesListPage }) => ({ default: ServicesListPage })))
const CartPage = React.lazy(() => import('./pages/CartPage').then(({ CartPage }) => ({ default: CartPage })))
const BlogPage = React.lazy(() => import('./pages/BlogPage').then(({ BlogPage }) => ({ default: BlogPage })))
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage').then(({ BlogPostPage }) => ({ default: BlogPostPage })))
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(({ AboutPage }) => ({ default: AboutPage })))
const IrrigationSupportPage = React.lazy(() => import('./pages/IrrigationSupportPage').then(({ IrrigationSupportPage }) => ({ default: IrrigationSupportPage })))

const PLANT_PRODUCT_TYPES = new Set([
  'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus',
  'palm', 'conifer', 'fruit', 'succulent', 'climber', 'ornamentalGrass',
  'groundcover', 'bulb', 'herb', 'aquatic', 'other',
])

const isPlantProductType = (productType?: string) =>
  PLANT_PRODUCT_TYPES.has(productType || '')

type InitialRouteState = {
  activeServiceSlug: string | null
  activeCategorySlug: string | null
  activeProductSlug: string | null
  activeSearchQuery: string | null
  isContactsOpen: boolean
  isCartOpen: boolean
}

function getRouteState(
  pathname = window.location.pathname,
  search = window.location.search,
): InitialRouteState {
  const path = pathname.replace(/\/+$/, '') || '/'
  const searchParams = new URLSearchParams(search)

  return {
    activeServiceSlug: path.startsWith('/services/') ? path.replace('/services/', '') : null,
    activeCategorySlug: path.startsWith('/category/') ? path.replace('/category/', '') : null,
    activeProductSlug: path.startsWith('/product/') || path.startsWith('/products/')
      ? decodeURIComponent(path.replace(/^\/(product|products)\//, ''))
      : null,
    activeSearchQuery: path === '/search' ? (searchParams.get('q')?.trim() || '') : null,
    isContactsOpen: path === '/contacts',
    isCartOpen: path === '/cart',
  }
}

function CategoryLoadingState({ label }: { label: string }) {
  return (
    <main
      className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-grow flex-col px-4 py-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status" aria-live="polite">{label}</p>

      <div aria-hidden="true" className="mb-6 h-4 w-44 animate-pulse rounded bg-slate-200" />

      <div aria-hidden="true" className="mb-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="h-9 w-3/4 max-w-xl animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-full max-w-3xl animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-5/6 max-w-2xl animate-pulse rounded bg-slate-100" />
        </div>
        <div className="hidden aspect-[4/3] animate-pulse rounded-2xl bg-slate-100 lg:block" />
      </div>

      <div aria-hidden="true" className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E5E8DC] bg-white p-2 sm:rounded-2xl sm:p-3">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:h-14 sm:w-14" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="mb-6 h-16 animate-pulse rounded-2xl bg-slate-100" />
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="aspect-[4/5] animate-pulse bg-slate-100" />
            <div className="space-y-3 p-3">
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default function App() {
  const { t, language, localize } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [headerCategories, setHeaderCategories] = useState<CategoryItem[]>([])
  const [headerPlantCategories, setHeaderPlantCategories] = useState<CategoryItem[]>([])
  const [headerServices, setHeaderServices] = useState<ServiceItem[]>([])
  const [headerSiteSettings, setHeaderSiteSettings] = useState<SiteSettings | null>(null)
  const [homePlantCategories, setHomePlantCategories] = useState<CategoryItem[]>([])
  const [homeHeroImageUrl, setHomeHeroImageUrl] = useState<string | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingServices, setLoadingServices] = useState(() => (window.location.pathname.replace(/\/+$/, '') || '/') === '/services')
  const [searchProducts, setSearchProducts] = useState<Product[]>([])
  const [loadingSearchResults, setLoadingSearchResults] = useState(false)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [currentCategoryDetails, setCurrentCategoryDetails] = useState<CategoryItem | null>(null)
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loadedServicesLanguage, setLoadedServicesLanguage] = useState<string | null>(null)
  const [serviceRolePhotos, setServiceRolePhotos] = useState<ServiceRolePhoto[]>([])
  const [currentServiceDetails, setCurrentServiceDetails] = useState<ServiceItem | null>(null)
  const [loadingServiceDetails, setLoadingServiceDetails] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [cart, setCart] = useState<CartItem[]>(() => loadCart())

  const [loadingProducts, setLoadingProducts] = useState(() => {
    const route = getRouteState()
    return Boolean(route.activeCategorySlug || route.activeProductSlug)
  })
  const [loadedCatalogueTypes, setLoadedCatalogueTypes] = useState<string[]>([])
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [initialSaleVariantKey, setInitialSaleVariantKey] = useState<string | null>(null)
  const [loadingProductDetails, setLoadingProductDetails] = useState(false)

  // Resolve the requested URL before the first render so direct links never flash the homepage.
  const [initialRoute] = useState(() => getRouteState())
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(initialRoute.activeServiceSlug)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(initialRoute.activeCategorySlug)
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(initialRoute.activeProductSlug)
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(initialRoute.activeSearchQuery)

  const [isContactsOpen, setIsContactsOpen] = useState(initialRoute.isContactsOpen)
  const [isCartOpen, setIsCartOpen] = useState(initialRoute.isCartOpen)
  const [, setRouteRevision] = useState(0)

  const normalizedRoutePath = window.location.pathname.replace(/\/+$/, '') || '/'
  const isServicesListRoute = normalizedRoutePath === '/services'
  const needsCatalogue = Boolean(activeCategorySlug || activeProductSlug)
  const lastTrackedPage = useRef<string | null>(null)

  // Persist the customer's cart between visits on this browser/device.
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  useEffect(() => {
    const pageKey = language + ':' + normalizedRoutePath
    if (lastTrackedPage.current === pageKey) return
    lastTrackedPage.current = pageKey
    trackEvent('page_view', language, normalizedRoutePath)
  }, [language, normalizedRoutePath])



  // Keep the HTML language and let page-level SEO decide canonical/hreflang URLs.
  useEffect(() => {
    document.documentElement.lang = language
    const path = window.location.pathname.replace(/\/+$/, '') || '/'

    const isPrivateUtilityPage = path === '/cart' || path === '/search'
    const isMissingDynamicRoute = (
      ((path.startsWith('/product/') || path.startsWith('/products/')) && !loadingProducts && Boolean(activeProductSlug) && !currentProduct) ||
      (path.startsWith('/services/') && path !== '/services/dostavka-poliv' && !loadingServiceDetails && Boolean(activeServiceSlug) && !currentService) ||
      (path.startsWith('/category/') && !loadingCategories && Boolean(activeCategorySlug) && !currentCategory)
    )
    const isUnknownRoute = path !== '/' && path !== '/index.html' &&
      path !== '/contacts' && path !== '/about' && path !== '/services' && path !== '/cart' && path !== '/search' && path !== '/blog' && !path.startsWith('/blog/') &&
      !path.startsWith('/product/') && !path.startsWith('/products/') &&
      !path.startsWith('/services/') && !path.startsWith('/category/')

    if (isPrivateUtilityPage) {
      const utilityMetadata = path === '/cart'
        ? language === 'ru'
          ? { title: 'Корзина | Florial', description: 'Содержимое корзины интернет-магазина Florial.' }
          : language === 'en'
            ? { title: 'Shopping Cart | Florial', description: 'Your Florial online shop shopping cart.' }
            : { title: 'Количка | Florial', description: 'Съдържание на количката в онлайн магазина Florial.' }
        : language === 'ru'
          ? { title: 'Поиск товаров | Florial', description: 'Поиск оборудования для полива и растений в магазине Florial.' }
          : language === 'en'
            ? { title: 'Product Search | Florial', description: 'Search irrigation equipment and plants in the Florial shop.' }
            : { title: 'Търсене на продукти | Florial', description: 'Търсете оборудване за напояване и растения в магазина Florial.' }
      applyPageSeo({
        fallbackTitle: utilityMetadata.title,
        fallbackDescription: utilityMetadata.description,
        noIndex: true,
        language,
      })
    } else if (isMissingDynamicRoute || isUnknownRoute) {
      applyPageSeo({
        fallbackTitle: language === 'ru' ? 'Страница не найдена | Florial' : language === 'en' ? 'Page not found | Florial' : 'Страницата не е намерена | Florial',
        fallbackDescription: language === 'ru' ? 'Запрошенная страница не найдена.' : language === 'en' ? 'The requested page could not be found.' : 'Търсената страница не беше намерена.',
        noIndex: true,
        language,
      })
    }
  }, [language, activeServiceSlug, activeCategorySlug, activeProductSlug, activeSearchQuery, isContactsOpen, isCartOpen, currentProduct, currentService, loadingServiceDetails, loadingProducts, loadingCategories, loadingServices])

  // Keep browser back/forward navigation in sync with the route resolved on initial render.
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteState()
      setActiveSearchQuery(route.activeSearchQuery)
      setIsCartOpen(route.isCartOpen)
      setIsContactsOpen(route.isContactsOpen)
      setActiveServiceSlug(route.activeServiceSlug)
      setCurrentServiceDetails(null)
      setLoadingServiceDetails(Boolean(route.activeServiceSlug && route.activeServiceSlug !== 'dostavka-poliv'))
      setActiveCategorySlug(route.activeCategorySlug)
      setActiveProductSlug(route.activeProductSlug)
      setInitialSaleVariantKey(null)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Load full product data and related records only after a product route is opened.
  useEffect(() => {
    let cancelled = false

    if (!activeProductSlug) {
      setCurrentProduct(null)
      setLoadingProductDetails(false)
      return () => { cancelled = true }
    }

    if (loadingProducts) {
      setLoadingProductDetails(true)
      return () => { cancelled = true }
    }

    const foundProduct = products.find(
      (product) => product.slug?.current === activeProductSlug || product._id === activeProductSlug
    )

    if (!foundProduct) {
      setCurrentProduct(null)
      setLoadingProductDetails(false)
      console.warn('Товар не найден. Slug из URL:', activeProductSlug)
      return () => { cancelled = true }
    }

    setLoadingProductDetails(true)
    import('./lib/routeData/productDetails')
      .then(({ fetchProductDetails }) => fetchProductDetails(foundProduct, () => cancelled))
      .then((details) => {
        if (!cancelled) setCurrentProduct(details)
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Sanity: не удалось загрузить полные данные товара:', error)
        setCurrentProduct(foundProduct)
      })
      .finally(() => {
        if (!cancelled) setLoadingProductDetails(false)
      })

    return () => { cancelled = true }
  }, [activeProductSlug, products, loadingProducts])

  const localizedUrl = (path: string) => language === 'bg' ? path : `${path}${path.includes('?') ? '&' : '?'}lang=${language}`

  // Навигация в корзину
  const navigateToCart = () => {
    setActiveSearchQuery(null)
    window.history.pushState({}, '', localizedUrl('/cart'))

    setIsCartOpen(true)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Добавление товара в корзину
  const getCartItemKey = (product: Product, saleVariant?: CartItem['saleVariant']) =>
    product._id + '::' + (saleVariant?._key || saleVariant?.sku || saleVariant?.name || '')

  // Одна корзина для оборудования и растений; разные варианты растения — отдельные строки.
  const handleAddToCart = (product: Product, qty: number, saleVariant?: CartItem['saleVariant']) => {
    const itemKey = getCartItemKey(product, saleVariant)
    setCart((prev) => {
      const existing = prev.find((item) => getCartItemKey(item.product, item.saleVariant) === itemKey)
      if (existing) return prev.map((item) =>
        getCartItemKey(item.product, item.saleVariant) === itemKey
          ? { ...item, quantity: item.quantity + qty }
          : item
      )
      return [...prev, { product, quantity: qty, ...(saleVariant ? { saleVariant } : {}) }]
    })
  }

  const handleUpdateQuantity = (itemKey: string, quantity: number) => {
    if (quantity <= 0) return handleRemoveFromCart(itemKey)
    setCart((prev) => prev.map((item) =>
      getCartItemKey(item.product, item.saleVariant) === itemKey ? { ...item, quantity } : item
    ))
  }

  const handleRemoveFromCart = (itemKey: string) => {
    setCart((prev) => prev.filter((item) => getCartItemKey(item.product, item.saleVariant) !== itemKey))
  }

  // Очистка корзины
  const handleClearCart = () => setCart([])

  // Header has its own compact data requests. Neither page data nor route rendering waits for them.
  useEffect(() => {
    let cancelled = false

    const headerCategoryQuery = `
      *[_type == "category"] | order(sortOrder asc, name asc) {
        _id, name, translations { bg { name }, ru { name }, en { name } },
        "slug": { "current": coalesce(slug.current, slug) },
        sortOrder, "parentId": parent->_id, "isPlantCategory": false
      }
    `
    const headerPlantCategoryQuery = `
      *[_type == "category" && defined(coalesce(slug.current, slug))] | order(sortOrder asc, name asc) {
        _id, name, translations { bg { name }, ru { name }, en { name } },
        "slug": { "current": coalesce(slug.current, slug) },
        sortOrder, "parentId": parent->_id, "isPlantCategory": true
      }
    `
    const headerServiceQuery = `
      *[_type == "service" && isActive != false] | order(sortOrder asc, name asc) {
        _id, name, translations { bg { name }, ru { name }, en { name } },
        "slug": { "current": coalesce(slug.current, slug) },
        sortOrder, serviceCategory, serviceLayout
      }
    `
    const headerSettingsQuery = `*[_type == "siteSettings"][0] { siteName }`
    const headerLogoQuery = `
      *[_type == "photo" && coalesce(slug.current, slug) == "oficialno-logo-florial-gradinski-centar"][0] {
        title, titleEn, titleRu,
        "logoUrl": image.asset->url,
        "logoAlt": image.alt, "logoAltEn": image.altEn, "logoAltRu": image.altRu,
        "logoAssetTitle": image.asset->title, "logoAssetAltText": image.asset->altText,
        "logoWidth": image.asset->metadata.dimensions.width,
        "logoHeight": image.asset->metadata.dimensions.height
      }
    `

    sanityClient.fetch(headerCategoryQuery)
      .then((data) => { if (!cancelled) setHeaderCategories(Array.isArray(data) ? data : []) })
      .catch((error) => console.error('Header: не удалось загрузить категории оборудования:', error))
    publicPlantsClient.fetch(headerPlantCategoryQuery)
      .then((data) => { if (!cancelled) setHeaderPlantCategories(Array.isArray(data) ? data : []) })
      .catch((error) => console.error('Header: не удалось загрузить категории растений:', error))
    sanityClient.fetch(headerServiceQuery)
      .then((data) => { if (!cancelled) setHeaderServices(Array.isArray(data) ? data : []) })
      .catch((error) => console.error('Header: не удалось загрузить пункты услуг:', error))
    sanityClient.fetch(headerSettingsQuery)
      .then((data) => { if (!cancelled) setHeaderSiteSettings((previous) => ({ ...(previous || {}), ...(data || {}) })) })
      .catch((error) => console.error('Header: не удалось загрузить название сайта:', error))
    sanityClient.fetch(headerLogoQuery)
      .then((data) => {
        if (cancelled) return
        setHeaderSiteSettings((previous) => ({
          ...(previous || {}),
          logoUrl: data?.logoUrl || null,
          logoAlt: data?.logoAlt || null,
          logoAltEn: data?.logoAltEn || null,
          logoAltRu: data?.logoAltRu || null,
          logoAssetTitle: data?.logoAssetTitle || null,
          logoAssetAltText: data?.logoAssetAltText || null,
          logoTitle: data?.title || null,
          logoTitleEn: data?.titleEn || null,
          logoTitleRu: data?.titleRu || null,
          logoWidth: data?.logoWidth || null,
          logoHeight: data?.logoHeight || null,
        }))
      })
      .catch((error) => console.error('Header: не удалось загрузить логотип:', error))

    return () => { cancelled = true }
  }, [])

  // The six homepage plant cards are requested only while the homepage is active.
  // This is intentionally separate from the complete category index used by catalogue routes.
  useEffect(() => {
    let cancelled = false
    if (normalizedRoutePath !== '/' && normalizedRoutePath !== '/index.html') {
      return () => { cancelled = true }
    }

    const homepagePlantCategoriesQuery = `
      *[_type == "category" && _id in [
        "plants-root", "plants-palms", "plants-olives",
        "plants-trees-shrubs", "plants-citrus", "plants-flowers"
      ]] {
        _id, name, translations { bg { name }, ru { name }, en { name } },
        "slug": { "current": coalesce(slug.current, slug) },
        sortOrder, "parentId": parent->_id,
        "imageUrl": coalesce(image.asset->url, externalImageUrl),
        "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu,
        "imageTitle": image.title, "imageTitleEn": image.titleEn, "imageTitleRu": image.titleRu,
        "isPlantCategory": true
      }
    `

    publicPlantsClient.fetch(homepagePlantCategoriesQuery)
      .then((data) => { if (!cancelled) setHomePlantCategories(Array.isArray(data) ? data : []) })
      .catch((error) => console.error('Homepage: не удалось загрузить категории растений:', error))

    // Resolve the hero from the Studio photo collection. Keep the existing CDN URL
    // as the immediate render fallback so the LCP image starts loading without waiting
    // for this content query; the Sanity result points to the same existing asset.
    const homepageHeroImageQuery = `
      *[_type == "photo" && slug == "florial-homepage-hero-background" && isActive == true][0] {
        "imageUrl": image.asset->url
      }
    `
    sanityClient.fetch(homepageHeroImageQuery)
      .then((data) => {
        if (!cancelled && typeof data?.imageUrl === 'string') setHomeHeroImageUrl(data.imageUrl)
      })
      .catch((error) => console.error('Homepage: не удалось загрузить фоновое изображение:', error))

    return () => { cancelled = true }
  }, [normalizedRoutePath])

  // Load only the catalogue required by the active category. Product detail routes
  // still load both indexes because the URL does not identify the Sanity dataset.
  // Each dataset is cached independently so switching catalogue roots fetches only
  // the missing dataset, without downloading irrigation products on plant categories.
  useEffect(() => {
    let cancelled = false

    if (!needsCatalogue) {
      setLoadingProducts(false)
      return () => { cancelled = true }
    }

    if (activeCategorySlug && loadingCategories) {
      setLoadingProducts(true)
      return () => { cancelled = true }
    }

    const routeCategory = activeCategorySlug
      ? categories.find((category) =>
          category.slug?.current === activeCategorySlug || category._id === activeCategorySlug
        )
      : null
    const requestedCatalogueTypes = activeProductSlug
      ? ['equipment', 'plants']
      : routeCategory
        ? [routeCategory.isPlantCategory ? 'plants' : 'equipment']
        : []
    const catalogueTypesToLoad = requestedCatalogueTypes.filter(
      (type) => !loadedCatalogueTypes.includes(type)
    )

    if (catalogueTypesToLoad.length === 0) {
      setLoadingProducts(false)
      return () => { cancelled = true }
    }

    setLoadingProducts(true)
    const productQuery = `
      *[
        _type == "product" &&
        isActive != false &&
        defined(slug)
      ] {
        _id,
        name,
        translations {
          bg { name, shortDescription },
          ru { name, shortDescription },
          en { name, shortDescription }
        },
        "productType": "equipment",
        "slug": { "current": coalesce(slug.current, slug) },
        sku,
        "brand": brand->name,
        priceEUR,
        oldPriceEUR,
        stockStatus,
        stockQuantity,
        "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
        "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
        "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
        "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
        shortDescription,
        "category": category->name,
        "categoryTranslations": category->translations { bg { name }, ru { name }, en { name } },
        "categoryId": category->_id,
        "categorySlug": coalesce(category->slug.current, category->slug),
        "categoryParentId": category->parent->_id,
        "categories": categories[]-> {
          _id,
          name,
          translations { bg { name }, ru { name }, en { name } },
          "slug": { "current": coalesce(slug.current, slug) },
          "parentId": parent->_id
        }
      }
    `

    const plantProductQuery = `
      *[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false] | order(sortOrder asc) {
        _id,
        name,
        translations {
          bg { name, shortDescription },
          ru { name, shortDescription },
          en { name, shortDescription }
        },
        productType,
        "slug": { "current": coalesce(slug.current, slug) },
        sku,
        priceEUR,
        oldPriceEUR,
        stockStatus,
        stockQuantity,
        saleVariants[]{_key, name, nameEn, nameRu, sku, saleHeightCm, containerVolumeL, priceEUR, oldPriceEUR, stockStatus, stockQuantity},
        shortDescription,
        scientificName,
        plantCare { light, waterNeeds, minWinterTempC, blackSeaCoast },
        "mainImageUrl": mainImage.asset->url,
        "imageUrl": coalesce(mainImage.asset->url, image.asset->url, category->image.asset->url, category->externalImageUrl, category->parent->image.asset->url, category->parent->externalImageUrl),
        "galleryImages": gallery[]{_key, "url": asset->url, alt, altEn, altRu},
        "imageAlt": coalesce(mainImage.alt, name, translations.bg.name),
        "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
        "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
        "category": category->name,
        "categoryTranslations": category->translations { bg { name }, ru { name }, en { name } },
        "categoryId": category->_id,
        "categorySlug": coalesce(category->slug.current, category->slug),
        "categoryParentId": category->parent->_id,
        "categories": categories[]-> {
          _id,
          name,
          translations { bg { name }, ru { name }, en { name } },
          "slug": { "current": coalesce(slug.current, slug) },
          "parentId": parent->_id
        }
      }
    `



    const catalogueRequests = catalogueTypesToLoad.map((type) =>
      type === 'plants'
        ? plantsClient.fetch(plantProductQuery)
        : sanityLiveClient.fetch(productQuery)
    )

    Promise.allSettled(catalogueRequests).then((results) => {
      if (cancelled) return

      results.forEach((result, index) => {
        const catalogueType = catalogueTypesToLoad[index]
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          const incomingProducts = result.value as Product[]
          setProducts((previous) => {
            const existingIds = new Set(previous.map((product) => product._id))
            return [...previous, ...incomingProducts.filter((product) => !existingIds.has(product._id))]
          })
        } else if (result.status === 'rejected') {
          console.error(
            catalogueType === 'plants'
              ? 'Sanity: не удалось загрузить растения:'
              : 'Sanity: не удалось загрузить товары оборудования:',
            result.reason
          )
        }
      })
    }).finally(() => {
      if (!cancelled) {
        setLoadedCatalogueTypes((previous) =>
          Array.from(new Set([...previous, ...catalogueTypesToLoad]))
        )
        setLoadingProducts(false)
      }
    })

    return () => { cancelled = true }
  }, [needsCatalogue, activeCategorySlug, activeProductSlug, categories, loadingCategories, loadedCatalogueTypes])

  // Page data is loaded independently from the Header. Product, category and service
  // readiness are tracked separately so unrelated routes do not wait for the catalogue.
  // Первоначальная загрузка данных из Sanity.
  // Каждый раздел загружается независимо: ошибка одного запроса не должна
  // блокировать категории, услуги, настройки сайта или логотип.
  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      const categoryQuery = `
        *[_type == "category"] | order(sortOrder asc) {
          _id,
          name,
          translations { bg { name }, ru { name }, en { name } },
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder,
          "parentId": parent->_id,
          "productCount": count(*[_type == "product" && isActive != false && defined(slug) && (category._ref == ^._id || ^._id in categories[]._ref)]),
          "imageUrl": image.asset->url,
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          "isPlantCategory": false
        }
      `

      const plantCategoryQuery = `
        *[_type == "category" && defined(coalesce(slug.current, slug))] | order(sortOrder asc, name asc) {
          _id,
          name,
          translations { bg { name }, ru { name }, en { name } },
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder,
          "parentId": parent->_id,
          "productCount": count(*[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false && (category._ref == ^._id || ^._id in categories[]._ref)]),
          "imageUrl": coalesce(image.asset->url, externalImageUrl),
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          "isPlantCategory": true
        }
      `

      const settingsQuery = `
        *[_type == "siteSettings"][0] {
          siteName,
          heroTitle,
          heroSubtitle,
          translations
        }
      `

      const categoryPromise = Promise.allSettled([
        sanityClient.fetch(categoryQuery),
        publicPlantsClient.fetch(plantCategoryQuery),
      ]).then(([categoryResult, plantCategoryResult]) => {
        if (cancelled) return
        const equipmentCategories = categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value) ? categoryResult.value : []
        const plantsCategoryData = plantCategoryResult.status === 'fulfilled' && Array.isArray(plantCategoryResult.value) ? plantCategoryResult.value : []
        setCategories([...equipmentCategories, ...plantsCategoryData])
        if (categoryResult.status !== 'fulfilled') console.error('Sanity: не удалось загрузить категории оборудования:', categoryResult.reason)
        if (plantCategoryResult.status !== 'fulfilled') console.error('Sanity: не удалось загрузить категории растений:', plantCategoryResult.reason)
      }).finally(() => { if (!cancelled) setLoadingCategories(false) })

      const settingsPromise = sanityClient.fetch(settingsQuery)
        .then((data) => { if (!cancelled) setSiteSettings(data || null) })
        .catch((error) => console.error('Sanity: не удалось загрузить настройки сайта:', error))

      await Promise.allSettled([
        categoryPromise,
        settingsPromise,
      ])
    }

    fetchData().catch((err) => console.error('Ошибка загрузки данных Florial:', err))

    return () => {
      cancelled = true
    }
  }, [])

  // The full service directory is needed only by /services; the Header keeps its compact navigation query.
  useEffect(() => {
    let cancelled = false

    if (!isServicesListRoute || loadedServicesLanguage === language) {
      return () => { cancelled = true }
    }

    setLoadingServices(true)

    const serviceQuery = `
      *[_type == "service" && isActive != false] | order(sortOrder asc, name asc) {
        _id,
        name,
        translations { ${language} { name, shortDescription } },
        "slug": { "current": coalesce(slug.current, slug) },
        shortDescription,
        "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
        "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
        "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
        "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu),
        "imageLinkUrl": coalesce(image.linkUrl, mainImage.linkUrl),
        sortOrder,
        serviceCategory,
        serviceLayout
      }
    `

    const serviceRolePhotosQuery = `
      *[
        _type == "photo" &&
        isActive != false &&
        coalesce(slug.current, slug) in [
          "landshaften-arhitekt",
          "inzhener-polivni-sistemi",
          "gardinar",
          "specialist-trevni-ploshti"
        ]
      ] {
        "slug": coalesce(slug.current, slug),
        title,
        titleEn,
        titleRu,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt,
        "imageAltEn": image.altEn,
        "imageAltRu": image.altRu
      }
    `

    Promise.allSettled([
      sanityClient.fetch(serviceQuery),
      sanityClient.fetch(serviceRolePhotosQuery),
    ]).then(([servicesResult, photosResult]) => {
      if (cancelled) return
      if (servicesResult.status === 'fulfilled') {
        setServices(Array.isArray(servicesResult.value) ? servicesResult.value : [])
      } else {
        console.error('Sanity: не удалось загрузить услуги:', servicesResult.reason)
        setServices([])
      }
      if (photosResult.status === 'fulfilled') {
        setServiceRolePhotos(Array.isArray(photosResult.value) ? photosResult.value : [])
      } else {
        console.error('Sanity: не удалось загрузить фотографии направлений услуг:', photosResult.reason)
        setServiceRolePhotos([])
      }
      setLoadedServicesLanguage(language)
    }).finally(() => {
      if (!cancelled) setLoadingServices(false)
    })

    return () => { cancelled = true }
  }, [isServicesListRoute, language, loadedServicesLanguage])

  // Переход на главную страницу
  const navigateToHome = () => {
    setActiveSearchQuery(null)
    window.history.pushState({}, '', localizedUrl('/'))

    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)
    setLoadingProductDetails(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход на страницу контактов
  const navigateToContacts = () => {
    setActiveSearchQuery(null)
    window.history.pushState({}, '', localizedUrl('/contacts'))

    setIsContactsOpen(true)
    setIsCartOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход на страницу результатов поиска
  const navigateToSearch = (query: string) => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return

    window.history.pushState(
      {},
      '',
      localizedUrl(`/search?q=${encodeURIComponent(normalizedQuery)}`)
    )

    setActiveSearchQuery(normalizedQuery)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)
    setLoadingProductDetails(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход в категорию
  const navigateToCategory = (slug?: string, id?: string) => {
    setActiveSearchQuery(null)
    const target = slug || id

    if (!target) return

    window.history.pushState(
      {},
      '',
      localizedUrl(`/category/${encodeURIComponent(target)}`)
    )

    setActiveCategorySlug(target)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход на страницу услуги
  const navigateToService = (slug?: string, id?: string) => {
    setActiveSearchQuery(null)
    const target = slug || id

    if (!target) return

    window.history.pushState(
      {},
      '',
      localizedUrl(`/services/${encodeURIComponent(target)}`)
    )

    setActiveServiceSlug(target)
    setCurrentServiceDetails(null)
    setLoadingServiceDetails(true)
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход в карточку товара
  const navigateToProduct = (slug: string, saleVariantKey?: string) => {
    setActiveSearchQuery(null)
    if (!slug) return

    window.history.pushState(
      {},
      '',
      localizedUrl(`/product/${encodeURIComponent(slug)}`)
    )

    setCurrentProduct(null)
    setLoadingProductDetails(true)
    setInitialSaleVariantKey(saleVariantKey ?? null)
    setActiveProductSlug(slug)

    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveServiceSlug(null)
    setActiveCategorySlug(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Универсальная SPA-навигация для внутренних ссылок из Portable Text.
  const navigateToInternalPath = (rawPath: string) => {
    let target: URL
    try {
      target = new URL(rawPath, window.location.origin)
    } catch {
      return
    }

    const hostname = target.hostname.toLowerCase()
    if (
      hostname !== window.location.hostname.toLowerCase() &&
      hostname !== 'florial-bg.com' &&
      hostname !== 'www.florial-bg.com'
    ) return

    target.searchParams.delete('lang')
    const path = target.pathname + target.search + target.hash
    window.history.pushState({}, '', localizedUrl(path))

    const route = getRouteState(target.pathname, target.search)
    setActiveSearchQuery(route.activeSearchQuery)
    setIsCartOpen(route.isCartOpen)
    setIsContactsOpen(route.isContactsOpen)
    setActiveServiceSlug(route.activeServiceSlug)
    setCurrentServiceDetails(null)
    setLoadingServiceDetails(Boolean(route.activeServiceSlug && route.activeServiceSlug !== 'dostavka-poliv'))
    setActiveCategorySlug(route.activeCategorySlug)
    setActiveProductSlug(route.activeProductSlug)
    setInitialSaleVariantKey(null)
    setCurrentProduct(null)
    setLoadingProductDetails(Boolean(route.activeProductSlug))
    setRouteRevision((revision) => revision + 1)
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  // The full-text search index is loaded only on the search results route.
  useEffect(() => {
    let cancelled = false
    if (!activeSearchQuery?.trim()) {
      setSearchProducts([])
      setLoadingSearchResults(false)
      return () => { cancelled = true }
    }

    setLoadingSearchResults(true)
    setSearchProducts([])

    import('./lib/routeData/search')
      .then(({ fetchSearchProducts }) => fetchSearchProducts(() => cancelled))
      .then((results) => {
        if (!cancelled) setSearchProducts(results)
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Sanity: не удалось загрузить поисковый индекс:', error)
        setSearchProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSearchResults(false)
      })

    return () => { cancelled = true }
  }, [activeSearchQuery])

  const searchedProducts = useMemo(() => {
    const query = (activeSearchQuery || '').toLocaleLowerCase('bg').trim()
    if (!query) return []

    const words = query.split(/\s+/).filter(Boolean)

    return searchProducts.filter((product) => {
      const searchableText = [
        product.name,
        product.translations?.en?.name,
        product.translations?.ru?.name,
        product.sku,
        toPlainText(product.shortDescription),
        toPlainText(product.translations?.en?.shortDescription),
        toPlainText(product.translations?.ru?.shortDescription),
        toPlainText(product.description),
        toPlainText(product.translations?.bg?.description),
        toPlainText(product.translations?.en?.description),
        toPlainText(product.translations?.ru?.description),
        product.category,
        product.categories?.flatMap((category: any) => [category.name, category.translations?.en?.name, category.translations?.ru?.name]).join(' '),
        product.categorySlug,
        ...(product.specifications || []).flatMap((item) => [item.name, item.value, item.unit]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('bg')

      return words.every((word) => searchableText.includes(word))
    })
  }, [searchProducts, activeSearchQuery])

  const currentService = currentServiceDetails

  useEffect(() => {
    let cancelled = false

    if (!activeServiceSlug || activeServiceSlug === 'dostavka-poliv') {
      setCurrentServiceDetails(null)
      setLoadingServiceDetails(false)
      return () => { cancelled = true }
    }

    setLoadingServiceDetails(true)

    import('./lib/routeData/serviceDetails')
      .then(({ fetchServiceDetails }) => fetchServiceDetails(activeServiceSlug, language, () => cancelled))
      .then((service) => {
        if (!cancelled) setCurrentServiceDetails(service || null)
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Sanity: не удалось загрузить полную страницу услуги:', error)
          setCurrentServiceDetails(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingServiceDetails(false)
      })

    return () => { cancelled = true }
  }, [activeServiceSlug, language])

  const currentCategory = categories.find(
    (category) =>
      category.slug?.current === activeCategorySlug ||
      category._id === activeCategorySlug
  )

  // Full description, SEO and help block are loaded only on the category route.
  useEffect(() => {
    let cancelled = false

    if (!activeCategorySlug) {
      setCurrentCategoryDetails(null)
      setLoadingCategoryDetails(false)
      return () => { cancelled = true }
    }

    if (loadingCategories) {
      setLoadingCategoryDetails(true)
      return () => { cancelled = true }
    }

    if (!currentCategory) {
      setCurrentCategoryDetails(null)
      setLoadingCategoryDetails(false)
      return () => { cancelled = true }
    }

    setCurrentCategoryDetails(null)
    setLoadingCategoryDetails(true)

    import('./lib/routeData/categoryDetails')
      .then(({ fetchCategoryDetails }) => fetchCategoryDetails(currentCategory, () => cancelled))
      .then((details) => {
        if (!cancelled) setCurrentCategoryDetails(details || currentCategory)
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Sanity: не удалось загрузить полное содержимое категории:', error)
        setCurrentCategoryDetails(currentCategory)
      })
      .finally(() => {
        if (!cancelled) setLoadingCategoryDetails(false)
      })

    return () => { cancelled = true }
  }, [activeCategorySlug, loadingCategories, currentCategory])

  const isNotFoundRoute = (
    (
      normalizedRoutePath !== '/' &&
      normalizedRoutePath !== '/index.html' &&
      normalizedRoutePath !== '/contacts' &&
      normalizedRoutePath !== '/about' &&
      normalizedRoutePath !== '/services' &&
      normalizedRoutePath !== '/cart' &&
      normalizedRoutePath !== '/search' &&
      normalizedRoutePath !== '/blog' &&
      !normalizedRoutePath.startsWith('/blog/') &&
      !normalizedRoutePath.startsWith('/product/') &&
      !normalizedRoutePath.startsWith('/products/') &&
      !normalizedRoutePath.startsWith('/services/') &&
      !normalizedRoutePath.startsWith('/category/')
    ) ||
    (normalizedRoutePath.startsWith('/services/') && normalizedRoutePath !== '/services/dostavka-poliv' && !loadingServiceDetails && !currentService) ||
    (normalizedRoutePath.startsWith('/category/') && !loadingCategories && !currentCategory) ||
    (
      (normalizedRoutePath.startsWith('/product/') || normalizedRoutePath.startsWith('/products/')) &&
      !loadingProducts &&
      !loadingProductDetails &&
      !currentProduct
    )
  )

  const filteredProducts = useMemo(() => {
    if (!currentCategory) return products

    // Equipment and plants have separate root categories and must never leak
    // into each other's category listings.
    if (currentCategory._id === 'plants-root' || currentCategory.slug?.current === 'rastenia') {
      return products.filter((product) => isPlantProductType(product.productType))
    }
    if (currentCategory.slug?.current === 'vsichko-za-polivane') {
      return products.filter((product) => !isPlantProductType(product.productType))
    }

    // A parent plant category includes products assigned to its descendants.
    const descendantIds = new Set<string>([currentCategory._id])
    let expanded = true
    while (expanded) {
      expanded = false
      categories.forEach((category: any) => {
        if (category.parentId && descendantIds.has(category.parentId) && !descendantIds.has(category._id)) {
          descendantIds.add(category._id)
          expanded = true
        }
      })
    }

    return products.filter((product) => {
      const productIsPlant = isPlantProductType(product.productType)
      const categoryIsPlant = currentCategory._id.startsWith('plants-')
      if (productIsPlant !== categoryIsPlant) return false

      const isMainMatch = Boolean(product.categoryId && descendantIds.has(product.categoryId))
      const isMultiMatch = Boolean(
        product.categories?.some((category: any) => descendantIds.has(category._id))
      )
      return isMainMatch || isMultiMatch
    })
  }, [products, currentCategory, categories])

  // Не показываем в навигации пустые категории; документы Sanity при этом не удаляются.
  const visibleCategories = useMemo(() => {
    // Sanity returns direct product counts; keep each populated category and its ancestors.
    const byId = new Map(categories.map((item) => [item._id, item]))
    const visibleIds = new Set<string>()
    categories.forEach((category) => {
      if ((category.productCount || 0) <= 0) return
      let current: CategoryItem | undefined = category
      const visited = new Set<string>()
      while (current && !visited.has(current._id)) {
        visited.add(current._id)
        visibleIds.add(current._id)
        current = current.parentId ? byId.get(current.parentId) : undefined
      }
    })
    return categories.filter((category) =>
      category.slug?.current !== 'electromagnetic-valves' && visibleIds.has(category._id)
    )
  }, [categories])


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        services={headerServices}
        categories={headerCategories.filter((category) => !category._id.startsWith('plants-') && category.slug?.current !== 'electromagnetic-valves')}
        plantCategories={headerPlantCategories}
        cart={cart}
        onNavigateHome={navigateToHome}
        onNavigateService={navigateToService}
        onNavigateCategory={navigateToCategory}
        onNavigateContacts={navigateToContacts}
        onNavigateCart={navigateToCart}
        onSearch={navigateToSearch}
        siteSettings={headerSiteSettings}
      />

      <React.Suspense fallback={
        activeCategorySlug
          ? <CategoryLoadingState label={t('Зареждане на категорията...')} />
          : (
            <main
              className="mx-auto flex w-full max-w-7xl flex-grow items-center justify-center px-4 py-20 text-center text-slate-500"
              role="status"
              aria-live="polite"
            >
              {t('Зареждане на страницата...')}
            </main>
          )
      }>
        {normalizedRoutePath === '/about' ? (
        <AboutPage services={services} categories={categories} />
      ) : isCartOpen ? (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onNavigateHome={navigateToHome}
        />
      ) : isContactsOpen ? (
        <ContactsPage onNavigateHome={navigateToHome} />
      ) : activeSearchQuery !== null ? (
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-5 text-sm text-slate-500">
            <button
              onClick={navigateToHome}
              className="font-semibold text-emerald-700 hover:text-emerald-900"
            >
              {t('Начало')}
            </button>
            <span className="mx-2">/</span>
            <span>{t('Резултати от търсенето')}</span>
          </nav>

          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {t('Резултати от търсенето')}
          </h1>
          <p className="mt-2 text-slate-600">
            {t('Търсене:')} „{activeSearchQuery}“
          </p>

          {loadingSearchResults ? (
            <p className="py-12 text-slate-500">{t('Зареждане на продуктите...')}</p>
          ) : !activeSearchQuery ? (
            <p className="py-12 text-slate-600">
              {t("Въведете име, марка или продуктов код в полето за търсене.")}
            </p>
          ) : searchedProducts.length === 0 ? (
            <div className="py-12">
              <p className="text-lg font-semibold text-slate-800">
                {t("Няма намерени продукти")}
              </p>
              <p className="mt-2 text-slate-600">
                {t("Опитайте с друго име, марка или продуктов код.")}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-slate-500">
                {t('Намерени продукти:')} {searchedProducts.length}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {searchedProducts.map((product) => (
                  <a
                    key={product._id}
                    href={localizedHref(`/product/${encodeURIComponent(product.slug?.current || product._id)}`, language)}
                    onClick={(event) => handleInternalLinkClick(event, () => {
                      navigateToProduct(product.slug?.current || product._id)
                    })}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-emerald-500 hover:shadow-md no-underline"
                  >
                    {product.imageUrl ? (
                      <img
                        {...getSanityImageProps(product.imageUrl, '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw')}
                        alt={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'alt')}
                        title={getProductImageText(String(localize(product, 'name') || product.name), language, 0, 'title')}
                        loading="lazy"
                        className="h-40 w-full bg-white object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-50 text-sm text-slate-400">
                        {t("Няма снимка")}
                      </div>
                    )}
                    <div className="p-3">
                      <h2 className="line-clamp-2 font-semibold text-slate-800">
                        {localize(product, 'name')}
                      </h2>
                      {product.sku && (
                        <p className="mt-2 text-xs text-slate-500">
                          {t('Артикул:')} {product.sku}
                        </p>
                      )}
                      <p className="mt-3 font-bold text-emerald-800">
                        {Number(product.priceEUR || 0).toFixed(2)} €
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
                      <span className="mt-3 block text-sm font-semibold text-emerald-700">
                        {t("Виж продукта →")}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </main>
      ) : normalizedRoutePath === '/blog' ? (
        <BlogPage />
      ) : normalizedRoutePath.startsWith('/blog/') ? (
        <BlogPostPage slug={decodeURIComponent(normalizedRoutePath.slice('/blog/'.length))} />
      ) : isNotFoundRoute ? (
        <main className="mx-auto flex w-full max-w-3xl flex-grow flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'ru' ? 'Страница не найдена' : language === 'en' ? 'Page not found' : 'Страницата не е намерена'}
          </h1>
          <p className="mt-3 text-slate-600">
            {language === 'ru' ? 'Проверьте адрес или вернитесь на главную страницу.' : language === 'en' ? 'Check the address or return to the homepage.' : 'Проверете адреса или се върнете към началната страница.'}
          </p>
          <button
            onClick={navigateToHome}
            className="mt-6 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            {language === 'ru' ? 'На главную' : language === 'en' ? 'Back to homepage' : 'Към началната страница'}
          </button>
        </main>
       ) : (normalizedRoutePath === '/services/dostavka-poliv' || currentService?.serviceLayout === 'delivery') ? (
        <IrrigationSupportPage />
      ) : normalizedRoutePath === '/services' ? (
        <ServicesListPage services={services} rolePhotos={serviceRolePhotos} loading={loadingServices || loadedServicesLanguage !== language} />
      ) : activeServiceSlug && loadingServiceDetails ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <p className="text-slate-500 font-medium">{t("Зареждане на страницата...")}</p>
        </div>
      ) : activeServiceSlug && currentService ? (
        <ServicePage
          service={currentServiceDetails || currentService}
          onNavigateHome={navigateToHome}
        />
      ) : activeCategorySlug && (
        loadingProducts ||
        loadingCategories ||
        loadingCategoryDetails ||
        Boolean(currentCategory && currentCategoryDetails?._id !== currentCategory._id)
      ) ? (
        <CategoryLoadingState label={t('Зареждане на категорията...')} />
      ) : activeCategorySlug && currentCategory ? (
        <CategoryPage
          category={currentCategoryDetails || currentCategory}
          products={filteredProducts}
          onNavigateHome={navigateToHome}
          onNavigateCategory={navigateToCategory}
          allCategories={categories}
          visibleCategories={visibleCategories}
          onNavigateInternalPath={navigateToInternalPath}
          onSelectProduct={(product, saleVariantKey) =>
            navigateToProduct(product.slug?.current || product._id, saleVariantKey)
          }
        />
      ) : activeProductSlug ? (
        loadingProducts || loadingProductDetails ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-medium">
              {t("Зареждане на продукта...")}
            </p>
          </div>
        ) : currentProduct ? (
          <ProductPage
            product={currentProduct}
            initialSaleVariantKey={initialSaleVariantKey}
            allCategories={categories}
            onNavigateHome={navigateToHome}
            onNavigateCategory={navigateToCategory}
            onNavigateProduct={navigateToProduct}
            onAddToCart={handleAddToCart}
            onNavigateContacts={navigateToContacts}
            onNavigateInternalPath={navigateToInternalPath}
          />
        ) : (
          <div className="flex-grow text-center py-20">
            <h1 className="text-xl font-bold text-slate-800">
              {t("Продуктът не е намерен")}
            </h1>

            <p className="mt-2 text-slate-500">
              {t("Проверете адреса или се върнете към началната страница.")}
            </p>

            <button
              onClick={navigateToHome}
              className="mt-4 rounded-lg bg-emerald-600 px-5 py-3 text-white"
            >
              {t("Към началната страница")}
            </button>
          </div>
        )
      ) : (
        <HomePage
          services={services}
          categories={visibleCategories.filter((category) => !category._id.startsWith('plants-'))}
          plantCategories={homePlantCategories}
          heroImageUrl={homeHeroImageUrl}
          siteSettings={siteSettings}
          onNavigateService={navigateToService}
          onNavigateCategory={navigateToCategory}
        />
        )}
      </React.Suspense>

      <Footer />
    </div>
  )
}
