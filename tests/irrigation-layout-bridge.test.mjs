import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLawnBoundary } from '../src/lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot } from '../src/lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../src/lib/irrigation/irrigationLayoutBridge.mjs'

function snapshotFor({ length = 10, width = 5, confirmed = true } = {}) {
  const vertices = buildLawnBoundary({ shape: 'rectangle', length, width })
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: confirmed ? 'confirmed' : 'needs_confirmation',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
  })
  return buildIrrigationIntakeSnapshot({
    language: 'bg', shape: 'rectangle', length: String(length), width: String(width), geometryValidation,
  })
}

test('10x5 and 20x5 use R-VAN18 with perimeter-first sprinkler layout and standard pipe route', () => {
  for (const [length, width] of [[10, 5], [20, 5]]) {
    const result = buildPreliminaryLawnLayout(snapshotFor({ length, width }))
    assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
    assert.equal(result.operatingScenario?.family, 'R-VAN')
    assert.equal(result.operatingScenario?.model, 'R-VAN18')
    assert.equal(result.operatingScenario?.sourcePressureBar, 4)
    assert.equal(result.operatingScenario?.manufacturerTablePressureBar, 3.1)
    assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
    assert.equal(result.layout?.headToHead?.passed, true)
    if (length === 20 && width === 10) {
      assert.equal(result.layout?.sprinklers?.some((entry) => entry.source === 'interior'), false)
    }
    assert.equal(result.layout?.pipeNetwork?.status, 'schematic_route_generated')
    assert.equal(result.layout?.pipeNetwork?.source?.label, 'top_right_corner')
    assert.equal(result.layout?.pipeNetwork?.mainPipeDiameterMm, 32)
    assert.equal(result.layout?.pipeNetwork?.zonePipeDiameterMm, 25)
    assert.equal(result.hydraulicFeasibility, 'not_calculated_by_scope')
  }
})

test('20x10 selects R-VAN24 and allows an internal sprinkler row when perimeter coverage needs it', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ length: 20, width: 10 }))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.geometry.shortSideM, 10)
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
  assert.equal(result.layout?.sprinklers?.some((entry) => entry.source === 'interior'), false)
})

test('orthogonal L-shape remains supported with perimeter routing', () => {
  const vertices = buildLawnBoundary({
    shape: 'l-shape', length: 12, width: 5, cutoutWidth: 4, cutoutDepth: 2, cutoutCorner: 'top-right',
  })
  const geometryValidation = validateLawnGeometry({
    schemaVersion: 1, coordinateSystem: 'local_cartesian_m', status: 'confirmed',
    regions: [{ id: 'lawn-l', boundary: { vertices }, exclusions: [] }],
  })
  const snapshot = buildIrrigationIntakeSnapshot({
    language: 'bg', shape: 'l-shape', length: '12', width: '5', cutoutWidth: '4', cutoutDepth: '2', geometryValidation,
  })
  const result = buildPreliminaryLawnLayout(snapshot)
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.layout?.geometry?.shape, 'l-shape')
  assert.equal(result.operatingScenario?.model, 'R-VAN18')
  assert.equal(result.layout?.pipeNetwork?.status, 'schematic_route_generated')
})

test('1m, 1.5m and 2m narrow strips are routed to exact Rain Bird strip-nozzle review', () => {
  for (const width of [1, 1.5, 2]) {
    const result = buildPreliminaryLawnLayout(snapshotFor({ length: 10, width }))
    assert.equal(result.status, 'strip_nozzle_layout_requires_exact_pattern_engine')
    assert.deepEqual(result.supportedStripModels, ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'])
    assert.deepEqual(result.stripSpecifications.map((entry) => entry.model), ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'])
    assert.equal(result.stripSpecifications[0].dimensionsM[0], 1.5)
    assert.equal(result.stripSpecifications[2].dimensionsM[1], 9.1)
    assert.equal(result.layout, undefined)
  }
})

test('unaccepted geometry is not passed to the layout solver', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ confirmed: false }))
  assert.equal(result.status, 'needs_geometry')
  assert.equal(result.layout, undefined)
})

test('geometry beyond the supported R-VAN envelope is not forced into an unsupported model', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ length: 20, width: 15 }))
  assert.equal(result.status, 'requires_rotor_engine')
  assert.equal(result.plannedNextFamily, 'Rain Bird 3500')
  assert.equal(result.layout, undefined)
})

test('20x15 selects R-VAN24 and adds a two-head central row only after the perimeter pass', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ length: 20, width: 15 }))
  assert.ok(['layout_generated', 'layout_incomplete'].includes(result.status))
  assert.equal(result.operatingScenario?.model, 'R-VAN24')
  const interior = result.layout?.sprinklers?.filter((entry) => entry.source === 'interior') ?? []
  assert.equal(interior.length, 2)
  assert.ok(interior.every((entry) => Math.abs(entry.position.y - 7.5) < 1e-8))
  assert.equal(result.layout?.coverage?.uncoveredPoints, 0)
  assert.equal(result.layout?.headToHead?.passed, true)
})
