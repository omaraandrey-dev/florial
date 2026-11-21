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
  payment_method?: string
  delivery_fee?: number | null
  total?: number | null
  currency?: string
  created_at: string
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
  const url = fontUrl || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'
  const fontResponse = await fetch(url)
  if (!fontResponse.ok) throw new Error('Unable to load Unicode font for PDF')
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: false })
  let page = pdf.addPage([595, 842])
  const left = 42
  const right = 553
  let y = 800
  const ink = rgb(0.15, 0.2, 0.2)
  const green = rgb(0.02, 0.39, 0.29)
  const draw = (text: string, size = 9, color = ink, bold = false) => {
    if (y < 48) {
      page = pdf.addPage([595, 842])
      y = 800
    }
    page.drawText(text, { x: left, y, size, font, color })
    y -= size + (bold ? 6 : 5)
  }
  const drawWrapped = (text: string, size = 8, maxChars = 105) => {
    for (const line of wrapText(text, maxChars)) draw(line, size)
  }
  const drawRule = () => {
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.7, color: rgb(0.82, 0.86, 0.84) })
    y -= 10
  }

  draw('FLORIAL OOD', 21, green, true)
  draw('„Флориал“ ООД / FLORIAL LTD', 9)
  draw('ЕИК: 206978288   |   ДДС №: BG206978288 (ДДС: BG206978288)   |   МОЛ: Десислав Бараков', 8)
  draw('Градински център „Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet)', 7.5)
  draw('Телефон: +359 876 777 902   |   Email: barakov1971@abv.bg', 7.5)
  draw('Банка: Банка ДСК   |   IBAN: BG88STSA93000029605234   |   BIC: STSABGSF', 7.5)
  y -= 4
  draw('ПРОФОРМА ФАКТУРА', 14, green, true)
  const dates = getProformaPaymentDates(order.created_at)
  draw('Номер: ' + order.order_number + '   |   Дата на издаване: ' + dates.issuedDateLabel)
  draw('КЛИЕНТ', 10, green, true)
  draw('Име: ' + (order.customer_name || 'Не е посочено'))
  draw('Телефон: ' + (order.phone || 'Не е посочен'))
  if (order.email) draw('Имейл: ' + order.email)
  if (order.city) draw('Населено място: ' + order.city)
  if (order.address) draw('Адрес: ' + order.address)
  if (order.delivery_method) drawWrapped('Получаване / доставка: ' + order.delivery_method)
  if (order.payment_method) draw('Начин на плащане: ' + (order.payment_method === 'bank_transfer' ? 'Банков превод' : 'Плащане в магазина'))
  y -= 3
  draw('АРТИКУЛИ', 10, green, true)
  for (const item of order.items || []) {
    drawWrapped((item.name || 'Продукт') + (item.sku ? ' (SKU: ' + item.sku + ')' : '') +
      ' — ' + item.qty + ' × ' + Number(item.price).toFixed(2) + ' EUR = ' +
      (Number(item.price) * Number(item.qty)).toFixed(2) + ' EUR', 8, 100)
  }
  drawRule()
  draw('Стойност на продуктите (с включен ДДС): ' + Number(order.subtotal).toFixed(2) + ' EUR', 9)
  if (order.delivery_fee == null) draw('Доставка: ще бъде уточнена и потвърдена от Florial', 9)
  else draw('Доставка: ' + Number(order.delivery_fee).toFixed(2) + ' EUR', 9)
  const total = order.total == null ? null : roundMoney(order.total)
  if (total == null) {
    draw('ОБЩА СУМА ЗА ПЛАЩАНЕ (с ДДС): след потвърждение на доставката', 11, green, true)
    draw('Словом: ще бъде посочена в окончателната проформа след потвърждение.', 8)
  } else {
    draw('Начислен ДДС (20%, включен в цената): ' + vatIncludedInGross(total).toFixed(2) + ' EUR', 9)
    draw('ОБЩА СУМА ЗА ПЛАЩАНЕ (с ДДС): ' + total.toFixed(2) + ' EUR', 12, green, true)
    drawWrapped('Словом: ' + amountInWordsBg(total, order.currency || 'EUR'), 8, 105)
  }

  if (order.payment_method === 'bank_transfer') {
    y -= 3
    draw('УСЛОВИЯ ЗА ПЛАЩАНЕ', 10, green, true)
    drawWrapped('Плащането се извършва по банков път в срок до 5 (пет) календарни дни от датата на издаване на проформа фактурата — краен срок: ' + dates.dueDateLabel + '.', 8, 105)
    drawWrapped('Получател: „Флориал“ ООД | IBAN: BG88STSA93000029605234 | BIC: STSABGSF | Банка: Банка ДСК', 8, 105)
    drawWrapped('Основание за плащане: ' + order.order_number + ' (номер на поръчката).', 8, 105)
    drawWrapped('ВАЖНО: Поръчката не се счита за потвърдена до проверка на наличностите. Моля, изчакайте потвърждение от екипа на Florial, преди да извършите банковия превод. При липса на артикул или промяна в количеството ще получите актуализирана проформа.', 8, 105)
  } else {
    draw('Този документ е проформа за поръчка, а не данъчна фактура.', 8)
  }

  y -= 5
  draw('СЪСТАВИЛ: Десислав Бараков / МОЛ', 8)
  draw('Подпис: ______________________________', 8)
  draw('ПОЛУЧИЛ:', 8)
  draw('Име и подпис: _________________________     Печат: ______________', 8)
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
