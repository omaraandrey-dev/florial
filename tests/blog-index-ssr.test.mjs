import test from 'node:test'
import assert from 'node:assert/strict'
import {
  blogIndexDirectionIds,
  getBlogIndexMetadata,
  renderBlogIndexHtml,
  serializeBlogIndexPayload,
} from '../functions/_lib/blogIndexHtml.mjs'

const posts = [
  {
    _id: 'post-newest',
    slug: { current: 'kak-raboti-avtomatichnata-polivna-sistema' },
    publishedAt: '2026-11-23T17:30:20.650Z',
    tags: ['Автоматично напояване', 'Поливни системи'],
    cover: {
      asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/newest-1200x800.jpg' },
      alt: 'Поливна система в градина',
    },
    translations: {
      bg: { title: 'Как работи системата за поливане', shortDescription: 'Практическо ръководство.', coverAlt: 'Поливна система' },
      ru: { title: 'Как работает система полива', shortDescription: 'Практическое руководство.', coverAlt: 'Система полива' },
      en: { title: 'How an Irrigation System Works', shortDescription: 'A practical guide.', coverAlt: 'Irrigation system' },
    },
  },
  {
    _id: 'post-landscape',
    slug: 'podroben-landshaften-proekt-gradina',
    publishedAt: '2026-11-17T03:17:29.448Z',
    tags: ['Озеленяване', 'Ландшафтно проектиране', 'Проект'],
    cover: { asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/landscape-900x1200.jpg' }, alt: 'Градина' },
    translations: {
      bg: { title: 'Подробен ландшафтен проект', shortDescription: 'Планове и растения.', coverAlt: 'Ландшафтен проект' },
      ru: { title: 'Подробный ландшафтный проект', shortDescription: 'Планы и растения.', coverAlt: 'Ландшафтный проект' },
      en: { title: 'A Detailed Landscape Project', shortDescription: 'Plans and plants.', coverAlt: 'Landscape project' },
    },
  },
  {
    _id: 'post-untagged',
    slug: { current: 'new-published-post' },
    publishedAt: '2026-10-01T09:00:00.000Z',
    tags: [],
    cover: { asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/other-800x600.jpg' }, alt: 'Garden' },
    translations: {
      bg: { title: 'Нова публикация', shortDescription: 'Ново съдържание.' },
      ru: { title: 'Новая публикация', shortDescription: 'Новый материал.' },
      en: { title: 'A New Publication', shortDescription: 'New content.' },
    },
  },
]

test('BG blog index renders all published cards in source order with four curated directions', () => {
  const rendered = renderBlogIndexHtml({ posts, language: 'bg' })
  assert.match(rendered.body, /data-florial-blog-index="v1"/)
  assert.match(rendered.body, /data-florial-blog-count="3"/)
  assert.match(rendered.body, /<h1[^>]*>Блог и портфолио<\/h1>/)
  assert.match(rendered.body, /Подробен ландшафтен проект/)
  assert.match(rendered.body, /Нова публикация/)
  assert.deepEqual(blogIndexDirectionIds(), ['landscape', 'irrigation', 'lawn', 'planting'])
  assert.equal((rendered.body.match(/data-florial-blog-direction=/g) || []).length, 4)
  const links = [...rendered.body.matchAll(/data-florial-blog-post="([^"]+)"[\s\S]*?<a href="([^"]+)"/g)]
  assert.equal(links.length, 3)
  assert.deepEqual(links.map((match) => match[1]), [
    'kak-raboti-avtomatichnata-polivna-sistema',
    'podroben-landshaften-proekt-gradina',
    'new-published-post',
  ])
  assert.ok(rendered.body.includes('newest-1200x800.jpg'))
  assert.ok(rendered.body.includes('srcset='))
})

test('RU and EN blog index use localized titles, descriptions, dates, image alt and links', () => {
  const ru = renderBlogIndexHtml({ posts, language: 'ru' })
  const en = renderBlogIndexHtml({ posts, language: 'en' })
  assert.match(ru.body, /<h1[^>]*>Блог и портфолио<\/h1>/)
  assert.match(ru.body, /Как работает система полива/)
  assert.match(ru.body, /href="\/blog\/kak-raboti-avtomatichnata-polivna-sistema\?lang=ru"/)
  assert.match(ru.body, /alt="Система полива"/)
  assert.match(en.body, /<h1[^>]*>Blog and portfolio<\/h1>/)
  assert.match(en.body, /How an Irrigation System Works/)
  assert.match(en.body, /href="\/blog\/kak-raboti-avtomatichnata-polivna-sistema\?lang=en"/)
  assert.match(en.body, /alt="Irrigation system"/)
})

test('CollectionPage ItemList and BreadcrumbList exactly represent localized card URLs and order', () => {
  for (const language of ['bg', 'ru', 'en']) {
    const rendered = renderBlogIndexHtml({ posts, language })
    const collection = rendered.structuredData.find((item) => item.id === 'collection-page').data
    const breadcrumb = rendered.structuredData.find((item) => item.id === 'breadcrumbs').data
    assert.equal(collection['@type'], 'CollectionPage')
    assert.equal(collection.mainEntity['@type'], 'ItemList')
    assert.equal(collection.mainEntity.numberOfItems, 3)
    assert.deepEqual(collection.mainEntity.itemListElement.map((item) => item.position), [1, 2, 3])
    assert.deepEqual(collection.mainEntity.itemListElement.map((item) => item.url), [
      'https://florial-bg.com/blog/kak-raboti-avtomatichnata-polivna-sistema' + (language === 'bg' ? '' : '?lang=' + language),
      'https://florial-bg.com/blog/podroben-landshaften-proekt-gradina' + (language === 'bg' ? '' : '?lang=' + language),
      'https://florial-bg.com/blog/new-published-post' + (language === 'bg' ? '' : '?lang=' + language),
    ])
    assert.equal(breadcrumb['@type'], 'BreadcrumbList')
    assert.equal(breadcrumb.itemListElement.length, 2)
  }
})

test('blog metadata keeps canonical and hreflang aligned with current route', () => {
  const metadata = getBlogIndexMetadata('en')
  assert.equal(metadata.canonical, 'https://florial-bg.com/blog?lang=en')
  assert.equal(metadata.alternates.bg, 'https://florial-bg.com/blog')
  assert.equal(metadata.alternates.ru, 'https://florial-bg.com/blog?lang=ru')
  assert.equal(metadata.alternates.en, 'https://florial-bg.com/blog?lang=en')
})

test('SSR escapes untrusted titles and rejects non-Sanity cover image URLs', () => {
  const unsafe = [{
    ...posts[0],
    translations: { bg: { title: '<script>alert(1)</script>', shortDescription: 'Safe text' } },
    cover: { asset: { url: 'javascript:alert(1)' } },
  }]
  const rendered = renderBlogIndexHtml({ posts: unsafe, language: 'bg' })
  assert.ok(!rendered.body.includes('<script>alert(1)</script>'))
  assert.ok(rendered.body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(!rendered.body.includes('javascript:alert(1)'))
  assert.equal(rendered.image, undefined)
})

test('serialized client seed is safe inside a JSON script element', () => {
  const payload = serializeBlogIndexPayload([{
    ...posts[0],
    translations: { bg: { title: '</script><script>alert(1)</script>' } },
  }], 'bg')
  assert.ok(!payload.includes('</script>'))
  const parsed = JSON.parse(payload)
  assert.equal(parsed.language, 'bg')
  assert.equal(parsed.posts[0].translations.bg.title, '</script><script>alert(1)</script>')
})

test('BlogPage consumes same-locale SSR seed and keeps client-side filtering/search implementation', async () => {
  const { readFile } = await import('node:fs/promises')
  const page = await readFile(new URL('../src/pages/BlogPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /readBlogSsrPayload/)
  assert.match(page, /ssrPayload\?\.language === language/)
  assert.match(page, /setLoaded\(true\)/)
  assert.match(page, /setSearchQuery/)
  assert.match(page, /setSelectedCategory/)
  assert.match(page, /setSortOrder/)
})
