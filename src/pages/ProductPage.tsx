import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import type { CategoryItem, Product } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'

interface ProductPageProps {
  product: Product
  allCategories: CategoryItem[]
  onNavigateHome: () => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateProduct: (slug: string) => void
  onAddToCart: (product: Product, quantity: number) => void
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
  const [quantity, setQuantity] = useState<number>(1)
  const [addedNotification, setAddedNotification] = useState<boolean>(false)

  // Собираем все изображения: главное (imageUrl) + галерея (galleryImages)
  const allImages = [
    product.imageUrl,
    ...(product.galleryImages || [])
  ].filter(Boolean) as string[]

  const getProductCategoryTrail = (): CategoryItem[] => {
    const catalogRoot = allCategories.find((item) => item.slug?.current === 'vsichko-za-polivane')
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
  const productCategoryTrail = getProductCategoryTrail()
  const productCatalogPath = product.productType === 'plant' ? '/category/rastenia' : '/category/vsichko-za-polivane'

  useEffect(() => {
    setSelectedImage(product.imageUrl || allImages[0] || '')
    setQuantity(1)
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
      noIndex: language !== 'bg' && !hasLocaleContent(language),
      alternates,
    })

    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: Number(product.priceEUR || 0).toFixed(2),
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
    }
    if (product.stockStatus === 'inStock') offer.availability = 'https://schema.org/InStock'
    if (product.stockStatus === 'outOfStock') offer.availability = 'https://schema.org/OutOfStock'

    setStructuredData('product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      description: productDescription,
      url: productUrl,
      ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
      ...(product.sku ? { sku: product.sku } : {}),
      offers: offer,
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
  }, [product, allCategories, productCategoryTrail, productCatalogPath, language, localize, t])

  const handleAdd = () => {
    onAddToCart(product, quantity)
    setAddedNotification(true)
    setTimeout(() => setAddedNotification(false), 2500)
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
      {/* Хлебни трохи: начало / каталог / категория / подкатегория / продукт */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center text-sm text-slate-500 gap-y-1">
        <a href={localizedHref('/', language)} onClick={(event) => handleInternalLinkClick(event, onNavigateHome)} className="hover:text-emerald-700 transition-colors no-underline">{t('Начало')}</a>
        <span className="mx-1">/</span>
        <a href={localizedHref(productCatalogPath, language)} onClick={(event) => handleInternalLinkClick(event, () => onNavigateCategory(product.productType === 'plant' ? 'rastenia' : 'vsichko-za-polivane'))} className="hover:text-emerald-700 transition-colors no-underline">{t('Каталог')}</a>
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
            {selectedImage ? (
              <img src={selectedImage} alt={localize(product, 'name')} className="h-full w-full object-contain p-4" />
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
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 bg-slate-50 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-1" />
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
            {product.productType === 'plant' && product.scientificName && (
              <p className="text-sm italic text-slate-500 -mt-2 mb-4">{product.scientificName}</p>
            )}

            <div className="mb-6">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-extrabold text-emerald-800">
                  {(product.priceEUR || 0).toFixed(2)} €
                </span>
                {product.oldPriceEUR && (
                  <span className="text-lg text-slate-400 line-through">
                    {product.oldPriceEUR.toFixed(2)} €
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
            </div>

            {product.shortDescription && (
              <p className="text-slate-600 text-base mb-6 leading-relaxed">
                {localize(product, 'shortDescription')}
              </p>
            )}
            {product.productType === 'plant' && (
              <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                {t('Наличност, размер и актуална цена се потвърждават при запитване.')}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            {product.productType !== 'plant' && (
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
            )}

            {product.productType === 'plant' ? (
              <button
                onClick={onNavigateContacts}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('Запитайте за цена и наличност')}
              </button>
            ) : (
            <button
              onClick={handleAdd}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('Добави в количката')}</span>
            </button>
            )}

            {product.productType !== 'plant' && addedNotification && (
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
                      <img src={item.imageUrl} alt={localize(item, 'name')} className="h-full w-full object-contain p-2" />
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
