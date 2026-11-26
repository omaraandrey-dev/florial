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

function reflexLGeometry() {
  return {
    status: 'confirmed',
    regions: [{
      id: 'lawn-reflex',
      boundary: { vertices: [
        { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 4 },
        { x: 4, y: 4 }, { x: 4, y: 8 }, { x: 0, y: 8 },
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

test('global optimization preserves symmetric rotor groups and fixed R-VAN and strip heads', () => {
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
  const fixedStrip = {
    id: 'fixed-strip',
    position: { x: 0, y: 0 },
    stripBounds: { minX: 0, maxX: 1, minY: 0, maxY: 10 },
    stripAxis: 'vertical',
    stripDirection: 'both',
    stripLengthM: 10,
    performanceModel: 'R-VAN-SST',
    pattern: 'strip',
    radiusM: null,
    calculationRegionId: 'zone-a',
  }
  const baseline = [...rotors, fixedRvan, fixedStrip]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.removedHeadIds.length, 0)
  assert.equal(result.sprinklers.filter((head) => head.performanceModel === '3504-PC').length, 4)
  assert.equal(result.sprinklers.find((head) => head.id === 'fixed-rvan'), fixedRvan)
  assert.equal(result.sprinklers.find((head) => head.id === 'fixed-strip'), fixedStrip)
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

test('a reflex corner prefers one inward 270-degree rotor at the shared coordinate', () => {
  const first = rotor('corner-a', 4, 4, { arcDeg: 90, directionDeg: 135, radiusM: 6 })
  const second = rotor('corner-b', 4, 4, { arcDeg: 90, directionDeg: 225, radiusM: 6 })
  const smallNeighbor = {
    id: 'rvan-near-corner',
    position: { x: 3, y: 4 },
    arcDeg: 360,
    radiusM: 1,
    performanceModel: 'R-VAN14',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const largeNeighbor = {
    id: 'rvan-se-arm',
    position: { x: 6, y: 2 },
    arcDeg: 360,
    radiusM: 4,
    performanceModel: 'R-VAN18',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const largeNeighborMate = {
    id: 'rvan-se-mate',
    position: { x: 5, y: 2 },
    arcDeg: 360,
    radiusM: 1,
    performanceModel: 'R-VAN14',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const baseline = [first, second, smallNeighbor, largeNeighbor, largeNeighborMate]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: reflexLGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: (heads) => heads.every((head) =>
      head.id !== 'corner-a' || head.arcDeg !== 270 || head.directionDeg === 180),
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.consolidatedGroups.length, 1)
  assert.equal(result.consolidatedGroups[0].arcDeg, 270)
  const replacement = result.sprinklers.find((head) => head.id === 'corner-a')
  assert.deepEqual(replacement.position, { x: 4, y: 4 })
  assert.equal(replacement.directionDeg, 180)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
})

test('sector search stops at the configured variant cap and reports the limit', () => {
  const first = rotor('corner-a', 5, 5, { arcDeg: 180, directionDeg: 0 })
  const second = rotor('corner-b', 5, 5, { arcDeg: 180, directionDeg: 180 })
  const fixedRvan = {
    id: 'fixed-rvan',
    position: { x: 5, y: 6 },
    arcDeg: 360,
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
    maxSectorVariants: 1,
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.sectorVariants, 1)
  assert.equal(result.sectorVariantLimitReached, true)
  assert.equal(result.consolidatedGroups.length, 0)
  assert.equal(result.sprinklers.length, baseline.length)
})

test('a single-head sector edit is rejected unless it enables another rotor removal', () => {
  const onlyRotor = rotor('only-rotor', 2, 2, { arcDeg: 180, directionDeg: 0 })
  const fixedRvan = {
    id: 'fixed-rvan',
    position: { x: 5, y: 5 },
    arcDeg: 360,
    radiusM: 20,
    performanceModel: 'R-VAN24',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const baseline = [onlyRotor, fixedRvan]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
  })

  assert.equal(result.status, 'completed')
  assert.deepEqual(result.sectorEdits, [])
  assert.equal(result.sprinklers.find((head) => head.id === 'only-rotor').arcDeg, 180)
  assert.equal(result.sprinklers.find((head) => head.id === 'fixed-rvan'), fixedRvan)
})

test('an incomplete global baseline is preserved and is not optimized', () => {
  const incomplete = rotor('too-short', 5, 5, { radiusM: 1 })
  const result = optimizeGlobalSprinklerSet({
    sprinklers: [incomplete],
    geometry: reflexLGeometry(),
    parts: [{ id: 'zone-a', layout: { sprinklers: [incomplete] } }],
    oversprayCheck: () => true,
  })
  assert.equal(result.status, 'baseline_failed')
  assert.deepEqual(result.sprinklers, [incomplete])
  assert.ok(result.coverage.uncoveredPoints > 0)
  assert.deepEqual(result.removedHeadIds, [])
})


function squareGridSeed(size) {
  const axis = size === 16 ? [0, 8, 16] : size === 17 ? [0, 8, 9, 17] : [0, 8, 12, 20]
  const heads = []
  for (let row = 0; row < axis.length; row += 1) {
    for (let column = 0; column < axis.length; column += 1) {
      const x = axis[column]
      const y = axis[row]
      const left = column === 0
      const right = column === axis.length - 1
      const bottom = row === 0
      const top = row === axis.length - 1
      let arcDeg = 360
      let directionDeg = null
      if ((left || right) && (bottom || top)) {
        arcDeg = 90
        directionDeg = left ? (bottom ? 45 : 315) : (bottom ? 135 : 225)
      } else if (bottom || top) {
        arcDeg = 180
        directionDeg = bottom ? 90 : 270
      } else if (left || right) {
        arcDeg = 180
        directionDeg = left ? 0 : 180
      }
      heads.push({
        id: `grid-${row}-${column}`,
        position: { x, y },
        arcDeg,
        directionDeg,
        radiusM: 8,
        performanceModel: '3504-PC',
        pattern: 'rotor',
        calculationRegionId: 'zone-a',
      })
    }
  }
  return heads
}

test('16x16 square is globally reconfigured to four side-midpoint rotors and one centre rotor', () => {
  const baseline = squareGridSeed(16)
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(16),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
    maxSectorVariants: 0,
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.reconfiguration.seed, 'whole-rectangle-five-head-balanced-layout')
  assert.equal(result.sprinklers.length, 5)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
  assert.equal(result.denserValidation.status, 'passed')
  assert.equal(result.denserValidation.sampleStepM, 0.25)
  const expected = [
    { x: 8, y: 0, arcDeg: 180, directionDeg: 90 },
    { x: 16, y: 8, arcDeg: 180, directionDeg: 180 },
    { x: 8, y: 16, arcDeg: 180, directionDeg: 270 },
    { x: 0, y: 8, arcDeg: 180, directionDeg: 0 },
    { x: 8, y: 8, arcDeg: 360, directionDeg: null },
  ]
  for (const item of expected) {
    assert.ok(result.sprinklers.some((head) =>
      head.position.x === item.x && head.position.y === item.y &&
      head.arcDeg === item.arcDeg && head.directionDeg === item.directionDeg))
  }
  assert.equal(result.sprinklers.some((head) =>
    (head.position.x === 0 || head.position.x === 16) &&
    (head.position.y === 0 || head.position.y === 16)), false)
})

for (const size of [17, 20]) {
  test(`${size}x${size} square optimization preserves reflection symmetry and equal side counts`, () => {
    const baseline = squareGridSeed(size)
    const result = optimizeGlobalSprinklerSet({
      sprinklers: baseline,
      geometry: squareGeometry(size),
      parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
      oversprayCheck: () => true,
      maxSectorVariants: 0,
    })

    assert.equal(result.status, 'completed')
    assert.equal(result.coverage.uncoveredPoints, 0)
    assert.equal(result.headToHead.passed, true)
    const positions = result.sprinklers.map((head) => head.position)
    for (const point of positions) {
      assert.ok(positions.some((other) =>
        Math.abs(other.x - (size - point.x)) < 1e-6 &&
        Math.abs(other.y - point.y) < 1e-6))
      assert.ok(positions.some((other) =>
        Math.abs(other.x - point.x) < 1e-6 &&
        Math.abs(other.y - (size - point.y)) < 1e-6))
    }
    const sideCounts = [
      positions.filter((point) => Math.abs(point.y) < 1e-6).length,
      positions.filter((point) => Math.abs(point.x - size) < 1e-6).length,
      positions.filter((point) => Math.abs(point.y - size) < 1e-6).length,
      positions.filter((point) => Math.abs(point.x) < 1e-6).length,
    ]
    assert.equal(new Set(sideCounts).size, 1)
  })
}


test('nearby circular R-VAN heads can be replaced by a newly positioned 3504-PC rotor', () => {
  const clustered = [
    { id: 'rv-a', position: { x: 4, y: 4 } },
    { id: 'rv-b', position: { x: 6, y: 4 } },
    { id: 'rv-c', position: { x: 4, y: 6 } },
    { id: 'rv-d', position: { x: 6, y: 6 } },
  ].map(({ id, position }) => ({
    id,
    position,
    arcDeg: 360,
    directionDeg: null,
    radiusM: 3,
    performanceModel: 'R-VAN18',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }))
  const fixed = {
    id: 'rv-fixed',
    position: { x: 5, y: 5 },
    arcDeg: 360,
    directionDeg: null,
    radiusM: 9,
    performanceModel: 'R-VAN24',
    pattern: 'circular',
    calculationRegionId: 'zone-a',
  }
  const baseline = [...clustered, fixed]
  const result = optimizeGlobalSprinklerSet({
    sprinklers: baseline,
    geometry: squareGeometry(10),
    parts: [{ id: 'zone-a', layout: { sprinklers: baseline } }],
    oversprayCheck: () => true,
    maxSectorVariants: 0,
  })

  assert.equal(result.status, 'completed')
  assert.ok(result.reconfiguration.replacedRvanGroups.length > 0)
  assert.ok(result.sprinklers.some((head) =>
    head.performanceModel === '3504-PC' &&
    head.id.startsWith('global-v2-rvan-replacement-')))
  assert.ok(result.sprinklers.filter((head) =>
    String(head.performanceModel).startsWith('R-VAN')).length < baseline.length)
  assert.equal(result.coverage.uncoveredPoints, 0)
  assert.equal(result.headToHead.passed, true)
})


test('dense final coverage validation reports its point cap without implying it ran', () => {
  const head = rotor('wide-head', 35, 35, { radiusM: 100 })
  const result = optimizeGlobalSprinklerSet({
    sprinklers: [head],
    geometry: squareGeometry(70),
    parts: [],
    oversprayCheck: () => true,
  })
  assert.equal(result.status, 'completed')
  assert.equal(result.denserValidation.status, 'skipped_target_limit')
  assert.equal(result.denserValidation.coverage, null)
})
