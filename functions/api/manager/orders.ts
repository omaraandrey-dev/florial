import { json, requireUser, type ManagerEnv } from './_lib'

type OrderRow = {
  id: string
  order_number: string
  customer_name: string
  phone: string
  email: string | null
  city: string | null
  address: string | null
  delivery_method: string
  payment_method: string
  comment: string | null
  items: string | unknown[]
  subtotal: number
  currency: string
  status: string
  delivery_fee: number | null
  total: number | null
  created_at: string
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const auth = await requireUser(request, env, ['owner', 'manager'])
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)

  const url = new URL(request.url)
  const requestedLimit = Number(url.searchParams.get('limit') || 100)
  const limit = Number.isInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 100

  try {
    const result = await env.DB.prepare(`
      SELECT id, order_number, customer_name, phone, email, city, address,
        delivery_method, payment_method, comment, items, subtotal, currency,
        status, delivery_fee, total, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all<OrderRow>()

    const orders = (result.results || []).map((order) => {
      let items: unknown[] = []
      try {
        items = Array.isArray(order.items) ? order.items : JSON.parse(String(order.items || '[]'))
        if (!Array.isArray(items)) items = []
      } catch { items = [] }
      return { ...order, items }
    })
    return json({ orders, count: orders.length, limit })
  } catch {
    return json({ error: 'Не успяхме да заредим поръчките от системата.' }, 502)
  }
}
