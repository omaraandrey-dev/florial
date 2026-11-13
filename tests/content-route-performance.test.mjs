import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('full service directory and role photos are requested only on the services route', async () => {
  const app = await read('../src/App.tsx')
  const globalFetchStart = app.indexOf('const fetchData = async')
  const routeFetchStart = app.indexOf('The full service directory is needed only by /services')
  assert.ok(globalFetchStart >= 0 && routeFetchStart > globalFetchStart)
  const globalFetch = app.slice(globalFetchStart, routeFetchStart)
  assert.doesNotMatch(globalFetch, /serviceQuery|serviceRolePhotosQuery/)
  assert.match(app, /if \(!isServicesListRoute \|\| loadedServicesLanguage === language\)/)
  assert.match(app, /translations \{ \$\{language\} \{ name, shortDescription \} \}/)
})

test('service detail route loads one localized document and caches it', async () => {
  const app = await read('../src/App.tsx')
  const loader = await read('../src/lib/routeData/serviceDetails.ts')
  assert.match(app, /fetchServiceDetails\(activeServiceSlug, language/)
  assert.match(loader, /translations\.\$\{language\}/)
  assert.match(loader, /SERVICE_DETAIL_CACHE_TTL_MS/)
  assert.match(loader, /\(coalesce\(slug\.current, slug\) == \$slug \|\| _id == \$slug\)/)
})

test('service page images use responsive sizing and prioritize only the first intro image', async () => {
  const list = await read('../src/pages/ServicesListPage.tsx')
  const detail = await read('../src/pages/ServicePage.tsx')
  assert.match(list, /getSanityImageProps\(service\.imageUrl/)
  assert.match(list, /getSanityImageProps\(photo\.imageUrl/)
  assert.match(list, /getSanityImageProps\('https:\/\/cdn\.sanity\.io/)
  assert.match(detail, /loading="eager" fetchPriority="high"/)
  assert.match(detail, /group === 'intro' && index === 0/)
  assert.match(detail, /loading=\{isPriorityImage \? "eager" : "lazy"\}/)
})

test('blog index and homepage request only the active locale card fields', async () => {
  const blog = await read('../src/lib/blog.ts')
  const index = await read('../src/pages/BlogPage.tsx')
  const home = await read('../src/components/BlogSection.tsx')
  assert.match(blog, /function blogCardProjection\(language: BlogLanguage\)/)
  assert.match(blog, /coalesce\(translations\.\$\{language\}\.title, translations\.bg\.title\)/)
  assert.match(index, /fetchBlogPosts\(undefined, language\)/)
  assert.match(home, /fetchBlogPosts\(3, language\)/)
})

test('header recent blog cards follow the active locale', async () => {
  const header = await read('../src/components/Header.tsx')
  assert.match(header, /fetchBlogPosts\(3, language\)/)
  assert.match(header, /\}, \[language\]\)/)
})

test('blog article renders after its localized document, without waiting for the whole blog index', async () => {
  const blog = await read('../src/lib/blog.ts')
  const page = await read('../src/pages/BlogPostPage.tsx')
  assert.match(blog, /fetchBlogPost\(slug: string, language: BlogLanguage/)
  assert.match(blog, /fetchRelatedBlogPosts\(excludeId: string, tags: string\[\], language: BlogLanguage/)
  assert.match(blog, /coalesce\(translations\.\$\{language\}\.body, translations\.bg\.body\)/)
  assert.doesNotMatch(page, /fetchBlogPosts\(/)
  assert.match(page, /setLoaded\(true\)[\s\S]*fetchRelatedBlogPosts/)
  assert.match(page, /loading="eager" fetchPriority="high"/)
})


test('homepage features specimen plants instead of citrus in the six plant category cards', async () => {
  const app = await read('../src/App.tsx')
  const home = await read('../src/pages/HomePage.tsx')
  assert.ok(app.includes('"plants-root", "plants-palms", "plants-olives",\n        "plants-trees-shrubs", "plants-solitaires", "plants-flowers"'))
  assert.ok(home.includes("'plants-trees-shrubs',\n    'plants-solitaires',\n    'plants-flowers'"))
  assert.ok(!home.includes("'plants-citrus'"))
})

test('compact Header service data preserves homepage service cards and About page service images', async () => {
  const app = await read('../src/App.tsx')
  const headerQueryStart = app.indexOf('const headerServiceQuery')
  const headerQueryEnd = app.indexOf('const headerSettingsQuery', headerQueryStart)
  const headerQuery = app.slice(headerQueryStart, headerQueryEnd)
  assert.ok(headerQuery.includes('"imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url)'))
  assert.ok(headerQuery.includes('sortOrder, serviceCategory, serviceLayout'))
  assert.ok(app.includes('<AboutPage services={headerServices} categories={categories} />'))
  assert.ok(app.includes('services={headerServices}\n          categories={visibleCategories'))
})


test('currentService is initialized before the SEO effect reads it during the first render', async () => {
  const app = await read('../src/App.tsx')
  const declaration = app.indexOf('const currentService = activeServiceSlug ? currentServiceDetails : null')
  const seoEffect = app.indexOf('const pageKey = language +')
  const dependencyReference = app.indexOf('[language, activeServiceSlug')
  assert.ok(declaration >= 0 && declaration < seoEffect)
  assert.ok(dependencyReference > seoEffect)
})
