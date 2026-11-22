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

test('short lawns select the smallest exact R-VAN radius that covers the short side', () => {
  for (const [length, width, expectedModel] of [[10, 5, 'R-VAN18'], [20, 5, 'R-VAN18'], [32, 6, 'R-VAN24']]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assert.equal(result.status, 'layout_generated')
    assert.equal(result.operatingScenario?.family, 'R-VAN')
    assert.equal(result.operatingScenario?.model, expectedModel)
    assert.equal(result.layout?.coverageScope, 'sampled_geometry_only')
    assert.equal(result.layout?.hydraulicFeasibility, 'not_evaluated')
    assert.equal(result.pipeNetwork?.connectionPoint?.x, length)
    assert.equal(result.pipeNetwork?.connectionPoint?.y, width)
    assert.ok(result.zones?.length > 0)
  }
})

test('25x5 and 26x5 reference lawns create two six-head zones with source-fed Ø25 routes', () => {
  for (const length of [25, 26]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, 5))
    assert.equal(result.status, 'layout_generated')
    assert.equal(result.operatingScenario?.model, 'R-VAN18')
    assert.equal(result.layout?.sprinklers?.length, 12)
    assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [6, 6])
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

test('30x5 lawn keeps the first six sequential perimeter heads together', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(30, 5))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.sprinklers?.length, 14)
  assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [6, 6, 2])
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.ok(result.pipeNetwork?.branches?.every((branch) => branch.sprinklerIds.length > 0))
})

test('32x6 uses R-VAN24 radius to avoid unnecessary mid-edge heads and interior sprinklers', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(32, 6))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.layout?.sprinklers?.length, 12)
  assert.ok(result.layout?.sprinklers?.every((sprinkler) => sprinkler.source !== 'interior'))
  assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [6, 6])
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x10 uses R-VAN24 and keeps complete sampled perimeter coverage', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 10))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x15 uses an interior circular row when perimeter coverage alone is insufficient', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 15))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.ok(interior.length > 0)
  assert.ok(interior.some((entry) => Math.abs(entry.position.y - 7.5) < 1e-6))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
})

test('30x30 uses multiple interior rows of full-circle heads with complete sampled coverage', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(30, 30))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.ok(interior.length >= 8)
  assert.ok(new Set(interior.map((entry) => Number(entry.position.y.toFixed(2)))).size >= 3)
  assert.ok(interior.every((entry) => entry.arcDeg === 360))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
  const perimeterZones = result.zones?.filter((zone) => zone.zoneType === 'perimeter') ?? []
  const interiorZones = result.zones?.filter((zone) => zone.zoneType === 'interior') ?? []
  assert.ok(perimeterZones.length > 0)
  assert.ok(interiorZones.length > 0)
  assert.ok(perimeterZones.every((zone) => zone.sprinklerCount <= 6))
  assert.ok(interiorZones.every((zone) => zone.sprinklerCount <= 6))
  assert.ok(result.zones?.every((zone) => zone.zoneType === 'perimeter' || zone.zoneType === 'interior'))
  assert.ok(result.zones?.every((zone, index, zones) =>
    index === 0 || (zones[index - 1].zoneType !== 'interior' || zone.zoneType === 'interior')))
})

test('narrow strips do not fall back to circular R-VAN or HE-VAN nozzles', () => {
  for (const width of [1, 1.5, 2]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(10, width))
    assert.ok([
      'strip_nozzle_layout_requires_exact_pattern_engine',
      'strip_width_not_supported_by_exact_manufacturer_point',
    ].includes(result.status))
    assert.equal(result.layout, undefined)
    assert.ok(Array.isArray(result.stripNozzleOptions))
  }
})
