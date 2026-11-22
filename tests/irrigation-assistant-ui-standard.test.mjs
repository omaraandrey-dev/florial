import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')

test('assistant uses approximate geometry and fixed Florial assumptions without water questionnaire', () => {
  assert.match(source, /approximate size|приблизительн|приблизителн/i)
  assert.match(source, /1-inch tap|Кран 1 дюйм|Кран 1 цол/)
  assert.match(source, /4-bar inlet pressure|давление на вводе 4 бара|налягане на входа 4 bar/)
  assert.match(source, /Ø25 mm supply pipe|подводящая труба Ø25 мм|захранваща тръба Ø25 mm/)
  assert.doesNotMatch(source, /copy\.waterTitle|copy\.pressureTitle|copy\.flowTitle/)
  assert.doesNotMatch(source, /checked=\{geometryConfirmed\}/)
})

test('layout view includes dashed spray radii and routed pipe network', () => {
  assert.match(source, /strokeDasharray="0\.22 0\.14"/)
  assert.match(source, /pipeNetwork\?\.mainRoute/)
  assert.match(source, /pipeNetwork\?\.branches/)
  assert.match(source, /mainDiameterMm|Ø32 mm main pipe/)
})
