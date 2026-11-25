import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getServicesDirectoryMetadata,
  renderServicesDirectoryHtml,
} from '../functions/_lib/servicesDirectoryHtml.mjs'

const services = [
  {
    _id: 'service-lawn',
    name: 'Тревни площи',
    shortDescription: 'Изграждане и поддръжка на тревни площи',
    slug: { current: 'trevni-ploshti' },
    sortOrder: 20,
    serviceCategory: 'lawn',
    imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/lawn-1200x800.jpg',
    translations: {
      ru: { name: 'Газоны', shortDescription: 'Устройство газонов' },
      en: { name: 'Lawns', shortDescription: 'Lawn installation' },
    },
  },
  {
    _id: 'service-landscape',
    name: 'Ландшафтен дизайн',
    slug: { current: 'landshaften-dizain' },
    sortOrder: 10,
    serviceCategory: 'landscaping',
    translations: {
      ru: { name: 'Ландшафтный дизайн' },
      en: { name: 'Landscape design' },
    },
  },
]

const photos = [
  {
    slug: 'landshaften-arhitekt',
    imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/landscape-800x800.jpg',
    imageAlt: 'Ландшафтен архитект',
    imageAltRu: 'Ландшафтный архитектор',
    imageAltEn: 'Landscape architect',
  },
]

test('services directory renders localized H1, intro and all active service cards in sort order', () => {
  const { body, structuredData } = renderServicesDirectoryHtml({
    entries: [
      { kind: 'service', service: services[1], order: 10 },
      { kind: 'service', service: services[0], order: 20 },
    ],
    rolePhotos: photos,
    language: 'ru',
  })

  assert.match(body, /<h1[^>]*>Услуги садового центра Florial/)
  assert.ok(body.indexOf('Ландшафтный дизайн') < body.indexOf('Газоны'))
  assert.match(body, /href="\/services\/landshaften-dizain\?lang=ru"/)
  assert.match(body, /href="\/services\/trevni-ploshti\?lang=ru"/)
  assert.match(body, /Ландшафтный архитектор/)
  assert.equal(structuredData[0].id, 'collection-page')
  assert.equal(structuredData[0].data.mainEntity.itemListElement.length, 2)
})

test('legacy delivery card is included in directory and collection list when supplied by service ordering', () => {
  const { body, structuredData } = renderServicesDirectoryHtml({
    entries: [{ kind: 'delivery', order: 90 }],
    rolePhotos: [],
    language: 'bg',
  })

  assert.match(body, /Доставка на оборудване и консултация с инженер/)
  assert.match(body, /href="\/services\/dostavka-poliv"/)
  assert.equal(structuredData[0].data.mainEntity.itemListElement[0].url, 'https://florial-bg.com/services/dostavka-poliv')
})

test('localized directory metadata contains canonical, hreflang alternates and BreadcrumbList', () => {
  const metadata = getServicesDirectoryMetadata('en')
  assert.equal(metadata.canonical, 'https://florial-bg.com/services?lang=en')
  assert.equal(metadata.alternates.bg, 'https://florial-bg.com/services')
  assert.equal(metadata.alternates.ru, 'https://florial-bg.com/services?lang=ru')
  assert.equal(metadata.structuredData[0].data['@type'], 'BreadcrumbList')
  assert.equal(metadata.structuredData[0].data.itemListElement.length, 2)
})

test('directory escapes content and omits unsafe image URLs', () => {
  const unsafeService = {
    _id: 'unsafe',
    name: '<script>alert(1)</script>',
    slug: { current: 'unsafe' },
    sortOrder: 1,
    imageUrl: 'javascript:alert(1)',
    translations: { en: { name: '<script>alert(1)</script>' } },
  }
  const { body } = renderServicesDirectoryHtml({
    entries: [{ kind: 'service', service: unsafeService, order: 1 }],
    rolePhotos: [],
    language: 'en',
  })
  assert.ok(!body.includes('<script>alert(1)</script>'))
  assert.ok(body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(!body.includes('javascript:alert(1)'))
})
