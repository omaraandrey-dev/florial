import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('homepage hero directs shoppers to plant and irrigation catalogues', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(home, /localizedHref\('\/category\/rastenia', language\)/)
  assert.match(home, /localizedHref\('\/category\/vsichko-za-polivane', language\)/)
  assert.match(home, /onNavigateCategory\('rastenia'\)/)
  assert.match(home, /onNavigateCategory\('vsichko-za-polivane'\)/)
})
test('homepage trust strip uses existing experience and service-area claims', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(home, /25\+ години опит/)
  assert.match(home, /Несебър и региона/)
  assert.match(home, /Проектиране и монтаж/)
})
test('homepage service cards display localized short descriptions', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  const app = await read('../src/App.tsx')
  assert.match(home, /localize\(service, 'shortDescription'\)/)
  assert.match(home, /getServiceSummary\(srv\)/)
  assert.match(app, /translations \{ bg \{ name, shortDescription \}, ru \{ name, shortDescription \}, en \{ name, shortDescription \} \}/)
})
test('homepage featured plants are explicit published plant recommendations with live variant prices', async () => {
  const app = await read('../src/App.tsx')
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(app, /isFeatured == true/)
  assert.match(app, /!\(_id in path\("drafts\.\*\*"\)\)/)
  assert.match(app, /publicPlantsClient\.fetch\(featuredPlantsQuery\)/)
  assert.match(home, /getPlantStockStatus\(product\)/)
  assert.match(home, /getPlantPrice\(product\)/)
  assert.match(home, /product.vatIncluded === true/)
  assert.match(home, /onNavigateProduct\(productSlug\)/)
})
test('homepage conversion content is localized in every supported language', async () => {
  for (const locale of ['bg', 'ru', 'en']) {
    const content = await read('../src/lib/i18n/' + locale + '.ts')
    assert.match(content, /'Разгледайте растенията':/)
    assert.match(content, /'Избрани растения':/)
    assert.match(content, /'Проверете наличността':/)
    assert.match(content, /'Цената е с включен ДДС.':/)
  }
})

 
test('homepage hero CTAs use published category photography and keep About visibly clickable', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(home, /plantRootCategory\?\.imageUrl/)
  assert.match(home, /readyKitsCategory\?\.imageUrl/)
  assert.match(home, /w-4\/5 max-w-\[208px\]/)
  assert.match(home, /className="mt-4 inline-flex text-sm font-semibold/)
  assert.doesNotMatch(home, /mt-4 inline-flex items-center gap-2 rounded-lg border/ )
})
test('homepage selected irrigation equipment is limited to four active ready kits', async () => {
  const app = await read('../src/App.tsx')
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(app, /references\("6709cd41-18c6-4c5f-bc27-90d55d685dec"\)/)
  assert.match(app, /stockStatus != "outOfStock"/)
  assert.match(app, /priceEUR asc, name asc\)\[0\.\.\.20\]/)
  assert.match(app, /selectFeaturedEquipment\(data\)/)
  assert.match(home, /visibleFeaturedEquipment[\s\S]*?\.slice\(0, 4\)/)
  assert.match(home, /onNavigateProduct\(productSlug\)/)
})
test('homepage blog pins the landscape project and irrigation price articles before the latest third article', async () => {
  const blog = await read('../src/components/BlogSection.tsx')
  assert.match(blog, /podroben-landshaften-proekt-gradina/)
  assert.match(blog, /cena-sistema-avtomatichno-napoyavane-burgas/)
  assert.match(blog, /latest\.filter\(\(post\) => !pinnedSlugsSet\.has\(blogSlug\(post\)\)\)\.slice\(0, 1\)/)
})


test('homepage delegates featured plant pricing to the tested pure helper', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  assert.match(home, /getPlantPrice\(product\)/)
})


test('homepage uses one main landmark for all primary sections', async () => {
  const home = await read('../src/pages/HomePage.tsx')
  assert.equal((home.match(/<main\b/g) || []).length, 1)
  assert.equal((home.match(/<\/main>/g) || []).length, 1)
  assert.match(home, /<BlogSection onReadinessChange=\{onBlogReadinessChange\} \/>/)
})

test('homepage blog distinguishes loading, empty and failed requests', async () => {
  const blog = await read('../src/components/BlogSection.tsx')
  assert.match(blog, /status === 'loading'/)
  assert.match(blog, /status === 'error'/)
  assert.match(blog, /status === 'empty'/)
  assert.match(blog, /setStatus\(nextPosts\.length \? 'ready' : 'empty'\)/)
})
