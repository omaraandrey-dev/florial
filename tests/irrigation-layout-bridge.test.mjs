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

test('unconfirmed geometry is never passed to the layout solver', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ confirmed: false }))
  assert.equal(result.status, 'needs_confirmed_geometry')
  assert.equal(result.layout, undefined)
})

test('geometry outside the current R-VAN v1 envelope is not forced into a nozzle layout', () => {
  const result = buildPreliminaryLawnLayout(snapshotFor({ width: 6 }))
  assert.equal(result.status, 'requires_rotor_engine')
  assert.equal(result.reason, 'requires_large_rotor_engine_or_engineer_review')
  assert.equal(result.layout, undefined)
})

test('source dynamic pressure is not silently treated as nozzle operating pressure', () => {
  const first = buildPreliminaryLawnLayout(snapshotFor({ pressureBar: 2.4 }))
  const second = buildPreliminaryLawnLayout(snapshotFor({ pressureBar: 4.0 }))
  assert.equal(first.operatingScenario?.pressureBar, second.operatingScenario?.pressureBar)
  assert.equal(first.operatingScenario?.pressureBar, 3.1)
  assert.equal(first.operatingScenario?.customerSourceMeasurementsUsedAsNozzlePressure, false)
})
