
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { sanityClient, plantsClient } from './lib/sanity'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { useI18n } from './lib/i18n'
import { HomePage } from './pages/HomePage'
import { ServicePage } from './pages/ServicePage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductPage } from './pages/ProductPage'
import { ContactsPage } from './pages/ContactsPage'
import { ServicesListPage } from './pages/ServicesListPage'
import { CartPage } from './pages/CartPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { AboutPage } from './pages/AboutPage'
import { IrrigationSupportPage } from './pages/IrrigationSupportPage'
import { handleInternalLinkClick, localizedHref } from './lib/navigation'
import { applyPageSeo } from './lib/seo'
import { getProductImageText } from './lib/productImageSeo'
import { toPlainText } from './lib/richTextUtils.mjs'
import { trackEvent } from './services/trackingService'
import { loadCart, saveCart } from './lib/cartStorage'

import type {
  CategoryItem,
  Product,
  ServiceItem,
  SiteSettings,
  CartItem,
} from './types'

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

export default function App() {
  const { t, language, localize } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [plantCategories, setPlantCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [cart, setCart] = useState<CartItem[]>(() => loadCart())

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
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
    const isMissingDynamicRoute = !loadingProducts && (
      ((path.startsWith('/product/') || path.startsWith('/products/')) && Boolean(activeProductSlug) && !currentProduct) ||
      (path.startsWith('/services/') && path !== '/services/dostavka-poliv' && Boolean(activeServiceSlug) && !currentService) ||
      (path.startsWith('/category/') && Boolean(activeCategorySlug) && !currentCategory)
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
  }, [language, activeServiceSlug, activeCategorySlug, activeProductSlug, activeSearchQuery, isContactsOpen, isCartOpen, currentProduct, loadingProducts])

  // Keep browser back/forward navigation in sync with the route resolved on initial render.
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteState()
      setActiveSearchQuery(route.activeSearchQuery)
      setIsCartOpen(route.isCartOpen)
      setIsContactsOpen(route.isContactsOpen)
      setActiveServiceSlug(route.activeServiceSlug)
      setActiveCategorySlug(route.activeCategorySlug)
      setActiveProductSlug(route.activeProductSlug)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Находим товар по URL. Состав комплекта загружаем отдельным detail-запросом,
  // чтобы не включать kitComponents в каталожные, поисковые и связанные GROQ-выборки.
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
      (product) =>
        product.slug?.current === activeProductSlug ||
        product._id === activeProductSlug
    )

    if (!foundProduct) {
      setCurrentProduct(null)
      setLoadingProductDetails(false)
      console.warn('Товар не найден. Slug из URL:', activeProductSlug)
      return () => { cancelled = true }
    }

    const kitCategoryId = '6709cd41-18c6-4c5f-bc27-90d55d685dec'
    const isKitProduct = foundProduct.productType === 'equipment' && (
      foundProduct.categoryId === kitCategoryId ||
      foundProduct.categories?.some(category => category._id === kitCategoryId)
    )

    if (!isKitProduct) {
      setCurrentProduct(foundProduct)
      setLoadingProductDetails(false)
      return () => { cancelled = true }
    }

    setLoadingProductDetails(true)
    const kitComponentsQuery = `
      *[_type == "product" && _id == $id][0] {
        "kitComponents": kitComponents[]{
          _key,
          quantity,
          unit,
          note { bg, ru, en },
          "product": product->{
            _id,
            name,
            translations,
            "slug": slug,
            sku,
            "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
            isActive
          }
        }
      }
    `

    sanityClient.fetch(kitComponentsQuery, {id: foundProduct._id})
      .then((details: any) => {
        if (cancelled) return
        setCurrentProduct({
          ...foundProduct,
          kitComponents: Array.isArray(details?.kitComponents) ? details.kitComponents : [],
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Sanity: не удалось загрузить состав комплекта:', error)
        setCurrentProduct({...foundProduct, kitComponents: []})
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
          translations,
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder,
          "parentId": parent->_id,
          "imageUrl": image.asset->url,
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          description,
          seo,
          helpBlock,
          "isPlantCategory": false
        }
      `

      const productQuery = `
        *[
          _type == "product" &&
          isActive != false &&
          defined(slug)
        ] {
          _id,
          name,
          translations,
          "productType": "equipment",
          // Normalize both Sanity slug objects ({ current }) and legacy plain strings.
          "slug": { "current": coalesce(slug.current, slug) },
          sku,
          "brand": brand->name,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          "galleryImages": gallery[]{ "url": asset->url, alt, altEn, altRu },
          shortDescription,
          description,
          specifications,
          compatibility,
          seo,
          "manualPDFUrl": manualPDF.asset->url,
          "catalogPDFUrl": catalogPDF.asset->url,
          "category": category->name,
          "categoryTranslations": category->translations,
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categoryParentId": category->parent->_id,
          "categories": categories[]-> {
            _id,
            name,
            translations,
            "slug": { "current": coalesce(slug.current, slug) },
            "parentId": parent->_id
          },
          "relatedProducts": relatedProducts[]->{
            _id,
            name,
            translations,
            "productType": "equipment",
            "slug": { "current": coalesce(slug.current, slug) },
            sku,
            priceEUR,
            oldPriceEUR,
            stockStatus,
            "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
            "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
            "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
            "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
            shortDescription
          },
          "relatedContent": relatedContent[]->{
            _id,
            _type,
            name,
            title,
            translations,
            "slug": { "current": coalesce(slug.current, slug) },
            shortDescription,
            isActive,
            isPublished,
            "imageUrl": coalesce(image.asset->url, cover.asset->url, hero.image.asset->url),
            "imageAlt": coalesce(image.alt, cover.alt, name, translations.bg.title, title),
            "imageAltEn": coalesce(image.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
            "imageAltRu": coalesce(image.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
          }
        }
      `

      const plantCategoryQuery = `
        *[_type == "category" && defined(coalesce(slug.current, slug))] | order(sortOrder asc, name asc) {
          _id,
          name,
          translations,
          seo,
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder,
          description,
          "parentId": parent->_id,
          "imageUrl": coalesce(image.asset->url, externalImageUrl),
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          helpBlock,
          "isPlantCategory": true
        }
      `

      const plantProductQuery = `
        *[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false] | order(sortOrder asc) {
          _id, name, translations,
          productType,
          "slug": { "current": coalesce(slug.current, slug) },
          sku, priceEUR, oldPriceEUR, vatIncluded, stockStatus, stockQuantity, saleVariants[]{_key, name, nameEn, nameRu, sku, saleHeightCm, containerVolumeL, priceEUR, oldPriceEUR, stockStatus, stockQuantity}, shortDescription, description,
          scientificName, plantCare, careGuide, recommendedIrrigation, relatedContentBySlug, isFeatured, plantDetails { availabilityNote }, sourcePageUrl,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url, category->image.asset->url, category->externalImageUrl, category->parent->image.asset->url, category->parent->externalImageUrl),
          "imageAlt": coalesce(mainImage.alt, name, translations.bg.name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          "galleryImages": gallery[]{_key, "url": asset->url, alt, altEn, altRu},
          "category": category->name,
          "categoryTranslations": category->translations,
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categoryParentId": category->parent->_id,
          "categories": categories[]->{_id, name, translations, "slug": { "current": coalesce(slug.current, slug) }, "parentId": parent->_id}
        }
      `

      const serviceQuery = `
        *[_type == "service" && isActive != false] {
          _id,
          name,
          translations,
          "slug": { "current": coalesce(slug.current, slug) },
          shortDescription,
          description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url),
          "imageAlt": coalesce(image.alt, mainImage.alt),
          "imageAltEn": coalesce(image.altEn, mainImage.altEn),
          "imageAltRu": coalesce(image.altRu, mainImage.altRu),
          "galleryImages": gallery[]{_key, "url": asset->url, alt, altEn, altRu},
          "contentBlocks": contentBlocks[]{
            _key,
            title,
            text,
            imagePosition,
            "imageUrl": image.asset->url,
            "imageAlt": image.alt,
            "imageAltEn": image.altEn,
            "imageAltRu": image.altRu,
            translations
          },
          startingPriceEUR,
          advantages,
          steps,
          hero,
          callToAction,
          leadForm,
          seo
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

      const logoQuery = `
        *[
          _type == "photo" &&
          coalesce(slug.current, slug) == "oficialno-logo-florial-gradinski-centar"
        ][0] {
          _id,
          title,
          titleEn,
          titleRu,
          slug,
          seoDescription,
          "logoUrl": image.asset->url,
          "logoAlt": image.alt,
          "logoAltEn": image.altEn,
          "logoAltRu": image.altRu,
          "logoAssetTitle": image.asset->title,
          "logoAssetAltText": image.asset->altText,
          "logoWidth": image.asset->metadata.dimensions.width,
          "logoHeight": image.asset->metadata.dimensions.height
        }
      `

      const requests = await Promise.allSettled([
        sanityClient.fetch(categoryQuery),
        sanityClient.fetch(productQuery),
        sanityClient.fetch(serviceQuery),
        plantsClient.fetch(plantCategoryQuery),
        plantsClient.fetch(plantProductQuery),
        Promise.all([
          sanityClient.fetch(settingsQuery),
          sanityClient.fetch(logoQuery),
        ]),
      ])

      if (cancelled) return

      const [categoryResult, productResult, serviceResult, plantCategoryResult, plantProductResult, settingsResult] = requests

      const equipmentCategories = categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value) ? categoryResult.value : []
      const plantsCategoryData = plantCategoryResult.status === 'fulfilled' && Array.isArray(plantCategoryResult.value) ? plantCategoryResult.value : []
      setPlantCategories(plantsCategoryData)
      setCategories([...equipmentCategories, ...plantsCategoryData])

      if (categoryResult.status !== 'fulfilled') {
        console.error('Sanity: не удалось загрузить категории оборудования:', categoryResult.reason)
      }
      if (plantCategoryResult.status !== 'fulfilled') {
        console.error('Sanity: не удалось загрузить категории растений:', plantCategoryResult.reason)
      }

      const equipmentProducts = productResult.status === 'fulfilled' && Array.isArray(productResult.value) ? productResult.value : []
      const plantProductData = plantProductResult.status === 'fulfilled' && Array.isArray(plantProductResult.value) ? plantProductResult.value : []

      // Resolve plant cross-links against the production dataset without changing Sanity documents.
      const plantRelatedSlugs = Array.from(new Set(
        plantProductData.flatMap((plant: any) =>
          Array.isArray(plant.relatedContentBySlug)
            ? plant.relatedContentBySlug.map((item: any) => item?.slug).filter((slug: any): slug is string => typeof slug === 'string' && slug.length > 0)
            : []
        )
      ))
      let plantRelatedDocuments: any[] = []
      if (plantRelatedSlugs.length > 0) {
        const plantRelatedQuery = `
          *[
            _type in ["service", "blogPost"] &&
            coalesce(slug.current, slug) in $slugs
          ] {
            _id,
            _type,
            name,
            title,
            "slug": { "current": coalesce(slug.current, slug) },
            shortDescription,
            isActive,
            isPublished,
            translations {
              bg { name, title, shortDescription },
              ru { name, title, shortDescription },
              en { name, title, shortDescription }
            },
            "imageUrl": coalesce(image.asset->url, mainImage.asset->url, cover.asset->url, hero.image.asset->url),
            "imageAlt": coalesce(image.alt, mainImage.alt, cover.alt, name, translations.bg.title, title),
            "imageAltEn": coalesce(image.altEn, mainImage.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
            "imageAltRu": coalesce(image.altRu, mainImage.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
          }
        `
        try {
          const result = await sanityClient.fetch(plantRelatedQuery, { slugs: plantRelatedSlugs })
          plantRelatedDocuments = Array.isArray(result) ? result : []
        } catch (error) {
          console.error('Sanity: не удалось разрешить связанные услуги и статьи растений:', error)
        }
      }

      const enrichedPlantProducts = plantProductData.map((plant: any) => {
        const relatedContent = (Array.isArray(plant.relatedContentBySlug) ? plant.relatedContentBySlug : [])
          .map((reference: any) => {
            const item = plantRelatedDocuments.find((candidate) =>
              candidate._type === reference.contentType &&
              candidate.slug?.current === reference.slug &&
              (candidate._type === 'service' ? candidate.isActive !== false : candidate.isPublished === true)
            )
            return item ? { ...item, linkLabel: reference.label || undefined } : null
          })
          .filter(Boolean)

        const recommendedIrrigationProduct = plant.recommendedIrrigation?.productSlug
          ? equipmentProducts.find((item: any) => item.slug?.current === plant.recommendedIrrigation.productSlug)
          : undefined

        return {
          ...plant,
          relatedContent,
          recommendedIrrigationProduct,
        }
      })

      setProducts([...equipmentProducts, ...enrichedPlantProducts])

      if (productResult.status !== 'fulfilled') {
        console.error('Sanity: не удалось загрузить товары оборудования:', productResult.reason)
      }
      if (plantProductResult.status !== 'fulfilled') {
        console.error('Sanity: не удалось загрузить растения:', plantProductResult.reason)
      }

      if (serviceResult.status === 'fulfilled') {
        setServices(Array.isArray(serviceResult.value) ? serviceResult.value : [])
      } else {
        console.error('Sanity: не удалось загрузить услуги:', serviceResult.reason)
      }

      if (settingsResult.status === 'fulfilled') {
        const [settData, logoData] = settingsResult.value
        setSiteSettings({
          ...(settData || {}),
          logoUrl: logoData?.logoUrl || null,
          logoAlt: logoData?.logoAlt || null,
          logoAltEn: logoData?.logoAltEn || null,
          logoAltRu: logoData?.logoAltRu || null,
          logoAssetTitle: logoData?.logoAssetTitle || null,
          logoAssetAltText: logoData?.logoAssetAltText || null,
          logoTitle: logoData?.title || null,
          logoTitleEn: logoData?.titleEn || null,
          logoTitleRu: logoData?.titleRu || null,
          logoWidth: logoData?.logoWidth || null,
          logoHeight: logoData?.logoHeight || null,
        })
        console.log('Florial: настройки и логотип загружены', {
          settingsFound: Boolean(settData),
          logoFound: Boolean(logoData?.logoUrl),
        })
      } else {
        console.error('Sanity: не удалось загрузить настройки или логотип:', settingsResult.reason)
      }
    }

    fetchData()
      .catch((err) => console.error('Ошибка загрузки данных Florial:', err))
      .finally(() => {
        if (!cancelled) setLoadingProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

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
    setIsCartOpen(false)
    setIsContactsOpen(false)
    setActiveCategorySlug(null)
    setActiveProductSlug(null)
    setCurrentProduct(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Переход в карточку товара
  const navigateToProduct = (slug: string) => {
    setActiveSearchQuery(null)
    if (!slug) return

    window.history.pushState(
      {},
      '',
      localizedUrl(`/product/${encodeURIComponent(slug)}`)
    )

    setCurrentProduct(null)
    setLoadingProductDetails(true)
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
    setActiveCategorySlug(route.activeCategorySlug)
    setActiveProductSlug(route.activeProductSlug)
    setCurrentProduct(null)
    setLoadingProductDetails(Boolean(route.activeProductSlug))
    setRouteRevision((revision) => revision + 1)
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  const searchedProducts = useMemo(() => {
    const query = (activeSearchQuery || '').toLocaleLowerCase('bg').trim()
    if (!query) return []

    const words = query.split(/\s+/).filter(Boolean)

    return products.filter((product) => {
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
  }, [products, activeSearchQuery])

  const currentService = services.find(
    (service) =>
      service.slug?.current === activeServiceSlug ||
      service._id === activeServiceSlug
  )

  const currentCategory = categories.find(
    (category) =>
      category.slug?.current === activeCategorySlug ||
      category._id === activeCategorySlug
  )

  const isNotFoundRoute = !loadingProducts && (
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
    (normalizedRoutePath.startsWith('/services/') && normalizedRoutePath !== '/services/dostavka-poliv' && !currentService) ||
    (normalizedRoutePath.startsWith('/category/') && !currentCategory) ||
    (
      (normalizedRoutePath.startsWith('/product/') || normalizedRoutePath.startsWith('/products/')) &&
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
    // Keep a category visible when it or any descendant contains a product.
    const byId = new Map(categories.map((item) => [item._id, item]))
    const visibleIds = new Set<string>()
    products.forEach((product) => {
      const assignedIds = [
        product.categoryId,
        ...(product.categories || []).map((item: any) => item?._id),
      ].filter((id): id is string => Boolean(id))
      assignedIds.forEach((id) => {
        let current = byId.get(id)
        const visited = new Set<string>()
        while (current && !visited.has(current._id)) {
          visited.add(current._id)
          visibleIds.add(current._id)
          current = current.parentId ? byId.get(current.parentId) : undefined
        }
      })
    })
    return categories.filter((category) =>
      category.slug?.current !== 'electromagnetic-valves' && visibleIds.has(category._id)
    )
  }, [categories, products])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        services={services}
        categories={categories.filter((category) => !category._id.startsWith('plants-') && category.slug?.current !== 'electromagnetic-valves')}
        plantCategories={plantCategories}
        cart={cart}
        onNavigateHome={navigateToHome}
        onNavigateService={navigateToService}
        onNavigateCategory={navigateToCategory}
        onNavigateContacts={navigateToContacts}
        onNavigateCart={navigateToCart}
        onSearch={navigateToSearch}
        siteSettings={siteSettings}
      />

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

          {loadingProducts ? (
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
                        src={product.imageUrl}
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
       ) : normalizedRoutePath === '/services/dostavka-poliv' ? (
        <IrrigationSupportPage />
      ) : normalizedRoutePath === '/services' ? (
        <ServicesListPage services={services} />
      ) : activeServiceSlug && loadingProducts ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <p className="text-slate-500 font-medium">{t("Зареждане на страницата...")}</p>
        </div>
      ) : activeServiceSlug && currentService ? (
        <ServicePage
          service={currentService}
          onNavigateHome={navigateToHome}
        />
      ) : activeCategorySlug && loadingProducts ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <p className="text-slate-500 font-medium">{t("Зареждане на категорията...")}</p>
        </div>
      ) : activeCategorySlug && currentCategory ? (
        <CategoryPage
          category={currentCategory}
          products={filteredProducts}
          onNavigateHome={navigateToHome}
          onNavigateCategory={navigateToCategory}
          allCategories={categories}
          visibleCategories={visibleCategories}
          onSelectProduct={(product) =>
            navigateToProduct(product.slug?.current || product._id)
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
          plantCategories={plantCategories}
          products={products}
          siteSettings={siteSettings}
          loadingProducts={loadingProducts}
          onNavigateService={navigateToService}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={(product) =>
            navigateToProduct(product.slug?.current || product._id)
          }
        />
      )}

      <Footer />
    </div>
  )
}
