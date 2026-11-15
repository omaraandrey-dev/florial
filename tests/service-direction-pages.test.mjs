import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('four specialist pages are localized and have distinct SEO content', async () => {
  const page = await read('../src/pages/ServiceDirectionPage.tsx')
  for (const slug of ['landshaften-arhitekt', 'polivni-sistemi', 'gardinar', 'trevni-ploshti']) {
    assert.ok(page.includes(`slug: '${slug}'`), `missing direction slug ${slug}`)
  }
  for (const locale of ['bg:', 'ru:', 'en:']) assert.ok(page.includes(locale))
  assert.match(page, /metaTitle:/)
  assert.match(page, /metaDescription:/)
  assert.match(page, /faqHeading:/)
  assert.match(page, /<h1/)
  assert.match(page, /<h2/)
})

test('service direction routes load the directory and do not fall through to service detail lookup', async () => {
  const app = await read('../src/App.tsx')
  assert.match(app, /path.startsWith\('\/services\/category\/'\)/)
  assert.match(app, /!path.startsWith\('\/services\/category\/'\)/)
  assert.match(app, /normalizedRoutePath.startsWith\('\/services\/category\/'\)/)
  assert.match(app, /<ServiceDirectionPage directionSlug=\{serviceDirectionSlug\}/)
})

test('service details include their specialist page in visual and JSON-LD breadcrumbs', async () => {
  const detail = await read('../src/pages/ServicePage.tsx')
  assert.match(detail, /SERVICE_DIRECTION_BY_CATEGORY/)
  assert.match(detail, /services\/category\//)
  assert.match(detail, /position: direction && directionUrl \? 4 : 3/)
  assert.match(detail, /direction\.title\[language\]/)
})

test('service directory links to all four dedicated specialist pages', async () => {
  const list = await read('../src/pages/ServicesListPage.tsx')
  for (const slug of ['polivni-sistemi', 'gardinar', 'trevni-ploshti', 'landshaften-arhitekt']) {
    assert.ok(list.includes(slug), `directory link missing ${slug}`)
  }
})

test('specialist pages are included in the multilingual sitemap', async () => {
  const sitemap = await read('../functions/sitemap.xml.ts')
  for (const slug of ['landshaften-arhitekt', 'polivni-sistemi', 'gardinar', 'trevni-ploshti']) {
    assert.ok(sitemap.includes(`services/category/${slug}`), `sitemap missing ${slug}`)
  }
})

test('service direction Sanity GROQ projections are structurally balanced for every locale', async () => {
  const app = await read('../src/App.tsx')
  const assignment = app.indexOf('const serviceDirectionQuery = ')
  assert.notEqual(assignment, -1, 'missing serviceDirectionQuery assignment')
  const opening = app.indexOf(String.fromCharCode(96), assignment)
  const closing = app.indexOf(String.fromCharCode(96), opening + 1)
  assert.ok(opening > -1 && closing > opening, 'missing GROQ template literal')
  const query = app.slice(opening + 1, closing)

  assert.equal((query.match(/sections\[\]\{/g) || []).length, 3, 'expected one sections projection per locale')
  assert.equal((query.match(/markDefs\[\]\{/g) || []).length, 3, 'expected one Portable Text markDefs projection per locale')

  const stack = []
  const closingDelimiters = { '}': '{', ']': '[', ')': '(' }
  let quote = null
  let escaped = false
  for (const char of query) {
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '{' || char === '[' || char === '(') stack.push(char)
    else if (char === '}' || char === ']' || char === ')') {
      assert.equal(stack.pop(), closingDelimiters[char], 'unbalanced GROQ delimiter before ' + char)
    }
  }
  assert.equal(quote, null, 'unterminated string in serviceDirectionQuery')
  assert.deepEqual(stack, [], 'serviceDirectionQuery contains unclosed GROQ delimiters')
})


test('service specialist landing routes reach the Pages SPA fallback instead of middleware 404', async () => {
  const middleware = await read('../functions/_middleware.ts')
  assert.ok(middleware.includes("if (/^\\/services\\/category\\/[^/]+$/.test(path)) return context.next()"))
})
