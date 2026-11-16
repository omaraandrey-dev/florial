import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyIrrigationSprayPoint,
  validateIrrigationSiteContext,
} from '../src/lib/irrigation/irrigationSiteContext.mjs'

const square = (x1, y1, x2, y2) => ({
  vertices: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }, { x: x1, y: y1 }],
})
const base = {
  schemaVersion: 1,
  coordinateSystem: 'local_cartesian_m',
  status: 'confirmed',
  siteBoundary: square(0, 0, 20, 20),
  permittedSprayRegions: [{ id: 'flower-bed', kind: 'planting_bed', polygon: square(10, 2, 18, 8) }],
  noSprayRegions: [{ id: 'pool', kind: 'pool', polygon: square(12, 10, 18, 16) }],
}
const lawn = square(2, 2, 10, 10).vertices.slice(0, -1)

test('accepts a confirmed site boundary with explicit permitted and prohibited spray zones', () => {
  const result = validateIrrigationSiteContext(base)
  assert.equal(result.valid, true)
  assert.equal(result.status, 'accepted')
})

test('requires confirmed site context and valid polygons', () => {
  assert.equal(validateIrrigationSiteContext({ ...base, status: 'draft' }).errors[0].code, 'confirmed_site_context_required')
  const invalid = validateIrrigationSiteContext({ ...base, siteBoundary: { vertices: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }] } })
  assert.equal(invalid.valid, false)
})

test('rejects permitted spray regions outside the site boundary', () => {
  const result = validateIrrigationSiteContext({
    ...base,
    permittedSprayRegions: [{ id: 'outside', polygon: square(18, 18, 22, 22) }],
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((entry) => entry.code === 'region_outside_site_boundary'))
})

test('classifies lawn, permitted adjacent, no-spray, unapproved and outside-site samples', () => {
  const context = validateIrrigationSiteContext(base)
  const classify = (x, y) => classifyIrrigationSprayPoint({ point: { x, y }, siteContext: context, lawnBoundary: lawn })
  assert.equal(classify(5, 5), 'target_lawn')
  assert.equal(classify(14, 5), 'permitted_adjacent')
  assert.equal(classify(14, 12), 'no_spray')
  assert.equal(classify(8, 15), 'unapproved_on_site')
  assert.equal(classify(22, 15), 'outside_site')
})

test('no-spray policy takes precedence over a permitted region', () => {
  const overlap = validateIrrigationSiteContext({
    ...base,
    noSprayRegions: [{ id: 'override', polygon: square(14, 4, 16, 6) }],
  })
  assert.equal(overlap.valid, true)
  assert.equal(classifyIrrigationSprayPoint({
    point: { x: 15, y: 5 }, siteContext: overlap, lawnBoundary: lawn,
  }), 'no_spray')
})
