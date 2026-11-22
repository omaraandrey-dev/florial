import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')

test('assistant uses approximate geometry and shows only the agreed customer project standards', () => {
  assert.match(source, /approximate size|приблизительн|приблизителн/i)
  assert.match(source, /top-right corner|верхний правый угол|горният десен ъгъл/i)
  assert.match(source, /Pipe — Ø25 mm|Труба — Ø25 мм|Тръба — Ø25 mm/)
  assert.doesNotMatch(source, /copy\.waterTitle|copy\.pressureTitle|copy\.flowTitle/)
  assert.doesNotMatch(source, /До 6 секторных дождевателей|up to 6 sector sprinklers|до 6 секторни разпръсквача/i)
  assert.doesNotMatch(source, /hydraulicNotReady|copy\.disclaimer|layoutLabels\.limits/)
  assert.doesNotMatch(source, /Ø32 mm main pipe|Магистраль Ø32|Главна тръба Ø32/)
  assert.doesNotMatch(source, /checked=\{geometryConfirmed\}/)
})

test('layout view draws one sequential route per zone and keeps sprinkler radius rings', () => {
  assert.match(source, /strokeDasharray="0\.22 0\.14"/)
  assert.match(source, /pipeNetwork\?\.mainRoute/)
  assert.match(source, /pipeNetwork\?\.branches/)
  assert.match(source, /branch\.zoneId/)
  assert.match(source, /branch\.lateralConnections/)
  assert.match(source, /zone\.branchDirection/)
})
