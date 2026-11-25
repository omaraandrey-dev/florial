import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { renderAboutHtml } from '../functions/_lib/aboutHtml.mjs'

const copy = {
  eyebrow: 'FLORIAL · НЕСЕБЪР, БЪЛГАРИЯ',
  title: 'Градински център Florial в Несебър',
  subtitle: 'Създаваме красиви и хармонични пространства',
  intro: 'Специализираме в ландшафтния дизайн и озеленяването.',
  plantSalesTitle: 'Продажба на растения',
  irrigationEquipmentTitle: 'Професионално оборудване за автоматично напояване',
  approachTitle: 'От идеята до грижата за градината',
  steps: ['Обсъждаме проекта', 'Изготвяме проект', 'Изпълняваме работата', 'Осигуряваме поддръжка'],
  areasTitle: 'Работим по Българското Черноморие',
  areas: 'Несебър, Равда, Слънчев бряг и близките райони.',
  cta: 'Обсъдете проекта си',
  ctaText: 'Разкажете ни за вашата градина.',
}

const photos = [
  { slugValue: 'landshaften-arhitekt', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/landscape-1024x1024.jpg', imageAlt: 'Ландшафтен архитект', imageAltEn: 'Landscape architect', imageAltRu: 'Ландшафтный архитектор' },
  { slugValue: 'gardinar', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/gardener-1024x1024.jpg', imageAlt: 'Градинар', imageAltEn: 'Gardener', imageAltRu: 'Садовник' },
  { slugValue: 'inzhener-polivni-sistemi', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/irrigation-1024x1024.jpg', imageAlt: 'Инженер по поливни системи', imageAltEn: 'Irrigation engineer', imageAltRu: 'Инженер систем полива' },
  { slugValue: 'specialist-trevni-ploshti', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/lawn-867x992.jpg', imageAlt: 'Специалист по тревни площи', imageAltEn: 'Lawn specialist', imageAltRu: 'Специалист по газонам' },
  { slugValue: 'Florial-nesebr', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/nesebr-1872x4056.jpg' },
  { slugValue: 'Florial-ravda', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/ravda-3072x4096.jpg' },
]
const categories = [
  { slugValue: 'rastenia', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/plants/rastenia-1200x896.jpg' },
  { slugValue: 'vsichko-za-polivane', imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/irrigation-category-1254x1254.png' },
]

test('About SSR renders the complete current page structure and owner-confirmed company details', () => {
  const html = renderAboutHtml(copy, { photos, categories }, 'bg')
  assert.match(html, /data-florial-ssr="about"/)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  for (const text of [
    copy.eyebrow, copy.title, copy.subtitle, copy.intro,
    'Продажа на растения', 'Професионално оборудване',
    'Нашият екип', 'Градински център Несебър', 'Градински център Равда',
    '206978288', 'BG206978288', 'Десислав Бараков',
    'BG88STSA93000029605234', 'STSABGSF',
    '+359 876 777 902', 'barakov1971@abv.bg',
    'Черно море', 'Хан Крум', copy.approachTitle, copy.areasTitle, copy.cta,
  ]) assert.ok(html.includes(text), 'About SSR contains: ' + text)

  assert.match(html, /href="\/category\/rastenia"/)
  assert.match(html, /href="\/category\/vsichko-za-polivane"/)
  assert.match(html, /pK8qGHh9b1xoCc4P9/)
  assert.match(html, /3fiLaRgwSLDTH77U6/)
  assert.equal((html.match(/<article class="rounded-3xl border border-\[#E2E7D9\]/g) || []).length, 2)
  assert.equal((html.match(/<li class="flex gap-4 rounded-2xl/g) || []).length, 4)
  assert.equal((html.match(/<img\b/g) || []).length, 8)
  assert.match(html, /srcset="https:\/\/cdn\.sanity\.io/)
  assert.match(html, /alt="Ландшафтен архитект"/)
  assert.match(html, /alt="Градински център Несебър"/)
  assert.match(html, /href="tel:\+359876777902"/)
  assert.match(html, /href="mailto:barakov1971@abv\.bg"/)
})

test('About SSR localizes visible labels, role descriptions, metadata copy and internal links', () => {
  const ru = renderAboutHtml({
    ...copy,
    eyebrow: 'FLORIAL · НЕСЕБР',
    title: 'Садовый центр Florial в Несебре',
    subtitle: 'Создаём красивые и гармоничные пространства',
    intro: 'Ландшафтный дизайн и озеленение.',
    plantSalesTitle: 'Продажа растений',
    irrigationEquipmentTitle: 'Оборудование для автополива',
    approachTitle: 'От идеи до ухода за садом',
    areasTitle: 'Работаем на побережье Болгарии',
    cta: 'Обсудить проект',
    ctaText: 'Расскажите о вашем саде.',
  }, { photos, categories }, 'ru')
  assert.match(ru, /Садовый центр Florial в Несебре/)
  assert.match(ru, /Что мы предлагаем/)
  assert.match(ru, /Наша команда/)
  assert.match(ru, /Садовый центр Несебр/)
  assert.match(ru, /Ландшафтный архитектор/)
  assert.match(ru, /href="\/category\/rastenia\?lang=ru"/)
  assert.match(ru, /href="\/contacts\?lang=ru"/)
  assert.match(ru, /alt="Ландшафтный архитектор"/)
  assert.match(ru, /Открыть на карте/)

  const en = renderAboutHtml({
    ...copy,
    eyebrow: 'FLORIAL · NESSEBAR',
    title: 'Florial Garden Centre in Nessebar',
    subtitle: 'Creating beautiful, balanced outdoor spaces',
    intro: 'Landscape design and planting.',
    plantSalesTitle: 'Plant sales',
    irrigationEquipmentTitle: 'Professional automatic irrigation equipment',
    approachTitle: 'From the first idea to garden care',
    areasTitle: 'Serving Bulgaria’s Black Sea coast',
    cta: 'Discuss your project',
    ctaText: 'Tell us about your garden.',
  }, { photos, categories }, 'en')
  assert.match(en, /Florial Garden Centre in Nessebar/)
  assert.match(en, /What we offer/)
  assert.match(en, /Our team/)
  assert.match(en, /Florial Garden Centre Ravda/)
  assert.match(en, /Landscape architect/)
  assert.match(en, /href="\/category\/rastenia\?lang=en"/)
  assert.match(en, /href="\/contacts\?lang=en"/)
  assert.match(en, /View on Google Maps/)
  assert.match(en, /Company and bank details/)
})

test('About SSR escapes text and rejects non-Sanity image URLs', () => {
  const html = renderAboutHtml({
    ...copy,
    intro: '<script>alert(1)</script>',
    plantSalesTitle: '<img src=x onerror=alert(1)>',
  }, {
    photos: [{ slugValue: 'landshaften-arhitekt', imageUrl: 'javascript:alert(1)', imageAlt: '<svg onload=alert(1)>' }],
    categories: [
      { slugValue: 'rastenia', imageUrl: 'https://example.com/not-sanity.jpg' },
      { slugValue: 'vsichko-za-polivane', imageUrl: 'javascript:alert(1)' },
    ],
  }, 'bg')
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  assert.doesNotMatch(html, /src="javascript:|src="https:\/\/example\.com/)
  assert.match(html, /Фото скоро не появится|Снимката скоро ще бъде добавена/)
  assert.match(html, /Няма изображение|Снимка/)
})

test('About middleware uses published bounded Sanity queries, shared copy, safe fallback caching and AboutPage JSON-LD', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/AboutPage.tsx', import.meta.url), 'utf8')
  const content = await readFile(new URL('../src/content/aboutPageContent.ts', import.meta.url), 'utf8')
  assert.match(middleware, /async function fetchAboutHtml\(language: string\)/)
  assert.match(middleware, /sanity\/production\/about-photos-v1/)
  assert.match(middleware, /sanity\/production\/about-equipment-category-v1/)
  assert.match(middleware, /sanity\/plants\/about-plant-category-v1/)
  assert.match(middleware, /querySanityData<AboutPhotoDocument\[]>\(/)
  assert.match(middleware, /querySanityData<AboutCategoryDocument\[]>\(/)
  assert.match(middleware, /perspective=published/)
  assert.match(middleware, /renderAboutHtml\(copy, \{/)
  assert.match(middleware, /body = about\.html/)
  assert.match(middleware, /about\.complete[\s\S]*?no-store/)
  assert.match(middleware, /'@type': 'AboutPage'/)
  assert.match(middleware, /mainEntity: \{ '@id': SITE_URL \+ '\/#organization' \}/)
  assert.match(page, /import \{ ABOUT_PAGE_CONTENT \} from '\.\.\/content\/aboutPageContent'/)
  assert.match(page, /const copy = ABOUT_PAGE_CONTENT\[/)
  assert.match(content, /seoTitle:/)
  assert.match(content, /seoDescription:/)
  assert.doesNotMatch(page, /const content = \{/)
})

test('About page metadata is shared between the server response and React page', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const metadata = middleware.slice(middleware.indexOf('function staticPageMetadata'), middleware.indexOf('function localizedRouteUrl'))
  assert.match(metadata, /const copy = ABOUT_PAGE_CONTENT\[/)
  assert.match(metadata, /title: copy\.seoTitle/)
  assert.match(metadata, /description: copy\.seoDescription/)
  assert.match(middleware, /alternates = \{[\s\S]*?bg: SITE_URL \+ path[\s\S]*?ru: SITE_URL \+ path \+ '\?lang=ru'[\s\S]*?en: SITE_URL \+ path \+ '\?lang=en'/)
})
