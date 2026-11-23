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
  assert.match(home, /fetchBlogPosts\(10, language\)/)
  assert.match(home, /fetchBlogPostsBySlugs\(pinnedSlugs, language\)/)
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


test('service page creates lead idempotency keys without requiring crypto.randomUUID', async () => {
  const detail = await read('../src/pages/ServicePage.tsx')
  assert.match(detail, /typeof cryptoApi\.randomUUID === 'function'/)
  assert.match(detail, /cryptoApi\.getRandomValues/)
  assert.match(detail, /Math\.random\(\)/)
  assert.match(detail, /useState\(\(\) => createLeadIdempotencyKey\(\)\)/)
})

test('service detail render errors are caught and shown as a recoverable page state', async () => {
  const app = await read('../src/App.tsx')
  assert.match(app, /class ServicePageErrorBoundary extends React\.Component/)
  assert.match(app, /componentDidCatch\(error: Error\)/)
  assert.match(app, /<ServicePageErrorBoundary key=\{activeServiceSlug\} language=\{language\}/)
  assert.match(app, /role="alert"/)
})


test('service breadcrumb direction is defined in component scope before the SEO effect and render', async () => {
  const detail = await read('../src/pages/ServicePage.tsx')
  const componentStart = detail.indexOf('export function ServicePage')
  const directionDeclaration = detail.indexOf("const direction = SERVICE_DIRECTION_BY_CATEGORY[service.serviceCategory || '']", componentStart)
  const effectStart = detail.indexOf('useEffect(() => {', componentStart)
  assert.ok(componentStart >= 0 && directionDeclaration > componentStart && directionDeclaration < effectStart)
  assert.match(detail, /const SERVICE_DIRECTION_BY_CATEGORY:/)
  assert.match(detail, /\{direction && \(/)
  assert.doesNotMatch(detail.slice(effectStart, detail.indexOf('const sourceBlocks', effectStart)), /const direction =/)
})

test('service route reserves viewport space and avoids a duplicate raw hero image in middleware HTML', async () => {
  const app = await read('../src/App.tsx')
  const middleware = await read('../functions/_middleware.ts')
  assert.ok(app.includes('function ServiceLoadingState'))
  assert.ok(app.includes('min-h-[100svh]'))
  assert.ok(app.includes("<ServiceLoadingState label={t('Зареждане на услугата...')} />"))
  assert.ok(middleware.includes("const image = type === 'product' && doc.imageUrl"))
  assert.ok(middleware.includes('image: doc?.imageUrl'))
  assert.ok(!middleware.includes("const image = type !== 'category'"))
})

test('product detail route resolves by exact slug without downloading both full catalogues', async () => {
  const app = await read('../src/App.tsx')
  const loader = await read('../src/lib/routeData/productDetails.ts')
  assert.match(app, /const needsCatalogue = Boolean\(activeCategorySlug\)/)
  assert.match(app, /fetchProductDetailsBySlug\(activeProductSlug/)
  assert.doesNotMatch(app, /const requestedCatalogueTypes = activeProductSlug/)
  assert.match(loader, /sanityLiveClient\.fetch\(productBySlugQuery/)
  assert.match(loader, /plantsClient\.fetch\(plantBySlugQuery/)
  assert.match(loader, /Promise\.allSettled\(\[/)
})

test('plant product LCP image is eager, prioritized and responsive in initial HTML', async () => {
  const app = await read('../src/App.tsx')
  const page = await read('../src/pages/ProductPage.tsx')
  const middleware = await read('../functions/_middleware.ts')
  assert.match(app, /function ProductLoadingState/)
  assert.match(app, /min-h-\[100svh\]/)
  assert.match(page, /useState<string>\(\(\) => product\.imageUrl \|\| ''\)/)
  assert.match(page, /loading="eager" fetchPriority="high" decoding="async"/)
  assert.match(middleware, /function renderResponsiveProductImage/)
  assert.match(middleware, /type === 'product'[\s\S]*?min-height:100svh/)
  assert.match(middleware, /srcset=/)
  assert.match(middleware, /fetchpriority="high"/)
  assert.match(middleware, /width="' \+ sourceWidth \+ '" height="' \+ sourceHeight/)
  assert.match(middleware, /href="https:\/\/cdn\.sanity\.io" crossorigin/)
  assert.match(middleware, /href="https:\/\/bxvcy0qs\.api\.sanity\.io" crossorigin/)
  assert.match(middleware, /href="https:\/\/bxvcy0qs\.apicdn\.sanity\.io" crossorigin/)
})


test('landscape architect route reserves hero, service cards and portfolio space while Sanity data loads', async () => {
  const page = await read('../src/pages/ServiceDirectionPage.tsx')
  assert.ok(page.includes('aspect-square max-h-[420px] w-full'))
  assert.ok(page.includes('Array.from({ length: 2 }'))
  assert.ok(page.includes('Array.from({ length: 5 }'))
  assert.ok(page.includes('min-h-[28rem]'))
  assert.ok(page.includes('!landscapeArticlesLoaded ? ('))
})

test('landscape architect route preconnects to the Sanity query and image origins in initial HTML', async () => {
  const middleware = await read('../functions/_middleware.ts')
  assert.ok(middleware.includes("path !== '/services/category/landshaften-arhitekt'"))
  assert.ok(middleware.includes('href="https://bxvcy0qs.apicdn.sanity.io" crossorigin'))
  assert.ok(middleware.includes('href="https://cdn.sanity.io" crossorigin'))
})


test('landscape architect direction uses one localized Sanity query for its direction, photo and category services', async () => {
  const app = await read('../src/App.tsx')
  const routeStart = app.indexOf("if (serviceDirectionSlug === 'landshaften-arhitekt')")
  const routeEnd = app.indexOf('const serviceQuery =', routeStart)
  assert.ok(routeStart >= 0 && routeEnd > routeStart)
  const routeLoader = app.slice(routeStart, routeEnd)
  assert.match(routeLoader, /sanityClient\.fetch\(landscapeDirectionQuery/)
  assert.match(routeLoader, /directionSlug: serviceDirectionSlug/)
  assert.match(routeLoader, /photoSlug: 'landshaften-arhitekt'/)
  assert.match(routeLoader, /translations \{\s*\$\{language\}/)
  assert.match(routeLoader, /serviceCategory == "landscaping"/)
  assert.match(routeLoader, /"rolePhoto": \*\[_type == "photo"/)
  assert.doesNotMatch(routeLoader, /Promise\.allSettled|serviceRolePhotosQuery|serviceDirectionQuery/)
  assert.match(routeLoader, /setServices\(Array\.isArray\(directionData\?\.services\)/)
  assert.match(routeLoader, /setServiceDirectionDocuments\(directionData \? \[directionData\] : \[\]\)/)
  assert.match(routeLoader, /setServiceRolePhotos\(directionData\?\.rolePhoto \? \[directionData\.rolePhoto\] : \[\]\)/)
})

test('landscape service direction reserves the long page layout while its lazy module loads', async () => {
  const app = await read('../src/App.tsx')
  assert.match(app, /function ServiceDirectionLoadingState/)
  assert.ok(app.includes('min-h-[calc(100svh+36rem)]'))
  assert.ok(app.includes('aspect-square max-h-[420px]'))
  assert.ok(app.includes('Array.from({ length: 5 }'))
  const fallbackStart = app.indexOf('<React.Suspense fallback={')
  const fallbackEnd = app.indexOf('}>', fallbackStart)
  const fallback = app.slice(fallbackStart, fallbackEnd)
  const directionFallback = fallback.indexOf('serviceDirectionSlug && isValidServiceDirectionRoute')
  const genericServiceFallback = fallback.indexOf('activeServiceSlug')
  assert.ok(fallbackStart >= 0 && fallbackEnd > fallbackStart)
  assert.ok(directionFallback >= 0 && directionFallback < genericServiceFallback)
  assert.match(fallback, /<ServiceDirectionLoadingState/)
})


test('blog route skips the unrelated full category indexes and keeps them available after navigation', async () => {
  const app = await read('../src/App.tsx')
  assert.match(app, /const isBlogRoute = normalizedRoutePath === '\/blog' \|\| normalizedRoutePath\.startsWith\('\/blog\/'\)/)
  assert.match(app, /if \(isBlogRoute \|\| categoriesLoaded\.current\)/)
  assert.match(app, /categoriesLoaded\.current = true/)
  assert.match(app, /\}, \[isBlogRoute\]\)/)
})

test('blog lazy-load and data-load states reserve page space and show matching skeletons', async () => {
  const app = await read('../src/App.tsx')
  const page = await read('../src/pages/BlogPage.tsx')
  assert.match(app, /function BlogLoadingState/)
  assert.match(app, /normalizedRoutePath === '\/blog'[\s\S]*?<BlogLoadingState/)
  assert.match(page, /min-h-\[100svh\]/)
  assert.match(page, /!loaded \? <div aria-busy="true"/)
  assert.match(page, /Array\.from\(\{ length: 4 \}/)
  assert.match(page, /Array\.from\(\{ length: 5 \}/)
})

test('blog route preconnects to Sanity query and image CDNs in the initial response', async () => {
  const middleware = await read('../functions/_middleware.ts')
  const blogRouteStart = middleware.indexOf("if (path === '/blog')")
  const blogRouteEnd = middleware.indexOf("if (path === '/services')", blogRouteStart)
  assert.ok(blogRouteStart >= 0 && blogRouteEnd > blogRouteStart)
  const blogRoute = middleware.slice(blogRouteStart, blogRouteEnd)
  assert.match(middleware, /options\.pageType === 'product' \|\| options\.pageType === 'blog'/)
  assert.match(blogRoute, /pageType: 'blog'/)
  assert.match(middleware, /href="https:\/\/cdn\.sanity\.io" crossorigin/)
  assert.match(middleware, /href="https:\/\/bxvcy0qs\.apicdn\.sanity\.io" crossorigin/)
})

test('blog listing images use narrower responsive sizes and lower card quality', async () => {
  const page = await read('../src/pages/BlogPage.tsx')
  assert.match(page, /\(min-width: 1280px\) 308px[\s\S]*?45vw', 640, 68/)
  assert.match(page, /\(min-width: 1280px\) 397px[\s\S]*?92vw', featured \? 1100 : 640, 68/)
})
