import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'

const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

test('builds a rectangle with the expected metric area', () => {
  const vertices = buildLawnBoundary({ shape: 'rectangle', length: 12, width: 8 })
  const result = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
  })
  assert.equal(result.status, 'accepted')
  assert.equal(result.regions[0].shape, 'rectangle')
  assert.equal(result.computedAreaM2, 96)
  assert.equal(result.computedPerimeterM, 40)
})

test('builds supported L-shaped outlines in all four corner orientations', () => {
  for (const cutoutCorner of corners) {
    const vertices = buildLawnBoundary({
      shape: 'l-shape',
      length: 12,
      width: 8,
      cutoutWidth: 4,
      cutoutDepth: 3,
      cutoutCorner,
    })
    const result = validateLawnGeometry({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: 'confirmed',
      regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
    })
    assert.equal(result.status, 'accepted', cutoutCorner)
    assert.equal(result.regions[0].shape, 'l-shape', cutoutCorner)
    assert.equal(result.computedAreaM2, 84, cutoutCorner)
    assert.equal(result.computedPerimeterM, 40, cutoutCorner)
  }
})

test('does not create geometry from missing, zero, non-finite or oversized dimensions', () => {
  assert.equal(buildLawnBoundary({ shape: 'rectangle', length: 0, width: 8 }), null)
  assert.equal(buildLawnBoundary({ shape: 'rectangle', length: Number.NaN, width: 8 }), null)
  assert.equal(buildLawnBoundary({ shape: 'l-shape', length: 12, width: 8, cutoutWidth: 12, cutoutDepth: 3 }), null)
  assert.equal(buildLawnBoundary({ shape: 'l-shape', length: 12, width: 8, cutoutWidth: 4, cutoutDepth: 8 }), null)
  assert.equal(buildLawnBoundary({ shape: 'l-shape', length: 12, width: 8, cutoutWidth: 4, cutoutDepth: 3, cutoutCorner: 'middle' }), null)
})
