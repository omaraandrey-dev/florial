import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export type ProformaOrder = {
  order_number: string
  customer_name: string
  phone: string
  email: string | null
  city: string
  address: string | null
  items: Array<{ sku?: string; name: string; qty: number; price: number; imageUrl?: string }>
  subtotal: number
  delivery_method?: string
  delivery_fee?: number | null
  total?: number | null
  created_at: string
}

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

export const createProformaPdf = async (order: ProformaOrder, fontUrl?: string): Promise<Uint8Array> => {
  const url = fontUrl || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'
  const fontResponse = await fetch(url)
  if (!fontResponse.ok) throw new Error('Unable to load Unicode font for PDF')
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  // Embed the complete font. Subsetting this variable Noto Sans font produced missing/corrupted glyphs in some PDF readers.
  const font = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: false })
  const page = pdf.addPage([595, 842])
  const left = 44
  let y = 785
  const draw = (text: string, size = 10, color = rgb(0.15, 0.2, 0.2)) => {
    page.drawText(text, { x: left, y, size, font, color })
    y -= size + 9
  }
  draw('FLORIAL OOD', 22, rgb(0.02, 0.39, 0.29))
  draw('ЕИК: 206978288', 9)
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
  draw('Продукти: ' + Number(order.subtotal).toFixed(2) + ' EUR', 10)
  draw(order.delivery_fee == null ? 'Доставка: ще бъде уточнена с Florial' : 'Доставка: ' + Number(order.delivery_fee).toFixed(2) + ' EUR', 10)
  draw(order.total == null ? 'ОБЩО: ще бъде потвърдено след уточняване на доставката' : 'ОБЩО: ' + Number(order.total).toFixed(2) + ' EUR', 13, rgb(0.02, 0.39, 0.29))
  draw('Това е проформа / потвърждение на поръчка, а не данъчна фактура.', 8)
  draw('Разходите за доставка се потвърждават отделно, ако не са включени.', 8)
  return pdf.save()
}

export const sendOrderEmail = async (
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type: string }>,
  idempotencyKey?: string,
): Promise<void> => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: [to], subject, html, ...(attachments?.length ? { attachments } : {}) }),
  })
  if (!response.ok) {
    throw new Error('Email provider returned ' + response.status + ': ' + await response.text())
  }
}
