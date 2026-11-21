import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/manager/PlantCatalogManager.tsx', import.meta.url), 'utf8')

test('plant variant requires price and quantity while height and container are optional when a model name is supplied', () => {
  assert.ok(source.includes("Височина (см){editingId?' *':' · по избор'}"))
  assert.ok(source.includes("Контейнер (л){editingId?' *':' · по избор'}"))
  assert.ok(source.includes('Наименование на размер / модел (или посочете височина и обем на контейнера)'))
  assert.ok(source.includes("Цена (€){canEditVariantPrice?' *':''}"))
  assert.ok(source.includes("Количество{!editingId||variant.stockStatus==='inStock'?' *':''}"))
  assert.ok(source.includes('!border-red-500'))
  assert.ok(source.includes('aria-required={Boolean(editingId)}'))
})

test('Manager and Seller receive a generic Gemini failure message without provider diagnostics', () => {
  assert.ok(source.includes("setGeminiError(role==='owner'?"))
  assert.ok(source.includes("'Gemini не успя да обработи заявката. Моля, опитайте отново по-късно.'"))
  assert.ok(source.includes('Gemini обработва заявката… · Време:'))
  assert.ok(source.includes('Получени редове:'))
  assert.ok(!source.includes("role==='owner'&&<span className=\"tabular-nums\">Получени редове:"))
  assert.ok(source.includes('Резултатът от Google е получен успешно и е приложен към формата. Попълнете размерите, количеството и цената'))
  assert.ok(source.includes("setGeminiStage(role==='owner'?(event.message||event.stage"))
})


test('plant image library is available only to Owner; Manager and Seller use file upload', () => {
  assert.ok(source.includes("{role==='owner'&&<button type=\"button\" className={btn+' border border-stone-300 bg-white'} onClick={()=>setLibraryOpen(previous=>!previous)}>{libraryOpen?'Скрий библиотека':'Избери от библиотеката'}</button>}"))
  assert.ok(source.includes("{role==='owner'&&libraryOpen&&<PlantImageLibrary"))
  assert.ok(source.includes("role==='owner'?'Все още няма добавени снимки. Качете готов файл или изберете снимка от библиотеката.':'Все още няма добавени снимки. Качете готов файл.'"))
})

test('plant editor keeps advanced catalog fields owner-only and explains automatic URL handling to staff', () => {
  assert.ok(source.includes("{role==='owner'&&<details id=\"plant-editor-seo\""))
  assert.ok(source.includes("{role==='owner'&&<details id=\"plant-editor-care\""))
  assert.ok(source.includes("{role==='owner'&&(['ru','en'] as const).map"))
  assert.ok(source.includes('URL адресът се генерира автоматично.'))
  assert.ok(source.includes('Преводите, SEO и ботаническите характеристики се обработват от собственика.'))
  assert.ok(source.includes('URL адресът се генерира автоматично.'))
})

test('plant editor provides section shortcuts and collapses long description and owner-only sections by default', () => {
  assert.ok(source.includes('Бърза навигация в картата на растението'))
  assert.ok(source.includes("scrollIntoView({behavior:'smooth',block:'start'})"))
  assert.ok(source.includes('<details id="plant-editor-content"'))
  assert.ok(source.includes("{role==='owner'&&<details id=\"plant-editor-seo\""))
  assert.ok(source.includes("{role==='owner'&&<details id=\"plant-editor-care\""))
})

test('plant editor warns before discarding unsaved edits', () => {
  assert.ok(source.includes('initialEditorSnapshot,setInitialEditorSnapshot]=useState'))
  assert.ok(source.includes('window.confirm(\'Имате незапазени промени. Сигурни ли сте, че искате да излезете без запазване?\')'))
  assert.ok(source.includes("window.addEventListener('beforeunload',warnBeforeUnload)"))
  assert.ok(source.includes('onClick={closeEditor}'))
})
