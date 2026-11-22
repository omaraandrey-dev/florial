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

test('10x5, 20x5 and 20x10 use the established R-VAN18 family', () => {
  for (const [length, width] of [[10, 5], [20, 5], [20, 10]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor(length, width))
    assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status), `layout status for ${length}x${width}`)
    assert.equal(result.operatingScenario?.family, 'R-VAN')
    assert.equal(result.operatingScenario?.model, 'R-VAN18')
    assert.equal(result.layout?.coverageScope, 'sampled_geometry_only')
    assert.equal(result.layout?.hydraulicFeasibility, 'not_evaluated')
    assert.equal(result.pipeNetwork?.connectionPoint?.x, length)
    assert.equal(result.pipeNetwork?.connectionPoint?.y, width)
    assert.ok(result.zones?.length > 0)
  }
})

test('25x5 reference lawn creates two six-head perimeter zones and continuous Ø25 routes', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(25, 5))
  assert.equal(result.status, 'layout_generated')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.sprinklers?.length, 12)
  assert.equal(result.zones?.length, 2)
  assert.deepEqual(result.zones?.map((zone) => zone.sprinklerCount), [6, 6])
  assert.ok(result.zones?.every((zone) => zone.sprinklerCount <= 6))
  assert.equal(result.pipeNetwork?.mainDiameterMm, 25)
  assert.equal(result.pipeNetwork?.zoneDiameterMm, 25)
  assert.equal(result.pipeNetwork?.branches?.length, 2)
  assert.ok(result.pipeNetwork?.branches?.every((branch) =>
    branch.diameterMm === 25 && branch.sprinklerIds.length === 6))
  assert.equal(result.layout?.headToHead?.passed, true)

  const perimeterHeads = result.layout.sprinklers
    .filter((entry) => Number.isFinite(entry.perimeterOffsetM))
    .slice()
    .sort((a, b) => a.perimeterOffsetM - b.perimeterOffsetM)
  const perimeterLengthM = perimeterHeads[0].perimeterLengthM
  for (let index = 0; index < perimeterHeads.length; index += 1) {
    const current = perimeterHeads[index]
    const next = perimeterHeads[(index + 1) % perimeterHeads.length]
    const gapM = (next.perimeterOffsetM - current.perimeterOffsetM + perimeterLengthM) % perimeterLengthM
    assert.ok(
      gapM <= Math.min(current.radiusM, next.radiusM) + 1e-8,
      `perimeter gap ${gapM}m exceeds the adjacent throw radius`,
    )
  }
})

test('20x10 reference case remains perimeter-only', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 10))
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.sprinklers?.length, 14)
  assert.equal(result.layout?.sprinklers?.some((entry) => entry.source === 'interior'), false)
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x15 uses R-VAN24 when additional interior coverage is needed', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor(20, 15))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.layout?.family, 'R-VAN')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.equal(interior.length, 2)
  assert.ok(interior.every((entry) => Math.abs(entry.position.y - 7.5) < 1e-6))
  assert.deepEqual(interior.map((entry) => Number(entry.position.x.toFixed(2))), [6.67, 13.33])
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
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
