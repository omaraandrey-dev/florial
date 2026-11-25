import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  renderEquipmentCategoryNavigation,
  renderEquipmentCategorySeoContent,
  renderEquipmentCategoryHelpBlock,
} from '../functions/_lib/equipmentCategoryPageHtml.mjs'

const categories = [
  { _id: 'root', slugValue: 'vsichko-za-polivane', name: 'Всичко за поливане', productCount: 0 },
  { _id: 'controllers', slugValue: 'controllers', parentId: 'root', name: 'Контролери', sortOrder: 10, productCount: 1, translations: { ru: { name: 'Контроллеры' }, en: { name: 'Controllers' } }, imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/controllers-800x800.jpg', imageAlt: 'Контролери за поливане', imageAltEn: 'Irrigation controllers' },
  { _id: 'kits', slugValue: 'gotovi-komplekti-za-polivane', parentId: 'root', name: 'Готови комплекти', sortOrder: 90, productCount: 1 },
  { _id: 'sprinklers', slugValue: 'sprinklers', parentId: 'root', name: 'Разпръсквачи', sortOrder: 11, productCount: 1 },
  { _id: 'controllers-indoor', slugValue: 'kontroleri-vatreshen-montazh', parentId: 'controllers', name: 'Контролери вътрешен монтаж', sortOrder: 2, productCount: 1, translations: { ru: { name: 'Контроллеры для помещений' } } },
  { _id: 'controllers-outdoor', slugValue: 'kontroleri-vanshen-montazh', parentId: 'controllers', name: 'Контролери външен монтаж', sortOrder: 1, productCount: 1 },
  { _id: 'empty', slugValue: 'empty-category', parentId: 'root', name: 'Празна категория', sortOrder: 12, productCount: 0 },
  { _id: 'legacy-valves', slugValue: 'electromagnetic-valves', parentId: 'root', name: 'Стара категория клапани', sortOrder: 13, productCount: 1 },
]

test('root equipment navigation follows the established ten-category sales priority', () => {
  const html = renderEquipmentCategoryNavigation(categories, 'root', 'bg', undefined, { rootCatalog: true })
  const links = [...html.matchAll(/href="([^"]*\/category\/[^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(links.map((href) => href.split('/category/')[1]), [
    'gotovi-komplekti-za-polivane',
    'controllers',
    'sprinklers',
  ])
  assert.match(html, /data-florial-category-subcategories="true"/)
  assert.match(html, /<h2[^>]*>Контролери<\/h2>/)
})

test('navigation mirrors the storefront visibility rules for empty categories and the excluded legacy valves category', () => {
  const html = renderEquipmentCategoryNavigation(categories, 'root', 'bg', undefined, { rootCatalog: true })
  assert.match(html, /gotovi-komplekti-za-polivane/)
  assert.match(html, /controllers/)
  assert.match(html, /sprinklers/)
  assert.doesNotMatch(html, /empty-category/)
  assert.doesNotMatch(html, /electromagnetic-valves/)
})

test('nested category navigation includes only direct children, never sibling or ancestor categories', () => {
  const html = renderEquipmentCategoryNavigation(categories, 'controllers', 'ru')
  assert.match(html, /Контроллеры для помещений/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/category\/kontroleri-vanshen-montazh\?lang=ru"/)
  assert.doesNotMatch(html, /href="[^"]*\/category\/sprinklers/)
  assert.doesNotMatch(html, /href="[^"]*\/category\/controllers"/)
})

test('category cards use localized image ALT text and responsive Sanity CDN image sizing', () => {
  const html = renderEquipmentCategoryNavigation(categories, 'root', 'en', undefined, { rootCatalog: true })
  assert.match(html, /src="https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/production\/controllers-800x800\.jpg\?w=160&amp;h=160&amp;fit=crop&amp;auto=format&amp;q=65"/)
  assert.match(html, /alt="Irrigation controllers"/)
})

test('category SEO Portable Text renders headings, marks, lists and localized safe internal links', () => {
  const category = {
    seoContent: [
      { _type: 'block', style: 'h2', children: [{ text: 'Как да изберем', marks: [] }] },
    ],
    translations: {
      ru: {
        seoContent: [
          { _type: 'block', style: 'h2', children: [{ text: 'Как выбрать', marks: [] }] },
          {
            _type: 'block',
            style: 'normal',
            markDefs: [{ _key: 'serviceLink', _type: 'link', href: '/services/avtomatichno-napoyavane' }],
            children: [
              { text: 'Подбор ', marks: ['strong'] },
              { text: 'системы', marks: ['serviceLink', 'em'] },
            ],
          },
          { _type: 'block', listItem: 'bullet', children: [{ text: 'Первый пункт', marks: [] }] },
          { _type: 'block', listItem: 'bullet', children: [{ text: 'Второй пункт', marks: [] }] },
          { _type: 'block', style: 'h3', children: [{ text: '<опасный текст>', marks: [] }] },
        ],
      },
    },
  }
  const html = renderEquipmentCategorySeoContent(category, 'ru')
  assert.match(html, /data-florial-category-seo-content="true"/)
  assert.match(html, /data-block-count="5"/)
  assert.match(html, /<h2>Как выбрать<\/h2>/)
  assert.match(html, /<strong>Подбор <\/strong>/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/services\/avtomatichno-napoyavane\?lang=ru"/)
  assert.match(html, /<ul><li>Первый пункт<\/li><li>Второй пункт<\/li><\/ul>/)
  assert.match(html, /<h3>&lt;опасный текст&gt;<\/h3>/)
  assert.doesNotMatch(html, /javascript:/)
})

test('unsafe Portable Text links are rendered as text without an unsafe anchor', () => {
  const category = {
    seoContent: [{
      _type: 'block',
      markDefs: [{ _key: 'bad', _type: 'link', href: 'javascript:alert(1)' }],
      children: [{ text: 'опасная ссылка', marks: ['bad'] }],
    }],
  }
  const html = renderEquipmentCategorySeoContent(category, 'bg')
  assert.match(html, /опасная ссылка/)
  assert.doesNotMatch(html, /<a\b/)
})

test('equipment help block renders localized copy and the configured service route', () => {
  const category = {
    helpBlock: {
      title: 'Помощ за поливане',
      text: 'Избор на оборудване.',
      buttonLabel: 'Монтаж',
      buttonUrl: '/services/avtomatichno-napoyavane',
      translations: {
        ru: {
          title: 'Помощь с автополивом',
          text: 'Подбор и монтаж системы.',
          buttonLabel: 'Установка автополива',
        },
      },
    },
  }
  const html = renderEquipmentCategoryHelpBlock(category, 'ru')
  assert.match(html, /data-florial-category-help="true"/)
  assert.match(html, /Помощь с автополивом/)
  assert.match(html, /Подбор и монтаж системы/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/services\/avtomatichno-napoyavane\?lang=ru"/)
  assert.match(html, /Установка автополива/)
})

test('equipment help block rejects external destinations and uses the established irrigation service fallback', () => {
  const html = renderEquipmentCategoryHelpBlock({
    helpBlock: { title: 'Help', text: 'Choose equipment', buttonUrl: 'https://example.com/lead' },
  }, 'en')
  assert.match(html, /href="https:\/\/florial-bg\.com\/services\/avtomatichno-napoyavane\?lang=en"/)
  assert.doesNotMatch(html, /example\.com/)
})

test('middleware requests category SEO/help fields and emits all equipment category sections only on successful catalogue data', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /renderEquipmentCategoryNavigation/)
  assert.match(middleware, /renderEquipmentCategorySeoContent/)
  assert.match(middleware, /renderEquipmentCategoryHelpBlock/)
  assert.match(middleware, /seoContent,helpBlock,translations/)
  assert.match(middleware, /category-tree-v3/)
  assert.match(middleware, /category-document-v2/)
  assert.match(middleware, /category-products-v2/)
  assert.match(middleware, /renderEquipmentCategoryListing\(equipmentProducts, language, SITE_URL, \{ rootCatalog, categories: equipmentCategoryTree \|\| \[\] \}\)/)
  assert.match(middleware, /categoryNavigation \+[\s\S]*categorySeoContent \+ categoryHelpBlock/)
  assert.match(middleware, /renderPlantCategoryListing\(plantProducts \|\| \[\], language, SITE_URL\)/)
})
