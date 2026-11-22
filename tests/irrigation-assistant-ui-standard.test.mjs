import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')

test('customer intake does not ask for water source, pressure or flow measurements', () => {
  assert.doesNotMatch(page, /waterSource|pressureBar|flowRate|Выберите источник воды|Choose the water source/)
  assert.match(page, /nominalPressureBar|waterAssumptions/)
})

test('approximate dimensions do not require a measurement-confirmation checkbox', () => {
  assert.match(page, /approximate|приблизительные размеры|приблизительные размери/)
  assert.doesNotMatch(page, /geometryConfirmed|confirmGeometry|Подтверждаю, что размеры измерены/)
})

test('layout diagram draws sprinkler coverage arcs and pipe routes', () => {
  assert.match(page, /strokeDasharray="0\.22 0\.16"/)
  assert.match(page, /pipeNetwork\?\.trunk/)
  assert.match(page, /pipeNetwork\?\.branches/)
})
