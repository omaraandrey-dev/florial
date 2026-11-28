import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('homepage SSR serializes the data already used to render the first response', async () => {
  const middleware = await read('../functions/_middleware.ts')
  assert.match(middleware, /async function fetchHomepageHtml\(language: string\): Promise<\{ html: string; payload: Record<string, unknown> \}>/)
  assert.match(middleware, /'homepage\/plant-categories-v2'/)
  assert.match(middleware, /headerSettingsQuery/)
  for (const field of ['equipmentCategories', 'plantCategories', 'featuredPlants', 'featuredEquipment', 'services', 'pinnedPosts', 'latestPosts', 'headerSiteSettings']) {
    assert.ok(middleware.includes(field), `homepage SSR payload is missing ${field}`)
  }
  assert.match(middleware, /florial-homepage-ssr-data/)
  assert.match(middleware, /serializeInlineJson\(homepage\.payload\)/)
})

test('homepage client accepts only a matching locale seed and initializes its page data from it', async () => {
  const app = await read('../src/App.tsx')
  assert.match(app, /function readHomepageSeed\(language: string\): HomepageSeed \| null/)
  assert.match(app, /payload\.language !== language/)
  assert.match(app, /const \[homepageSeed\] = useState\(\(\) => readHomepageSeed\(language\)\)/)
  assert.match(app, /categoriesLoaded = useRef\(Boolean\(homepageSeed\)\)/)
  assert.match(app, /if \(homepageSeed(?: \\|\\| initialHeaderSeed)?\) return \(\) => \{ cancelled = true \}/)
  assert.match(app, /homepageSeed\.featuredPlants/)
  assert.match(app, /homepageSeed\.featuredEquipment/)
  assert.match(app, /homepageSeed\?\.headerSiteSettings/)
})

test('homepage Header and BlogSection reuse SSR blog cards instead of fetching them again', async () => {
  const header = await read('../src/components/Header.tsx')
  const blog = await read('../src/components/BlogSection.tsx')
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(header, /if \(initialBlogPosts\) \{[\s\S]*?setBlogPosts\(initialBlogPosts\)[\s\S]*?return/)
  assert.match(blog, /if \(initialPosts\) \{[\s\S]*?setPosts\(initialPosts\)[\s\S]*?onReadinessChange\?\.\(true\)[\s\S]*?return/)
  assert.match(home, /<BlogSection initialPosts=\{initialBlogPosts\}/)
})
