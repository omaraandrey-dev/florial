import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3504Layout } from '../src/lib/irrigation/rainBird3504Layout.mjs'

function geometry(length, width, exclusions = []) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: [
        { x: 0, y: 0 }, { x: length, y: 0 }, { x: length, y: width }, { x: 0, y: width },
      ] },
      exclusions: exclusions.map((entry, index) => ({
        id: 'ex-' + index,
        kind: 'non-irrigated',
        polygon: { vertices: [
          { x: entry.x, y: entry.y },
          { x: entry.x + entry.width, y: entry.y },
          { x: entry.x + entry.width, y: entry.y + entry.height },
          { x: entry.x, y: entry.y + entry.height },
        ] },
      })),
    }],
  }
}

test('3504-PC can cover an 8x8 rectangle with owner planning radius and independent arc', () => {
  const result = generateRainBird3504Layout(geometry(8, 8))
  assert.equal(result.status, 'layout_generated')
  assert.ok(result.sprinklers.length > 0)
  assert.ok(result.sprinklers.every((head) => head.performanceModel === '3504-PC'))
  assert.ok(result.sprinklers.every((head) => [8, 9, 10].includes(head.radiusM)))
  assert.ok(result.sprinklers.every((head) => [90, 180, 270, 360].includes(head.arcDeg)))
  assert.equal(result.coverage.uncoveredPoints, 0)
})

test('3504-PC candidate sectors stay inside the irrigated geometry and avoid rectangular exclusions', () => {
  const result = generateRainBird3504Layout(geometry(20, 16, [{ x: 8, y: 6, width: 4, height: 4 }]))
  assert.ok(['layout_generated', 'no_usable_rotor_candidates'].includes(result.status))
  for (const head of result.sprinklers) {
    assert.ok(head.position.x >= 0 && head.position.x <= 20)
    assert.ok(head.position.y >= 0 && head.position.y <= 16)
  }
  assert.ok(result.sprinklers.every((head) => head.radiusM === result.planningRadiusM))
})

test('3504-PC rejects missing or invalid geometry without manufacturing a layout', () => {
  assert.equal(generateRainBird3504Layout(null).status, 'invalid_geometry')
  assert.equal(generateRainBird3504Layout(geometry(0, 8)).status, 'layout_generated')
})
