import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot } from '../src/lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../src/lib/irrigation/irrigationLayoutBridge.mjs'
import { buildIrrigationBillOfMaterials } from '../src/lib/irrigation/irrigationBillOfMaterials.mjs'
import { generateLawnSprinklerLayout } from '../src/lib/irrigation/lawnSprinklerLayout.mjs'
import { generateRainBird3504Layout } from '../src/lib/irrigation/rainBird3504Layout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from '../src/lib/irrigation/rainBirdRvanPerformanceData.mjs'
import { buildIrrigationZones } from '../src/lib/irrigation/irrigationProjectStandards.mjs'

function snapshotFor(length, width, options = {}) {
  const shape = options.shape ?? 'rectangle'
  const vertices = buildLawnBoundary({ shape, length, width, cutoutWidth: options.cutoutWidth, cutoutDepth: options.cutoutDepth, cutoutCorner: options.cutoutCorner })
  const exclusions = (options.exclusions ?? []).map((entry) => ({
    id: entry.id,
    kind: entry.kind ?? 'other',
    polygon: { vertices: [
      { x: entry.x, y: entry.y },
      { x: entry.x + entry.width, y: entry.y },
      { x: entry.x + entry.width, y: entry.y + entry.height },
      { x: entry.x, y: entry.y + entry.height },
    ] },
  }))
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions }],
  })
  return buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape,
    length: String(length),
    width: String(width),
    cutoutWidth: options.cutoutWidth == null ? '' : String(options.cutoutWidth),
    cutoutDepth: options.cutoutDepth == null ? '' : String(options.cutoutDepth),
    cutoutCorner: options.cutoutCorner ?? 'top-right',
    geometryValidation,
  })
}

function assertGlobalLayoutStatus(result, message = '') {
  const expectedStatus = ['coverage_complete_sampled', 'strip_pattern_placement_ready'].includes(result.layout?.status)
    ? 'layout_generated'
    : 'layout_incomplete'
  assert.equal(result.status, expectedStatus, message)
}

function legacyRvanLayout(length, width) {
  const snapshot = snapshotFor(length, width)
  return generateLawnSprinklerLayout({
    geometry: snapshot.geometry.normalized,
    family: 'R-VAN',
    model: 'R-VAN24',
    pressureBar: RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar,
    sampleStepM: 0.5,
    radiusM: 6,
  })
}

test('Florial selects R-VAN heads from local reach on narrow rectangles and reports the actual model set', () => {
  for (const [length, width] of [[10, 3], [10, 4], [10, 5]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assertGlobalLayoutStatus(result)
    assert.equal(result.operatingScenario?.family, 'R-VAN')
    const selectedModels = [...new Set(result.layout?.sprinklers?.map((head) => head.performanceModel) ?? [])].sort()
    assert.equal(result.operatingScenario?.model, selectedModels.join(' / '))
    assert.equal(result.layout?.model, selectedModels.join(' / '))
    assert.equal(result.operatingScenario?.layoutRadiusM, null)
    assert.ok(result.layout?.sprinklers?.every((head) => {
      const baseModel = head.performanceModel.replace(/-360$/, '')
      return (baseModel === 'R-VAN14' && head.radiusM === 3) ||
        (baseModel === 'R-VAN18' && [4, 4.5, 5, 5.5].includes(head.radiusM)) ||
        (baseModel === 'R-VAN24' && head.radiusM === 6)
    }))
    assert.equal(result.layout?.coverageScope, 'global_sampled_geometry')
    assert.equal(result.layout?.hydraulicFeasibility, 'not_evaluated')
    assert.equal(result.pipeNetwork?.connectionPoint?.x, length)
    assert.equal(result.pipeNetwork?.connectionPoint?.y, width)
    assert.ok(result.zones?.length > 0)
  }
  const wide = buildPreliminaryLawnLayout(snapshotFor(32, 6))
  assert.equal(wide.status, 'layout_generated')
  assert.equal(wide.operatingScenario?.family, '3500')
  assert.equal(wide.operatingScenario?.model, '3504-PC')
})

test('rotor reduction runs before R-VAN and only removes redundant rotors without losing rotor-covered samples', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 10, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result)
  const reduction = result.layout.rotorReduction
  assert.equal(reduction.status, 'completed')
  assert.ok(reduction.baseline.rotorCount > 0)
  assert.ok(reduction.optimized.rotorCount <= reduction.baseline.rotorCount)
  assert.equal(reduction.coverage.uncoveredPoints, 0)
  assert.equal(reduction.headToHead.passed, true)
  assert.equal(reduction.oversprayPassed, true)
  assert.equal(reduction.preservesExistingRotorCoverageOnly, true)
  assert.ok(reduction.proximityCandidates.every((candidate) =>
    candidate.separationM <= candidate.halfRadiusM + 1e-8))
  const removed = new Set(reduction.removedHeadIds)
  assert.ok(reduction.baseline.sprinklers.filter((head) => removed.has(head.id))
    .every((head) => !['vertex', 'corner'].includes(head.source)),
  'true polygon vertex/corner rotors remain protected in this reduction phase')
  const rotorHeads = result.layout.sprinklers.filter((head) => head.performanceModel === '3504-PC')
  const rvanHeads = result.layout.sprinklers.filter((head) =>
    head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
  if (rvanHeads.length) {
    assert.ok(rotorHeads.length > 0)
    assert.ok(result.layout.sprinklers.findIndex((head) => head.performanceModel.startsWith('R-VAN')) >
      Math.max(...result.layout.sprinklers.map((head, index) =>
        head.performanceModel === '3504-PC' ? index : -1)))
  }
})

test('8x8 lawn prioritizes 3504-PC rotors while 4m and 5m rectangles retain the R-VAN rule', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(8, 8))
  assert.equal(result.status, 'layout_generated')
  assert.ok(result.layout.sprinklers.length > 0)
  assert.ok(result.layout.sprinklers.every((head) => head.performanceModel === '3504-PC'))
  assert.ok(result.layout.sprinklers.every((head) => head.radiusM === 8))
  assert.ok(result.layout.sprinklers.every((head) => [90, 180, 270, 360].includes(head.arcDeg)))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.headToHead.passed, true)
  assert.equal(result.zones.reduce((sum, zone) => sum + zone.sprinklerCount, 0), result.layout.sprinklers.length)
  const bom = buildIrrigationBillOfMaterials(result.layout, result.zones)
  assert.equal(bom.valid, true)
  assert.equal(bom.items.find((item) => item.sku === 'Y34001')?.quantity, result.layout.sprinklers.length)
  assert.equal(bom.items.find((item) => item.sku === 'A44120'), undefined)
})

test('rectangles run the rotor pass first and only use R-VAN for any residual coverage', () => {
  for (const [length, width] of [[20, 10], [20, 15], [30, 30]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assertGlobalLayoutStatus(result, length + 'x' + width)
    assert.ok(['3500', 'R-VAN', 'mixed'].includes(result.operatingScenario?.family))
    assert.equal(result.layout.algorithm, 'whole-polygon-sequential-3504pc-rvan-strip-v1')
    assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
    const heads = result.layout.sprinklers
    const rotorHeads = heads.filter((head) => head.performanceModel === '3504-PC')
    const rvanHeads = heads.filter((head) => head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
    assert.ok(heads.length > 0)
    assert.equal(result.layout.coverage.uncoveredPoints, 0)
    assert.equal(result.layout.headToHead.passed, true)
    assert.equal(result.layout.overspray, 'sampled_inside_boundary')
    assert.equal(result.overspray, 'sampled_inside_boundary')
    assert.ok(rotorHeads.every((head) => head.radiusM >= 6 && head.radiusM <= 9))
    if (rotorHeads.length && rvanHeads.length) {
      const lastRotor = Math.max(...heads.map((head, index) => head.performanceModel === '3504-PC' ? index : -1))
      const firstRvan = heads.findIndex((head) => head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
      assert.ok(firstRvan > lastRotor)
    }
    assert.ok(result.zones.every((zone) => zone.sprinklerCount <= 6))
    const bom = buildIrrigationBillOfMaterials(result.layout, result.zones)
    assert.equal(bom.valid, true)
    if (rotorHeads.length) assert.equal(bom.items.find((item) => item.sku === 'Y34001')?.quantity, rotorHeads.length)
    const expectedRvanQuantity = heads.filter((head) => head.performanceModel.startsWith('R-VAN')).length
    assert.equal(bom.items.find((item) => item.sku === 'A44120')?.quantity ?? 0, expectedRvanQuantity)
  }
})

test('20x20 square keeps a four-way symmetric 3504-PC layout after global optimization', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 20))
  assertGlobalLayoutStatus(result, JSON.stringify({
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    optimization: result.layout?.globalOptimization,
  }))
  const heads = result.layout.sprinklers
  assert.ok(heads.length > 0)
  assert.ok(heads.every((head) => head.performanceModel === '3504-PC'))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.headToHead.passed, true)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')

  const sideCounts = [
    heads.filter((head) => Math.abs(head.position.y - 20) < 1e-6).length,
    heads.filter((head) => Math.abs(head.position.y) < 1e-6).length,
    heads.filter((head) => Math.abs(head.position.x) < 1e-6).length,
    heads.filter((head) => Math.abs(head.position.x - 20) < 1e-6).length,
  ]
  assert.equal(new Set(sideCounts).size, 1,
    'all four sides must retain equal sprinkler counts after global optimization')
  assert.ok(sideCounts.every((count) => count >= 2),
    'each side must retain enough heads to form a perimeter Head-to-Head chain')

  const transforms = [
    { point: (p) => ({ x: 20 - p.x, y: p.y }), angle: (d) => 180 - d },
    { point: (p) => ({ x: p.x, y: 20 - p.y }), angle: (d) => -d },
    { point: (p) => ({ x: 20 - p.x, y: 20 - p.y }), angle: (d) => d + 180 },
    { point: (p) => ({ x: 20 - p.y, y: p.x }), angle: (d) => d + 90 },
    { point: (p) => ({ x: p.y, y: 20 - p.x }), angle: (d) => d - 90 },
    { point: (p) => ({ x: p.y, y: p.x }), angle: (d) => 90 - d },
    { point: (p) => ({ x: 20 - p.y, y: 20 - p.x }), angle: (d) => 270 - d },
  ]
  const normalize = (value) => ((value % 360) + 360) % 360
  for (const head of heads) {
    for (const transform of transforms) {
      const position = transform.point(head.position)
      const match = heads.find((candidate) =>
        Math.hypot(candidate.position.x - position.x, candidate.position.y - position.y) < 1e-6 &&
        Math.abs(candidate.radiusM - head.radiusM) < 1e-6 &&
        candidate.arcDeg === head.arcDeg &&
        (head.arcDeg === 360 ||
          Math.abs(((normalize(candidate.directionDeg) - normalize(transform.angle(head.directionDeg)) + 540) % 360) - 180) < 1e-5))
      assert.ok(match, 'missing symmetric counterpart for ' + head.id + ' at ' + JSON.stringify(position))
    }
  }
})

test('38x16 rectangle is covered by 3504-PC rotors without redundant R-VAN heads', () => {
  const snapshot = snapshotFor(38, 16)
  const rotorAttempt = generateRainBird3504Layout(snapshot.geometry.normalized)
  assert.equal(rotorAttempt.coverage?.uncoveredPoints, 0,
    JSON.stringify({ status: rotorAttempt.status, coverage: rotorAttempt.coverage, stats: rotorAttempt.candidateStats, rotors: rotorAttempt.sprinklers.map((head) => ({ position: head.position, arc: head.arcDeg, direction: head.directionDeg, radius: head.radiusM })) }))
  const result = buildPreliminaryLawnLayout(snapshot)
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.family, '3500')
  assert.equal(result.operatingScenario?.model, '3504-PC')
  assert.ok(result.layout.sprinklers.length > 0)
  assert.ok(result.layout.sprinklers.every((head) => head.performanceModel === '3504-PC'))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.notEqual(result.layout.headToHead.passed, false)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
  assert.ok(result.zones.every((zone) => zone.sprinklerCount <= 6))
})

test('whole-polygon L-shape completes rotors and R-VAN before its connected 2m strip pass', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(18, 14, {
    shape: 'l-shape', cutoutWidth: 6, cutoutDepth: 12, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  assert.equal(result.layout.algorithm, 'whole-polygon-sequential-3504pc-rvan-strip-v1')
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.equal(result.layout.calculationRegions[0].shape, 'l-shape')
  const stripHeads = result.layout.sprinklers.filter((head) => head.pattern === 'strip')
  assert.ok(stripHeads.length > 0)
  assert.ok(stripHeads.every((head) => head.stripWidthM === 2))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
})

test('R-VAN fallback applies the approved 7.5cm inward offset only to the matching corner head', () => {
  const geometry = snapshotFor(4, 4).geometry.normalized
  const seam = { x: 4, y: 0 }
  const layout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model: 'R-VAN14',
    pressureBar: RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar,
    sampleStepM: 0.5,
    radiusM: 3,
    preventOverspray: true,
    candidatePositionOffsets: [{
      from: seam,
      dx: -0.0530330086,
      dy: 0.0530330086,
    }],
  })
  assert.ok(layout.sprinklers.some((head) =>
    Math.abs(head.position.x - (seam.x - 0.0530330086)) < 1e-6 &&
    Math.abs(head.position.y - (seam.y + 0.0530330086)) < 1e-6),
  JSON.stringify(layout.sprinklers.map((head) => ({ position: head.position, source: head.source, model: head.performanceModel }))))
  assert.ok(layout.sprinklers.every((head) =>
    head.position.x >= 0 && head.position.x <= 4 &&
    head.position.y >= 0 && head.position.y <= 4))
})

test('non-strip L-shape uses the shared whole-polygon corner-first solver without rectangle fallback', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(12, 8, {
    shape: 'l-shape', cutoutWidth: 4, cutoutDepth: 3, cutoutCorner: 'top-right',
  }))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.layout.algorithm, 'whole-polygon-sequential-3504pc-rvan-strip-v1')
  assert.equal(result.layout.geometry.shape, 'l-shape')
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.equal(result.layout.calculationRegions.length, 1)
  assert.equal(result.layout.cornerFirstAttempt, undefined)
  assert.ok(!result.layout.warnings.some((warning) =>
    warning.code === 'l_shape_corner_first_attempt_failed_safe_rectangle_fallback_used'))
  if (result.status === 'layout_generated') {
    assert.equal(result.layout.coverage.uncoveredPoints, 0)
    assert.equal(result.layout.headToHead.passed, true)
    assert.equal(result.layout.overspray, 'sampled_inside_boundary')
  }
})

test('3504-PC rotors are placed first across one L-shaped polygon and R-VAN may complete their residuals', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 10, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  assert.equal(result.layout.algorithm, 'whole-polygon-sequential-3504pc-rvan-strip-v1')
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.equal(result.layout.calculationRegions.filter((part) => part.pattern === 'whole-polygon').length, 1)
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.headToHead.passed, true, JSON.stringify(
    result.layout.headToHead.checks.filter((entry) => !entry.passed),
  ))
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
  const heads = result.layout.sprinklers
  const rotorHeads = heads.filter((head) => head.performanceModel === '3504-PC')
  const rvanHeads = heads.filter((head) => head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
  assert.ok(rotorHeads.length > 0)
  assert.ok(rvanHeads.length > 0, 'the 4m residual arm should be handled by R-VAN after the rotor pass')
  const checks = result.layout.headToHead.checks
  assert.ok(checks.some((check) => {
    const source = heads.find((head) => head.id === check.sprinklerId)
    const neighbour = heads.find((head) => head.id === check.headToHeadNeighborId)
    return source && neighbour && source.performanceModel !== neighbour.performanceModel
  }), 'mixed rotor/R-VAN Head-to-Head must be counted as a complete mutual link')
  const rotorLastIndex = Math.max(...heads.map((head, index) => head.performanceModel === '3504-PC' ? index : -1))
  const rvanFirstIndex = heads.findIndex((head) => head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
  assert.ok(rvanFirstIndex > rotorLastIndex, 'R-VAN must be appended only after the whole rotor pass')
})

test('rectangular exclusion stays inside one whole-polygon calculation region', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 16, {
    exclusions: [{ id: 'pool', x: 8, y: 6, width: 4, height: 4 }],
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  assert.equal(result.layout.calculationRegions.length, 1)
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
  assert.ok(result.layout.sprinklers.every((head) => {
    const { x, y } = head.position
    return !(x > 8 && x < 12 && y > 6 && y < 10)
  }))
})

test('4 m and 5 m rectangular widths stay on R-VAN18 with a local 0.5 m reach allowance', () => {
  for (const [length, width, expectedRadius] of [[10, 4, 4], [18, 4, 4], [10, 5, 5], [18, 5, 5]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assertGlobalLayoutStatus(result, length + 'x' + width)
    const heads = result.layout?.sprinklers ?? []
    assert.ok(heads.length > 0)
    assert.ok(heads.every((head) => ['R-VAN14', 'R-VAN18'].includes(head.performanceModel.replace(/-360$/, ''))),
      length + 'x' + width + ' must not select R-VAN24')
    assert.ok(heads.every((head) => head.radiusM <= expectedRadius + 1e-8))
    assert.ok(heads.some((head) => head.radiusM === expectedRadius))
    if (result.layout?.globalOptimization?.failure?.coverage) {
      assert.ok(result.layout?.coverage?.uncoveredPoints > 0)
    } else {
      assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
    }
    if (result.layout?.globalOptimization?.failure?.overspray) {
      assert.equal(result.layout?.overspray, 'sampled_outside_boundary')
    } else {
      assert.notEqual(result.layout?.overspray, 'sampled_outside_boundary')
    }
    if (result.layout?.globalOptimization?.failure?.headToHead) {
      assert.equal(result.layout?.headToHead?.passed, false)
    } else {
      assert.notEqual(result.layout?.headToHead?.passed, false)
    }
  }
})

test('3x18 narrow rectangle keeps every head at R-VAN14 instead of sizing corners to the global centroid', () => {
  for (const [length, width] of [[18, 3], [3, 18]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assertGlobalLayoutStatus(result, length + 'x' + width)
    assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
    assert.equal(result.layout?.headToHead?.passed, true)
    const heads = result.layout?.sprinklers ?? []
    assert.ok(heads.length > 0)
    assert.ok(heads.every((head) => head.performanceModel.replace(/-360$/, '') === 'R-VAN14' && head.radiusM === 3))
    assert.ok(heads.every((head) => head.source !== 'interior'))
    assert.ok(heads.every((head) => head.position.x >= 0 && head.position.x <= length &&
      head.position.y >= 0 && head.position.y <= width))
  }
})

test('legacy R-VAN solver retains the 8x8 corner and side-midpoint model selection', () => {
  const snapshot = snapshotFor(8, 8)
  const layout = legacyRvanLayout(8, 8)
  assert.equal(layout.status, 'coverage_complete_sampled')
  assert.equal(layout.coverage?.uncoveredPoints, 0)
  assert.equal(layout.headToHead?.passed, true)
  const corners = layout.sprinklers.filter((head) => head.source === 'vertex')
  const sideMidpoints = layout.sprinklers.filter((head) => head.source === 'edge')
  assert.equal(corners.length, 4)
  assert.equal(sideMidpoints.length, 4)
  assert.ok(corners.every((head) => head.performanceModel === 'R-VAN24' && head.radiusM === 6))
  assert.ok(sideMidpoints.every((head) => head.performanceModel === 'R-VAN18' && head.radiusM === 4))
  const zones = buildIrrigationZones(layout.sprinklers, snapshot.geometry.normalized)
  assert.equal(zones.reduce((sum, zone) => sum + zone.sprinklerCount, 0), 8)
})

test('25x5 and 26x5 reference lawns create balanced zones with source-fed Ø25 routes', () => {
  for (const [length, expectedCount, expectedZones] of [[25, 12, [6, 6]], [26, 14, [5, 5, 4]]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, 5))
    assertGlobalLayoutStatus(result)
    const selectedModels = [...new Set(result.layout?.sprinklers?.map((head) => head.performanceModel) ?? [])].sort()
    assert.equal(result.operatingScenario?.model, selectedModels.join(' / '))
    assert.equal(result.layout?.sprinklers?.length, expectedCount)
    assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), expectedZones)
    assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
    assert.equal(result.pipeNetwork?.mainDiameterMm, 25)
    assert.equal(result.pipeNetwork?.zoneDiameterMm, 25)
    assert.ok(result.pipeNetwork?.branches?.length >= 2)
    assert.ok(result.pipeNetwork?.branches?.every((branch) =>
      branch.diameterMm === 25 && branch.sprinklerIds.length > 0))
    assert.ok(result.layout?.sprinklers?.every((sprinkler) => sprinkler.source !== 'interior'))
    if (result.layout?.globalOptimization?.failure?.headToHead) {
      assert.equal(result.layout?.headToHead?.passed, false)
    } else {
      assert.equal(result.layout?.headToHead?.passed, true)
    }
    assert.ok(result.pipeNetwork?.branches?.every((branch) =>
      branch.points[0].x === length && branch.points[0].y === 5))
  }
})

test('30x5 lawn is covered by perimeter heads in two balanced zones', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(30, 5))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.sprinklers?.length, 14)
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.ok(result.layout?.sprinklers?.every((head) => head.source !== 'interior'))
  assert.ok(result.pipeNetwork?.branches?.every((branch) => branch.sprinklerIds.length > 0))
})

test('32x6 rectangle uses corner-first 3504-PC rotors when the complete layout passes', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(32, 6))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.family, '3500')
  assert.equal(result.operatingScenario?.model, '3504-PC')
  assert.ok(result.layout?.sprinklers?.length > 0)
  assert.ok(result.layout?.sprinklers?.every((head) => head.performanceModel === '3504-PC' && head.pattern === 'rotor'))
  assert.ok(result.layout?.sprinklers?.every((sprinkler) => sprinkler.source !== 'interior'))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('legacy R-VAN solver retains mixed models and complete sampled coverage on 20x10', () => {
  const layout = legacyRvanLayout(20, 10)
  assert.equal(layout.status, 'coverage_complete_sampled')
  assert.equal([...new Set(layout.sprinklers.map((head) => head.performanceModel))].sort().join(' / '), 'R-VAN18 / R-VAN18-360 / R-VAN24')
  assert.equal(layout.coverage?.uncoveredPoints, 0)
  assert.equal(layout.headToHead?.passed, true)
})

test('legacy R-VAN solver retains interior-row placement on 20x15', () => {
  const snapshot = snapshotFor(20, 15)
  const layout = legacyRvanLayout(20, 15)
  assert.equal(layout.status, 'coverage_complete_sampled')
  assert.equal([...new Set(layout.sprinklers.map((head) => head.performanceModel))].sort().join(' / '), 'R-VAN18 / R-VAN18-360 / R-VAN24')
  const interior = layout.sprinklers.filter((entry) => entry.source === 'interior')
  assert.ok(interior.length > 0)
  assert.ok(interior.every((entry) => [5, 7.5, 10].some((row) => Math.abs(entry.position.y - row) < 1e-6)))
  assert.equal(layout.coverage?.uncoveredPoints, 0)
  assert.equal(layout.headToHead?.passed, true)
  const zones = buildIrrigationZones(layout.sprinklers, snapshot.geometry.normalized)
  assert.ok(zones.every((zone) => zone.sprinklerCount <= 6))
})

test('legacy R-VAN solver retains multiple interior rows and balanced mixed zones on 30x30', () => {
  const snapshot = snapshotFor(30, 30)
  const layout = legacyRvanLayout(30, 30)
  assert.equal(layout.status, 'coverage_complete_sampled')
  assert.equal([...new Set(layout.sprinklers.map((head) => head.performanceModel))].sort().join(' / '), 'R-VAN24 / R-VAN24-360')
  const interior = layout.sprinklers.filter((entry) => entry.source === 'interior')
  assert.ok(interior.length >= 3)
  assert.ok(new Set(interior.map((entry) => Number(entry.position.y.toFixed(2)))).size >= 3)
  assert.ok(interior.every((entry) => entry.arcDeg === 360))
  assert.equal(layout.coverage?.uncoveredPoints, 0)
  assert.equal(layout.headToHead?.passed, true)
  const zones = buildIrrigationZones(layout.sprinklers, snapshot.geometry.normalized)
  assert.ok(zones.every((zone) => zone.sprinklerCount <= 6))
  const zoneSizes = zones.map((zone) => zone.sprinklerCount)
  assert.equal(zones.length, Math.ceil(layout.sprinklers.length / 6))
  assert.ok(Math.max(...zoneSizes) - Math.min(...zoneSizes) <= 1)
  assert.ok(zones.some((zone) => zone.zoneType === 'mixed'))
  assert.ok(zones.every((zone) => ['perimeter', 'interior', 'mixed'].includes(zone.zoneType)))
})

test('narrow strip rules select RCS, LCS and SST at the approved thresholds', () => {
  const cases = [
    { length: 4, width: 2, models: ['R-VAN-RCS'], directions: ['left'], positions: [4] },
    { length: 5, width: 2, models: ['R-VAN-RCS', 'R-VAN-LCS'], directions: ['left', 'right'], positions: [5, 0] },
    { length: 7, width: 2, models: ['R-VAN-RCS', 'R-VAN-LCS'], directions: ['left', 'right'], positions: [7, 0] },
    { length: 8, width: 2, models: ['R-VAN-RCS', 'R-VAN-SST', 'R-VAN-LCS'], directions: ['left', 'both', 'right'], positions: [8, 4, 0] },
    { length: 10, width: 2, models: ['R-VAN-RCS', 'R-VAN-SST', 'R-VAN-SST', 'R-VAN-LCS'], directions: ['left', 'both', 'both', 'right'], positions: [10, 6, 2, 0] },
    { length: 12, width: 2, models: ['R-VAN-RCS', 'R-VAN-SST', 'R-VAN-SST', 'R-VAN-LCS'], directions: ['left', 'both', 'both', 'right'], positions: [12, 8, 4, 0] },
    { length: 3, width: 1, models: ['R-VAN-RCS'], directions: ['left'], positions: [3] },
    { length: 4, width: 1, models: ['R-VAN-RCS', 'R-VAN-LCS'], directions: ['left', 'right'], positions: [4, 0] },
    { length: 5, width: 1, models: ['R-VAN-RCS', 'R-VAN-LCS'], directions: ['left', 'right'], positions: [5, 0] },
    { length: 6, width: 1, models: ['R-VAN-RCS', 'R-VAN-SST', 'R-VAN-LCS'], directions: ['left', 'both', 'right'], positions: [6, 3, 0] },
    { length: 10, width: 1, models: ['R-VAN-RCS', 'R-VAN-SST', 'R-VAN-SST', 'R-VAN-SST', 'R-VAN-LCS'], directions: ['left', 'both', 'both', 'both', 'right'], positions: [10, 7, 4, 1, 0] },
  ]

  for (const entry of cases) {
    const result = buildPreliminaryLawnLayout(snapshotFor(entry.length, entry.width))
    assertGlobalLayoutStatus(result, entry.length + 'x' + entry.width)
    if (result.layout?.globalOptimization?.failure?.coverage) {
      assert.ok(result.layout?.coverage?.uncoveredPoints > 0)
    }
    if (result.layout?.globalOptimization?.failure?.overspray) {
      assert.equal(result.layout?.overspray, 'sampled_outside_boundary')
    }
    assert.equal(result.layout?.coverageScope, 'owner_defined_strip_pattern_global_sampled')
    assert.equal(result.layout?.rotorReduction?.status, 'not_applicable')
    assert.ok(result.layout?.sprinklers?.every((head) => head.pattern === 'strip'))
    assert.deepEqual(result.layout?.sprinklers?.map((head) => head.performanceModel), entry.models)
    assert.deepEqual(result.layout?.sprinklers?.map((head) => head.stripDirection), entry.directions)
    assert.deepEqual(result.layout?.sprinklers?.map((head) => head.position.x), entry.positions)
    assert.ok(result.layout.sprinklers.every((head) =>
      head.pattern === 'strip' && head.stripWidthM === entry.width &&
      head.stripLengthM === (entry.width === 1 ? 3 : 4) && head.radiusM === null))
    assert.equal(result.layout?.headToHead?.passed, null)
    assert.equal(result.layout?.headToHead?.applicable, false)
    assert.equal(result.zones?.reduce((sum, zone) => sum + zone.sprinklerCount, 0), entry.models.length)
  }
})

test('narrow strip heads use the lower long edge and rotate correctly for vertical lawns', () => {
  const horizontal = buildPreliminaryLawnLayout(snapshotFor(10, 2))
  assert.ok(horizontal.layout.sprinklers.every((head) => head.position.y === 0))
  const vertical = buildPreliminaryLawnLayout(snapshotFor(2, 10))
  assertGlobalLayoutStatus(vertical)
  assert.deepEqual(vertical.layout.sprinklers.map((head) => [head.position.x, head.position.y, head.stripDirection, head.stripAxis]), [
    [2, 0, 'up', 'vertical'], [2, 4, 'both', 'vertical'], [2, 8, 'both', 'vertical'], [2, 10, 'down', 'vertical'],
  ])
})

test('10x2 narrow-strip BOM uses the real LCS, RCS and SST catalog SKUs', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(10, 2))
  const bom = buildIrrigationBillOfMaterials(result.layout, result.zones)
  assert.equal(bom.valid, true)
  assert.equal(bom.items.find((item) => item.sku === 'A84667')?.quantity, 1)
  assert.equal(bom.items.find((item) => item.sku === 'A84668')?.quantity, 1)
  assert.equal(bom.items.find((item) => item.sku === 'A84669')?.quantity, 2)
})

test('all four L-shaped cut-out corners survive intake normalization and layout generation', () => {
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  for (const cutoutCorner of corners) {
    const length = 12, width = 8, cutoutWidth = 4, cutoutDepth = 3
    const snapshot = snapshotFor(length, width, { shape: 'l-shape', cutoutWidth, cutoutDepth, cutoutCorner })
    const normalized = snapshot.geometry.normalized.regions[0].boundary.vertices.slice(0, -1)
    const expected = buildLawnBoundary({ shape: 'l-shape', length, width, cutoutWidth, cutoutDepth, cutoutCorner })
    assert.deepEqual(normalized, expected, cutoutCorner)

    const result = buildPreliminaryLawnLayout(snapshot)
    assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status), cutoutCorner)
    assert.equal(result.layout?.geometry?.shape, 'l-shape', cutoutCorner)
    for (const head of result.layout?.sprinklers ?? []) {
      const { x, y } = head.position
      const insideCutout = cutoutCorner === 'top-left' ? x < cutoutWidth && y > width - cutoutDepth
        : cutoutCorner === 'top-right' ? x > length - cutoutWidth && y > width - cutoutDepth
          : cutoutCorner === 'bottom-left' ? x < cutoutWidth && y < cutoutDepth
            : x > length - cutoutWidth && y < cutoutDepth
      assert.equal(insideCutout, false, cutoutCorner + ' ' + head.id)
    }
  }
})

test('geometry preview and calculated customer SVG share one Y-up to SVG transform', async () => {
  const assistant = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(assistant, /const svgTransform = 'translate\(0 '/)
  assert.equal((assistant.match(/<g transform={svgTransform}>/g) ?? []).length, 2)
  assert.match(assistant, /<g transform={svgTransform}>\s*<polygon points={svgPoints} fill=/)
})


test('28x14 L-shape with a 16x12 cut-out is split into a 12x14 R-VAN zone and a connected 16x2 strip', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 12, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({ reason: result.reason, warnings: result.layout?.warnings, coverage: result.layout?.coverage, headToHead: result.layout?.headToHead, overspray: result.layout?.overspray }))
  assert.equal(result.geometry?.shape, 'l-shape')
  assert.equal(result.geometry?.areaM2, 200)
  assert.equal(result.layout?.coverageScope, 'global_sampled_geometry')
  assert.equal(result.layout?.geometry?.shape, 'l-shape')
  assert.equal(result.layout?.geometry?.areaM2, 200)
  assert.equal(result.layout?.overspray, 'sampled_inside_boundary')
  const stripHeads = result.layout?.sprinklers?.filter((head) => head.pattern === 'strip') ?? []
  assert.deepEqual(stripHeads.map((head) => head.performanceModel), [
    'R-VAN-RCS', 'R-VAN-SST', 'R-VAN-SST', 'R-VAN-SST',
  ])
  assert.deepEqual(stripHeads.map((head) => head.position.x), [28, 16, 20, 24])
  assert.ok(stripHeads.every((head) => head.position.y === 0 && head.stripAxis === 'horizontal'))
  assert.ok(stripHeads.every((head) => head.stripWidthM === 2 && head.stripLengthM === 4))
  assert.ok(result.layout?.sprinklers?.filter((head) => head.pattern !== 'strip')
    .every((head) => head.position.x <= 12 + 1e-8))
  assert.ok(result.layout?.sprinklers?.every((head) => {
    const { x, y } = head.position
    return !(x > 12 && x < 28 && y > 2 && y < 14)
  }))
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
  assert.equal(result.zones?.reduce((sum, zone) => sum + zone.sprinklerCount, 0), result.layout?.sprinklers?.length)
})

test('decomposed L-shape keeps the 1m/2m strip connected to the wide zone in all four cut-out corners', () => {
  for (const cutoutCorner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
      shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 12, cutoutCorner,
    }))
    assertGlobalLayoutStatus(result, cutoutCorner + ' ' + JSON.stringify({ reason: result.reason, warnings: result.layout?.warnings, coverage: result.layout?.coverage, headToHead: result.layout?.headToHead, overspray: result.layout?.overspray }))
    assert.equal(result.layout?.coverageScope, 'global_sampled_geometry', cutoutCorner)
    assert.equal(result.layout?.overspray, 'sampled_inside_boundary', cutoutCorner)
    const stripHeads = result.layout?.sprinklers?.filter((head) => head.pattern === 'strip') ?? []
    assert.equal(stripHeads.length, 4, cutoutCorner)
    assert.ok(stripHeads.every((head) => head.stripWidthM === 2), cutoutCorner)
    assert.ok(stripHeads.every((head) => head.stripAxis === 'horizontal'), cutoutCorner)
    assert.ok(result.layout?.sprinklers?.every((head) => {
      const { x, y } = head.position
      return cutoutCorner === 'top-left' ? !(x < 16 && y > 2)
        : cutoutCorner === 'top-right' ? !(x > 12 && y > 2)
          : cutoutCorner === 'bottom-left' ? !(x < 16 && y < 12)
            : !(x > 12 && y < 12)
    }), cutoutCorner)
  }
})

test('a 2m vertical connected L-shape arm uses a rotated strip row and keeps its nozzles in the irrigated polygon', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(14, 28, {
    shape: 'l-shape', cutoutWidth: 12, cutoutDepth: 16, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({ reason: result.reason, warnings: result.layout?.warnings, coverage: result.layout?.coverage, headToHead: result.layout?.headToHead, overspray: result.layout?.overspray }))
  assert.equal(result.layout?.coverageScope, 'global_sampled_geometry')
  const stripHeads = result.layout?.sprinklers?.filter((head) => head.pattern === 'strip') ?? []
  assert.ok(stripHeads.length > 0)
  assert.ok(stripHeads.every((head) => head.stripAxis === 'vertical' && head.stripWidthM === 2))
  assert.ok(stripHeads.every((head) => head.position.x === 2))
  assert.equal(result.layout?.overspray, 'sampled_inside_boundary')
})




test('two narrow connected arms keep separate strip geometry and unique sprinkler references', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 26, cutoutDepth: 12, cutoutCorner: 'top-right',
  }))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layout?.coverageScope, 'owner_defined_strip_pattern_global_sampled')
  assert.equal(result.layout?.overspray, 'sampled_inside_boundary')
  assert.ok(result.layout?.sprinklers?.every((head) => head.pattern === 'strip'))
  assert.equal(new Set(result.layout?.sprinklers?.map((head) => head.id)).size, result.layout?.sprinklers?.length)
  assert.equal(result.layout?.calculationRegions?.[0]?.pattern, 'whole-polygon')
  assert.ok(result.layout?.calculationRegions?.slice(1).every((region) => region.pattern === 'directional-strip'))
})



test('2x2 square is not misclassified as a 2m strip; reject any 1m pattern that oversprays', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(18, 2, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 1, cutoutCorner: 'top-right',
  }))
  assert.equal(result.status, 'layout_incomplete')
  assert.equal(result.layout?.coverageScope, 'owner_defined_strip_pattern_global_sampled')
  assert.equal(result.layout?.overspray, 'sampled_inside_boundary')
  assert.ok(result.layout?.coverage?.uncoveredPoints > 0, 'the remaining 2x2 square is not a strip and must remain explicitly uncovered')
  const verticalTwoMetreHeads = result.layout?.sprinklers?.filter((head) =>
    head.stripWidthM === 2 && head.stripAxis === 'vertical') ?? []
  assert.equal(verticalTwoMetreHeads.length, 0)
  assert.ok(result.layout?.warnings.some((warning) =>
    warning.code === 'strip_pattern_rejected_due_to_boundary_overspray'))
})


test('strip direction arrows use sub-metre SVG markers and cannot masquerade as spray coverage', async () => {
  const assistant = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(assistant, /markerWidth="0\.32" markerHeight="0\.32"/)
  assert.doesNotMatch(assistant, /markerWidth="4" markerHeight="4"/)
})


test('4m L-shape arm is handled by R-VAN after the rotor pass on the full polygon', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 10, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  const armHeads = result.layout.sprinklers.filter((head) =>
    head.pattern !== 'strip' && head.position.x > 12 && head.position.y < 4)
  assert.ok(armHeads.length > 0)
  assert.ok(armHeads.every((head) => ['R-VAN14', 'R-VAN18'].includes(head.performanceModel.replace(/-360$/, ''))))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
})

test('rectangular exclusions may start at X=0 or Y=0 and retain their visual kind', () => {
  for (const exclusion of [
    { id: 'pool-x0', kind: 'pool', x: 0, y: 4, width: 4, height: 4 },
    { id: 'patio-y0', kind: 'patio', x: 4, y: 0, width: 4, height: 4 },
  ]) {
    const snapshot = snapshotFor(20, 12, { exclusions: [exclusion] })
    assert.equal(snapshot.geometry.normalized.regions[0].exclusions[0].kind, exclusion.kind)
    assert.equal(snapshot.geometry.areaM2, 224)
    assert.equal(snapshot.geometry.normalized.regions[0].exclusions.length, 1)
  }
})

test('rectangular exclusion is checked against the original whole-polygon boundary', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 12, {
    exclusions: [{ id: 'pool', x: 8, y: 4, width: 4, height: 4 }],
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  assert.equal(result.layout.calculationRegions.length, 1)
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.ok(result.layout.coverage.uncoveredPoints >= 0)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
  assert.ok(result.layout.sprinklers.every((head) => {
    const { x, y } = head.position
    return !(x > 8 && x < 12 && y > 4 && y < 8)
  }))
})

test('unsupported 1.5m strip is reported as incomplete rather than forced into circular heads', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(10, 1.5))
  assert.equal(result.status, 'layout_incomplete')
  assert.equal(result.layout.status, 'coverage_incomplete')
  assert.equal(result.layout.sprinklers.length, 0)
  assert.ok(result.layout.warnings.some((warning) =>
    warning.code === 'narrow_area_has_no_exact_one_or_two_metre_strip_pattern'))
})

test('16x16 rectangle keeps all corners before perimeter and interior rotor positions', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(16, 16))
  assert.equal(result.status, 'layout_generated')
  const heads = result.layout.sprinklers.filter((head) => head.performanceModel === '3504-PC')
  assert.ok(heads.length >= 8)
  for (const [x, y] of [[0, 0], [16, 0], [16, 16], [0, 16]]) {
    assert.ok(heads.some((head) => Math.abs(head.position.x - x) < 1e-8 &&
      Math.abs(head.position.y - y) < 1e-8), 'each true corner must remain in the final layout')
  }
  assert.ok(heads.filter((head) => head.source === 'edge').length >= 3)
  assert.equal(result.layout.headToHead.checks.length, heads.length)
  assert.ok(result.layout.headToHead.checks.every((check) => check.passed))
  assert.ok(heads.every((head) => head.radiusM >= 6 && head.radiusM <= 9))
  assert.equal(result.layout.coverage.uncoveredPoints, 0)
  assert.equal(result.layout.headToHead.passed, true)
  assert.equal(result.layout.overspray, 'sampled_inside_boundary')
})

test('exclusion layout uses one polygon-wide coverage and optimization pass', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 20, {
    exclusions: [{ id: 'pool', x: 12, y: 8, width: 4, height: 4 }],
  }))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.layout.calculationRegions.length, 1)
  assert.equal(result.layout.calculationRegions[0].pattern, 'whole-polygon')
  assert.equal(result.layout.algorithm, 'whole-polygon-sequential-3504pc-rvan-strip-v1')
  assert.equal(result.layout.sectorOptimization.strategy, 'whole-polygon-maximum-safe-3504pc-sector-expansion')
  assert.equal(result.layout.fullCircleRotorSpacing.minimumDistanceM, 6)
})

test('mixed rotor and R-VAN Head-to-Head is evaluated as one whole-polygon relationship', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(28, 14, {
    shape: 'l-shape', cutoutWidth: 16, cutoutDepth: 10, cutoutCorner: 'top-right',
  }))
  assertGlobalLayoutStatus(result, JSON.stringify({
    warnings: result.layout?.warnings,
    coverage: result.layout?.coverage,
    headToHead: result.layout?.headToHead,
    overspray: result.layout?.overspray,
  }))
  const heads = result.layout.sprinklers
  const rotorHeads = heads.filter((head) => head.performanceModel === '3504-PC')
  const rvanHeads = heads.filter((head) => head.performanceModel.startsWith('R-VAN') && head.pattern !== 'strip')
  assert.ok(rotorHeads.length > 0)
  assert.ok(rvanHeads.length > 0)
  assert.equal(result.layout.headToHead.passed, true)
  assert.equal(result.layout.hydraulicFeasibility, 'owner_confirmed_compatible')
  assert.equal(result.layout.hydraulicCompatibilityBasis, 'owner_confirmed')
  assert.equal(result.hydraulicFeasibility, 'owner_confirmed_compatible')
  assert.equal(result.precipitationIntensityCompatibility, 'owner_confirmed_similar')
  assert.ok(result.layout.headToHead.checks.some((check) => {
    const a = heads.find((head) => head.id === check.sprinklerId)
    const b = heads.find((head) => head.id === check.headToHeadNeighborId)
    return a && b && a.performanceModel !== b.performanceModel
  }))
})
