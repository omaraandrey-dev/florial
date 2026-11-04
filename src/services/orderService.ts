export interface OrderData {
  customer_name: string
  phone: string
  email: string
  city: string
  address: string
  delivery_method?: string
  payment_method?: string
  comment?: string
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
}

export async function createOrder(data: OrderData): Promise<CreatedOrder> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const responseText = await response.text()
  let result: { orderNumber?: unknown; error?: unknown; requestId?: unknown } | null = null
  try {
    result = JSON.parse(responseText) as { orderNumber?: unknown; error?: unknown; requestId?: unknown }
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

  return { orderNumber: result.orderNumber as string }
}
