import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEquipmentProductStructuredData,
  getEquipmentProductMetadata,
  renderEquipmentProductHtml,
} from '../functions/_lib/equipmentProductHtml.mjs'

const product = {
  _id: 'product-1',
  _dataset: 'production',
  name: 'Rain Bird 100-HV-9V — електромагнитен клапан',
  slugValue: 'rain-bird-100-hv-9v',
  sku: 'H01040',
  brandName: 'Rain Bird',
  priceEUR: 58.89,
  oldPriceEUR: 64.5,
  vatIncluded: true,
  stockStatus: 'onRequest',
  weightKg: 0.345,
  shortDescription: 'Клапан за автономни контролери с 9 V захранване.',
  seo: {
    h1: 'Rain Bird 100-HV-9V — клапан 1″',
    metaTitle: 'Rain Bird 100-HV-9V | Florial',
    metaDescription: 'Продажба на електромагнитен клапан Rain Bird 100-HV-9V.',
  },
  description: [
    { _key: 'h2', _type: 'block', style: 'h2', children: [{ text: 'Описание на клапана', marks: [] }], markDefs: [] },
    { _key: 'p1', _type: 'block', style: 'normal', children: [{ text: 'Мембранен клапан ', marks: [] }, { text: '9 V DC', marks: ['strong'] }], markDefs: [] },
    { _key: 'link', _type: 'block', style: 'normal', children: [{ text: 'Услуга монтаж', marks: ['service'] }], markDefs: [{ _key: 'service', _type: 'link', href: '/services/montazh-remont-elektromagnitni-klapani' }] },
    { _key: 'list1', _type: 'block', listItem: 'bullet', children: [{ text: 'Работно налягане 1–10 bar', marks: [] }] },
    { _key: 'list2', _type: 'block', listItem: 'bullet', children: [{ text: 'Дебит 0,05–6,82 m³/h', marks: [] }] },
    { _key: 'unsafe', _type: 'block', style: 'normal', children: [{ text: '<script>alert(1)</script>', marks: [] }], markDefs: [] },
  ],
  translations: {
    ru: {
      name: 'Rain Bird 100-HV-9V — электромагнитный клапан',
      shortDescription: 'Клапан для автономных контроллеров с питанием 9 В.',
      formattedDescription: [
        { _key: 'ru-h2', _type: 'block', style: 'h2', children: [{ text: 'Описание клапана', marks: [] }], markDefs: [] },
      ],
      seo: { h1: 'Rain Bird 100-HV-9V — клапан 1″', metaTitle: 'Клапан Rain Bird 100-HV-9V | Florial', metaDescription: 'Продажа клапана Rain Bird.', noIndex: false },
    },
    en: {
      name: 'Rain Bird 100-HV-9V solenoid valve',
      shortDescription: '9 V solenoid valve for battery-powered controllers.',
      formattedDescription: [
        { _key: 'en-h2', _type: 'block', style: 'h2', children: [{ text: 'Valve description', marks: [] }], markDefs: [] },
      ],
      seo: { h1: 'Rain Bird 100-HV-9V valve', metaTitle: 'Rain Bird 100-HV-9V valve | Florial', metaDescription: 'Rain Bird 9 V irrigation valve.', noIndex: false },
    },
  },
  imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/main-1195x896.jpg',
  imageAlt: 'Електромагнитен клапан Rain Bird',
  imageAltEn: 'Rain Bird solenoid valve',
  imageAltRu: 'Электромагнитный клапан Rain Bird',
  galleryImages: [
    { _key: 'g1', url: 'https://cdn.sanity.io/images/bxvcy0qs/production/gallery-800x800.jpg', alt: 'Допълнителен изглед', altEn: 'Additional view', altRu: 'Дополнительный вид' },
  ],
  specifications: [
    { _key: 's1', name: 'Модел', value: '100-HV-9V' },
    { _key: 's2', name: 'Работно налягане', value: '1–10', unit: 'bar', translations: { en: { name: 'Operating pressure', value: '1–10', unit: 'bar' } } },
  ],
  compatibility: ['ESP-BAT-BT1', '9 V DC latching solenoid'],
  manualPDFUrl: 'https://cdn.sanity.io/files/bxvcy0qs/production/manual.pdf',
  catalogPDFUrl: 'https://cdn.sanity.io/files/bxvcy0qs/production/catalog.pdf',
  categoryId: 'valves',
  categoryIds: ['valves'],
  kitComponents: [{
    _key: 'kit1', quantity: 0.56, unit: 'm', note: { bg: 'Отрежете необходимата дължина.', ru: 'Отрежьте нужную длину.', en: 'Cut to the required length.' },
    product: { _id: 'pipe', name: 'Тръба PE', slugValue: 'pe-pipe', isActive: true },
  }],
  relatedProducts: [{
    _id: 'adapter', name: 'Адаптор за клапан', slugValue: 'valve-adapter', sku: 'A-1',
    priceEUR: 9.7, stockStatus: 'inStock',
    imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/adapter-600x600.jpg',
  }],
  relatedContent: [{
    _id: 'service-1', _type: 'service', name: 'Монтаж на клапани',
    slugValue: 'montazh-remont-elektromagnitni-klapani', isActive: true,
    shortDescription: 'Монтаж и ремонт на електромагнитни клапани.',
  }],
}

const categories = [
  { _id: 'root', slugValue: 'vsichko-za-polivane', name: 'Всичко за поливане', translations: { ru: { name: 'Всё для полива' }, en: { name: 'All irrigation equipment' } } },
  { _id: 'valves', slugValue: 'klapani', parentId: 'root', name: 'Клапани', translations: { ru: { name: 'Клапаны' }, en: { name: 'Valves' } } },
]

test('equipment product metadata is localized and uses the Sanity SEO H1/title/description', () => {
  const bg = getEquipmentProductMetadata(product, 'bg')
  const ru = getEquipmentProductMetadata(product, 'ru')
  const en = getEquipmentProductMetadata(product, 'en')
  assert.equal(bg.h1, 'Rain Bird 100-HV-9V — клапан 1″')
  assert.equal(ru.name, 'Rain Bird 100-HV-9V — электромагнитный клапан')
  assert.equal(ru.title, 'Клапан Rain Bird 100-HV-9V | Florial')
  assert.equal(en.h1, 'Rain Bird 100-HV-9V valve')
  assert.equal(bg.noIndex, false)
})

test('BG product page renders product information, responsive gallery, specs and rich description', () => {
  const html = renderEquipmentProductHtml(product, categories, 'bg')
  assert.match(html, /data-florial-ssr="equipment-product-v1"/)
  assert.match(html, /<h1[^>]*>Rain Bird 100-HV-9V — клапан 1″<\/h1>/)
  assert.match(html, /href="\/category\/vsichko-za-polivane"/)
  assert.match(html, /href="\/category\/klapani"/)
  assert.match(html, /Rain Bird solenoid valve|Електромагнитен клапан Rain Bird/)
  assert.match(html, /srcset=/)
  assert.match(html, /SKU: H01040/)
  assert.match(html, /58,89/)
  assert.match(html, /64,50/)
  assert.match(html, /По заявка/)
  assert.match(html, /<h2[^>]*>Технически характеристики<\/h2>/)
  assert.match(html, /Работно налягане/)
  assert.match(html, /<h2[^>]*>Описание<\/h2>/)
  assert.match(html, /<strong>9 V DC<\/strong>/)
  assert.match(html, /href="\/services\/montazh-remont-elektromagnitni-klapani"/)
  assert.match(html, /0,56 m/)
  assert.match(html, /Съвместимост/)
  assert.match(html, /manual\.pdf/)
  assert.match(html, /Адаптор за клапан/)
  assert.match(html, /Монтаж на клапани/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
})

test('RU and EN product pages use localized names, text, stock labels and product links', () => {
  const ru = renderEquipmentProductHtml(product, categories, 'ru')
  const en = renderEquipmentProductHtml(product, categories, 'en')
  assert.match(ru, /Rain Bird 100-HV-9V — клапан 1″/)
  assert.match(ru, /Описание клапана/)
  assert.match(ru, /Клапаны/)
  assert.match(ru, /href="\/category\/klapani\?lang=ru"/)
  assert.match(ru, /По запросу/)
  assert.match(en, /Rain Bird 100-HV-9V valve/)
  assert.match(en, /Valve description/)
  assert.match(en, /Valves/)
  assert.match(en, /href="\/product\/pe-pipe\?lang=en"/)
  assert.match(en, /On request/)
})

test('Product and Offer structured data uses the shared Florial offer builder, factual EUR price, brand and SKU', () => {
  const [productData, breadcrumbData] = buildEquipmentProductStructuredData(
    product, categories, 'bg', 'https://florial-bg.com/product/rain-bird-100-hv-9v',
  )
  assert.equal(productData['@type'], 'Product')
  assert.equal(productData.name, product.name)
  assert.equal(productData.sku, 'H01040')
  assert.deepEqual(productData.brand, { '@type': 'Brand', name: 'Rain Bird' })
  assert.equal(productData.offers.price, '58.89')
  assert.equal(productData.offers.priceCurrency, 'EUR')
  assert.equal(productData.offers.url, 'https://florial-bg.com/product/rain-bird-100-hv-9v')
  assert.equal(productData.offers.availability, undefined)
  assert.equal(breadcrumbData['@type'], 'BreadcrumbList')
  assert.equal(breadcrumbData.itemListElement.at(-1).name, product.name)
  assert.equal(productData.aggregateRating, undefined)
  assert.equal(productData.review, undefined)
})

test('unsafe image and PDF URLs are not emitted into product HTML or Product JSON-LD', () => {
  const unsafe = {
    ...product,
    imageUrl: 'javascript:alert(1)',
    galleryImages: [{ url: 'https://evil.example/image.jpg' }],
    manualPDFUrl: 'https://evil.example/manual.pdf',
    catalogPDFUrl: 'javascript:alert(2)',
  }
  const html = renderEquipmentProductHtml(unsafe, [], 'bg')
  const [productData] = buildEquipmentProductStructuredData(
    unsafe, [], 'bg', 'https://florial-bg.com/product/rain-bird-100-hv-9v',
  )
  assert.doesNotMatch(html, /javascript:/)
  assert.doesNotMatch(html, /evil\.example/)
  assert.deepEqual(productData.image, undefined)
})
