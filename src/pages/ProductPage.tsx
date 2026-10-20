import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import type { Product } from '../types'

interface ProductPageProps {
  product: Product
  onNavigateHome: () => void
  onNavigateCategory: (slug?: string, id?: string) => void
  onNavigateProduct: (slug: string) => void
  onAddToCart: (product: Product, quantity: number) => void
  onNavigateContacts: () => void
}

export function ProductPage({
  product,
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

  useEffect(() => {
    setSelectedImage(product.imageUrl || allImages[0] || '')
    setQuantity(1)
  }, [product, language])

  useEffect(() => {
    if (!product) return
    const localizedSeo = localize(product, 'seo')
    document.title = `${localizedSeo?.metaTitle || localizedSeo?.seoTitle || localize(product, 'name')} | Florial`

    let descMeta = document.querySelector('meta[name="description"]')
    const descText = localizedSeo?.metaDescription || localizedSeo?.seoDescription || localize(product, 'shortDescription') || `Купете ${localize(product, 'name')} изгодно в онлайн магазин Флориал.`
    if (!descMeta) {
      descMeta = document.createElement('meta')
      descMeta.setAttribute('name', 'description')
      document.head.appendChild(descMeta)
    }
    descMeta.setAttribute('content', descText)
  }, [product, language, localize])

  const handleAdd = () => {
    onAddToCart(product, quantity)
    setAddedNotification(true)
    setTimeout(() => setAddedNotification(false), 2500)
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
      {/* Хлебные крошки */}
      <nav className="mb-6 flex items-center text-sm text-slate-500 flex-wrap gap-1">
        <button onClick={onNavigateHome} className="hover:text-emerald-700 transition-colors cursor-pointer">
          Начало
        </button>
        <span className="mx-1">/</span>
        <button onClick={onNavigateHome} className="hover:text-emerald-700 transition-colors cursor-pointer">
          {t("Каталог")}
        </button>
        {product.category && (
          <>
            <span className="mx-1">/</span>
            <button 
              onClick={() => onNavigateCategory(product.categorySlug, product.categoryId)}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {localize(product, 'category')}
            </button>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{localize(product, 'name')}</span>
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

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-extrabold text-emerald-800">
                {(product.priceEUR || 0).toFixed(2)} €
              </span>
              {product.oldPriceEUR && (
                <span className="text-lg text-slate-400 line-through">
                  {product.oldPriceEUR.toFixed(2)} €
                </span>
              )}
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
              <div
                key={item._id}
                onClick={() => item.slug?.current && onNavigateProduct(item.slug.current)}
                className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
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
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-emerald-800">{(item.priceEUR || 0).toFixed(2)} €</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">{t('Виж')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
