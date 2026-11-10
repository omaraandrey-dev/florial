import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlantDuplicateQuery } from '../functions/api/manager/plant-duplicate-lib.ts'

test('duplicate query checks primary and localized names plus botanical candidates', () => {
  const query = buildPlantDuplicateQuery('Cycas', ['Cycas revoluta'])
  assert.match(query, /lower\(name\)==lower\("cycas"\)/)
  assert.match(query, /lower\(translations\.bg\.name\)/)
  assert.match(query, /lower\(translations\.ru\.name\)/)
  assert.match(query, /lower\(translations\.en\.name\)/)
  assert.match(query, /lower\(scientificName\)/)
  assert.match(query, /!\(_id in path\("drafts\.\*\*"\)\)/)
})

test('duplicate query escapes seller/model supplied strings and bounds candidate count', () => {
  const query = buildPlantDuplicateQuery('Cycas") || true || ("', ['one', 'two', 'three', 'four'])
  assert.match(query, /\\\"/)
  assert.doesNotMatch(query, /lower\(name\)==lower\("four"\)/)
})

test('duplicate query rejects empty input', () => {
  assert.throws(() => buildPlantDuplicateQuery('', []), /PLANT_DUPLICATE_QUERY_EMPTY/)
})
