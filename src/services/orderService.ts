export interface IrrigationProjectSnapshot {
  schemaVersion: 1
  projectType: 'automatic_lawn_irrigation'
  [key: string]: unknown
}

export interface OrderData {
  customer_name: string
  phone: string
  email: string
  city: string
  address: string
  delivery_method?: string
  payment_method?: string
  comment?: string
  irrigationProject?: IrrigationProjectSnapshot
  items: Array<{
    productId: string
    qty: number
    expectedPrice: number
    catalog?: 'production' | 'plants'
    variantKey?: string
  }>
}

export interface CreatedOrder {
  orderNumber: string
  analyticsPurchase?: {
    value: number
    shipping?: number
    currency: 'EUR'
    items: Array<{
      item_id: string
      item_name: string
      item_category?: string
      item_variant?: string
      price: number
      quantity: number
    }>
  }
}

export async function createOrder(data: OrderData): Promise<CreatedOrder> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const responseText = await response.text()
  let result: { orderNumber?: unknown; error?: unknown; requestId?: unknown; analyticsPurchase?: unknown } | null = null
  try {
    result = JSON.parse(responseText) as { orderNumber?: unknown; error?: unknown; requestId?: unknown; analyticsPurchase?: unknown }
  } catch {
    result = null
  }

  if (!response.ok) {
    const message = typeof result?.error === 'string'
      ? result.error
      : 'Сървърът не върна коректен отговор (HTTP ' + response.status + '). Моля, опитайте отново.'
    const requestId = typeof result?.requestId === 'string' ? ' Код: ' + result.requestId : ''
    throw new Error(message + requestId)
  }

  if (!result?.orderNumber) {
    throw new Error('Поръчката не беше потвърдена от сървъра.')
  }

  const analytics = result.analyticsPurchase && typeof result.analyticsPurchase === 'object'
    ? result.analyticsPurchase as Record<string, unknown>
    : null
  const analyticsItems = Array.isArray(analytics?.items) ? analytics.items.filter((item): item is Record<string, unknown> =>
    Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).item_id === 'string' &&
      typeof (item as Record<string, unknown>).item_name === 'string' &&
      typeof (item as Record<string, unknown>).price === 'number' &&
      typeof (item as Record<string, unknown>).quantity === 'number')
  ) : []
  const analyticsPurchase = analytics && analytics.currency === 'EUR' &&
    typeof analytics.value === 'number' && Number.isFinite(analytics.value) && analyticsItems.length > 0
    ? {
        value: analytics.value,
        ...(typeof analytics.shipping === 'number' && Number.isFinite(analytics.shipping) ? { shipping: analytics.shipping } : {}),
        currency: 'EUR' as const,
        items: analyticsItems as NonNullable<CreatedOrder['analyticsPurchase']>['items'],
      }
    : undefined

  return { orderNumber: result.orderNumber as string, ...(analyticsPurchase ? { analyticsPurchase } : {}) }
}
