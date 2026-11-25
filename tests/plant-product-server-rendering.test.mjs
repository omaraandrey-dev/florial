import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildPlantProductStructuredData,
  renderPlantProductHtml,
} from '../functions/_lib/plantProductHtml.mjs'

const plant = {
  _id: 'plant-1',
  slugValue: 'example-plant',
  name: 'Растение на български',
  scientificName: 'Plantus exemplaris',
  shortDescription: 'Кратко описание на растението.',
  seo: { h1: 'Българско H1', metaTitle: 'BG title' },
  translations: {
    en: {
      name: 'Example plant',
      shortDescription: 'A short plant description.',
      seo: { h1: 'Example plant (Plantus exemplaris)' },
      description: [{
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'English description', marks: ['strong'] }],
        markDefs: [],
      }],
      careGuide: [{
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Water moderately.', marks: [] }],
        markDefs: [],
      }],
    },
  },
  description: [{
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text: 'Описание <опасно>', marks: [] }],
    markDefs: [],
  }],
  careGuide: [{
    _type: 'block',
    style: 'h2',
    children: [{ _type: 'span', text: 'Грижи', marks: [] }],
    markDefs: [],
  }],
  mainImage: {
    asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/plants/example-800x600.jpg' },
    alt: 'Снимка на растение',
    altEn: 'Plant photo',
  },
  gallery: [{
    _key: 'gallery-1',
    asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/plants/gallery-800x600.jpg' },
    alt: 'Допълнителна снимка',
  }],
  plantCare: {
    light: 'sun',
    waterNeeds: 'medium',
    adultHeightCm: 250,
    foliageType: 'evergreen',
    minWinterTempC: -10,
    blackSeaCoast: 'needsVerification',
    blackSeaCoastRecommendation: 'suitable',
    plantingSeason: ['spring', 'autumn'],
  },
  saleVariants: [{
    _key: 'variant-1',
    name: 'Размер 80 см C10',
    nameEn: '80 cm / C10',
    priceEUR: 45,
    oldPriceEUR: 50,
    stockStatus: 'inStock',
    saleHeightCm: 80,
    containerVolumeL: 10,
    sku: 'PLANT-80',
  }, {
    _key: 'variant-2',
    name: 'Размер 120 см C25',
    nameEn: '120 cm / C25',
    priceEUR: 90,
    stockStatus: 'onRequest',
    saleHeightCm: 120,
    containerVolumeL: 25,
  }],
  category: {
    name: 'Палми',
    slugValue: 'palmi',
    translations: { en: { name: 'Palms' } },
  },
  recommendedIrrigation: { irrigationType: 'drip', productSlug: 'drip-kit' },
  relatedContentBySlug: [{ contentType: 'service', slug: 'planting-service', label: 'Planting' }],
}

test('renders complete localized plant detail content in the initial HTML', () => {
  const html = renderPlantProductHtml(plant, 'en')
  assert.match(html, /data-florial-ssr="plant-product"/)
  assert.match(html, /<h1>Example plant \(Plantus exemplaris\)<\/h1>/)
  assert.match(html, /<em>Plantus exemplaris<\/em>/)
  assert.match(html, /A short plant description\./)
  assert.match(html, /<strong>English description<\/strong>/)
  assert.match(html, /Water moderately\./)
  assert.match(html, /Plant photo/)
  assert.match(html, /gallery-800x600/)
  assert.match(html, /80 cm \/ C10/)
  assert.match(html, /120 cm \/ C25/)
  assert.match(html, /€45\.00/)
  assert.match(html, /€90\.00/)
  assert.match(html, /PLANT-80/)
  assert.match(html, /Mature height/)
  assert.match(html, /250 cm/)
  assert.match(html, /Palms/)
  assert.match(html, /Drip irrigation/)
  assert.match(html, /planting-service/)
})

test('escapes Portable Text and does not expose preliminary AI suitability as verified status', () => {
  const html = renderPlantProductHtml(plant, 'bg')
  assert.match(html, /Описание &lt;опасно&gt;/)
  assert.match(html, /Нужна е проверка/)
  assert.doesNotMatch(html, /blackSeaCoastRecommendation/)
  assert.doesNotMatch(html, /Подходящо за Черноморието/)
})

test('builds Product and BreadcrumbList JSON-LD from actual plant offers', () => {
  const [productData, breadcrumbs] = buildPlantProductStructuredData(plant, 'en', 'https://florial-bg.com/product/example-plant?lang=en')
  assert.equal(productData['@type'], 'Product')
  assert.equal(productData.name, 'Example plant')
  assert.equal(productData.alternateName, 'Plantus exemplaris')
  assert.equal(productData.offers.lowPrice, '45.00')
  assert.equal(productData.offers.highPrice, '90.00')
  assert.equal(productData.offers.offerCount, 2)
  assert.equal(productData.offers.availability, 'https://schema.org/InStock')
  assert.equal(breadcrumbs['@type'], 'BreadcrumbList')
  assert.equal(breadcrumbs.itemListElement[2].name, 'Palms')
})

test('does not invent price or availability when sale variant data is missing', () => {
  const [productData] = buildPlantProductStructuredData({
    _id: 'without-offer',
    name: 'Plant without offer',
    saleVariants: [{ name: 'Size not priced' }],
  }, 'bg', 'https://florial-bg.com/product/without-offer')
  assert.equal(productData.offers, undefined)
})

test('middleware fetches plant-only product fields and routes plant details through the renderer', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /queryPlantProductDocument\(slug\)/)
  assert.match(middleware, /productType in \["plant", "tree", "shrub"/)
  assert.match(middleware, /translations \{[\s\S]*careGuide[\s\S]*description/)
  assert.match(middleware, /renderPlantProductHtml\(doc as PlantProductDocument, language, SITE_URL\)/)
  assert.match(middleware, /buildPlantProductStructuredData\(doc as PlantProductDocument, language, canonicalUrl\)/)
})
