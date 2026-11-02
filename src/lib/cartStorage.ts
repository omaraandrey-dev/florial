import type { CartItem, Product } from '../types'

const CART_STORAGE_KEY = 'florial:shopping-cart:v1'
const CART_STORAGE_VERSION = 1
const MAX_CART_ITEMS = 100
const MAX_ITEM_QUANTITY = 9999

type StoredCart = {
  version: number
  items: unknown[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidProduct = (value: unknown): value is Product => {
  if (!isRecord(value)) return false
  return typeof value._id === 'string' &&
    value._id.length > 0 &&
    typeof value.name === 'string' &&
    typeof value.priceEUR === 'number' &&
    Number.isFinite(value.priceEUR)
}

const isValidSaleVariant = (value: unknown): boolean => {
  if (value === undefined) return true
  if (!isRecord(value) || typeof value.name !== 'string') return false
  if (value.priceEUR !== undefined &&
    (typeof value.priceEUR !== 'number' || !Number.isFinite(value.priceEUR))) return false
  return true
}

const isValidCartItem = (value: unknown): value is CartItem => {
  if (!isRecord(value) || !isValidProduct(value.product)) return false
  if (typeof value.quantity !== 'number' ||
    !Number.isInteger(value.quantity) ||
    value.quantity < 1 ||
    value.quantity > MAX_ITEM_QUANTITY) return false
  return isValidSaleVariant(value.saleVariant)
}

/**
 * Restores a versioned cart snapshot. Invalid or inaccessible browser storage
 * is treated as an empty cart and never blocks the storefront.
 */
export const loadCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []

    const stored = JSON.parse(raw) as StoredCart
    if (!isRecord(stored) ||
      stored.version !== CART_STORAGE_VERSION ||
      !Array.isArray(stored.items)) return []

    return stored.items
      .filter(isValidCartItem)
      .slice(0, MAX_CART_ITEMS)
  } catch {
    // Private browsing restrictions, malformed JSON or disabled storage
    // must not prevent customers from using the cart in the current session.
    return []
  }
}

/**
 * Persists only the cart snapshot. Product prices are still revalidated by
 * the server against Sanity when the customer submits an order.
 */
export const saveCart = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return

  try {
    const stored: StoredCart = {
      version: CART_STORAGE_VERSION,
      items: items.slice(0, MAX_CART_ITEMS).map((item) => ({
        ...item,
        product: {
          _id: item.product._id,
          name: item.product.name,
          productType: item.product.productType,
          translations: item.product.translations,
          slug: item.product.slug,
          priceEUR: item.product.priceEUR,
          oldPriceEUR: item.product.oldPriceEUR,
          sku: item.product.sku,
          brand: item.product.brand,
          imageUrl: item.product.imageUrl,
          imageAlt: item.product.imageAlt,
          imageAltEn: item.product.imageAltEn,
          imageAltRu: item.product.imageAltRu,
          stockStatus: item.product.stockStatus,
          vatIncluded: item.product.vatIncluded,
        },
      })),
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage quota or browser policy errors must never break cart actions.
  }
}
