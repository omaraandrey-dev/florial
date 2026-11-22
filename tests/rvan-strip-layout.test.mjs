import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'
import { generateRvanStripLayout } from '../src/lib/irrigation/rvanStripLayout.mjs'

function rectangleGeometry(length, width) {
  const vertices = buildLawnBoundary({ shape: 'rectangle', length, width })
  return validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'strip-lawn', boundary: { vertices }, exclusions: [] }],
  }).normalizedGeometry
}

test('10x1.5 strip uses LCS, SST and RCS with complete sampled coverage', () => {
  const result = generateRvanStripLayout({ geometry: rectangleGeometry(10, 1.5), pressureBar: 3.1 })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.deepEqual(result.modelsUsed, ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'])
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.equal(result.sizeAdjustmentRequired, false)
})

test('20x1.5 strip spaces SST heads with manufacturer 50-percent overlap basis', () => {
  const result = generateRvanStripLayout({ geometry: rectangleGeometry(20, 1.5), pressureBar: 3.1 })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.sprinklers.filter((head) => head.model === 'R-VAN-SST').length, 3)
  assert.ok(result.headToHead.checks.every((check) => check.passed))
  assert.equal(result.coverage.uncoveredPoints, 0)
})

test('vertical narrow strip uses the long Y axis and inward X direction', () => {
  const result = generateRvanStripLayout({ geometry: rectangleGeometry(1.5, 10), pressureBar: 3.1 })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.ok(result.sprinklers.every((head) => head.tangent.x === 0 && head.tangent.y === 1))
  assert.ok(result.sprinklers.every((head) => head.inward.x === 1 && head.inward.y === 0))
})

test('adjusted strip width is shown as preliminary and requires field verification', () => {
  const result = generateRvanStripLayout({ geometry: rectangleGeometry(10, 1), pressureBar: 3.1 })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.sizeAdjustmentRequired, true)
  assert.equal(result.sizeAdjustmentVerified, false)
  assert.ok(result.warnings.some((warning) => warning.code === 'strip_size_adjustment_requires_on_site_verification'))
})

test('L-shaped narrow geometry is not forced into a rectangular strip layout', () => {
  const vertices = buildLawnBoundary({ shape: 'l-shape', length: 12, width: 1.5, cutoutWidth: 4, cutoutDepth: 0.5, cutoutCorner: 'top-right' })
  const geometry = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'strip-lawn-l', boundary: { vertices }, exclusions: [] }],
  }).normalizedGeometry
  const result = generateRvanStripLayout({ geometry, pressureBar: 3.1 })
  assert.equal(result.status, 'strip_geometry_not_supported')
  assert.equal(result.layout, undefined)
})
