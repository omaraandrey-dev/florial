import test from 'node:test'
import assert from 'node:assert/strict'
import { generateProductSeo, getMissingProductSeoFields, isProductSeoFieldMissing, PRODUCT_SEO_MAX_TITLE_LENGTH, PRODUCT_SEO_MAX_DESCRIPTION_LENGTH } from '../src/lib/productSeo.mjs'

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
  assert.ok(result.metaTitle.includes('1″…'))
})

test('never assigns Sozopol and replaces an excluded existing location', () => {
  const result = generateProductSeo({
    name: 'Product',
    translations: { en: { name: 'Product' } },
    seo: { metaTitle: 'Product | Созопол', metaDescription: 'Product for Sozopol.' },
  }, 'en', 0)
  assert.ok(result)
  assert.ok(!/sozopol|созопол|созополь/i.test(JSON.stringify(result)))
})

test('keeps product characteristics while removing duplicate location phrases', () => {
  const result = generateProductSeo({
    name: 'Bougainvillea',
    translations: {
      en: {
        name: 'Bougainvillea',
        shortDescription: 'Beautiful Bougainvillea with vibrant colors and green leaves, ideal for gardens in Nesebar and surrounding areas.',
      },
    },
  }, 'en', 0)
  assert.ok(result)
  assert.match(result.metaDescription, /vibrant colors and green leaves/)
  assert.match(result.metaDescription, /Florial, Nessebar|customers in Nessebar/)
  assert.ok(!result.metaDescription.includes('Nesebar and surrounding areas'))
})

test('uses a permitted location already mentioned in product descriptions', () => {
  const result = generateProductSeo({
    name: 'Градински продукт',
    shortDescription: 'Подходящ продукт за градини в Равда и района.',
  }, 'bg', 0)
  assert.ok(result)
  assert.equal(result.location, 'Равда')
  assert.match(result.metaDescription, /клиенти в Равда/)
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


test('returns only SEO fields that are missing and preserves populated values', () => {
  const generated = { h1: 'New H1', metaTitle: 'New title', metaDescription: 'New description', location: 'Nessebar' }
  const existing = { h1: 'Owner H1', metaTitle: 'Owner title', metaDescription: '' }
  assert.deepEqual(getMissingProductSeoFields(existing, generated), { metaDescription: 'New description' })
})

test('treats absent, null and whitespace-only SEO values as missing', () => {
  const generated = { h1: 'H1', metaTitle: 'Title', metaDescription: 'Description', location: 'Nessebar' }
  assert.deepEqual(getMissingProductSeoFields({ h1: null, metaTitle: '   ' }, generated), {
    h1: 'H1', metaTitle: 'Title', metaDescription: 'Description',
  })
})

test('returns all generated fields when no SEO values exist', () => {
  const generated = { h1: 'H1', metaTitle: 'Title', metaDescription: 'Description', location: 'Nessebar' }
  assert.deepEqual(getMissingProductSeoFields(undefined, generated), {
    h1: 'H1', metaTitle: 'Title', metaDescription: 'Description',
  })
})

test('classifies missing SEO values consistently for preview and apply', () => {
  for (const value of [undefined, null, '', '   ', String.fromCharCode(9, 10)]) assert.equal(isProductSeoFieldMissing(value), true)
  for (const value of ['0', ' H1 ', 'Existing title']) assert.equal(isProductSeoFieldMissing(value), false)
})


test('keeps generated descriptions within 160 characters without clipping feature text', () => {
  const result = generateProductSeo({
    name: 'Rain Bird PCD-2333-100 — pressure-compensating dripline, 100 m',
    translations: {
      en: {
        name: 'Rain Bird PCD-2333-100 — pressure-compensating dripline, 100 m',
        shortDescription: 'Dripline with pressure-compensating emitters for uniform water delivery along the full irrigation line.',
      },
    },
  }, 'en', 0)
  assert.ok(result)
  assert.ok(result.metaDescription.length <= PRODUCT_SEO_MAX_DESCRIPTION_LENGTH)
  assert.ok(!result.metaDescription.includes('…'))
  assert.ok(!result.metaDescription.endsWith('for'))
  assert.match(result.metaDescription, /Florial/)
})

test('does not create empty feature fragments from VAT-only source text', () => {
  const result = generateProductSeo({
    name: 'Irritec 16 mm barbed dripline valve with 3/4 inch male thread',
    translations: {
      en: {
        name: 'Irritec 16 mm barbed dripline valve with 3/4 inch male thread',
        shortDescription: 'Irritec 16 mm barbed dripline valve with 3/4 inch male thread. VAT included.',
      },
    },
  }, 'en', 0)
  assert.ok(result)
  assert.ok(result.metaDescription.length <= PRODUCT_SEO_MAX_DESCRIPTION_LENGTH)
  assert.ok(!/—\s*[.,]|\.\./.test(result.metaDescription))
  assert.ok(!result.metaDescription.includes('VAT included'))
})

test('skips English or Russian SEO generation when the source name contains Bulgarian text', () => {
  assert.equal(generateProductSeo({
    translations: { en: { name: 'Support stake за капков маркуч 16 mm' } },
  }, 'en', 0), null)
  assert.equal(generateProductSeo({
    translations: { ru: { name: 'Опорный колышек за капков маркуч 16 mm' } },
  }, 'ru', 0), null)
})

test('falls back to a complete product description when the feature does not fit', () => {
  const result = generateProductSeo({
    name: 'Rain Bird controller',
    translations: {
      en: {
        name: 'Rain Bird controller',
        shortDescription: 'A very long product feature description that must not be clipped into an unfinished phrase or an incomplete word because it cannot fit in the available search description length.',
      },
    },
  }, 'en', 0)
  assert.ok(result)
  assert.ok(result.metaDescription.length <= PRODUCT_SEO_MAX_DESCRIPTION_LENGTH)
  assert.ok(!result.metaDescription.includes('…'))
  assert.match(result.metaDescription, /^For sale:/)
})
