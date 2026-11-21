import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const manager = read('src/manager/PlantCatalogManager.tsx')
const createApi = read('functions/api/manager/plants.ts')
const plantLib = read('functions/api/manager/plant-direct-lib.ts')
const gemini = read('functions/api/manager/plants/gemini-test.ts')

test('manual plant intake requires name, variant/model-or-size, price and quantity only', () => {
  assert.match(manager, /const variantsReady=activeForm\.saleVariants\.length>0/)
  assert.match(manager, /hasModelOrSize=variant\.name\.trim\(\)\.length>=2\|\|Number\(variant\.saleHeightCm\)>0\|\|Number\(variant\.containerVolumeL\)>0/)
  assert.match(manager, /Number\.isFinite\(price\)&&price>0/)
  assert.match(manager, /variant\.stockQuantity\.trim\(\)!==''&&Number\.isInteger\(quantity\)&&quantity>=0/)
  assert.doesNotMatch(manager, /if\(!editingId&&!activeProof\)/)
  assert.doesNotMatch(manager, /if\(!activeForm\.name\.trim\(\)\|\|!allowedCategoryIds\.length/)
  assert.match(createApi, /if \(body\.aiProof && !await verifyPlantAiProof/)
  assert.match(plantLib, /stockQuantity === null/)
})

test('variant model name can replace numeric height and container dimensions', () => {
  assert.match(plantLib, /suppliedName\.length < 2 && !hasPhysicalSize/)
  assert.match(plantLib, /const name = suppliedName \|\|/)
  assert.match(manager, /Наименование на размер \/ модел \(или посочете височина\/обем\)/)
  assert.match(manager, /Височина \(см\) · по избор/)
  assert.match(manager, /Контейнер \(л\) · по избор/)
  assert.match(manager, /if\(key==='stockQuantity'&&value\.trim\(\)==='0'&&next\.stockStatus==='inStock'\)next\.stockStatus='outOfStock'/)
})

test('a new incomplete plant is stored inactive until category and photo are provided', () => {
  assert.match(plantLib, /if \(!set\.name \|\| !set\.slug \|\| !set\.productType \|\| !set\.saleVariants\)/)
  assert.match(plantLib, /set\.isActive = Boolean\(set\.category && set\.mainImage\)/)
  assert.match(manager, /isActive:editingId\?activeForm\.isActive:activeForm\.isActive&&Boolean\(allowedCategoryIds\.length&&activeImages\.length\)/)
  assert.match(manager, /запазено като чернова в Manager/)
  assert.match(plantLib, /if \(!categoryIds\.length\)/)
})

test('Google Text search can be applied without attaching a photograph', () => {
  assert.match(gemini, /mode === 'text' \|\| \/\^image-/)
  assert.match(gemini, /aiSearchMode: mode/)
  assert.match(plantLib, /mode: value\.aiSearchMode === 'text' \? 'text' : 'photo'/)
  assert.match(plantLib, /identity\.mode === 'text' \|\| Boolean\(identity\.imageAssetId\)/)
  assert.match(manager, /geminiResult\.mode==='text'/)
  assert.match(manager, /aiSearchMode:aiSearchMode\|\|'photo'/)
})
