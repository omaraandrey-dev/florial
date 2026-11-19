import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/manager/PlantCatalogManager.tsx', import.meta.url), 'utf8')

test('required plant variant fields have asterisk labels and missing values get a red outline', () => {
  assert.match(source, /Височина \\(см\\) \\*/)
  assert.match(source, /Контейнер \\(л\\) \\*/)
  assert.match(source, /Цена \\(€\\)\\{canEditVariantPrice\\?' \\*':''\\}/)
  assert.match(source, /Количество\\{canEditVariantStock&&variant\\.stockStatus==='inStock'\\?' \\*':''\\}/)
  assert.match(source, /!border-red-500/)
  assert.match(source, /requiredInputClass\\(!(Number\\(variant\\.saleHeightCm\\)>0\\)\\)/)
  assert.match(source, /requiredInputClass\\(!(Number\\(variant\\.containerVolumeL\\)>0\\)\\)/)
})

test('Manager and Seller receive a generic Gemini failure message without provider diagnostics', () => {
  assert.match(source, /role==='owner'\\?\\(e instanceof Error\\?.*Gemini не успя да обработи заявката\\. Моля, опитайте отново по-късно\\./s)
  assert.match(source, /role==='owner'&&<span className="tabular-nums">Получени редове:/)
  assert.match(source, /role==='owner'\\?\\(event\\.message\\|\\|event\\.stage/)
})
