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

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof result?.error === 'string'
        ? result.error
        : 'Грешка при запазване на поръчката. Моля, опитайте отново.'
    )
  }

  if (!result?.orderNumber) {
    throw new Error('Поръчката не беше потвърдена от сървъра.')
  }

  return { orderNumber: result.orderNumber as string }
}
