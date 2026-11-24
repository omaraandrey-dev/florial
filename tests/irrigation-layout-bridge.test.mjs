import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot } from '../src/lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../src/lib/irrigation/irrigationLayoutBridge.mjs'

function snapshotFor(length, width) {
  const vertices = buildLawnBoundary({ shape: 'rectangle', length, width })
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
  })
  return buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'rectangle',
    length: String(length),
    width: String(width),
    geometryValidation,
  })
}

test('Florial selects each R-VAN head from its local reach while retaining the base scenario', () => {
  for (const [length, width] of [[10, 3], [10, 4], [10, 5], [32, 6]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assert.equal(result.status, 'layout_generated')
    assert.equal(result.operatingScenario?.family, 'R-VAN')
    const selectedModels = [...new Set(result.layout?.sprinklers?.map((head) => head.performanceModel) ?? [])].sort()
    assert.equal(result.operatingScenario?.model, selectedModels.join(' / '))
    assert.equal(result.layout?.model, selectedModels.join(' / '))
    assert.equal(result.operatingScenario?.layoutRadiusM, null)
    assert.ok(result.layout?.sprinklers?.every((head) => {
      const baseModel = head.performanceModel.replace(/-360$/, '')
      return (baseModel === 'R-VAN14' && head.radiusM === 3) ||
        (baseModel === 'R-VAN18' && [4, 5].includes(head.radiusM)) ||
        (baseModel === 'R-VAN24' && head.radiusM === 6)
    }))
    assert.equal(result.layout?.coverageScope, 'sampled_geometry_only')
    assert.equal(result.layout?.hydraulicFeasibility, 'not_evaluated')
    assert.equal(result.pipeNetwork?.connectionPoint?.x, length)
    assert.equal(result.pipeNetwork?.connectionPoint?.y, width)
    assert.ok(result.zones?.length > 0)
  }
})

test('8x8 rectangle uses R-VAN24 in the four corners and R-VAN18 at the four side midpoints', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(8, 8))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  const heads = result.layout?.sprinklers ?? []
  const corners = heads.filter((head) => head.source === 'vertex')
  const sideMidpoints = heads.filter((head) => head.source === 'edge')
  assert.equal(corners.length, 4)
  assert.equal(sideMidpoints.length, 4)
  assert.ok(corners.every((head) => head.performanceModel === 'R-VAN24' && head.radiusM === 6))
  assert.ok(sideMidpoints.every((head) => head.performanceModel === 'R-VAN18' && head.radiusM === 4))
  assert.deepEqual(result.zones?.reduce((sum, zone) => sum + zone.sprinklerCount, 0), 8)
})

test('25x5 and 26x5 reference lawns create balanced zones with source-fed Ø25 routes', () => {
  for (const [length, expectedCount, expectedZones] of [[25, 12, [6, 6]], [26, 12, [6, 6]]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, 5))
    assert.equal(result.status, 'layout_generated')
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
    assert.equal(result.layout?.headToHead?.passed, true)
    assert.ok(result.pipeNetwork?.branches?.every((branch) =>
      branch.points[0].x === length && branch.points[0].y === 5))
  }
})

test('30x5 lawn is covered by mixed-radius perimeter heads in two balanced zones', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(30, 5))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.layout?.sprinklers?.length, 12)
  assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [6, 6])
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.ok(result.layout?.sprinklers?.every((head) => head.source !== 'interior'))
  assert.ok(result.pipeNetwork?.branches?.every((branch) => branch.sprinklerIds.length > 0))
})

test('32x6 uses the fixed 6m R-VAN24 planning radius and remains perimeter-only', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(32, 6))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.layout?.sprinklers?.length, 14)
  assert.ok(result.layout?.sprinklers?.every((sprinkler) => sprinkler.source !== 'interior'))
  assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [5, 5, 4])
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x10 uses R-VAN24 and keeps complete sampled perimeter coverage', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 10))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN18 / R-VAN24')
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x15 uses mixed R-VAN models and an interior circular row when perimeter coverage alone is insufficient', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 15))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN18 / R-VAN24')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.ok(interior.length > 0)
  assert.ok(interior.every((entry) => [5, 7.5, 10].some((row) => Math.abs(entry.position.y - row) < 1e-6)))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
})

test('30x30 uses multiple interior rows and permits mixed balanced zones', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(30, 30))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.ok(interior.length >= 3)
  assert.ok(new Set(interior.map((entry) => Number(entry.position.y.toFixed(2)))).size >= 3)
  assert.ok(interior.every((entry) => entry.arcDeg === 360))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
  const zoneSizes = result.zones?.map((zone) => zone.sprinklerCount) ?? []
  assert.equal(result.zones?.length, Math.ceil((result.layout?.sprinklers?.length ?? 0) / 6))
  assert.ok(Math.max(...zoneSizes) - Math.min(...zoneSizes) <= 1)
  assert.ok(result.zones?.some((zone) => zone.zoneType === 'mixed'))
  assert.ok(result.zones?.every((zone) => ['perimeter', 'interior', 'mixed'].includes(zone.zoneType)))
})

test('R-VAN-RCS uses the owner-defined strip width, throw and head-count rules', () => {
  for (const [length, width, expectedCount, expectedReach] of [
    [4, 2, 1, 4],
    [6, 2, 2, 4],
    [8, 2, 3, 4],
    [4, 1, 3, 2],
  ]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assert.equal(result.status, 'layout_generated')
    assert.equal(result.operatingScenario?.model, 'R-VAN-RCS')
    assert.equal(result.layout?.coverageScope, 'owner_defined_strip_pattern')
    assert.equal(result.layout?.sprinklers?.length, expectedCount)
    assert.ok(result.layout.sprinklers.every((head) =>
      head.pattern === 'strip' && head.performanceModel === 'R-VAN-RCS' &&
      head.stripWidthM === width && head.stripLengthM === expectedReach &&
      head.radiusM === null))
    assert.equal(result.layout?.headToHead?.passed, null)
    assert.equal(result.layout?.headToHead?.applicable, false)
    assert.equal(result.zones?.reduce((sum, zone) => sum + zone.sprinklerCount, 0), expectedCount)
    assert.equal(result.layout.sprinklers[0].position.x, length)
    assert.equal(result.layout.sprinklers[0].position.y, 0)
    if (expectedCount > 1) {
      assert.equal(result.layout.sprinklers.at(-1).position.x, 0)
      const gaps = result.layout.sprinklers.slice(1).map((head, index) =>
        Math.abs(head.position.x - result.layout.sprinklers[index].position.x))
      assert.ok(gaps.every((gap) => Math.abs(gap - gaps[0]) < 1e-8))
    }
  }
})

test('unsupported narrow widths do not fall back to circular sprinklers', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(10, 1.5))
  assert.ok([
    'strip_nozzle_layout_requires_exact_pattern_engine',
    'strip_width_not_supported_by_exact_manufacturer_point',
  ].includes(result.status))
  assert.equal(result.layout, undefined)
})
