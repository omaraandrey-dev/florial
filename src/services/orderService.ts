import { supabase } from '../lib/supabase'

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
    sku: string
    name: string
    qty: number
    price: number
  }>
  subtotal: number
}

export async function createOrder(data: OrderData) {
  const orderNumber = 'FL-' + Math.floor(100000 + Math.random() * 900000)

  // Отправка заказа в Supabase (убрали неиспользуемую переменную order)
  const { error } = await supabase
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        address: data.address,
        delivery_method: data.delivery_method || 'Econt Courier',
        payment_method: data.payment_method || 'Cash on delivery',
        comment: data.comment || '',
        items: data.items,
        total_price: data.subtotal,
        status: 'new'
      }
    ])

  if (error) {
    console.error('Помилка при запис в Supabase:', error)
    throw new Error('Грешка при запазване на поръчката')
  }

  return { orderNumber }
}