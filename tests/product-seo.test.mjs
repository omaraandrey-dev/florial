import test from 'node:test'
import assert from 'node:assert/strict'
import { generateProductSeo, PRODUCT_SEO_MAX_TITLE_LENGTH } from '../src/lib/productSeo.mjs'

test('uses the approved separator and keeps Meta Title within 70 characters', () => {
  const result = generateProductSeo({ name: 'Маслина Olea Europaea', shortDescription: 'Вечнозелено дърво с декоративна корона.' }, 'bg', 0)
  assert.ok(result)
  assert.ok(result.metaTitle.includes(' | '))
  assert.ok(result.metaTitle.length <= PRODUCT_SEO_MAX_TITLE_LENGTH)
  assert.match(result.metaDescription, /^Продажба на /)
  assert.match(result.metaDescription, /Градински център Флориал/)
})

test('shortens long product names only at word boundaries and preserves the location', () => {
  const result = generateProductSeo({
    name: 'Rain Bird 100-DVF-TBOS — електромагнитен клапан 1″, 9 V с регулатор на дебита',
    shortDescription: 'Електромагнитен клапан за автоматично поливане.',
  }, 'bg', 1)
  assert.ok(result)
  assert.ok(result.metaTitle.length <= PRODUCT_SEO_MAX_TITLE_LENGTH)
  assert.match(result.metaTitle, /Равда/)
  assert.match(result.metaTitle, /Флориал/)
  assert.ok(result.metaTitle.includes('1″, 9…'))
})

test('never assigns Sozopol and replaces an excluded existing location', () => {
  const result = generateProductSeo({
    name: 'Product',
    seo: { metaTitle: 'Product | Созопол', metaDescription: 'Product for Sozopol.' },
  }, 'en', 0)
  assert.ok(result)
  assert.ok(!/sozopol|созопол|созополь/i.test(JSON.stringify(result)))
})

test('localizes location and uses natural sale-first copy for RU and EN', () => {
  const product = {
    name: 'Rain Bird Rotor',
    shortDescription: 'Роторен разпръсквач за тревни площи.',
    translations: {
      ru: { name: 'Роторный дождеватель Rain Bird', shortDescription: 'Роторный дождеватель для газонов.' },
      en: { name: 'Rain Bird rotor sprinkler', shortDescription: 'Rotor sprinkler for lawns.' },
    },
  }
  const ru = generateProductSeo(product, 'ru', 0)
  const en = generateProductSeo(product, 'en', 0)
  assert.ok(ru?.metaDescription.startsWith('Продажа: '))
  assert.ok(en?.metaDescription.startsWith('For sale: '))
  assert.ok(ru?.metaTitle.includes('Несебр'))
  assert.ok(en?.metaTitle.includes('Nessebar'))
})
