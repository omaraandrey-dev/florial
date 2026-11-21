import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/manager/PlantCatalogManager.tsx', import.meta.url), 'utf8')

test('plant variant requires price and quantity while height and container are optional when a model name is supplied', () => {
  assert.ok(source.includes('Височина (см) · по избор'))
  assert.ok(source.includes('Контейнер (л) · по избор'))
  assert.ok(source.includes('Наименование на размер / модел (или посочете височина/обем)'))
  assert.ok(source.includes("Цена (€){canEditVariantPrice?' *':''}"))
  assert.ok(source.includes('Количество *'))
  assert.ok(source.includes('!border-red-500'))
  assert.ok(source.includes('aria-required="false"'))
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
