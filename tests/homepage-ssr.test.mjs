import test from 'node:test'
import assert from 'node:assert/strict'
import { renderHomepageHtml, homepageSelectionForTest } from '../functions/_lib/homepageHtml.mjs'
import { readFile } from 'node:fs/promises'

const plantCategories = [
  { _id: 'plants-flowers', name: 'Цветя', slug: { current: 'cvetya' } },
  { _id: 'plants-root', name: 'Растения', slug: { current: 'rastenia' } },
  { _id: 'plants-palms', name: 'Палми', slug: { current: 'palmi' } },
  { _id: 'plants-olives', name: 'Маслини', slug: { current: 'maslini' } },
  { _id: 'plants-trees-shrubs', name: 'Дървета', slug: { current: 'darveta' } },
  { _id: 'plants-solitaires', name: 'Солитери', slug: { current: 'soliteri' } },
]

const equipmentCategories = [
  { _id: 'c-root', name: 'Всичко за поливане', slug: { current: 'vsichko-za-polivane' }, productCount: 10 },
  { _id: 'c-kits', name: 'Комплекти', slug: { current: 'gotovi-komplekti-za-polivane' }, productCount: 5 },
  { _id: 'c-controllers', name: 'Контролери', slug: { current: 'controllers' }, productCount: 4, parentId: 'c-root' },
  { _id: 'c-sprinklers', name: 'Дъждовалци', slug: { current: 'sprinklers' }, productCount: 4, parentId: 'c-root' },
  { _id: 'c-nozzles', name: 'Дюзи', slug: { current: 'nozzles' }, productCount: 3, parentId: 'c-root' },
  { _id: 'c-valves', name: 'Клапани', slug: { current: 'klapani' }, productCount: 2, parentId: 'c-root' },
  { _id: 'c-shahti', name: 'Шахти', slug: { current: 'shahti' }, productCount: 1, parentId: 'c-root' },
  { _id: 'c-drip', name: 'Капково', slug: { current: 'kapkovo-napoyavane' }, productCount: 1, parentId: 'c-root' },
  { _id: 'c-empty', name: 'Празна категория', slug: { current: 'empty' }, productCount: 0, parentId: 'c-root' },
]

const featuredPlants = [
  { _id: 'p1', name: 'Маслина', slug: { current: 'maslina' }, priceEUR: 50, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/plant.jpg', translations: { ru: { name: 'Олива' } } },
  { _id: 'p2', name: 'Палма', slug: { current: 'palma' }, priceEUR: 80, stockStatus: 'onRequest', imageUrl: 'https://cdn.sanity.io/palm.jpg' },
  { _id: 'p3', name: 'Изчерпано', slug: { current: 'out' }, priceEUR: 30, stockStatus: 'outOfStock', imageUrl: 'https://cdn.sanity.io/out.jpg' },
  { _id: 'p4', name: 'Без цена', slug: { current: 'no-price' }, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/no-price.jpg' },
]

const featuredEquipment = [
  { _id: 'e1', name: 'Комплект 1', slug: { current: 'kit-one' }, priceEUR: 10, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/one.jpg' },
  { _id: 'e2', name: 'Комплект 5x5', slug: { current: 'komplekt-polivane-5x5' }, priceEUR: 12, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/two.jpg' },
  { _id: 'e3', name: 'Комплект 2', slug: { current: 'kit-two' }, priceEUR: 15, stockStatus: 'onRequest', imageUrl: 'https://cdn.sanity.io/three.jpg' },
  { _id: 'e4', name: 'Комплект 6 зони', slug: { current: 'komplekt-avtomatizatsiya-6-zoni' }, priceEUR: 20, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/four.jpg' },
  { _id: 'e5', name: 'Комплект 3', slug: { current: 'kit-three' }, priceEUR: 25, stockStatus: 'inStock', imageUrl: 'https://cdn.sanity.io/five.jpg' },
]

const data = {
  equipmentCategories,
  plantCategories,
  featuredPlants,
  featuredEquipment,
  serviceEntries: [
    { kind: 'delivery' },
    { kind: 'service', service: { _id: 's1', name: 'Монтаж на полив', slug: { current: 'montazh-poliv' }, serviceCategory: 'irrigation', translations: { ru: { name: 'Монтаж полива', shortDescription: 'Установка системы' } } } },
  ],
  heroImageUrl: 'https://cdn.sanity.io/hero.jpg',
  pinnedPosts: [
    { _id: 'b1', slug: { current: 'podroben-landshaften-proekt-gradina' }, publishedAt: '2026-11-01T00:00:00Z', translations: { ru: { title: 'Ландшафтный проект', shortDescription: 'Проект сада' } } },
    { _id: 'b2', slug: { current: 'cena-sistema-avtomatichno-napoyavane-burgas' }, publishedAt: '2026-11-02T00:00:00Z', translations: { ru: { title: 'Цена автополива', shortDescription: 'Стоимость системы' } } },
  ],
  latestPosts: [
    { _id: 'b2', slug: { current: 'cena-sistema-avtomatichno-napoyavane-burgas' }, translations: { ru: { title: 'Цена автополива' } } },
    { _id: 'b3', slug: { current: 'latest-story' }, publishedAt: '2026-11-03T00:00:00Z', translations: { ru: { title: 'Новая статья', shortDescription: 'Описание статьи' } } },
  ],
}

test('homepage SSR preserves curated category and product selection order', () => {
  const selection = homepageSelectionForTest(data)
  assert.deepEqual(selection.plantCategories, [
    'plants-root', 'plants-palms', 'plants-olives', 'plants-trees-shrubs', 'plants-solitaires', 'plants-flowers',
  ])
  assert.deepEqual(selection.equipmentCategories, [
    'vsichko-za-polivane', 'gotovi-komplekti-za-polivane', 'controllers', 'sprinklers', 'nozzles', 'klapani',
  ])
  assert.deepEqual(selection.plants, ['maslina', 'palma'])
  assert.deepEqual(selection.equipment, ['kit-one', 'kit-two', 'kit-three', 'komplekt-avtomatizatsiya-6-zoni'])
})

test('homepage SSR returns localized semantic content and crawlable product/category/article links', () => {
  const html = renderHomepageHtml(data, 'ru')
  assert.match(html, /data-florial-ssr-homepage="v1"/)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.match(html, /Садовый центр Florial/)
  assert.match(html, /href="\/category\/rastenia\?lang=ru"/)
  assert.match(html, /href="\/product\/maslina\?lang=ru"/)
  assert.match(html, /href="\/services\/montazh-poliv\?lang=ru"/)
  assert.match(html, /href="\/blog\/latest-story\?lang=ru"/)
  assert.match(html, /Олива/)
  assert.match(html, /Ландшафтный проект/)
  assert.doesNotMatch(html, /Празна категория/)
})

test('homepage SSR keeps variant-aware plant prices, stock labels and pinned blog order', () => {
  const html = renderHomepageHtml({
    ...data,
    featuredPlants: [
      { _id: 'p-variant', name: 'Цитрус', slug: { current: 'citrus' }, saleVariants: [
        { priceEUR: 30, stockStatus: 'outOfStock' },
        { priceEUR: 42, stockStatus: 'onRequest' },
        { priceEUR: 45, stockStatus: 'inStock' },
      ], imageUrl: 'https://cdn.sanity.io/citrus.jpg' },
    ],
  }, 'bg')
  assert.match(html, /Цена от 42\.00 €/)
  assert.match(html, /По заявка/)
  assert.ok(html.indexOf('podroben-landshaften-proekt-gradina') < html.indexOf('cena-sistema-avtomatichno-napoyavane-burgas'))
  assert.ok(html.indexOf('cena-sistema-avtomatichno-napoyavane-burgas') < html.indexOf('latest-story'))
})

test('homepage SSR escapes untrusted Sanity text and rejects non-HTTPS image URLs', () => {
  const html = renderHomepageHtml({
    ...data,
    plantCategories: [{ _id: 'plants-root', name: '<script>alert(1)</script>', slug: { current: 'rastenia' }, imageUrl: 'javascript:alert(1)' }],
    featuredPlants: [{ _id: 'p-x', name: '<img src=x onerror=alert(1)>', slug: { current: 'unsafe' }, priceEUR: 5, stockStatus: 'inStock', imageUrl: 'javascript:alert(1)' }],
  }, 'en')
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html, /src="javascript:/)
})


test('homepage middleware uses bounded published Sanity projections and keeps fallback uncached', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /async function fetchHomepageHtml\(language: string\)/)
  assert.match(middleware, /querySanityData<any\[]>\('plants', featuredPlantsQuery/)
  assert.match(middleware, /querySanityData<any\[]>\('production', featuredEquipmentQuery/)
  assert.match(middleware, /querySanityData<any\[]>\('production', pinnedQuery/)
  assert.match(middleware, /getOrderedServiceEntries\(services as any\[\]\)/)
  assert.match(middleware, /renderHomepageHtml\(\{/)
  assert.match(middleware, /cacheControl = 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'/)
  assert.match(middleware, /cacheControl = 'no-store'/)
})

test('homepage SSR renderer keeps cart route out of index while homepage remains indexable', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const homepageBranch = middleware.slice(
    middleware.indexOf("if (path === '/' || path === '/contacts' || path === '/about')"),
    middleware.indexOf("if (path === '/cart' || path === '/search')"),
  )
  const cartBranch = middleware.slice(
    middleware.indexOf("if (path === '/cart' || path === '/search')"),
    middleware.indexOf('// Specialist landing pages'),
  )
  assert.doesNotMatch(homepageBranch, /noIndex:\s*true/)
  assert.match(cartBranch, /noIndex:\s*true/)
})
