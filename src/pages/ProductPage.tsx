import React, { useState, useEffect, useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, PlantSaleVariant, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import { getProductImageText } from '../lib/productImageSeo'
import { ValveServiceCrosslink } from '../components/ValveServiceCrosslink'

const PLANT_PRODUCT_TYPES = new Set([
  'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus',
  'palm', 'conifer', 'fruit', 'succulent', 'climber', 'ornamentalGrass',
  'groundcover', 'bulb', 'herb', 'aquatic', 'other',
])

const isPlantProduct = (product: Product) =>
  PLANT_PRODUCT_TYPES.has(product.productType || '')

const formatPlantHeight = (value: number, language: string) => {
  if (value >= 100) return `${(value / 100).toLocaleString(language === 'en' ? 'en-GB' : language === 'ru' ? 'ru-RU' : 'bg-BG', { maximumFractionDigits: 1 })} m`
  return `${value} cm`
}

const renderCareGuideBlocks = (blocks: any[]) => blocks.map((block, index) => {
  if (block?._type !== 'block' || !Array.isArray(block.children)) return null
  const content = block.children.map((child: any, childIndex: number) => {
    let node: React.ReactNode = child.text || ''
    const marks: string[] = child.marks || []
    if (marks.includes('strong')) node = <strong>{node}</strong>
    if (marks.includes('em')) node = <em>{node}</em>
    const link = (block.markDefs || []).find((definition: any) => marks.includes(definition._key) && definition._type === 'link')
    if (link?.href) {
      const external = link.href.startsWith('http://') || link.href.startsWith('https://')
      node = <a href={link.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="text-emerald-700 underline underline-offset-2">{node}</a>
    }
    return <React.Fragment key={child._key || childIndex}>{node}</React.Fragment>
  })
  if (block.style === 'h2') return <h3 key={block._key || index} className="text-lg font-bold text-slate-900 mt-5 mb-2">{content}</h3>
  if (block.style === 'h3') return <h4 key={block._key || index} className="font-bold text-slate-800 mt-4 mb-2">{content}</h4>
  if (block.listItem) return <p key={block._key || index} className="pl-5 relative before:content-['•'] before:absolute before:left-1">{content}</p>
  return <p key={block._key || index}>{content}</p>
})


interface ProductPageProps {
  product: Product
  allCategories: CategoryItem[]
  onNavigateHome: () => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateProduct: (slug: string) => void
  onAddToCart: (product: Product, quantity: number, saleVariant?: PlantSaleVariant) => void
  onNavigateContacts: () => void
}

export function ProductPage({
  product,
  allCategories,
  onNavigateHome,
  onNavigateCategory,
  onNavigateProduct,
  onAddToCart,
  onNavigateContacts,
}: ProductPageProps) {
  const { t, language, localize } = useI18n()
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [addedNotification, setAddedNotification] = useState<boolean>(false)
  const [selectedSaleVariantKey, setSelectedSaleVariantKey] = useState<string>('0')
  const [requestedPlantSize, setRequestedPlantSize] = useState<string>('')

  const plantSaleVariants = isPlantProduct(product) && Array.isArray(product.saleVariants) ? product.saleVariants : []
  const selectedSaleVariantIndex = plantSaleVariants.findIndex((variant, index) => (variant._key || String(index)) === selectedSaleVariantKey)
  const selectedSaleVariant = plantSaleVariants[selectedSaleVariantIndex >= 0 ? selectedSaleVariantIndex : 0]
  const currentPrice = isPlantProduct(product) ? selectedSaleVariant?.priceEUR : product.priceEUR
  const currentOldPrice = isPlantProduct(product) ? selectedSaleVariant?.oldPriceEUR : product.oldPriceEUR
  const plantStockStatus = selectedSaleVariant?.stockStatus || product.stockStatus || 'onRequest'
  const plantStockQuantity = selectedSaleVariant?.stockQuantity ?? product.stockQuantity
  const hasPrice = typeof currentPrice === 'number' && Number.isFinite(currentPrice) && currentPrice > 0
  const plantStockLabels: Record<string, string> = {
    inStock: language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност',
    onRequest: language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка',
    outOfStock: language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан',
  }
  const getSaleVariantName = (variant: PlantSaleVariant) =>
    language === 'ru' ? (variant.nameRu || variant.name) : language === 'en' ? (variant.nameEn || variant.name) : variant.name
  const selectedVariantDescription = selectedSaleVariant
    ? [
        getSaleVariantName(selectedSaleVariant),
        typeof selectedSaleVariant.saleHeightCm === 'number' ? (language === 'ru' ? 'Высота' : language === 'en' ? 'Height' : 'Височина') + ': ' + formatPlantHeight(selectedSaleVariant.saleHeightCm, language) : '',
        typeof selectedSaleVariant.containerVolumeL === 'number' ? (language === 'ru' ? 'Контейнер' : language === 'en' ? 'Container' : 'Контейнер') + ': ' + selectedSaleVariant.containerVolumeL + ' L' : '',
        selectedSaleVariant.sku ? 'SKU: ' + selectedSaleVariant.sku : '',
      ].filter(Boolean).join(', ')
    : requestedPlantSize.trim() || (language === 'ru' ? 'Прошу предложить доступные размеры' : language === 'en' ? 'Please suggest available sizes' : 'Моля, предложете наличните размери')
  const plantWhatsAppMessage = language === 'ru'
    ? 'Здравствуйте! Интересует растение: ' + String(localize(product, 'name') || product.name) + '. Размер: ' + selectedVariantDescription + '. Количество: ' + quantity + ' шт. Пожалуйста, подтвердите актуальную цену и наличие.'
    : language === 'en'
      ? 'Hello! I am interested in: ' + String(localize(product, 'name') || product.name) + '. Size: ' + selectedVariantDescription + '. Quantity: ' + quantity + '. Please confirm the current price and availability.'
      : 'Здравейте! Интересувам се от растение: ' + String(localize(product, 'name') || product.name) + '. Размер: ' + selectedVariantDescription + '. Количество: ' + quantity + ' бр. Моля, потвърдете актуалната цена и наличността.'
  const plantWhatsAppUrl = 'https://wa.me/380674807486?text=' + encodeURIComponent(plantWhatsAppMessage)

  // Support legacy URL-only galleries and localized alt text on Sanity image objects.
  const imageCandidates: Array<{ url?: string | null; alt?: string | null }> = [
    {
      url: product.imageUrl,
      alt: language === 'ru' ? product.imageAltRu : language === 'en' ? product.imageAltEn : product.imageAlt,
    },
    ...(product.galleryImages || []).map((image) => {
      if (typeof image === 'string') return { url: image, alt: localize(product, 'name') }
      if (!image || typeof image !== 'object') return { url: undefined, alt: undefined }
      return {
        url: image.url,
        alt: language === 'ru' ? (image.altRu || image.alt) : language === 'en' ? (image.altEn || image.alt) : image.alt,
      }
    }),
  ]
  const allImages = imageCandidates
    .filter((image): image is { url: string; alt?: string | null } =>
      typeof image.url === 'string' && /^https?:\/\//i.test(image.url) && !failedImageUrls.includes(image.url)
    )
    .filter((image, index, list) => list.findIndex((candidate) => candidate.url === image.url) === index)

  const relatedContentItems = (product.relatedContent || [])
    .filter((item) => item.slug?.current && (
      item._type === 'service' ? item.isActive !== false : item.isPublished === true
    ))
    .slice(0, 4)

  const plantCare = isPlantProduct(product) ? product.plantCare : undefined
  const noCareData = language === 'ru' ? 'Нет подтверждённых данных' : language === 'en' ? 'No verified data' : 'Няма потвърдени данни'
  const careLabels: Record<string, Record<string, string>> = {
    light: {
      sun: language === 'ru' ? 'Полное солнце' : language === 'en' ? 'Full sun' : 'Пълно слънце',
      partialShade: language === 'ru' ? 'Полутень' : language === 'en' ? 'Partial shade' : 'Полусянка',
      shade: language === 'ru' ? 'Тень' : language === 'en' ? 'Shade' : 'Сянка',
    },
    waterNeeds: {
      low: language === 'ru' ? 'Низкая' : language === 'en' ? 'Low' : 'Ниска',
      medium: language === 'ru' ? 'Средняя' : language === 'en' ? 'Medium' : 'Средна',
      high: language === 'ru' ? 'Высокая' : language === 'en' ? 'High' : 'Висока',
    },
    foliageType: {
      evergreen: language === 'ru' ? 'Вечнозелёное' : language === 'en' ? 'Evergreen' : 'Вечнозелено',
      deciduous: language === 'ru' ? 'Листопадное' : language === 'en' ? 'Deciduous' : 'Листопадно',
    },
    blackSeaCoast: {
      suitable: language === 'ru' ? 'Подходит для Черноморья' : language === 'en' ? 'Suitable for the Black Sea coast' : 'Подходящо за Черноморието',
      notSuitable: language === 'ru' ? 'Не подходит для Черноморья' : language === 'en' ? 'Not suitable for the Black Sea coast' : 'Неподходящо за Черноморието',
      needsVerification: language === 'ru' ? 'Требуется проверка' : language === 'en' ? 'Needs verification' : 'Нужна проверка',
    },
  }
  const seasonLabels: Record<string, string> = {
    spring: language === 'ru' ? 'Весна' : language === 'en' ? 'Spring' : 'Пролет',
    summer: language === 'ru' ? 'Лето' : language === 'en' ? 'Summer' : 'Лято',
    autumn: language === 'ru' ? 'Осень' : language === 'en' ? 'Autumn' : 'Есен',
    winter: language === 'ru' ? 'Зима' : language === 'en' ? 'Winter' : 'Зима',
    yearRound: language === 'ru' ? 'Круглый год' : language === 'en' ? 'Year-round' : 'През цялата година',
  }
  const formatSeasons = (values?: string[]) => values?.length ? values.map((value) => seasonLabels[value] || value).join(', ') : noCareData
  const renderLevelIndicator = (level?: number) => (
    <div className="mt-3 flex gap-1.5" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span key={step} className={`h-1.5 flex-1 rounded-full ${level && step <= level ? 'bg-emerald-600' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
  const careGuideBlocks = isPlantProduct(product) && Array.isArray(product.careGuide) ? product.careGuide : []
  const hasDiscount = hasPrice && typeof currentOldPrice === 'number' && currentOldPrice > Number(currentPrice)
  const discountPercent = hasDiscount ? Math.round((Number(currentOldPrice) - Number(currentPrice)) / Number(currentOldPrice) * 100) : 0
  const discountSaving = hasDiscount ? Number(currentOldPrice) - Number(currentPrice) : 0

  const getImageText = (imageUrl: string, kind: 'title' | 'alt') => {
    const imageIndex = allImages.findIndex((image) => image.url === imageUrl)
    const image = allImages.find((candidate) => candidate.url === imageUrl)
    const productName = String(localize(product, 'name') || product.name)

    if (kind === 'alt' && image?.alt) return image.alt

    return getProductImageText(productName, language, Math.max(0, imageIndex), kind)
  }

  const handleImageError = (imageUrl: string) => {
    setFailedImageUrls((previous) => previous.includes(imageUrl) ? previous : [...previous, imageUrl])
  }

  const getProductCategoryTrail = (): CategoryItem[] => {
    const catalogRoot = isPlantProduct(product)
      ? allCategories.find((item) => item.slug?.current === 'rastenia' || item._id === 'plants-root')
      : allCategories.find((item) => item.slug?.current === 'vsichko-za-polivane')
    const assigned = (product.categories || [])
      .map((item: any) => allCategories.find((category) => category._id === item._id) || item)
      .filter((item: any) => item && item._id !== catalogRoot?._id && item.slug?.current !== 'vsichko-za-polivane')
    const depth = (candidate: any) => {
      let current = candidate
      let result = 0
      const seen = new Set<string>()
      while (current?.parentId && !seen.has(current._id)) {
        seen.add(current._id)
        current = allCategories.find((item) => item._id === current.parentId)
        result += 1
      }
      return result
    }
    const primary = assigned.slice().sort((a: any, b: any) => depth(b) - depth(a))[0]
      || (product.categoryId ? allCategories.find((item) => item._id === product.categoryId) : undefined)
    const trail: CategoryItem[] = []
    let current: any = primary
    const seen = new Set<string>()
    while (current && !seen.has(current._id)) {
      seen.add(current._id)
      if (current._id !== catalogRoot?._id && current.slug?.current !== 'vsichko-za-polivane') trail.unshift(current)
      current = current.parentId ? allCategories.find((item) => item._id === current.parentId) : undefined
    }
    return trail
  }
  const productCategoryTrail = useMemo(() => getProductCategoryTrail(), [product, allCategories])
  const productCatalogPath = isPlantProduct(product) ? '/category/rastenia' : '/category/vsichko-za-polivane'

  useEffect(() => {
    setFailedImageUrls([])
    setSelectedImage(product.imageUrl || '')
    setQuantity(1)
    setSelectedSaleVariantKey(product.saleVariants?.[0]?._key || '0')
    setRequestedPlantSize('')
  }, [product, language])

  useEffect(() => {
    if (!product) return
    const productName = String(localize(product, 'name') || product.name)
    const productDescription = String(localize(product, 'shortDescription') || `Купете ${productName} изгодно в онлайн магазин Florial.`)
    const productPath = `/product/${encodeURIComponent(product.slug?.current || product._id)}`
    const productUrl = new URL(localizedHref(productPath, language), window.location.origin).toString()

    const hasLocaleContent = (locale: 'ru' | 'en') => {
      const translated = product.translations?.[locale]
      return Boolean(
        translated?.name &&
        translated?.shortDescription &&
        translated?.seo?.metaTitle &&
        translated?.seo?.metaDescription
      )
    }
    const localizedSeo = language === 'bg' ? product.seo : product.translations?.[language]?.seo
    const alternates: Record<string, string> = {
      bg: new URL(productPath, 'https://florial-bg.com').toString(),
      'x-default': new URL(productPath, 'https://florial-bg.com').toString(),
    }
    if (hasLocaleContent('ru')) alternates.ru = new URL(localizedHref(productPath, 'ru'), 'https://florial-bg.com').toString()
    if (hasLocaleContent('en')) alternates.en = new URL(localizedHref(productPath, 'en'), 'https://florial-bg.com').toString()

    applyPageSeo({
      seo: localizedSeo,
      fallbackTitle: `${productName} | Florial`,
      fallbackDescription: productDescription,
      pageType: 'product',
      imageUrl: product.imageUrl,
      language,
      noIndex: false,
      alternates,
    })

    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
    }
    if (hasPrice) offer.price = Number(currentPrice).toFixed(2)
    if ((isPlantProduct(product) ? plantStockStatus : product.stockStatus) === 'inStock') offer.availability = 'https://schema.org/InStock'
    if ((isPlantProduct(product) ? plantStockStatus : product.stockStatus) === 'outOfStock') offer.availability = 'https://schema.org/OutOfStock'
    if ((isPlantProduct(product) ? plantStockStatus : product.stockStatus) === 'onRequest') offer.availability = 'https://schema.org/PreOrder'

    setStructuredData('product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      description: productDescription,
      url: productUrl,
      ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
      ...(product.sku ? { sku: product.sku } : {}),
      ...(hasPrice ? { offers: offer } : {}),
    })

    const breadcrumbItems: Array<{ name: string; item: string }> = [
      { name: t('Начало'), item: new URL(localizedHref('/', language), window.location.origin).toString() },
      { name: t('Каталог'), item: new URL(localizedHref(productCatalogPath, language), window.location.origin).toString() },
      ...productCategoryTrail.map((item) => ({
        name: String(localize(item, 'name') || item.name),
        item: new URL(localizedHref(`/category/${encodeURIComponent(item.slug?.current || item._id)}`, language), window.location.origin).toString(),
      })),
      { name: productName, item: productUrl },
    ]
    setStructuredData('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    })
  }, [product, allCategories, productCategoryTrail, productCatalogPath, language, localize, t, currentPrice, hasPrice, plantStockStatus])

  const handleAdd = () => {
    onAddToCart(product, quantity, isPlantProduct(product) ? selectedSaleVariant : undefined)
    setAddedNotification(true)
    setTimeout(() => setAddedNotification(false), 2500)
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
      {/* Хлебни трохи: начало / каталог / категория / подкатегория / продукт */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center text-sm text-slate-500 gap-y-1">
        <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="hover:text-emerald-700 transition-colors no-underline">{t('Начало')}</a>
        <span className="mx-1">/</span>
        <a href={localizedHref(productCatalogPath, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(isPlantProduct(product) ? 'rastenia' : 'vsichko-za-polivane'))} className="hover:text-emerald-700 transition-colors no-underline">{t('Каталог')}</a>
        {productCategoryTrail.map((item) => (
          <React.Fragment key={item._id}>
            <span className="mx-1">/</span>
            <a href={localizedHref(`/category/${encodeURIComponent(item.slug?.current || item._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(item.slug?.current, item._id))} className="hover:text-emerald-700 transition-colors no-underline">
              {localize(item, 'name') || item.name}
            </a>
          </React.Fragment>
        ))}
        <span className="mx-1">/</span>
        <span className="font-medium text-slate-800 truncate max-w-xs">{localize(product, 'name')}</span>
      </nav>

      {/* Основной блок товара и галерея */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        <div className="flex flex-col gap-4">
          <div className="w-full h-80 sm:h-96 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 relative">
            {selectedImage && !failedImageUrls.includes(selectedImage) ? (
              <img src={selectedImage} alt={getImageText(selectedImage, "alt")} title={getImageText(selectedImage, "title")} onError={() => handleImageError(selectedImage)} className="h-full w-full object-contain p-4" />
            ) : (
              <span className="text-slate-400">{t('Няма изображение')}</span>
            )}
            {product.stockStatus && (
              <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {localize(product, 'stockStatus')}
              </span>
            )}
          </div>

          {/* Миниатюры галереи */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img) => (
                <button
                  key={img.url}
                  onClick={() => setSelectedImage(img.url)}
                  aria-label={img.alt || localize(product, 'name')}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 bg-slate-50 transition-all cursor-pointer ${
                    selectedImage === img.url ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt={getImageText(img.url, "alt")} title={getImageText(img.url, "title")} onError={() => handleImageError(img.url)} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка с информацией */}
        <div className="flex flex-col justify-between">
          <div>
            {product.sku && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('Артикул (SKU):')} {product.sku}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
              {localize(product, 'name')}
            </h1>
            {isPlantProduct(product) && product.scientificName && (
              <p className="text-sm italic text-slate-500 -mt-2 mb-4">{product.scientificName}</p>
            )}

            {isPlantProduct(product) ? (
              <div className="mb-6 rounded-xl border border-[#E2E6D8] bg-[#F8F9F4] p-4">
                {plantSaleVariants.length > 0 && (
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    {language === 'ru' ? 'Выберите размер' : language === 'en' ? 'Choose a size' : 'Изберете размер'}
                    <select
                      value={selectedSaleVariantKey || (plantSaleVariants[0]._key || '0')}
                      onChange={(event) => setSelectedSaleVariantKey(event.target.value)}
                      className="w-full rounded-lg border border-[#DDE3D0] bg-white px-3 py-3 font-medium outline-none focus:border-[#91A66B]"
                    >
                      {plantSaleVariants.map((variant, index) => {
                        const optionName = getSaleVariantName(variant)
                        const optionDetails = [
                          optionName,
                          typeof variant.saleHeightCm === 'number' ? formatPlantHeight(variant.saleHeightCm, language) : '',
                          typeof variant.containerVolumeL === 'number' ? variant.containerVolumeL + ' L' : '',
                        ].filter(Boolean).join(' · ')
                        return <option key={variant._key || index} value={variant._key || String(index)}>{optionDetails}</option>
                      })}
                    </select>
                  </label>
                )}
                {selectedSaleVariant && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    {typeof selectedSaleVariant.saleHeightCm === 'number' && <span className="rounded-full bg-white px-3 py-1.5">{language === 'ru' ? 'Высота' : language === 'en' ? 'Height' : 'Височина'}: {formatPlantHeight(selectedSaleVariant.saleHeightCm, language)}</span>}
                    {typeof selectedSaleVariant.containerVolumeL === 'number' && <span className="rounded-full bg-white px-3 py-1.5">{language === 'ru' ? 'Контейнер' : language === 'en' ? 'Container' : 'Контейнер'}: {selectedSaleVariant.containerVolumeL} L</span>}
                    {selectedSaleVariant.sku && <span className="rounded-full bg-white px-3 py-1.5">SKU: {selectedSaleVariant.sku}</span>}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  {hasPrice ? (
                    <span className="text-3xl font-extrabold text-emerald-800">{Number(currentPrice).toFixed(2)} €</span>
                  ) : (
                    <span className="text-2xl font-extrabold text-emerald-800">{language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване'}</span>
                  )}
                  {hasDiscount && <span className="text-lg text-slate-400 line-through">{Number(currentOldPrice).toFixed(2)} €</span>}
                  {hasDiscount && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">−{discountPercent}%</span>}
                </div>
                {hasPrice && product.vatIncluded !== false && <p className="mt-1 text-sm text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${plantStockStatus === 'inStock' ? 'bg-emerald-100 text-emerald-800' : plantStockStatus === 'outOfStock' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                    {plantStockLabels[plantStockStatus] || plantStockLabels.onRequest}
                  </span>
                  {plantStockStatus === 'inStock' && typeof plantStockQuantity === 'number' && (
                    <span className="text-xs text-slate-600">{language === 'ru' ? 'Количество' : language === 'en' ? 'Quantity' : 'Количество'}: {plantStockQuantity}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-extrabold text-emerald-800">{(product.priceEUR || 0).toFixed(2)} €</span>
                  {hasDiscount && <span className="text-lg text-slate-400 line-through">{Number(currentOldPrice).toFixed(2)} €</span>}
                  {hasDiscount && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">−{discountPercent}%</span>}
                </div>
                {hasDiscount && <p className="mt-1 text-sm font-semibold text-emerald-700">{language === 'ru' ? `Экономия: ${discountSaving.toFixed(2)} €` : language === 'en' ? `You save: ${discountSaving.toFixed(2)} €` : `Спестявате: ${discountSaving.toFixed(2)} €`}</p>}
                <p className="mt-1 text-sm text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
              </div>
            )}

            {product.shortDescription && (
              <p className="text-slate-600 text-base mb-6 leading-relaxed">
                {localize(product, 'shortDescription')}
              </p>
            )}

          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-700">{t('Количество:')}</span>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-2 font-semibold text-slate-800 text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {isPlantProduct(product) && plantSaleVariants.length === 0 && (
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                {language === 'ru' ? 'Желаемый размер (необязательно)' : language === 'en' ? 'Preferred size (optional)' : 'Желан размер (по желание)'}
                <input type="text" value={requestedPlantSize} onChange={(event) => setRequestedPlantSize(event.target.value)} maxLength={120} placeholder={language === 'ru' ? 'Например: высота 100–120 см, контейнер 20 л' : language === 'en' ? 'E.g. 100–120 cm tall, 20 L container' : 'Напр. височина 100–120 см, контейнер 20 л'} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-500" />
              </label>
            )}

            {isPlantProduct(product) ? (
              <>
              <a
                href={plantWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 no-underline"
              >
                <span aria-hidden="true">◉</span>
                {language === 'ru' ? 'Запросить через WhatsApp' : language === 'en' ? 'Enquire via WhatsApp' : 'Запитайте чрез WhatsApp'}
              </a>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!hasPrice || plantStockStatus === 'outOfStock' || !selectedSaleVariant}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {language === 'ru' ? 'Добавить в корзину' : language === 'en' ? 'Add to cart' : 'Добави в количката'}
              </button>
              {addedNotification && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg text-center font-medium">
                  {language === 'ru' ? 'Растение добавлено в корзину.' : language === 'en' ? 'Plant added to cart.' : 'Растението е добавено в количката.'}
                </div>
              )}
              <button type="button" onClick={onNavigateContacts} className="text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer">
                {language === 'ru' ? 'Другие способы связи' : language === 'en' ? 'Other contact options' : 'Други начини за връзка'}
              </button>
              </>
            ) : (
            <button
              onClick={handleAdd}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('Добави в количката')}</span>
            </button>
            )}

            {!isPlantProduct(product) && addedNotification && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg text-center font-medium">
                {t('Продуктът е добавен успешно в кошницата!')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Технические характеристики */}
      {product.specifications && product.specifications.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t('Технически характеристики')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(((localize(product, 'specifications') as any[] | undefined) || product.specifications) || []).map((spec, i) => (
              <div key={i} className="flex justify-between py-3 px-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-sm font-medium">{localize(spec, 'name')}</span>
                <span className="text-slate-900 text-sm font-semibold text-right">
                  {localize(spec, 'value')} {spec.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Plant-specific structured care profile from Sanity */}
      {isPlantProduct(product) && (
        <section className="mb-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">{language === 'ru' ? 'Характеристики и условия выращивания' : language === 'en' ? 'Plant characteristics and growing conditions' : 'Характеристики и условия на отглеждане'}</h2>
            <p className="mt-1 text-sm text-slate-500">{language === 'ru' ? 'Данные приведены по профилю растения в каталоге Florial.' : language === 'en' ? 'Information is based on the plant profile in the Florial catalogue.' : 'Информацията е според профила на растението в каталога на Florial.'}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">☀️</span>{language === 'ru' ? 'Освещение' : language === 'en' ? 'Light' : 'Осветление'}</div>
              <p className="mt-2 font-bold text-slate-900">{plantCare?.light ? careLabels.light[plantCare.light] || noCareData : noCareData}</p>
              {renderLevelIndicator(plantCare?.light === 'sun' ? 3 : plantCare?.light === 'partialShade' ? 2 : plantCare?.light === 'shade' ? 1 : undefined)}
            </article>
            <article className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">💧</span>{language === 'ru' ? 'Потребность в воде' : language === 'en' ? 'Water needs' : 'Нужда от поливане'}</div>
              <p className="mt-2 font-bold text-slate-900">{plantCare?.waterNeeds ? careLabels.waterNeeds[plantCare.waterNeeds] || noCareData : noCareData}</p>
              {renderLevelIndicator(plantCare?.waterNeeds === 'low' ? 1 : plantCare?.waterNeeds === 'medium' ? 2 : plantCare?.waterNeeds === 'high' ? 3 : undefined)}
            </article>
            <article className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">❄️</span>{language === 'ru' ? 'Минимальная зимняя температура' : language === 'en' ? 'Minimum winter temperature' : 'Минимална зимна температура'}</div>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{typeof plantCare?.minWinterTempC === 'number' ? `${plantCare.minWinterTempC < 0 ? '−' : '+'}${Math.abs(plantCare.minWinterTempC)} °C` : noCareData}</p>
              <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Значение из профиля растения; фактическая устойчивость зависит от условий.' : language === 'en' ? 'Profile value; actual hardiness depends on growing conditions.' : 'Стойността е от профила; реалната устойчивост зависи от условията.'}</p>
            </article>
            <article className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">📏</span>{language === 'ru' ? 'Высота взрослого растения' : language === 'en' ? 'Mature plant height' : 'Височина на възрастното растение'}</div>
              <p className="mt-2 font-bold text-slate-900">{typeof plantCare?.adultHeightCm === 'number' ? formatPlantHeight(plantCare.adultHeightCm, language) : noCareData}</p>
              {typeof plantCare?.saleFormat?.saleHeightCm === 'number' && <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Высота при продаже' : language === 'en' ? 'Height at sale' : 'Височина при продажба'}: {formatPlantHeight(plantCare.saleFormat.saleHeightCm, language)}</p>}
            </article>
            <article className="rounded-xl border border-green-100 bg-green-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">🍃</span>{language === 'ru' ? 'Тип листвы' : language === 'en' ? 'Foliage type' : 'Тип листна маса'}</div>
              <p className="mt-2 font-bold text-slate-900">{plantCare?.foliageType ? careLabels.foliageType[plantCare.foliageType] || noCareData : noCareData}</p>
            </article>
            <article className="rounded-xl border border-pink-100 bg-pink-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">🌸</span>{language === 'ru' ? 'Период цветения' : language === 'en' ? 'Flowering season' : 'Период на цъфтеж'}</div>
              <p className="mt-2 font-bold text-slate-900">{formatSeasons(plantCare?.floweringSeason)}</p>
            </article>
            <article className="rounded-xl border border-lime-100 bg-lime-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">🌱</span>{language === 'ru' ? 'Период посадки' : language === 'en' ? 'Planting season' : 'Период на засаждане'}</div>
              <p className="mt-2 font-bold text-slate-900">{formatSeasons(plantCare?.plantingSeason)}</p>
            </article>
            <article className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">🌊</span>{language === 'ru' ? 'Подходит для Черноморского побережья' : language === 'en' ? 'Black Sea coast suitability' : 'Пригодност за Черноморието'}</div>
              <p className="mt-2 font-bold text-slate-900">{plantCare?.blackSeaCoast ? careLabels.blackSeaCoast[plantCare.blackSeaCoast] || noCareData : noCareData}</p>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${plantCare?.blackSeaCoast === 'suitable' ? 'bg-emerald-100 text-emerald-800' : plantCare?.blackSeaCoast === 'notSuitable' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>{plantCare?.blackSeaCoast === 'suitable' ? (language === 'ru' ? 'Подходит' : language === 'en' ? 'Suitable' : 'Подходящо') : plantCare?.blackSeaCoast === 'notSuitable' ? (language === 'ru' ? 'Не подходит' : language === 'en' ? 'Not suitable' : 'Неподходящо') : (language === 'ru' ? 'Не проверено' : language === 'en' ? 'Not verified' : 'Непроверено')}</span>
            </article>
            <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="text-xl">🪴</span>{language === 'ru' ? 'Формат продажи' : language === 'en' ? 'Sale format' : 'Формат на продажба'}</div>
              <p className="mt-2 font-bold text-slate-900">{typeof plantCare?.saleFormat?.containerVolumeL === 'number' ? `${plantCare.saleFormat.containerVolumeL} L` : noCareData}</p>
              <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Объём контейнера' : language === 'en' ? 'Container volume' : 'Обем на контейнера'}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{language === 'ru' ? 'Высота при продаже' : language === 'en' ? 'Height at sale' : 'Височина при продажба'}: {typeof plantCare?.saleFormat?.saleHeightCm === 'number' ? formatPlantHeight(plantCare.saleFormat.saleHeightCm, language) : noCareData}</p>
            </article>
          </div>
        </section>
      )}

      {isPlantProduct(product) && careGuideBlocks.length > 0 && (
        <section className="mb-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-3 text-xl font-bold text-slate-900">{language === 'ru' ? 'Руководство по уходу' : language === 'en' ? 'Plant care guide' : 'Ръководство за отглеждане'}</h2>
          {language !== 'bg' && <p className="mb-4 text-xs text-slate-500">{language === 'ru' ? 'Это руководство предоставлено на болгарском языке.' : 'This guide is provided in Bulgarian.'}</p>}
          <div className="space-y-3 text-sm leading-7 text-slate-600">{renderCareGuideBlocks(careGuideBlocks)}</div>
        </section>
      )}

      {isPlantProduct(product) && product.recommendedIrrigation && (
        <section className="mb-12 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm md:p-8">
          <h2 className="mb-3 text-xl font-bold text-slate-900">{language === 'ru' ? 'Рекомендуемая система полива' : language === 'en' ? 'Recommended irrigation system' : 'Препоръчителна система за напояване'}</h2>
          <p className="mb-4 text-sm text-slate-600">{({
            drip: language === 'ru' ? 'Капельный полив' : language === 'en' ? 'Drip irrigation' : 'Капково напояване',
            rotator: language === 'ru' ? 'Ротаторные форсунки' : language === 'en' ? 'Rotator nozzles' : 'Ротаторни дюзи',
            root: language === 'ru' ? 'Корневой полив' : language === 'en' ? 'Root irrigation' : 'Кореново напояване',
            mist: language === 'ru' ? 'Туманообразование' : language === 'en' ? 'Misting' : 'Мъглуване',
          } as Record<string, string>)[product.recommendedIrrigation.irrigationType || ''] || noCareData}</p>
          {product.recommendedIrrigationProduct ? (
            <a href={localizedHref(`/product/${encodeURIComponent(product.recommendedIrrigationProduct.slug?.current || product.recommendedIrrigationProduct._id)}`, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(product.recommendedIrrigationProduct!.slug?.current || product.recommendedIrrigationProduct!._id))} className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 no-underline transition hover:shadow-md sm:flex-row sm:items-center">
              {product.recommendedIrrigationProduct.imageUrl && <img src={product.recommendedIrrigationProduct.imageUrl} alt={localize(product.recommendedIrrigationProduct, 'name')} className="h-24 w-24 rounded-lg bg-slate-50 object-contain p-2" loading="lazy" />}
              <span className="flex-1 font-semibold text-slate-900">{localize(product.recommendedIrrigationProduct, 'name')}</span>
              <span className="font-bold text-emerald-800">{Number(product.recommendedIrrigationProduct.priceEUR || 0).toFixed(2)} €</span>
              <span className="text-sm font-semibold text-emerald-700">{language === 'ru' ? 'Посмотреть товар →' : language === 'en' ? 'View product →' : 'Виж продукта →'}</span>
            </a>
          ) : product.recommendedIrrigation.productSlug ? (
            <p className="text-xs text-amber-700">{language === 'ru' ? 'Связанный товар полива пока не найден в каталоге.' : language === 'en' ? 'The linked irrigation product was not found in the catalogue.' : 'Свързаният продукт за напояване не е намерен в каталога.'}</p>
          ) : null}
        </section>
      )}

      {/* Полное описание товара */}
      {product.description && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t('Описание')}</h2>
          <div className="text-slate-600 text-base leading-relaxed space-y-4">
            {typeof localize(product, 'description') === 'string' ? (
              <p className="whitespace-pre-line">{localize(product, 'description')}</p>
            ) : Array.isArray(localize(product, 'description')) ? (
              // Рендеринг блоков Portable Text из Sanity
              (localize(product, 'description') as any[]).map((block: any, idx: number) => {
                if (block._type === 'block' && block.children) {
                  return (
                    <p key={idx}>
                      {block.children.map((child: any) => child.text).join('')}
                    </p>
                  )
                }
                return null
              })
            ) : (
              <p>{t("Детайлно описание на продукта.")}</p>
            )}
          </div>
        </section>
      )}

      {/* Съвместимост на продукта */}
      {((localize(product, 'compatibility') as string[] | undefined) || product.compatibility || []).length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t('Съвместимост')}</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            {(((localize(product, 'compatibility') as string[] | undefined) || product.compatibility) || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Инструкции и каталози в PDF */}
      {(product.manualPDFUrl || product.catalogPDFUrl) && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t('Документи и инструкции')}</h2>
          <div className="flex flex-col gap-3">
            {product.manualPDFUrl && <a href={product.manualPDFUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{t('Изтегляне на инструкция (PDF)')} ↓</a>}
            {product.catalogPDFUrl && <a href={product.catalogPDFUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{t('Изтегляне на каталог (PDF)')} ↓</a>}
          </div>
        </section>
      )}

      {/* Документы и инструкции */}
      {product.documents && product.documents.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t('Документи и инструкции')}</h2>
          <div className="flex flex-col gap-3">
            {product.documents.map((doc, i) => (
              <a
                key={i}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 transition"
              >
                <span className="font-semibold text-slate-800 text-sm">{localize(doc, 'title')}</span>
                <span className="text-emerald-700 text-xs font-bold uppercase">{t('Изтегляне ↓')}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {relatedContentItems.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {language === 'ru' ? 'Полезные материалы и услуги' : language === 'en' ? 'Useful resources and services' : 'Полезни материали и услуги'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedContentItems.map((item) => {
              const itemTitle = item.linkLabel || (item._type === 'blogPost'
                ? (item.translations?.[language]?.title || item.translations?.bg?.title || item.title || '')
                : (item.translations?.[language]?.name || item.name || ''))
              const itemDescription = item.translations?.[language]?.shortDescription
                || item.translations?.bg?.shortDescription
                || item.shortDescription
              const itemImageAlt = language === 'ru'
                ? (item.imageAltRu || item.imageAlt || itemTitle)
                : language === 'en'
                  ? (item.imageAltEn || item.imageAlt || itemTitle)
                  : (item.imageAlt || itemTitle)
              const itemHref = item._type === 'service'
                ? `/services/${encodeURIComponent(item.slug!.current)}`
                : `/blog/${encodeURIComponent(item.slug!.current)}`

              return (
                <a
                  key={item._id}
                  href={localizedHref(itemHref, language)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition no-underline"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={itemImageAlt} title={itemImageAlt} className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-40 bg-slate-100" />
                  )}
                  <div className="p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {item._type === 'service'
                        ? (language === 'ru' ? 'Услуга Florial' : language === 'en' ? 'Florial service' : 'Услуга Florial')
                        : (language === 'ru' ? 'Статья' : language === 'en' ? 'Article' : 'Статия')}
                    </span>
                    <h3 className="mt-2 font-bold text-slate-900 leading-snug group-hover:text-emerald-800">{itemTitle}</h3>
                    {itemDescription && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{itemDescription}</p>}
                    <span className="mt-3 inline-block text-sm font-semibold text-emerald-700">
                      {language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Read more →' : 'Научете повече →'}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      ) : (
        <ValveServiceCrosslink product={product} language={language} />
      )}

      {/* Често купувани заедно — редактират се чрез relatedProducts в Sanity */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {language === 'ru' ? 'С этим товаром покупают' : language === 'en' ? 'Frequently bought together' : 'Често купувани заедно'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {product.relatedProducts.filter(item => item._id !== product._id).slice(0, 5).map(item => (
              <article key={item._id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition flex flex-col">
                <a
                  href={localizedHref(`/product/${encodeURIComponent(item.slug?.current || item._id)}`, language)}
                  onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(item.slug?.current || item._id))}
                  className="no-underline flex-1"
                >
                  <div className="h-36 bg-slate-50 rounded-lg mb-3 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={getProductImageText(String(localize(item, 'name') || item.name), language, 0, 'alt')} title={getProductImageText(String(localize(item, 'name') || item.name), language, 0, 'title')} className="h-full w-full object-contain p-2" loading="lazy" />
                    ) : (
                      <span className="text-xs text-slate-400">{t('Няма снимка')}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-3 mb-2">{localize(item, 'name')}</h3>
                  {item.sku && <p className="text-xs text-slate-400 mb-2">{t('Артикул (SKU):')} {item.sku}</p>}
                </a>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="font-bold text-emerald-800 mb-1">{(item.priceEUR || 0).toFixed(2)} €</p>
                  <p className="text-xs text-slate-500 mb-3">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
                  <button
                    type="button"
                    onClick={() => onAddToCart(item, 1)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-3 rounded-lg transition-colors"
                  >
                    {language === 'ru' ? 'Добавить в корзину' : language === 'en' ? 'Add to cart' : 'Добави в количката'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Совместимые продукты */}
      {product.compatibleProducts && product.compatibleProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t('Съвместими продукти')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {product.compatibleProducts.map(item => (
              <a
                key={item._id}
                href={localizedHref(`/product/${encodeURIComponent(item.slug?.current || item._id)}`, language)}
                onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(item.slug?.current || item._id))}
                className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between no-underline"
              >
                <div>
                  <div className="h-40 bg-slate-50 rounded-lg mb-3 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={getProductImageText(String(localize(item, "name") || item.name), language, 0, "alt")} title={getProductImageText(String(localize(item, "name") || item.name), language, 0, "title")} className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-slate-400">{t('Няма снимка')}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1">{localize(item, 'name')}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800">{(item.priceEUR || 0).toFixed(2)} €</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">{t('Виж')}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
