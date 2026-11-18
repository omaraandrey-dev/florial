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
  assert.match(home, /variantPrices/)
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
