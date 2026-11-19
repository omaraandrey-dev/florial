import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const manager = read('../src/manager/PlantCatalogManager.tsx')
const upload = read('../functions/api/manager/upload-image.ts')
const publication = read('../functions/api/manager/publish-plant.ts')

test('plant image upload recommends 1600 square images and rejects files above 1.5 MB in the UI', () => {
  assert.match(manager, /Препоръчителен размер: 1600 × 1600 px, до 500 KB/)
  assert.match(manager, /Максимален размер на файла: 1,5 MB/)
  assert.match(manager, /file\.size>1500000/)
  assert.match(manager, /надвишава максимално допустимите 1,5 MB/)
})

test('plant image upload endpoint enforces the same 1.5 MB limit server-side', () => {
  assert.match(upload, /const MAX_IMAGE_SIZE = 1_500_000/)
  assert.match(upload, /до 1,5 MB/)
})

test('plant publication validation rejects images above 1.5 MB', () => {
  assert.match(publication, /image\.size > 1_500_000/)
  assert.match(publication, /максимум 1,5 MB на снимка/)
})

test('Gemini progress UI shows only elapsed time and received line count, not streamed content or model details', () => {
  assert.doesNotMatch(manager, /Google Gemini 3\.5 Flash-Lite/)
  assert.doesNotMatch(manager, /Photo анализира основната снимка/)
  assert.doesNotMatch(manager, /Потоков отговор Google/)
  assert.match(manager, /Получени редове:/)
  assert.match(manager, /geminiElapsedSeconds/)
})

test('empty plant gallery no longer suggests taking a photo or tapping an image', () => {
  assert.match(manager, /Качете готов файл или изберете снимка от библиотеката/)
  assert.doesNotMatch(manager, /Натиснете снимка, за да я направите основна/)
})
