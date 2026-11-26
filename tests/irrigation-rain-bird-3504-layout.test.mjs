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

function coordinateKey(point) {
  return point.x.toFixed(5) + ':' + point.y.toFixed(5)
}

test('8x8 square starts and finishes with exactly four corner rotors', () => {
  const result = generateRainBird3504Layout(geometry(8, 8))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layoutStrategy, 'four-corners-first')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.sprinklers.length, 4)
  assert.equal(result.grid?.cornerPositionsPerCell, 4)
  assert.equal(result.grid?.uniqueCornerPositions, 4)
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
  assert.ok(result.sprinklers.every((head) =>
    head.performanceModel === '3504-PC' && head.pattern === 'rotor' &&
    head.arcDeg === 90 && head.radiusM === 8))
  assert.deepEqual(
    result.sprinklers.map((head) => coordinateKey(head.position)).sort(),
    ['0.00000:0.00000', '0.00000:8.00000', '8.00000:0.00000', '8.00000:8.00000'].sort(),
  )
})

test('10x10 square uses the preferred 8m corner radius without extending to 10m', () => {
  const result = generateRainBird3504Layout(geometry(10, 10))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layoutStrategy, 'corner-first-shared-cell-grid')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.sprinklers.length, 9)
  assert.equal(result.sprinklers.filter((head) => head.radiusM === 8).length, 4)
  assert.ok(result.sprinklers.some((head) => head.radiusM === 5))
  assert.ok(result.sprinklers.every((head) => head.radiusM !== 10))
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
})

test('38x16 rectangle uses a shared corner grid with four positions per cell and no duplicated shared corners', () => {
  const result = generateRainBird3504Layout(geometry(38, 16))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layoutStrategy, 'corner-first-shared-cell-grid')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.grid?.columns, 5)
  assert.equal(result.grid?.rows, 2)
  assert.equal(result.grid?.cells, 10)
  assert.equal(result.grid?.cornerPositionsPerCell, 4)
  assert.equal(result.grid?.uniqueCornerPositions, 18)
  assert.equal(result.sprinklers.length, 18)
  assert.equal(new Set(result.sprinklers.map((head) => coordinateKey(head.position))).size, 18)
  assert.ok(result.sprinklers.every((head) => head.radiusM === 8))
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
  assert.ok(result.headToHead.checks.length >= 22)
})

test('20x10 rectangle expands to a 5m supplemental grid only after larger stages fail', () => {
  const result = generateRainBird3504Layout(geometry(20, 10))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.supplementalRadiusM, 5)
  assert.equal(result.grid?.cells, 8)
  assert.equal(result.sprinklers.length, 15)
  assert.equal(result.sprinklers.filter((head) => head.radiusM === 8 && head.source === 'vertex').length, 4)
  assert.ok(result.sprinklers.filter((head) => head.source !== 'vertex').every((head) => head.radiusM === 5))
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
})

test('local clearances reduce rotor radii without breaking adjacent head-to-head links', () => {
  const result = generateRainBird3504Layout(geometry(18, 14))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.supplementalRadiusM, 7)
  assert.equal(result.sprinklers.filter((head) => head.radiusM === 8 && head.source === 'vertex').length, 4)
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
  assert.ok(result.sprinklers.every((head) => [5, 6, 7, 8].includes(head.radiusM)))
  assert.ok(result.sprinklers.filter((head) => head.source !== 'vertex').every((head) => [5, 6, 7].includes(head.radiusM)))
  assert.ok(result.sprinklers.some((head) => head.radiusM === 7))
  assert.ok(result.sprinklers.every((head) => head.radiusM !== 10))
})

test('3504-PC corner-first placement keeps rotor positions on the true rectangle corners', () => {
  const result = generateRainBird3504Layout(geometry(12, 14))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
  assert.ok(result.sprinklers.every((head) =>
    head.position.x >= 0 && head.position.x <= 12 &&
    head.position.y >= 0 && head.position.y <= 14))
  assert.ok(result.sprinklers.some((head) => head.source === 'vertex'))
})

test('3504-PC rejects unsupported exclusions and invalid geometry without manufacturing a layout', () => {
  assert.equal(generateRainBird3504Layout(null).status, 'invalid_geometry')
  assert.equal(generateRainBird3504Layout(geometry(0, 8)).status, 'invalid_geometry')
  assert.equal(generateRainBird3504Layout(geometry(20, 16, [
    { x: 8, y: 6, width: 4, height: 4 },
  ])).status, 'invalid_geometry')
})

test('17x17 square selects five inward rotors with the exact 8.5m geometric radius', () => {
  const result = generateRainBird3504Layout(geometry(17, 17))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layoutStrategy, 'four-side-midpoints-and-center')
  assert.equal(result.sprinklers.length, 5)
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.coverage?.coveragePercent, 100)
  assert.equal(result.headToHead?.passed, true)
  assert.deepEqual(
    result.sprinklers.map((head) => head.arcDeg).sort((a, b) => a - b),
    [180, 180, 180, 180, 360],
  )
  assert.ok(result.sprinklers.every((head) => Math.abs(head.radiusM - 8.5) < 1e-9))
  assert.ok(result.sprinklers.every((head) =>
    head.position.x >= 0 && head.position.x <= 17 &&
    head.position.y >= 0 && head.position.y <= 17))
})

test('fractional dimensions produce an unrounded continuous rotor radius', () => {
  const result = generateRainBird3504Layout(geometry(17.2, 17.2))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layoutStrategy, 'four-side-midpoints-and-center')
  assert.equal(result.sprinklers.length, 5)
  assert.equal(result.coverage?.uncoveredPoints, 0)
  assert.equal(result.headToHead?.passed, true)
  assert.ok(result.sprinklers.every((head) => Math.abs(head.radiusM - 8.6) < 1e-9))
})
