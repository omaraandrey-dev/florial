import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const manager = read('src/manager/PlantCatalogManager.tsx')
const createApi = read('functions/api/manager/plants.ts')
const plantLib = read('functions/api/manager/plant-direct-lib.ts')
const gemini = read('functions/api/manager/plants/gemini-test.ts')

test('manual plant intake requires name, variant/model-or-complete-size, price and quantity only', () => {
  assert.match(manager, /const variantsReady=activeForm\.saleVariants\.length>0/)
  assert.match(manager, /hasModelOrSize=\(!variant\.nameAuto&&variant\.name\.trim\(\)\.length>=2\)\|\|\(Number\(variant\.saleHeightCm\)>0&&Number\(variant\.containerVolumeL\)>0\)/)
  assert.match(manager, /Number\.isFinite\(price\)&&price>0/)
  assert.match(manager, /variant\.stockQuantity\.trim\(\)!==''&&Number\.isInteger\(quantity\)&&quantity>=0/)
  assert.doesNotMatch(manager, /if\(!editingId&&!activeProof\)/)
  assert.match(manager, /else if\(!activeForm\.name\.trim\(\)\|\|activeForm\.name\.trim\(\)\.length<2\|\|!activeForm\.slug\.trim\(\)\|\|!variantsReady\)/)
  assert.match(createApi, /if \(body\.aiProof && !await verifyPlantAiProof/)
  assert.match(plantLib, /requireQuantity && stockQuantity === null/)
  assert.match(plantLib, /normalizeVariants\(input\.saleVariants, isCreate\)/)
})

test('variant model name can replace both numeric height and container dimensions', () => {
  assert.match(plantLib, /const suppliedName = requireQuantity && item\.nameAuto === true \? '' : cleanText\(item\.name, 100\)/)
  assert.match(plantLib, /suppliedName\.length < 2 && !hasPhysicalSize/)
  assert.match(plantLib, /const hasPhysicalSize = requireQuantity/)
  assert.match(plantLib, /const name = suppliedName \|\|/)
  assert.match(manager, /Наименование на размер \/ модел \(или посочете височина и обем на контейнера\)/)
  assert.match(manager, /nameAuto:v\.nameAuto===true/)
  assert.match(manager, /Височина \(см\)\{editingId\?' \*':' · по избор'\}/)
  assert.match(manager, /Контейнер \(л\)\{editingId\?' \*':' · по избор'\}/)
  assert.match(manager, /if\(key==='stockQuantity'&&value\.trim\(\)==='0'&&next\.stockStatus==='inStock'\)next\.stockStatus='outOfStock'/)
})

test('a new incomplete plant is stored inactive until category and photo are provided', () => {
  assert.match(plantLib, /if \(!set\.name \|\| !set\.slug \|\| !set\.productType \|\| !set\.saleVariants\)/)
  assert.match(plantLib, /set\.isActive = Boolean\(set\.category && set\.mainImage\)/)
  assert.match(plantLib, /if \(!isCreate && set\.isActive === true\)/)
  assert.match(plantLib, /Преди показване в магазина добавете категория и основна снимка/)
  assert.match(manager, /isActive:editingId\?activeForm\.isActive:activeForm\.isActive&&Boolean\(allowedCategoryIds\.length&&activeImages\.length\)/)
  assert.match(manager, /запазено като чернова в Manager/)
  assert.match(plantLib, /if \(!categoryIds\.length\)/)
  assert.match(plantLib, /if \(existing\) throw new Error\('Изберете поне една категория за съществуващото растение\.'/)
  assert.match(plantLib, /if \(!isCreate && !variants\.some/)
  assert.match(plantLib, /normalizeVariants\(input\.saleVariants, isCreate\)/)
  assert.match(manager, /if\(editingId\)\{/)
})

test('Google Text search can be applied without attaching a photograph', () => {
  assert.match(gemini, /mode === 'text' \|\| \/\^image-/)
  assert.match(gemini, /const proofAssetId = mode === 'photo' \? cleanText\(body\.mainImage\?\.assetId, 160\) : ''/)
  assert.match(gemini, /aiSearchMode: mode/)
  assert.match(plantLib, /if \(mode === 'text'\) return \{ mode: 'text', imageAssetId: '' \}/)
  assert.match(plantLib, /identity\.mode === 'text' \|\| Boolean\(identity\.imageAssetId\)/)
  assert.match(manager, /geminiResult\.mode==='text'/)
  assert.match(manager, /Boolean\(geminiProof&&!geminiProofAssetId\)/)
  assert.match(manager, /image=\{geminiResult\.mode==='photo'&&images\[mainImageIndex\]/)
  assert.match(manager, /aiSearchMode:aiSearchMode\|\|'photo'/)
})

test('image-based Google proofs retain their existing signature for duplicate-variant flow', () => {
  assert.match(plantLib, /if \(imageAssetId\) return \{ imageAssetId \}/)
  const duplicate = read('functions/api/manager/plants/[id]/add-variant.ts')
  assert.match(duplicate, /verifyPlantAiProof\(request, body\.aiProof, \{ mainImage: \{ assetId: proofAssetId \} \}\)/)
})
