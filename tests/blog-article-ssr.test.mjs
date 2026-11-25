import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBlogArticleStructuredData,
  getBlogArticleMetadata,
  renderBlogArticleHtml,
  serializeBlogArticlePayload,
} from '../functions/_lib/blogArticleHtml.mjs'

const post = {
  _id: 'post-1',
  slug: { current: 'landshaften-proekt-nesebar' },
  publishedAt: '2026-11-23T17:30:20.650Z',
  _updatedAt: '2026-11-24T09:00:00.000Z',
  tags: ['Ландшафтно проектиране', 'Проект'],
  cover: {
    asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/cover-1200x800.jpg' },
    alt: 'Градина',
    caption: 'Завършен проект',
  },
  gallery: [{
    asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/gallery-1200x800.jpg' },
    alt: 'Озеленена градина',
    altRu: 'Озеленённый сад',
    altEn: 'Landscaped garden',
    caption: 'Растителни композиции',
  }],
  translations: {
    bg: {
      title: 'Ландшафтен проект в Несебър',
      shortDescription: 'Проектиране и озеленяване на градина.',
      seoTitle: 'Ландшафтен проект Несебър | Florial',
      seoDescription: 'Реализиран ландшафтен проект в Несебър.',
      coverAlt: 'Ландшафтен проект в Несебър',
      body: [
        { _key: 'h2', _type: 'block', style: 'h2', children: [{ text: 'Етапи на проекта', marks: [] }], markDefs: [] },
        { _key: 'p1', _type: 'block', style: 'normal', children: [{ text: 'Първи етап ', marks: [] }, { text: 'проектиране', marks: ['strong'] }], markDefs: [] },
        { _key: 'link', _type: 'block', style: 'normal', children: [{ text: 'Вижте услугата', marks: ['link1'] }], markDefs: [{ _key: 'link1', _type: 'link', href: '/services/landshaften-dizain', blank: false }] },
        { _key: 'image1', _type: 'image', assetUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/inline-800x600.jpg', alt: 'План на градината', caption: 'План' },
        { _key: 'quote', _type: 'block', style: 'blockquote', children: [{ text: 'Индивидуално решение', marks: [] }], markDefs: [] },
        { _key: 'video', _type: 'youtubeEmbed', url: 'https://youtu.be/abcdefghijk', title: 'Проектно видео', caption: 'Видео' },
        { _key: 'unsafe', _type: 'block', style: 'normal', children: [{ text: '<script>alert(1)</script>', marks: [] }], markDefs: [] },
        { _key: 'cta', _type: 'block', style: 'normal', children: [{ text: 'Свържете се с нас на +359 876 777 902', marks: [] }], markDefs: [] },
      ],
    },
    ru: {
      title: 'Ландшафтный проект в Несебре',
      shortDescription: 'Проектирование и озеленение сада.',
      seoTitle: 'Ландшафтный проект в Несебре | Florial',
      seoDescription: 'Реализованный ландшафтный проект.',
      coverAlt: 'Ландшафтный проект в Несебре',
      body: [
        { _key: 'ru-h2', _type: 'block', style: 'h2', children: [{ text: 'Этапы проекта', marks: [] }], markDefs: [] },
      ],
    },
    en: {
      title: 'Landscape Design Project in Nessebar',
      shortDescription: 'Garden design and landscaping.',
      seoTitle: 'Landscape Design Project in Nessebar | Florial',
      seoDescription: 'A completed landscape design project.',
      coverAlt: 'Landscape design project in Nessebar',
      body: [],
    },
  },
}

const related = [{
  _id: 'post-2',
  slug: 'landshaften-proekt-zima-burgas',
  publishedAt: '2026-11-17T03:17:29.448Z',
  cover: { asset: { url: 'https://cdn.sanity.io/images/bxvcy0qs/production/related-900x600.jpg' }, alt: 'Зимна градина' },
  translations: {
    bg: { title: 'Зимен ландшафтен проект', shortDescription: 'Зимно планиране.', coverAlt: 'Зимна градина' },
    ru: { title: 'Зимний ландшафтный проект', shortDescription: 'Зимнее планирование.', coverAlt: 'Зимний сад' },
    en: { title: 'Winter Landscape Project', shortDescription: 'Winter planning.', coverAlt: 'Winter garden' },
  },
}]

test('BG article renders full Portable Text content, headings, marks, links, images, video and gallery', () => {
  const rendered = renderBlogArticleHtml({ post, relatedPosts: related, language: 'bg' })
  assert.match(rendered.body, /data-florial-blog-article="v1"/)
  assert.match(rendered.body, /data-florial-blog-slug="landshaften-proekt-nesebar"/)
  assert.match(rendered.body, /<h1[^>]*>Ландшафтен проект в Несебър<\/h1>/)
  assert.match(rendered.body, /<h2[^>]*>Етапи на проекта<\/h2>/)
  assert.match(rendered.body, /<strong>проектиране<\/strong>/)
  assert.match(rendered.body, /href="\/services\/landshaften-dizain"/)
  assert.match(rendered.body, /data-florial-blog-inline-image="image1"/)
  assert.match(rendered.body, /youtube-nocookie\.com\/embed\/abcdefghijk/)
  assert.match(rendered.body, /data-florial-blog-gallery="true"/)
  assert.match(rendered.body, /data-florial-blog-related="landshaften-proekt-zima-burgas"/)
  assert.ok(!rendered.body.includes('+359 876 777 902'))
  assert.ok(!rendered.body.includes('<script>alert(1)</script>'))
  assert.ok(rendered.body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.match(rendered.body, /srcset=/)
  assert.equal(rendered.image, post.cover.asset.url)
})

test('RU and EN use localized title, body, cover/gallery ALT and internal language links', () => {
  const ru = renderBlogArticleHtml({ post, relatedPosts: related, language: 'ru' })
  const en = renderBlogArticleHtml({ post, relatedPosts: related, language: 'en' })
  assert.match(ru.body, /Ландшафтный проект в Несебре/)
  assert.match(ru.body, /Этапы проекта/)
  assert.match(ru.body, /alt="Озеленённый сад"/)
  assert.match(ru.body, /href="\/blog\/landshaften-proekt-zima-burgas\?lang=ru"/)
  assert.match(en.body, /Landscape Design Project in Nessebar/)
  assert.match(en.body, /Етапи на проекта/)
  assert.match(en.body, /alt="Landscaped garden"/)
  assert.match(en.body, /href="\/blog\/landshaften-proekt-zima-burgas\?lang=en"/)
})

test('missing localized body follows the same BG fallback as the client blogTranslation helper', () => {
  const rendered = renderBlogArticleHtml({ post, relatedPosts: [], language: 'en' })
  assert.match(rendered.body, /Етапи на проекта/)
  assert.match(rendered.body, /Първи етап/)
})

test('metadata and BlogPosting/BreadcrumbList match localized canonical article URLs', () => {
  for (const language of ['bg', 'ru', 'en']) {
    const metadata = getBlogArticleMetadata(post, language)
    assert.equal(metadata.canonical, 'https://florial-bg.com/blog/landshaften-proekt-nesebar' + (language === 'bg' ? '' : '?lang=' + language))
    assert.equal(metadata.alternates.bg, 'https://florial-bg.com/blog/landshaften-proekt-nesebar')
    assert.equal(metadata.alternates.ru, 'https://florial-bg.com/blog/landshaften-proekt-nesebar?lang=ru')
    assert.equal(metadata.alternates.en, 'https://florial-bg.com/blog/landshaften-proekt-nesebar?lang=en')
    const [article, breadcrumb] = buildBlogArticleStructuredData(post, language)
    assert.equal(article.data['@type'], 'BlogPosting')
    assert.equal(article.data.inLanguage, language)
    assert.equal(article.data.datePublished, post.publishedAt)
    assert.equal(article.data.dateModified, post._updatedAt)
    assert.equal(breadcrumb.data['@type'], 'BreadcrumbList')
    assert.equal(breadcrumb.data.itemListElement.length, 3)
  }
})

test('untrusted URLs and non-Sanity image hosts are rejected', () => {
  const unsafe = {
    ...post,
    cover: { asset: { url: 'https://evil.example/cover.jpg' } },
    translations: {
      bg: {
        title: '<img src=x onerror=alert(1)>',
        shortDescription: 'Safe',
        body: [
          { _type: 'block', style: 'normal', children: [{ text: 'unsafe link', marks: ['bad'] }], markDefs: [{ _key: 'bad', _type: 'link', href: 'javascript:alert(1)' }] },
          { _type: 'image', assetUrl: 'https://evil.example/x.jpg', alt: 'bad' },
        ],
      },
    },
  }
  const rendered = renderBlogArticleHtml({ post: unsafe, language: 'bg' })
  assert.ok(!rendered.body.includes('<img src=x onerror=alert(1)>'))
  assert.ok(rendered.body.includes('&lt;img src=x onerror=alert(1)&gt;'))
  assert.ok(!rendered.body.includes('javascript:alert(1)'))
  assert.ok(!rendered.body.includes('evil.example'))
  assert.equal(rendered.image, undefined)
})

test('serialized article seed cannot break out of the JSON script element', () => {
  const payload = serializeBlogArticlePayload({
    ...post,
    translations: { bg: { title: '</script><script>alert(1)</script>' } },
  }, related, 'bg')
  assert.ok(!payload.includes('</script>'))
  const parsed = JSON.parse(payload)
  assert.equal(parsed.language, 'bg')
  assert.equal(parsed.slug, 'landshaften-proekt-nesebar')
  assert.equal(parsed.post.translations.bg.title, '</script><script>alert(1)</script>')
  assert.equal(parsed.relatedPosts.length, 1)
})

test('article renderer mirrors the existing client contact CTA, video and image behavior', async () => {
  const { readFile } = await import('node:fs/promises')
  const client = await readFile(new URL('../src/components/BlogContent.tsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/BlogPostPage.tsx', import.meta.url), 'utf8')
  const renderer = await readFile(new URL('../functions/_lib/blogArticleHtml.mjs', import.meta.url), 'utf8')
  assert.match(client, /function isContactCta/)
  assert.match(renderer, /function isContactCta/)
  assert.match(client, /youtube-nocookie\.com\/embed/)
  assert.match(renderer, /youtube-nocookie\.com\/embed/)
  assert.match(page, /readBlogArticleSsrPayload/)
  assert.match(page, /florial-blog-article-data/)
  assert.match(page, /ssrPayload\?\.slug === slug/)
})

test('middleware has a dedicated published blog detail SSR route before generic document fallback', async () => {
  const { readFile } = await import('node:fs/promises')
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const routeIndex = middleware.indexOf("if (path.startsWith('/blog/'))")
  const genericIndex = middleware.indexOf("parts.length === 2")
  assert.ok(routeIndex >= 0 && genericIndex > routeIndex)
  assert.match(middleware, /isPublished == true && defined\(publishedAt\)/)
  assert.match(middleware, /blogUnavailableResponse/)
  assert.match(middleware, /serializeBlogArticlePayload/)
})
