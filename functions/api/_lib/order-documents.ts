import { PDFDocument, rgb, type PDFPage } from 'pdf-lib'
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
  payment_method?: string
  delivery_fee?: number | null
  total?: number | null
  currency?: string
  created_at: string
  issued_at?: string
  confirmed_at?: string | null
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const bgOnes = {
  masculine: ['нула', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'],
  feminine: ['нула', 'една', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'],
  neuter: ['нула', 'едно', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'],
} as const

const bgTeens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет']
const bgTens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет']
const bgHundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин']

const underThousandBg = (value: number, gender: keyof typeof bgOnes = 'masculine'): string => {
  if (value < 10) return bgOnes[gender][value]
  if (value < 20) return bgTeens[value - 10]
  if (value < 100) return bgTens[Math.floor(value / 10)] + (value % 10 ? ' и ' + bgOnes[gender][value % 10] : '')
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  return bgHundreds[hundreds] + (remainder ? (remainder < 20 ? ' и ' : ' ') + underThousandBg(remainder, gender) : '')
}

const integerToBgWords = (value: number): string => {
  if (value === 0) return 'нула'
  const parts: string[] = []
  const millions = Math.floor(value / 1_000_000)
  const thousands = Math.floor((value % 1_000_000) / 1000)
  const rest = value % 1000
  if (millions) parts.push((millions === 1 ? 'един' : underThousandBg(millions)) + ' милион' + (millions > 1 ? 'а' : ''))
  if (thousands) {
    const thousandWords = thousands === 1 ? 'хиляда' : underThousandBg(thousands, 'feminine') + ' хиляди'
    parts.push(thousandWords)
  }
  if (rest) parts.push(underThousandBg(rest, 'neuter'))
  return parts.join(' ')
}

/** Converts a gross EUR amount to Bulgarian words; catalog prices already include VAT. */
export const amountInWordsBg = (amount: number, currency = 'EUR'): string => {
  if (!Number.isFinite(amount) || amount < 0 || amount > 999_999_999) return 'Сумата не може да бъде изписана'
  const centsTotal = Math.round((amount + Number.EPSILON) * 100)
  const whole = Math.floor(centsTotal / 100)
  const cents = centsTotal % 100
  const currencyName = currency === 'EUR' ? 'евро' : currency
  return integerToBgWords(whole) + ' ' + currencyName + ' и ' + (cents < 10 ? 'нула ' : '') + underThousandBg(cents, 'masculine') + (cents === 1 ? ' цент' : ' цента')
}

/** Returns the VAT component included in a gross amount at the Bulgarian standard 20% rate. */
export const vatIncludedInGross = (grossAmount: number, rate = 20): number =>
  roundMoney(grossAmount * rate / (100 + rate))

const sofiaDate = (date: Date): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date)

export const getProformaPaymentDates = (issuedAt: string, calendarDays = 5) => {
  const issuedDate = sofiaDate(new Date(issuedAt))
  const [year, month, day] = issuedDate.split('-').map(Number)
  const due = new Date(Date.UTC(year, month - 1, day + calendarDays))
  const dueDate = [due.getUTCFullYear(), String(due.getUTCMonth() + 1).padStart(2, '0'), String(due.getUTCDate()).padStart(2, '0')].join('-')
  const format = (value: string) => {
    const [y, m, d] = value.split('-')
    return d + '.' + m + '.' + y
  }
  return { issuedDate, dueDate, issuedDateLabel: format(issuedDate), dueDateLabel: format(dueDate) }
}

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

const wrapText = (value: string, maxChars: number): string[] => {
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? line + ' ' + word : word
    if (next.length > maxChars && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Shared Bulgarian proforma document generator.
 * It is a payment request only; it is not a tax invoice.
 */
export const createProformaPdf = async (order: ProformaOrder, fontUrl?: string): Promise<Uint8Array> => {
  const fontResponse = await fetch(fontUrl || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf')
  if (!fontResponse.ok) throw new Error('Unable to load Unicode font for PDF')
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: false })
  const logoUrl = 'https://cdn.sanity.io/images/bxvcy0qs/production/70904998847fbf96afd2f2994203b4ddc45a75f2-841x289.png'
  const logoResponse = await fetch(logoUrl)
  if (!logoResponse.ok) throw new Error('Unable to load official Florial logo for PDF')
  const logo = await pdf.embedPng(await logoResponse.arrayBuffer())
  const pageSize: [number, number] = [595.28, 841.89]
  const margin = 34
  const right = pageSize[0] - margin
  const ink = rgb(0.12, 0.18, 0.16)
  const green = rgb(0.02, 0.31, 0.22)
  const greenLight = rgb(0.91, 0.96, 0.92)
  const greenPale = rgb(0.96, 0.98, 0.96)
  const gold = rgb(0.72, 0.57, 0.29)
  const muted = rgb(0.38, 0.43, 0.40)
  const white = rgb(1, 1, 1)
  const line = rgb(0.82, 0.87, 0.83)
  const issuedDate = sofiaDate(new Date(order.issued_at || order.created_at))
  const confirmedDate = order.confirmed_at ? sofiaDate(new Date(order.confirmed_at)) : null
  const dates = confirmedDate ? getProformaPaymentDates(order.confirmed_at!) : null
  const fmtDate = (value: string) => {
    const [y, m, d] = value.split('-')
    return d + '.' + m + '.' + y
  }
  const total = order.total == null ? null : roundMoney(order.total)
  const confirmed = Boolean(confirmedDate && total !== null)
  const pages: PDFPage[] = []
  let page = pdf.addPage(pageSize)
  pages.push(page)
  let y = 0
  const text = (value: string, x: number, top: number, size = 8, color = ink) => {
    page.drawText(value, { x, y: top - size, size, font, color, maxWidth: right - x })
  }
  const wrapped = (value: string, x: number, top: number, width: number, size = 7, color = ink) => {
    const maxChars = Math.max(12, Math.floor(width / (size * 0.53)))
    const lines = wrapText(value, maxChars)
    lines.forEach((lineText, index) => page.drawText(lineText, { x, y: top - size - index * (size + 2), size, font, color, maxWidth: width }))
    return lines.length * (size + 2)
  }
  const rule = (x1: number, x2: number, yy: number, color = line, thickness = 0.65) =>
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, color, thickness })
  const newPage = () => {
    page = pdf.addPage(pageSize)
    pages.push(page)
    y = 790
    drawTableHeader()
  }
  const drawTableHeader = () => {
    const top = y
    const h = 24
    page.drawRectangle({ x: margin, y: top - h, width: right - margin, height: h, color: green })
    const xs = [margin + 8, margin + 34, margin + 270, margin + 333, margin + 411]
    text('№', xs[0], top - 7, 7, white)
    text('НАИМЕНОВАНИЕ / SKU', xs[1], top - 7, 7, white)
    text('КОЛ.', xs[2], top - 7, 7, white)
    text('ЕД. ЦЕНА', xs[3], top - 7, 7, white)
    text('СУМА', xs[4], top - 7, 7, white)
    y = top - h
  }
  const drawSectionTitle = (label: string) => {
    page.drawRectangle({ x: margin, y: y - 18, width: right - margin, height: 18, color: greenLight })
    text(label, margin + 8, y - 4, 8, green)
    y -= 25
  }

  const colGap = 12
  const colW = (right - margin - colGap * 2) / 3
  const x1 = margin
  const x2 = margin + colW + colGap
  const x3 = margin + (colW + colGap) * 2
  page.drawRectangle({ x: x1, y: 635, width: colW, height: 165, color: greenPale, borderColor: line, borderWidth: 0.6 })
  page.drawRectangle({ x: x2, y: 635, width: colW, height: 165, color: white, borderColor: line, borderWidth: 0.6 })
  page.drawRectangle({ x: x3, y: 635, width: colW, height: 165, color: greenPale, borderColor: line, borderWidth: 0.6 })
  const logoDims = logo.scale(Math.min((colW - 18) / logo.width, 43 / logo.height))
  page.drawImage(logo, { x: x1 + 9, y: 800 - logoDims.height - 8, width: logoDims.width, height: logoDims.height })
  let sy = 800 - logoDims.height - 18
  text('ПРОДАВАЧ', x1 + 9, sy, 7, green); sy -= 15
  for (const lineText of [
    '„Флориал“ ООД / FLORIAL LTD',
    'ЕИК: 206978288',
    'ДДС №: BG206978288 (ДДС: BG206978288)',
    'МОЛ: Десислав Бараков',
    '8230 Несебър, България',
    'Тел.: +359 876 777 902',
    'barakov1971@abv.bg',
  ]) { text(lineText, x1 + 9, sy, 6.2, ink); sy -= 11 }
  text('ПРОФОРМА', x2 + 8, 755, 8, gold)
  text('ФАКТУРА', x2 + 8, 733, 15, green)
  rule(x2 + 8, x2 + colW - 8, 716, gold, 1.2)
  text('№ ' + order.order_number, x2 + 8, 701, 7.4, ink)
  text('Издадена: ' + fmtDate(issuedDate), x2 + 8, 685, 6.7, muted)
  if (confirmed) text('Потвърдена: ' + fmtDate(confirmedDate!), x2 + 8, 670, 6.7, green)
  else text('Очаква потвърждение', x2 + 8, 670, 7, gold)
  text(confirmed ? 'ПОРЪЧКАТА Е' : 'СТАТУС НА ПОРЪЧКАТА', x2 + 8, 651, 6.2, muted)
  text(confirmed ? 'ПОТВЪРДЕНА' : 'ОЧАКВА ПОТВЪРЖДЕНИЕ', x2 + 8, 638, confirmed ? 8 : 6.1, confirmed ? green : gold)
  text('КЛИЕНТ', x3 + 9, 788, 7, green)
  let cy = 772
  for (const lineText of [
    order.customer_name || 'Не е посочено',
    'Тел.: ' + (order.phone || 'Не е посочен'),
    ...(order.email ? ['Email: ' + order.email] : []),
    ...(order.city ? ['Град: ' + order.city] : []),
    ...(order.address ? ['Адрес: ' + order.address] : []),
  ]) { cy -= wrapped(lineText, x3 + 9, cy, colW - 18, 6.4, ink) + 4 }
  y = 620
  text('ПОЛУЧАВАНЕ: ' + (order.delivery_method || 'Не е посочено'), margin + 2, y, 7, muted)
  y -= 22
  drawSectionTitle('ДЕТАЙЛИ НА ПОРЪЧКАТА')
  drawTableHeader()

  const rowX = [margin, margin + 28, margin + 264, margin + 330, margin + 408]
  const rowWidths = [20, 226, 58, 70, 75]
  ;(order.items || []).forEach((item, index) => {
    const titleLines = wrapText((item.name || 'Продукт') + (item.sku ? ' · SKU: ' + item.sku : ''), 54)
    const rowHeight = Math.max(28, 10 + titleLines.length * 9)
    if (y - rowHeight < 105) newPage()
    const top = y
    page.drawRectangle({ x: margin, y: top - rowHeight, width: right - margin, height: rowHeight, color: index % 2 === 0 ? greenPale : white })
    rule(margin, right, top - rowHeight, line, 0.45)
    text(String(index + 1), rowX[0] + 6, top - 8, 7, muted)
    titleLines.forEach((lineText, lineIndex) => page.drawText(lineText, { x: rowX[1] + 3, y: top - 8 - 8 - lineIndex * 9, size: 7, font, color: ink, maxWidth: rowWidths[1] }))
    text(String(item.qty), rowX[2] + 8, top - 9, 7, ink)
    text(Number(item.price).toFixed(2) + ' €', rowX[3] + 2, top - 9, 6.6, ink)
    text((Number(item.price) * Number(item.qty)).toFixed(2) + ' €', rowX[4] + 2, top - 9, 6.6, ink)
    y = top - rowHeight
  })
  y -= 12
  const needSpace = (height: number) => { if (y - height < 65) newPage() }
  needSpace(138)
  const labelX = margin + 8
  const valueX = right - 145
  const totalBase = total === null ? null : roundMoney(total - vatIncludedInGross(total))
  const vat = total === null ? null : vatIncludedInGross(total)
  const totals = [
    ['Стойност на продуктите (с ДДС)', roundMoney(order.subtotal).toFixed(2) + ' EUR'],
    ['Доставка', order.delivery_fee == null ? 'За уточняване' : roundMoney(order.delivery_fee).toFixed(2) + ' EUR'],
    ['Данъчна основа', totalBase === null ? 'След потвърждение' : totalBase.toFixed(2) + ' EUR'],
    ['Начислен ДДС (20%, включен в цената)', vat === null ? 'След потвърждение' : vat.toFixed(2) + ' EUR'],
  ]
  totals.forEach(([label, value]) => {
    text(label, labelX, y, 7.2, muted)
    text(value, valueX, y, 7.2, ink)
    y -= 15
  })
  page.drawRectangle({ x: margin, y: y - 29, width: right - margin, height: 29, color: green })
  text('ОБЩА СУМА ЗА ПЛАЩАНЕ (с ДДС)', margin + 9, y - 8, 8, white)
  text(total === null ? 'След потвърждение' : total.toFixed(2) + ' EUR', valueX, y - 8, 10, white)
  y -= 39
  text('Словом: ' + (total === null ? 'ще бъде посочена след потвърждение' : amountInWordsBg(total, order.currency || 'EUR')), labelX, y, 7, ink)
  y -= 20
  if (confirmed) {
    drawSectionTitle('УСЛОВИЯ ЗА ПЛАЩАНЕ')
    y -= wrapped('Поръчката е потвърдена от екипа на Florial. Плащането се извършва в срок до 5 (пет) календарни дни след датата на потвърждение. Краен срок за плащане: ' + dates!.dueDateLabel + '.', margin + 7, y, right - margin - 14, 7.2, ink) + 8
    y -= wrapped('Получател: „Флориал“ ООД · Банка: Банка ДСК · IBAN: BG88STSA93000029605234 · BIC: STSABGSF', margin + 7, y, right - margin - 14, 7, ink) + 6
    y -= wrapped('Основание за плащане: ' + order.order_number, margin + 7, y, right - margin - 14, 7, ink) + 8
  } else {
    drawSectionTitle('ВАЖНО — МОЛЯ, НЕ ИЗВЪРШВАЙТЕ ПЛАЩАНЕ')
    y -= wrapped('Тази проформа е предварителна. Очаква се проверка на наличностите, количествата и окончателната сума от екипа на Florial. Не извършвайте банков превод преди да получите потвърдена проформа.', margin + 7, y, right - margin - 14, 7.2, ink) + 10
  }
  if (order.payment_method === 'bank_transfer') {
    y -= wrapped('Начин на плащане: банков превод. Получател: „Флориал“ ООД · DSK Bank · IBAN: BG88STSA93000029605234 · BIC: STSABGSF', margin + 7, y, right - margin - 14, 7, muted) + 8
  }
  needSpace(58)
  rule(margin, right, y, gold, 0.9)
  y -= 18
  text('СЪСТАВИЛ: Десислав Бараков / МОЛ', margin + 4, y, 7, ink)
  text('ПОЛУЧИЛ:', margin + 285, y, 7, ink)
  y -= 25
  text('Подпис: __________________________', margin + 4, y, 7, muted)
  text('Име и подпис: ____________________', margin + 285, y, 7, muted)
  y -= 22
  text('Печат: ___________________________', margin + 4, y, 7, muted)
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: margin, y: 34 }, end: { x: right, y: 34 }, color: line, thickness: 0.5 })
    p.drawText('Florial · ' + order.order_number, { x: margin, y: 20, size: 6.5, font, color: muted })
    p.drawText('Страница ' + (index + 1) + ' / ' + pages.length, { x: right - 78, y: 20, size: 6.5, font, color: muted })
  })
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
  bcc?: string[],
): Promise<void> => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: [to], subject, html, ...(bcc?.length ? { bcc } : {}), ...(attachments?.length ? { attachments } : {}) }),
  })
  if (!response.ok) {
    throw new Error('Email provider returned ' + response.status + ': ' + await response.text())
  }
}
