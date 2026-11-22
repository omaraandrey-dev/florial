import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')

test('lawn outline is accepted from valid entered dimensions without a measured-dimensions checkbox', () => {
  assert.match(source, /status: 'confirmed'/)
  assert.doesNotMatch(source, /geometryConfirmed|setGeometryConfirmed|copy\.confirmGeometry/)
  assert.doesNotMatch(source, /type="checkbox"[^>]*geometry/)
  assert.match(source, /Контур подтверждён вами по введённым примерным размерам/)
  assert.match(source, /The outline is confirmed from your approximate dimensions/)
  assert.match(source, /Контурът е потвърден според въведените от вас приблизителни размери/)
  assert.match(source, /approximate dimensions|примерные длину и ширину|приблизителна дължина и ширина/)
})
