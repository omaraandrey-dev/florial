import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3504Layout } from '../src/lib/irrigation/rainBird3504Layout.mjs'

function rectangle(length, width) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: [
        { x: 0, y: 0 }, { x: length, y: 0 },
        { x: length, y: width }, { x: 0, y: width },
      ] },
      exclusions: [],
    }],
  }
}

test('38x16 uses a whole-area 8m rotor grid without greedy end clustering', () => {
  const result = generateRainBird3504Layout(rectangle(38, 16))
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.ok(result.sprinklers.length <= 18)
  assert.ok(result.sprinklers.length >= 12)
  assert.ok(result.sprinklers.every((head) => head.radiusM === 8))
  assert.ok(result.sprinklers.every((head) =>
    head.position.x >= 0 && head.position.x <= 38 &&
    head.position.y >= 0 && head.position.y <= 16))
  const farRightHeads = result.sprinklers.filter((head) => head.position.x >= 30)
  assert.ok(farRightHeads.length <= 6,
    'the far end must not accumulate a second greedy repair cluster')
})

test('10x10 allows a shorter local radius while preserving full rotor coverage and H2H', () => {
  const result = generateRainBird3504Layout(rectangle(10, 10))
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.ok(result.sprinklers.every((head) => head.radiusM >= 5 && head.radiusM <= 8))
  assert.ok(result.sprinklers.some((head) => head.radiusM < 8),
    JSON.stringify(result.sprinklers.map((head) => ({ position: head.position, radiusM: head.radiusM }))))
})

test('rotor-only solver declines rectangles narrower than the minimum 5m throw', () => {
  const result = generateRainBird3504Layout(rectangle(18, 4))
  assert.equal(result.status, 'no_usable_rotor_candidates')
  assert.equal(result.sprinklers.length, 0)
})

test('rotor solver rejects exclusions rather than projecting spray through them', () => {
  const geometry = rectangle(20, 16)
  geometry.regions[0].exclusions = [{
    id: 'pool',
    polygon: { vertices: [
      { x: 8, y: 6 }, { x: 12, y: 6 },
      { x: 12, y: 10 }, { x: 8, y: 10 },
    ] },
  }]
  assert.equal(generateRainBird3504Layout(geometry).status, 'invalid_geometry')
})
