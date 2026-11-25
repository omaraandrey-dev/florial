import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildServiceDetailStructuredData,
  getServiceDetailMetadata,
  renderServiceDetailHtml,
} from '../functions/_lib/serviceDetailHtml.mjs'

const service = {
  _id: 'service-sample',
  slugValue: 'sample-landscape-service',
  name: 'Ландшафтно озеленяване',
  shortDescription: 'Професионално озеленяване на градини в България.',
  serviceCategory: 'landscaping',
  startingPriceEUR: 120,
  imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/hero-1200x800.jpg',
  imageAlt: 'Озеленена градина',
  hero: {
    title: 'Професионално озеленяване на градини',
    subtitle: 'От проекта до засаждането.',
    imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/hero-1200x800.jpg',
    imageAlt: 'Професионално озеленена градина',
  },
  seo: {
    metaTitle: 'Озеленяване на градини в Несебър | Florial',
    metaDescription: 'Професионално озеленяване, подбор и засаждане на растения в Несебър и региона.',
  },
  description: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', text: 'Създаваме хармонични градини с подходящи растения.' }],
    },
    {
      _type: 'block',
      _key: 'design',
      style: 'h2',
      markDefs: [],
      children: [{ _type: 'span', text: 'Проектиране и разделяне на поливни зони' }],
    },
    {
      _type: 'block',
      _key: 'detail',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: 'category-link', href: '/category/rastenia' }],
      children: [
        { _type: 'span', text: 'Избираме растенията с внимание: ' },
        { _type: 'span', text: 'разгледайте каталога', marks: ['category-link'] },
      ],
    },
    {
      _type: 'block',
      _key: 'list',
      style: 'normal',
      listItem: 'bullet',
      markDefs: [],
      children: [{ _type: 'span', text: 'Подготовка на терена' }],
    },
  ],
  contentBlocks: [
    {
      _key: 'design-gallery',
      title: '__gallery:design',
      imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/design-900x600.jpg',
      imageAlt: 'Проект на градина',
    },
  ],
  galleryImages: [],
  relatedContent: [
    {
      _id: 'related-1',
      _type: 'service',
      name: 'Посадка на растения',
      slug: { current: 'zasazhdane-na-rasteniya' },
      isActive: true,
      shortDescription: 'Професионално засаждане.',
    },
  ],
  translations: {
    ru: {
      name: 'Ландшафтное озеленение',
      shortDescription: 'Профессиональное озеленение садов в Болгарии.',
      hero: { title: 'Профессиональное озеленение садов', subtitle: 'От проекта до посадки.' },
      description: 'Мы создаём гармоничные сады с подходящими растениями.\n\n## Проектирование сада\n\nВыберите [растения в каталоге](/category/rastenia) и согласуйте план работ.',
      seo: {
        metaTitle: 'Озеленение садов в Несебре | Florial',
        metaDescription: 'Профессиональное озеленение, подбор и посадка растений в Несебре и регионе.',
      },
    },
    en: {
      name: 'Landscape planting',
      shortDescription: 'Professional garden planting in Bulgaria.',
      hero: { title: 'Professional garden planting', subtitle: 'From the plan to planting.' },
      description: 'We create balanced gardens with carefully selected plants.\n\n## Garden planning\n\nBrowse [plants in our catalogue](/category/rastenia) and discuss the project.',
      seo: {
        metaTitle: 'Garden planting in Nessebar | Florial',
        metaDescription: 'Professional garden planting and plant selection in Nessebar and the surrounding area.',
      },
    },
  },
}

test('BG service HTML contains the full Portable Text structure, internal links and inline gallery', () => {
  const html = renderServiceDetailHtml(service, 'bg')
  assert.match(html, /data-florial-service-detail="true"/)
  assert.match(html, /<h1[^>]*>Професионално озеленяване на градини<\/h1>/)
  assert.match(html, /<h2[^>]*>Проектиране и разделяне на поливни зони<\/h2>/)
  assert.match(html, /href="\/category\/rastenia"/)
  assert.match(html, /<ul[^>]*><li>Подготовка на терена<\/li><\/ul>/)
  assert.match(html, /design-900x600\.jpg/)
  assert.ok(html.indexOf('Проектиране и разделяне на поливни зони') < html.indexOf('design-900x600.jpg'))
})

test('RU and EN service HTML use localized hero, Markdown headings and localized internal links', () => {
  const ru = renderServiceDetailHtml(service, 'ru')
  const en = renderServiceDetailHtml(service, 'en')
  assert.match(ru, /<h1[^>]*>Профессиональное озеленение садов<\/h1>/)
  assert.match(ru, /<h2[^>]*>Проектирование сада<\/h2>/)
  assert.match(ru, /href="\/category\/rastenia\?lang=ru"/)
  assert.match(en, /<h1[^>]*>Professional garden planting<\/h1>/)
  assert.match(en, /<h2[^>]*>Garden planning<\/h2>/)
  assert.match(en, /href="\/category\/rastenia\?lang=en"/)
})

test('service metadata exposes canonical and only SEO-complete localized alternates', () => {
  const metadata = getServiceDetailMetadata(service, 'ru')
  assert.equal(metadata.canonical, 'https://florial-bg.com/services/sample-landscape-service')
  assert.equal(metadata.title, 'Озеленение садов в Несебре | Florial')
  assert.equal(metadata.description, 'Профессиональное озеленение, подбор и посадка растений в Несебре и регионе.')
  assert.equal(metadata.alternates.bg, 'https://florial-bg.com/services/sample-landscape-service')
  assert.equal(metadata.alternates.ru, 'https://florial-bg.com/services/sample-landscape-service?lang=ru')
  assert.equal(metadata.alternates.en, 'https://florial-bg.com/services/sample-landscape-service?lang=en')
})

test('Service and BreadcrumbList JSON-LD use localized URL, provider and confirmed service areas', () => {
  const structured = buildServiceDetailStructuredData(service, 'en')
  const serviceNode = structured.find((entry) => entry.id === 'service').data
  const breadcrumb = structured.find((entry) => entry.id === 'breadcrumbs').data
  assert.equal(serviceNode['@type'], 'Service')
  assert.equal(serviceNode.name, 'Landscape planting')
  assert.equal(serviceNode.url, 'https://florial-bg.com/services/sample-landscape-service?lang=en')
  assert.equal(serviceNode.provider['@id'], 'https://florial-bg.com/#organization')
  assert.deepEqual(serviceNode.areaServed.map((place) => place.name), ['Nessebar', 'Ravda', 'Sunny Beach', 'Sveti Vlas', 'Aheloy', 'Pomorie'])
  assert.equal(breadcrumb['@type'], 'BreadcrumbList')
  assert.equal(breadcrumb.itemListElement.at(-1).name, 'Landscape planting')
})

test('SSR escapes untrusted content, rejects unsafe links and never submits a real lead', () => {
  const unsafe = {
    ...service,
    name: '<script>alert(1)</script>',
    hero: { title: '<script>alert(1)</script>' },
    description: [{
      _type: 'block',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: 'bad', href: 'javascript:alert(1)' }],
      children: [{ _type: 'span', text: 'unsafe link', marks: ['bad'] }],
    }],
    leadForm: { title: 'Contact', fields: [{ name: 'phone', type: 'tel' }] },
  }
  const html = renderServiceDetailHtml(unsafe, 'bg')
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(!html.includes('javascript:alert(1)'))
  assert.ok(!html.includes('/api/service-leads'))
  assert.match(html, /href="\/contacts"/)
})
