import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { buildLawnDimensionAnnotations } from '../src/lib/irrigation/lawnDimensionAnnotations.mjs'

test('rectangle dimensions label every edge with its actual side length', () => {
  const annotations = buildLawnDimensionAnnotations(buildLawnBoundary({
    shape: 'rectangle', length: 10, width: 4,
  }))
  assert.equal(annotations.length, 4)
  assert.deepEqual(annotations.map((entry) => entry.lengthM).sort((a, b) => a - b), [4, 4, 10, 10])
})

test('L-shape dimensions include all six outer and recess edges', () => {
  const annotations = buildLawnDimensionAnnotations(buildLawnBoundary({
    shape: 'l-shape', length: 28, width: 14, cutoutWidth: 16, cutoutDepth: 12, cutoutCorner: 'top-right',
  }))
  assert.equal(annotations.length, 6)
  assert.ok(annotations.some((entry) => entry.lengthM === 16))
  assert.ok(annotations.some((entry) => entry.lengthM === 12))
  assert.ok(annotations.every((entry) => Number.isFinite(entry.angleDeg)))
})

test('rectangular non-irrigated exclusions add four independently labelled sides', () => {
  const boundary = buildLawnBoundary({ shape: 'rectangle', length: 20, width: 12 })
  const annotations = buildLawnDimensionAnnotations(boundary, [{
    id: 'pool',
    polygon: { vertices: [
      { x: 4, y: 3 }, { x: 10, y: 3 }, { x: 10, y: 7 }, { x: 4, y: 7 },
    ] },
  }])
  assert.equal(annotations.length, 8)
  assert.deepEqual(annotations.filter((entry) => entry.ringId === 'pool').map((entry) => entry.lengthM).sort((a, b) => a - b), [4, 4, 6, 6])
})
