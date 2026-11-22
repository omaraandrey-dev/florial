import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot } from '../src/lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../src/lib/irrigation/irrigationLayoutBridge.mjs'

function snapshotFor({ length = 10, width = 5, confirmed = true, pressureBar = 2.4 } = {}) {
  const vertices = buildLawnBoundary({ shape: 'rectangle', length, width })
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: confirmed ? 'confirmed' : 'needs_confirmation',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
  })
  return buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'rectangle',
    length: String(length),
    width: String(width),
    geometryValidation,
    waterSource: 'well',
    pressureType: 'dynamic',
    pressureBar: String(pressureBar),
    pressureMeasuredWhileFlowing: true,
    pressureTestPoint: 'lawn_entry',
    flowRate: '40',
    flowMeasurementMethod: 'bucket',
  })
}

test('confirmed 5m lawn geometry is connected to the deterministic R-VAN18 layout engine', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor())
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.operatingScenario?.family, 'R-VAN')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.operatingScenario?.pressureBar, 3.1)
  assert.equal(result.operatingScenario?.actualNozzlePressureVerified, false)
  assert.equal(result.operatingScenario?.customerSourceMeasurementsUsedAsNozzlePressure, false)
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.equal(result.layout?.coverageScope, 'sampled_geometry_only')
})

test('confirmed orthogonal L-shape reaches the existing layout solver', () => {
  const vertices = buildLawnBoundary({
    shape: 'l-shape',
    length: 12,
    width: 5,
    cutoutWidth: 4,
    cutoutDepth: 2,
    cutoutCorner: 'top-right',
  })
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-l', boundary: { vertices }, exclusions: [] }],
  })
  const snapshot = buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'l-shape',
    length: '12',
    width: '5',
    cutoutWidth: '4',
    cutoutDepth: '2',
    geometryValidation,
    waterSource: 'well',
  })
  const result = buildPreliminaryLawnLayout(snapshot)
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.layout?.geometry?.shape, 'l-shape')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
})

test('narrow strip geometry routes to dedicated R-VAN strip layout and exposes adjustment status', () => {
  const exact = buildPreliminaryLawnLayout(snapshotFor({ width: 1.5 }))
  assert.equal(exact.status, 'strip_layout_generated')
  assert.deepEqual(exact.layout.modelsUsed, ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'])
  assert.equal(exact.layout.coverage.uncoveredPoints, 0)
  assert.equal(exact.layout.headToHead.passed, true)

  for (const width of [1, 2]) {
    const adjusted = buildPreliminaryLawnLayout(snapshotFor({ width }))
    assert.equal(adjusted.status, 'strip_layout_requires_field_adjustment')
    assert.equal(adjusted.layout.sizeAdjustmentRequired, true)
    assert.equal(adjusted.layout.sizeAdjustmentVerified, false)
  }
})
test('unconfirmed geometry is never passed to the layout solver', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ confirmed: false }))
  assert.equal(result.status, 'needs_confirmed_geometry')
  assert.equal(result.layout, undefined)
})

test('wider geometry remains in the R-VAN family and selects R-VAN24 for a multi-row candidate', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ width: 10 }))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.operatingScenario?.family, 'R-VAN')
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  assert.equal(result.operatingScenario?.requiresInternalRows, true)
  assert.equal(result.layout?.family, 'R-VAN')
})

test('10x5 lawn keeps perimeter-only R-VAN18 layout and adjusts each head to 5m spacing', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ length: 10, width: 5 }))
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.sprinklers.some((sprinkler) => sprinkler.source === 'interior_row'), false)
  assert.ok(result.layout?.sprinklers.every((sprinkler) => Math.abs(sprinkler.radiusM - 5) < 0.01))
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('20x10 lawn adds a longitudinal R-VAN24 internal row and adjusts radius to grid spacing', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ length: 20, width: 10 }))
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  const internal = result.layout?.sprinklers.filter((sprinkler) => sprinkler.source === 'interior_row') ?? []
  assert.equal(internal.length, 2)
  assert.ok(internal.every((sprinkler) => Math.abs(sprinkler.position.y - 5) < 0.01))
  assert.ok(internal.every((sprinkler) => sprinkler.performanceModel === 'R-VAN24-360'))
  assert.deepEqual(result.layout?.modelsUsed, ['R-VAN24'])
  assert.ok(result.layout?.sprinklers.every((sprinkler) => sprinkler.radiusM >= 5.2 && sprinkler.radiusM <= 7.3))
  assert.equal(result.layout?.headToHead?.passed, true)
})

test('source dynamic pressure is not silently treated as nozzle operating pressure', () => {
  const first = buildPreliminaryLawnLayout(snapshotFor({ pressureBar: 2.4 }))
  const second = buildPreliminaryLawnLayout(snapshotFor({ pressureBar: 4.0 }))
  assert.equal(first.operatingScenario?.pressureBar, second.operatingScenario?.pressureBar)
  assert.equal(first.operatingScenario?.pressureBar, 3.1)
  assert.equal(first.operatingScenario?.customerSourceMeasurementsUsedAsNozzlePressure, false)
})

test('validates the provisional R-VAN model-selection boundaries and solves both supported bands', () => {
  const cases = [
    { width: 4.0, expectedModel: 'R-VAN14' },
    { width: 4.6, expectedModel: 'R-VAN14' },
    { width: 4.6001, expectedModel: 'R-VAN18' },
    { width: 5.5, expectedModel: 'R-VAN18' },
  ]

  for (const { width, expectedModel } of cases) {
    const result = buildPreliminaryLawnLayout(snapshotFor({ width }))
    assert.equal(result.status, 'layout_generated', `layout at short side ${width}m`)
    assert.equal(result.geometry.shortSideM, width)
    assert.equal(result.operatingScenario.model, expectedModel)
    assert.equal(result.layout.family, 'R-VAN')
    assert.equal(result.layout.model, expectedModel)
    assert.equal(result.layout.pressureBar, 3.1)
    assert.equal(result.layout.coverage.uncoveredPoints, 0)
    assert.equal(result.layout.headToHead.passed, true)
    assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  }
})

test('narrow circular geometry below R-VAN14 range requires engineering review', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ width: 2.2 }))
  assert.equal(result.status, 'short_side_below_supported_rvan_scope')
  assert.equal(result.layout, undefined)
})

test('rejects geometry below strip range and retains the R-VAN-to-3500 handoff', () => {
  const below = buildPreliminaryLawnLayout(snapshotFor({ width: 0.9 }))
  assert.equal(below.status, 'short_side_below_supported_rvan_scope')
  assert.equal(below.layout, undefined)

  const rvan = buildPreliminaryLawnLayout(snapshotFor({ width: 4.0 }))
  assert.equal(rvan.operatingScenario?.family, 'R-VAN')
  assert.equal(rvan.operatingScenario?.model, 'R-VAN14')

  const above = buildPreliminaryLawnLayout(snapshotFor({ width: 15 }))
  assert.equal(above.status, 'requires_rotor_engine')
  assert.equal(above.plannedNextFamily, 'Rain Bird 3500')
  assert.equal(above.layout, undefined)
})
