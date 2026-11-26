import test from 'node:test'
import assert from 'node:assert/strict'
import { optimizeGlobalSprinklerSet } from '../src/lib/irrigation/globalSprinklerOptimization.mjs'

function squareGeometry(size = 10) {
  return {
    status: 'confirmed',
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: [
        { x: 0, y: 0 }, { x: size, y: 0 },
        { x: size, y: size }, { x: 0, y: size },
      ] },
      exclusions: [],
    }],
  }
}

function rotor(id, x, y, options = {}) {
  return {
    id,
    position: { x, y },
    arcDeg: options.arcDeg ?? 360,
    directionDeg: options.directionDeg ?? null,
    radiusM: options.radiusM ?? 20,
    performanceModel: '3504-PC',
    pattern: 'rotor',
    calculationRegionId: 'zone-a',
  }
}

test('global removal reduces redundant 3504-PC heads and never removes the fixed R-VAN head', () => {
  const rotors = [
    rotor('r1', 2, 2),
    rotor('r2', 8, 2),
    rotor('r3', 8, 8),
    rotor('r4', 2, 8),
  ]
  const fixedRvan = {
    id: 'fixed-rvan',
    position: { x: 5, y: 5 },
    arcDeg: 360,
    directionDeg: null,
    radiusM: 20,
    performanceModel: 'R-VAN24',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const baseline = [...rotors, fixedRvan]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
  })

  assert.equal(result.status, 'completed')
  assert.ok(result.removedHeadIds.length >= 2)
  assert.equal(result.sprinklers.filter((head) => head.performanceModel === '3504-PC').length, 1)
  assert.equal(result.sprinklers.find((head) => head.id === 'fixed-rvan'), fixedRvan)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
})

test('same-position rotors can consolidate into one 360-degree rotor without moving the head', () => {
  const first = rotor('corner-a', 5, 5, { arcDeg: 180, directionDeg: 0 })
  const second = rotor('corner-b', 5, 5, { arcDeg: 180, directionDeg: 180 })
  const fixedRvan = {
    id: 'fixed-rvan',
    position: { x: 5, y: 6 },
    arcDeg: 360,
    directionDeg: null,
    radiusM: 1,
    performanceModel: 'R-VAN18',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const baseline = [first, second, fixedRvan]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.consolidatedGroups.length, 1)
  assert.equal(result.consolidatedGroups[0].arcDeg, 360)
  assert.deepEqual(result.consolidatedGroups[0].position, { x: 5, y: 5 })
  assert.equal(result.sprinklers.filter((head) => head.performanceModel === '3504-PC').length, 1)
  assert.equal(result.sprinklers.find((head) => head.id === 'fixed-rvan'), fixedRvan)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
})

test('global optimization explicitly skips target grids above 30,000 points', () => {
  const result = optimizeGlobalSprinklerSet({
    sprinklers: [],
    geometry: squareGeometry(100),
    parts: [],
    sampleStepM: 0.5,
  })
  assert.equal(result.status, 'skipped_target_limit')
  assert.equal(result.coverage, null)
  assert.equal(result.sprinklers.length, 0)
})

test('global target map excludes the full boundary of rectangular exclusions', () => {
  const geometry = squareGeometry()
  geometry.regions[0].exclusions = [{
    id: 'pool',
    polygon: { vertices: [
      { x: 4, y: 4 }, { x: 6, y: 4 },
      { x: 6, y: 6 }, { x: 4, y: 6 },
    ] },
  }]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: [],
    geometry,
    parts: [],
    sampleStepM: 0.5,
  })
  assert.equal(result.status, 'baseline_failed')
  assert.equal(result.targetCount, 416)
  assert.ok(result.coverage.uncoveredPoints > 0)
})

test('an incomplete global baseline is preserved and is not optimized', () => {
  const incomplete = rotor('too-short', 5, 5, { radiusM: 1 })
  const result = optimizeGlobalSprinklerSet({
    sprinklers: [incomplete],
    geometry: squareGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: [incomplete] } }],
    oversprayCheck: () => true,
  })
  assert.equal(result.status, 'baseline_failed')
  assert.deepEqual(result.sprinklers, [incomplete])
  assert.ok(result.coverage.uncoveredPoints > 0)
  assert.deepEqual(result.removedHeadIds, [])
})
