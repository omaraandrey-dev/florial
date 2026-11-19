import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/manager/PlantCatalogManager.tsx', import.meta.url), 'utf8')

test('required plant variant fields have asterisk labels and missing values get a red outline', () => {
  assert.ok(source.includes('Височина (см) *'))
  assert.ok(source.includes('Контейнер (л) *'))
  assert.ok(source.includes("Цена (€){canEditVariantPrice?' *':''}"))
  assert.ok(source.includes("Количество{canEditVariantStock&&variant.stockStatus==='inStock'?' *':''}"))
  assert.ok(source.includes('!border-red-500'))
  assert.ok(source.includes("requiredInputClass(!(Number(variant.saleHeightCm)>0))"))
  assert.ok(source.includes("requiredInputClass(!(Number(variant.containerVolumeL)>0))"))
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
