import React from 'react'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import { getKitComponentDisplayRows, hasKitComponents, isKitComponentLinkable } from '../lib/richTextUtils.mjs'

interface KitComponentProduct {
  _id?: string
  name?: string
  translations?: Record<string, Record<string, any>>
  slug?: string | { current?: string }
  sku?: string
  imageUrl?: string
  isActive?: boolean
}

interface KitComponentItem {
  _key?: string
  quantity?: number
  unit?: 'pcs' | 'm'
  note?: Partial<Record<'bg' | 'ru' | 'en', string>>
  product?: KitComponentProduct | null
}

interface KitComponentsProps {
  items?: KitComponentItem[] | null
  language: 'bg' | 'ru' | 'en'
  title: string
  onNavigateProduct: (slug: string) => void
}

function getProductSlug(product?: KitComponentProduct | null) {
  if (!product) return ''
  return typeof product.slug === 'string' ? product.slug : product.slug?.current || ''
}

function formatQuantity(quantity: unknown, language: 'bg' | 'ru' | 'en') {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) return ''
  const locale = language === 'en' ? 'en-GB' : language === 'ru' ? 'ru-RU' : 'bg-BG'
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(quantity)
}

function getUnitLabel(unit: string | undefined, language: 'bg' | 'ru' | 'en') {
  if (unit === 'm') return 'm'
  return language === 'en' ? 'pcs' : language === 'ru' ? 'шт.' : 'бр.'
}

export function KitComponents({ items, language, title, onNavigateProduct }: KitComponentsProps) {
  if (!hasKitComponents(items)) return null

  if (import.meta.env.DEV) {
    items?.forEach((item, index) => {
      const product = item?.product
      if (!product || !product.name || product.isActive === false || !getProductSlug(product)) {
        console.warn('Florial: компонент комплекта #' + (index + 1) + ' имеет отсутствующий товар, неактивный статус или некорректную ссылку.', item)
      }
    })
  }

  const rows = getKitComponentDisplayRows<KitComponentItem>(items)
  return (
    <section className="mb-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map((item, index) => {
          const product = item.product!
          const name = product.translations?.[language]?.name || product.name || ''
          const slug = getProductSlug(product)
          const linkable = isKitComponentLinkable(item) && Boolean(slug)
          const note = item.note?.[language] || item.note?.bg || item.note?.en || item.note?.ru
          const quantity = formatQuantity(item.quantity, language)
          const unit = getUnitLabel(item.unit, language)
          const image = typeof product.imageUrl === 'string' && /^https?:\/\//i.test(product.imageUrl)
            ? product.imageUrl
            : ''

          const content = (
            <>
              {image ? (
                <img
                  src={image}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 shrink-0 rounded-lg bg-slate-50 object-contain p-1"
                />
              ) : (
                <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">—</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-800">{name}</span>
                {note && <span className="mt-1 block text-xs leading-5 text-slate-500">{note}</span>}
              </span>
              {quantity && <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{quantity} {unit}</span>}
            </>
          )

          if (linkable) {
            return (
              <a
                key={item._key || product._id || index}
                href={localizedHref('/product/' + encodeURIComponent(slug), language)}
                onClick={(event) => handleInternalLinkClick(event, () => onNavigateProduct(slug))}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 no-underline transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {content}
              </a>
            )
          }

          return (
            <div key={item._key || product._id || index} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
