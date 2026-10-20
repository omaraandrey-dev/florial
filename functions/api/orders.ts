import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

type OrderRequest = {
  customer_name?: unknown
  phone?: unknown
  email?: unknown
  city?: unknown
  address?: unknown
  delivery_method?: unknown
  payment_method?: unknown
  comment?: unknown
  items?: unknown
}

type RuntimeEnv = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SANITY_PROJECT_ID?: string
  SANITY_DATASET?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  ORDER_NOTIFICATION_EMAIL?: string
  PROFORMA_FONT_URL?: string
}

type SanityProduct = {
  _id: string
  name?: string
  sku?: string
  priceEUR?: number
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''


const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] || char)

type ProformaOrder = {
  order_number: string
  customer_name: string
  phone: string
  email: string | null
  city: string
  address: string | null
  items: Array<{ sku: string; name: string; qty: number; price: number }>
  subtotal: number
  created_at: string
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

const createProformaPdf = async (order: ProformaOrder, fontUrl?: string): Promise<Uint8Array> => {
  const url = fontUrl || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'
  const fontResponse = await fetch(url)
  if (!fontResponse.ok) throw new Error('Unable to load Unicode font for PDF')
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: true })
  const page = pdf.addPage([595, 842])
  const left = 44
  let y = 785
  const draw = (text: string, size = 10, color = rgb(0.15, 0.2, 0.2)) => {
    page.drawText(text, { x: left, y, size, font, color })
    y -= size + 9
  }
  draw('FLORIAL OOD', 22, rgb(0.02, 0.39, 0.29))
  draw('ПРОФОРМА / ПОТВЪРЖДЕНИЕ НА ПОРЪЧКА', 12)
  draw('Номер: ' + order.order_number)
  draw('Дата: ' + new Date(order.created_at).toLocaleDateString('bg-BG'))
  y -= 8
  draw('КЛИЕНТ', 12, rgb(0.02, 0.39, 0.29))
  draw('Име: ' + order.customer_name)
  draw('Телефон: ' + order.phone)
  if (order.email) draw('Имейл: ' + order.email)
  draw('Населено място: ' + order.city)
  if (order.address) draw('Адрес: ' + order.address)
  y -= 8
  draw('АРТИКУЛИ', 12, rgb(0.02, 0.39, 0.29))
  for (const item of order.items || []) {
    if (y < 95) break
    const line = (item.name || 'Продукт') + (item.sku ? ' (' + item.sku + ')' : '') +
      ' — ' + item.qty + ' x ' + Number(item.price).toFixed(2) + ' EUR = ' +
      (Number(item.price) * Number(item.qty)).toFixed(2) + ' EUR'
    draw(line, 9)
  }
  y -= 8
  draw('ОБЩО ЗА ПРОДУКТИТЕ: ' + Number(order.subtotal).toFixed(2) + ' EUR', 13, rgb(0.02, 0.39, 0.29))
  draw('Това е проформа / потвърждение на поръчка, а не данъчна фактура.', 8)
  draw('Разходите за доставка се потвърждават отделно, ако не са включени.', 8)
  return pdf.save()
}

const sendOrderEmail = async (
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type: string }>,
): Promise<void> => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, ...(attachments?.length ? { attachments } : {}) }),
  })
  if (!response.ok) {
    throw new Error('Email provider returned ' + response.status + ': ' + await response.text())
  }
}

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request
  env: RuntimeEnv
}) => {
  let body: OrderRequest
  try {
    body = (await request.json()) as OrderRequest
  } catch {
    return json({ error: 'Невалидна заявка.' }, 400)
  }

  const customerName = cleanText(body.customer_name, 160)
  const phone = cleanText(body.phone, 50)
  const email = cleanText(body.email, 254)
  const city = cleanText(body.city, 120)
  const address = cleanText(body.address, 500)
  const comment = cleanText(body.comment, 2000)

  if (!customerName || !phone || !city) {
    return json({ error: 'Моля, попълнете име, телефон и населено място.' }, 400)
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Моля, въведете валиден имейл адрес.' }, 400)
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    return json({ error: 'Количката е празна или съдържа твърде много артикули.' }, 400)
  }

  const requestedItems: Array<{ productId: string; qty: number; expectedPrice: number }> = []
  for (const item of body.items) {
    if (!item || typeof item !== 'object') {
      return json({ error: 'Невалиден артикул в количката.' }, 400)
    }
    const productId = cleanText((item as { productId?: unknown }).productId, 120)
    const qty = (item as { qty?: unknown }).qty
    const expectedPrice = (item as { expectedPrice?: unknown }).expectedPrice
    if (!productId || !Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > 999 || typeof expectedPrice !== 'number' || !Number.isFinite(expectedPrice) || expectedPrice < 0) {
      return json({ error: 'Невалиден артикул или количество.' }, 400)
    }
    requestedItems.push({ productId, qty: qty as number, expectedPrice })
  }

  const supabaseUrl = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Сървърът за поръчки не е конфигуриран. Моля, свържете се с нас.' }, 503)
  }

  const sanityProjectId = env.SANITY_PROJECT_ID || 'bxvcy0qs'
  const sanityDataset = env.SANITY_DATASET || 'production'
  const productIds = [...new Set(requestedItems.map((item) => item.productId))]
  const groq = '*[_type == "product" && isActive != false && _id in $ids] { _id, name, sku, priceEUR }'
  const sanityUrl = new URL(
    `https://${sanityProjectId}.api.sanity.io/v2024-01-01/data/query/${encodeURIComponent(sanityDataset)}`
  )
  sanityUrl.searchParams.set('query', groq)
  sanityUrl.searchParams.set('$ids', JSON.stringify(productIds))

  let products: SanityProduct[]
  try {
    const sanityResponse = await fetch(sanityUrl.toString())
    if (!sanityResponse.ok) {
      return json({ error: 'Не успяхме да проверим цените на продуктите. Моля, опитайте отново.' }, 502)
    }
    const sanityResult = (await sanityResponse.json()) as { result?: SanityProduct[] }
    products = Array.isArray(sanityResult.result) ? sanityResult.result : []
  } catch {
    return json({ error: 'Временно не можем да проверим каталога. Моля, опитайте отново.' }, 502)
  }

  const productMap = new Map(products.map((product) => [product._id, product]))
  const orderItems: Array<{ sku: string; name: string; qty: number; price: number }> = []
  let subtotal = 0

  for (const requested of requestedItems) {
    const product = productMap.get(requested.productId)
    const price = Number(product?.priceEUR)
    if (!product || !Number.isFinite(price) || price < 0) {
      return json({ error: 'Един или повече продукти вече не са налични. Обновете количката и опитайте отново.' }, 409)
    }
    if (Math.abs(price - requested.expectedPrice) > 0.009) {
      return json({ error: 'Цената на продукт се е променила. Обновете страницата и проверете количката отново.' }, 409)
    }
    orderItems.push({
      sku: cleanText(product.sku, 100),
      name: cleanText(product.name, 250) || 'Продукт',
      qty: requested.qty,
      price,
    })
    subtotal += price * requested.qty
  }

  subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100
  if (!Number.isFinite(subtotal) || subtotal > 10000000) {
    return json({ error: 'Общата стойност на поръчката е невалидна.' }, 400)
  }

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const orderNumber = `FL-${datePart}-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`
  const order = {
    order_number: orderNumber,
    customer_name: customerName,
    phone,
    email: email || null,
    city,
    address: address || null,
    delivery_method: cleanText(body.delivery_method, 100) || 'courier',
    payment_method: cleanText(body.payment_method, 100) || 'cash_on_delivery',
    comment: comment || null,
    items: orderItems,
    subtotal,
    currency: 'EUR',
    status: 'new',
    created_at: new Date().toISOString(),
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/orders`, {
      method: 'POST',
      headers: (() => {
        const headers: Record<string, string> = {
          apikey: serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        }
        // New Supabase sb_secret_ keys are not JWTs and must not be sent as Bearer tokens.
        if (!serviceKey.startsWith('sb_secret_')) {
          headers.Authorization = `Bearer ${serviceKey}`
        }
        return headers
      })(),
      body: JSON.stringify(order),
    })

    if (!response.ok) {
      const details = await response.text()
      console.error('Supabase order insert failed:', response.status, details)
      return json({ error: 'Не успяхме да запазим поръчката. Моля, опитайте отново след малко.' }, 502)
    }
  } catch (error) {
    console.error('Order endpoint network error:', error)
    return json({ error: 'Временно не можем да запазим поръчката. Моля, опитайте отново.' }, 502)
  }


  // Email is best-effort: a mail-provider outage must not fail a saved order.
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const itemsHtml = orderItems.map((item) =>
      '<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">' +
      escapeHtml(item.name) + (item.sku ? '<br><small>SKU: ' + escapeHtml(item.sku) + '</small>' : '') +
      '</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">' +
      item.qty + '</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">' +
      (item.price * item.qty).toFixed(2) + ' €</td></tr>'
    ).join('')
    const detailsHtml = '<p><strong>Номер на поръчката:</strong> ' + escapeHtml(orderNumber) + '</p>' +
      '<p><strong>Клиент:</strong> ' + escapeHtml(customerName) + '<br>' +
      '<strong>Телефон:</strong> ' + escapeHtml(phone) + '<br>' +
      '<strong>Имейл:</strong> ' + escapeHtml(email || 'Не е посочен') + '<br>' +
      '<strong>Населено място:</strong> ' + escapeHtml(city) + '<br>' +
      '<strong>Адрес:</strong> ' + escapeHtml(address || 'Не е посочен') + '</p>' +
      (comment ? '<p><strong>Коментар:</strong> ' + escapeHtml(comment) + '</p>' : '') +
      '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Продукт</th><th style="padding:8px">Брой</th><th style="text-align:right;padding:8px">Сума</th></tr></thead><tbody>' +
      itemsHtml + '</tbody></table><p style="text-align:right;font-size:18px"><strong>Общо: ' +
      subtotal.toFixed(2) + ' €</strong></p><p>Разходите за доставка, ако има такива, ще бъдат потвърдени допълнително.</p>'

    const sellerEmail = cleanText(env.ORDER_NOTIFICATION_EMAIL, 254)
    const mailTasks: Promise<void>[] = []
    let pdfAttachment: Array<{ filename: string; content: string; type: string }> = []
    try {
      const pdfBytes = await createProformaPdf({
        order_number: orderNumber,
        customer_name: customerName,
        phone,
        email: email || null,
        city,
        address: address || null,
        items: orderItems,
        subtotal,
        created_at: String(order.created_at),
      }, env.PROFORMA_FONT_URL)
      pdfAttachment = [{
        filename: 'Florial-' + orderNumber + '-proforma.pdf',
        content: toBase64(pdfBytes),
        type: 'application/pdf',
      }]
    } catch (error) {
      console.error('Proforma PDF generation failed; sending email without attachment:', error)
    }
    if (sellerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      mailTasks.push(sendOrderEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM,
        sellerEmail,
        'Нова поръчка ' + orderNumber + ' — Florial',
        '<h1>Получена е нова поръчка</h1>' + detailsHtml,
        pdfAttachment,
      ))
    }
    if (email) {
      mailTasks.push(sendOrderEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM,
        email,
        'Потвърждение на поръчка ' + orderNumber + ' — Florial',
        '<h1>Благодарим ви за поръчката!</h1><p>Получихме вашата заявка. Екипът на Florial ще се свърже с вас за потвърждение. Прикачили сме проформа за вашата поръчка, ако генерирането е успешно.</p>' + detailsHtml,
        pdfAttachment,
      ))
    }
    const mailResults = await Promise.allSettled(mailTasks)
    for (const result of mailResults) {
      if (result.status === 'rejected') console.error('Order email failed:', result.reason)
    }
  }

  return json({ orderNumber }, 201)
}
