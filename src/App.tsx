
import React, { useState, useEffect, useMemo } from 'react'
import { sanityClient } from './lib/sanity'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { useI18n } from './lib/i18n'
import { HomePage } from './pages/HomePage'
import { ServicePage } from './pages/ServicePage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductPage } from './pages/ProductPage'
import { ContactsPage } from './pages/ContactsPage'
import { CartPage } from './pages/CartPage'

import type {
  CategoryItem,
  Product,
  ServiceItem,
  SiteSettings,
  CartItem,
} from './types'

export default function App() {
  const { t, language, localize } = useI18n()
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
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(null)

  const [isContactsOpen, setIsContactsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Роутинг по URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      setActiveSearchQuery(path === '/search' ? (searchParams.get('q')?.trim() || '') : null)

      if (path === '/search') {
        setIsCartOpen(false)
        setIsContactsOpen(false)
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
      } else if (path === '/cart') {
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
        setActiveCategorySlug(null)
        setActiveProductSlug(null)
        setIsCartOpen(false)
        setIsContactsOpen(false)
      } else if (path.startsWith('/category/')) {
        setActiveCategorySlug(path.replace('/category/', ''))
        setActiveServiceSlug(null)
        setActiveProductSlug(null)
        setIsCartOpen(false)
        setIsContactsOpen(false)
      } else if (
        path.startsWith('/product/') ||
        path.startsWith('/products/')
      ) {
        setActiveProductSlug(
          decodeURIComponent(path.replace(/^\/(product|products)\//, ''))
        )
        setActiveServiceSlug(null)
        setActiveCategorySlug(null)
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

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Находим товар по URL после загрузки каталога
  useEffect(() => {
    if (!activeProductSlug) {
      setCurrentProduct(null)
      setLoadingProductDetails(false)
      return
    }

    // При прямом открытии ссылки ждём загрузки товаров из Sanity
    if (loadingProducts) {
      setLoadingProductDetails(true)
      return
    }

    const foundProduct = products.find(
      (product) =>
        product.slug?.current === activeProductSlug ||
        product._id === activeProductSlug
    )

    setCurrentProduct(foundProduct || null)
    setLoadingProductDetails(false)

    if (!foundProduct) {
      console.warn(
        'Товар не найден. Slug из URL:',
        activeProductSlug
      )
    }
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
  const handleAddToCart = (product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product._id === product._id
      )

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

  // Изменение количества товара в корзине
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Удаление товара из корзины
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) =>
      prev.filter((item) => item.product._id !== productId)
    )
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
          slug,
          sortOrder,
          "imageUrl": image.asset->url,
          description,
          seo
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
          // Normalize both Sanity slug objects ({ current }) and legacy plain strings.
          "slug": { "current": coalesce(slug.current, slug) },
          sku,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "galleryImages": gallery[].asset->url,
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
          "categorySlug": category->slug.current,
          "categories": categories[]-> {
            _id,
            name,
            translations,
            slug
          }
        }
      `

      const serviceQuery = `
        *[_type == "service" && isActive != false] {
          _id,
          name,
          translations,
          slug,
          shortDescription,
          description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url),
          "galleryImages": gallery[].asset->url,
          "contentBlocks": contentBlocks[]{
            _key,
            title,
            text,
            imagePosition,
            "imageUrl": image.asset->url,
            "imageAlt": image.alt,
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
          slug.current == "oficialno-logo-florial-gradinski-centar"
        ][0] {
          _id,
          title,
          slug,
          "logoUrl": image.asset->url
        }
      `

      const requests = await Promise.allSettled([
        sanityClient.fetch(categoryQuery),
        sanityClient.fetch(productQuery),
        sanityClient.fetch(serviceQuery),
        Promise.all([
          sanityClient.fetch(settingsQuery),
          sanityClient.fetch(logoQuery),
        ]),
      ])

      if (cancelled) return

      const [categoryResult, productResult, serviceResult, settingsResult] = requests

      if (categoryResult.status === 'fulfilled') {
        setCategories(Array.isArray(categoryResult.value) ? categoryResult.value : [])
      } else {
        console.error('Sanity: не удалось загрузить категории:', categoryResult.reason)
      }

      if (productResult.status === 'fulfilled') {
        setProducts(Array.isArray(productResult.value) ? productResult.value : [])
      } else {
        console.error('Sanity: не удалось загрузить товары:', productResult.reason)
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
        product.shortDescription,
        product.translations?.en?.shortDescription,
        product.translations?.ru?.shortDescription,
        typeof product.description === 'string' ? product.description : '',
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

  const filteredProducts = useMemo(() => {
    if (!currentCategory) return products

    if (currentCategory.slug?.current === 'vsichko-za-polivane') {
      return products
    }

    return products.filter((product) => {
      const isMainMatch = product.categoryId === currentCategory._id

      const isMultiMatch =
        product.categories &&
        product.categories.some(
          (category: any) => category._id === currentCategory._id
        )

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
        onSearch={navigateToSearch}
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
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => {
                      if (product.slug?.current) {
                        navigateToProduct(product.slug.current)
                      }
                    }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-emerald-500 hover:shadow-md"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={localize(product, 'name')}
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
                      <span className="mt-3 block text-sm font-semibold text-emerald-700">
                        {t("Виж продукта →")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      ) : activeServiceSlug && currentService ? (
        <ServicePage
          service={currentService}
          onNavigateHome={navigateToHome}
        />
      ) : activeCategorySlug && currentCategory ? (
        <CategoryPage
          category={currentCategory}
          products={filteredProducts}
          onNavigateHome={navigateToHome}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={(product) =>
            product.slug?.current &&
            navigateToProduct(product.slug.current)
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
            onNavigateHome={navigateToHome}
            onNavigateCategory={navigateToCategory}
            onNavigateProduct={navigateToProduct}
            onAddToCart={handleAddToCart}
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
          categories={categories}
          products={products}
          siteSettings={siteSettings}
          loadingProducts={loadingProducts}
          onNavigateService={navigateToService}
          onNavigateCategory={navigateToCategory}
          onSelectProduct={(product) =>
            product.slug?.current &&
            navigateToProduct(product.slug.current)
          }
        />
      )}

      <Footer />
    </div>
  )
}
