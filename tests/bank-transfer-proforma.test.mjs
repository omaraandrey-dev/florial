import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('proforma generator contains verified Florial company and bank details', async () => {
  const pdf = await read('functions/api/_lib/order-documents.ts')
  assert.match(pdf, /ЕИК: 206978288/)
  assert.match(pdf, /ДДС №: BG206978288/)
  assert.match(pdf, /barakov1971@abv\.bg/)
  assert.match(pdf, /IBAN: BG88STSA93000029605234/)
  assert.match(pdf, /BIC: STSABGSF/)
  assert.doesNotMatch(pdf, /omaraandrey@gmail\.com/)
})

test('gross prices extract VAT instead of adding another 20 percent', async () => {
  const pdf = await read('functions/api/_lib/order-documents.ts')
  assert.match(pdf, /grossAmount \* rate \/ \(100 \+ rate\)/)
  assert.match(pdf, /Начислен ДДС \(20%, включен в цената\)/)
})

test('bank transfer proforma includes due date, amount in words, and stock confirmation warning', async () => {
  const pdf = await read('functions/api/_lib/order-documents.ts')
  assert.match(pdf, /getProformaPaymentDates\(order\.issued_at \|\| order\.created_at\)/)
  const managerPdf = await read('functions/api/manager/order-documents.ts')
  assert.match(managerPdf, /issued_at:nowIso\(\)/)
  assert.match(pdf, /5 \(пет\) календарни дни/)
  assert.match(pdf, /amountInWordsBg\(total/)
  assert.match(pdf, /изчакайте потвърждение от екипа на Florial/)
  assert.match(pdf, /СЪСТАВИЛ: Десислав Бараков \/ МОЛ/)
  assert.match(pdf, /ПОЛУЧИЛ:/)
})

test('checkout accepts bank transfer but blocks it while delivery total is unknown', async () => {
  const api = await read('functions/api/orders.ts')
  assert.match(api, /\['pay_in_store', 'bank_transfer'\]/)
  assert.match(api, /paymentMethodInput === 'bank_transfer' && deliveryMethodInput === 'agree'/)
  assert.match(api, /payment_method: paymentMethodInput/)
  const cart = await read('src/pages/CartPage.tsx')
  assert.match(cart, /useState<'pay_in_store' \| 'bank_transfer'>\('pay_in_store'\)/)
  assert.match(cart, /payment_method: paymentMethod/)
  assert.match(cart, /disabled=\{deliveryMethod === 'agree'\}/)
  assert.match(cart, /wait for Florial confirmation before making the bank transfer/i)
})
