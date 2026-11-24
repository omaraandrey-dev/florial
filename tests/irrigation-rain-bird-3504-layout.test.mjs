import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3504Layout } from '../src/lib/irrigation/rainBird3504Layout.mjs'

function geometry(length, width) {
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

function assertCellCorners(result) {
  const sprinklerIds = new Set(result.sprinklers.map((head) => head.id))
  for (const cell of result.cells) {
    assert.equal(cell.cornerHeadIds.length, 4)
    assert.equal(new Set(cell.cornerHeadIds).size, 4)
    for (const id of cell.cornerHeadIds) assert.ok(sprinklerIds.has(id))
  }
}

test('38x16 uses an 8m corner-first grid with every cell corner required and shared corners deduplicated', () => {
  const result = generateRainBird3504Layout(geometry(38, 16))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.equal(result.sprinklers.length, 18)
  assert.equal(result.cells.length, 10)
  assert.equal(result.grid.columns, 6)
  assert.equal(result.grid.rows, 3)
  assert.equal(result.candidateStats.sharedCellCornersDeduplicated, 22)
  assert.ok(result.sprinklers.every((head) => head.radiusM === 8))
  assertCellCorners(result)
})

test('10x10 starts with four outer corner heads and fills the four shared cell corners without duplicates', () => {
  const result = generateRainBird3504Layout(geometry(10, 10))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.equal(result.sprinklers.length, 9)
  assert.equal(result.cells.length, 4)
  assert.equal(result.candidateStats.sharedCellCornersDeduplicated, 7)
  assert.equal(result.sprinklers.filter((head) => head.source === 'vertex').length, 4)
  assertCellCorners(result)
})

test('8x8 is one square with exactly four mandatory corner rotors', () => {
  const result = generateRainBird3504Layout(geometry(8, 8))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.sprinklers.length, 4)
  assert.equal(result.cells.length, 1)
  assert.deepEqual(result.sprinklers.map((head) => head.arcDeg), [90, 90, 90, 90])
  assert.equal(result.headToHead.passed, true)
  assertCellCorners(result)
})

test('38x6 refines the long axis to keep every adjacent pair inside mutual Head-to-Head reach', () => {
  const result = generateRainBird3504Layout(geometry(38, 6))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.planningRadiusM, 8)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.ok(result.headToHead.checks.every((entry) => entry.passed))
  assertCellCorners(result)
})

test('3504-PC rejects missing, too narrow, excluded or invalid rectangle geometry', () => {
  assert.equal(generateRainBird3504Layout(null).status, 'invalid_geometry')
  assert.equal(generateRainBird3504Layout(geometry(0, 8)).status, 'invalid_geometry')
  assert.equal(generateRainBird3504Layout(geometry(4, 18)).status, 'no_usable_rotor_candidates')
  const withExclusion = geometry(20, 16)
  withExclusion.regions[0].exclusions = [{ polygon: { vertices: [
    { x: 8, y: 6 }, { x: 12, y: 6 }, { x: 12, y: 10 }, { x: 8, y: 10 },
  ] } }]
  assert.equal(generateRainBird3504Layout(withExclusion).status, 'invalid_geometry')
})
