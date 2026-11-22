import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIrrigationIntakeSnapshot, evaluateIrrigationIntake } from '../src/lib/irrigation/irrigationIntake.mjs'

const acceptedGeometry = {
  valid: true,
  status: 'accepted',
  supported: true,
  computedAreaM2: 96,
  computedPerimeterM: 40,
  normalizedGeometry: {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices: [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 8 },
    ] }, exclusions: [] }],
  },
}

test('geometry alone completes intake; customer water-source and flow questions are not required', () => {
  const result = evaluateIrrigationIntake({ geometryValidation: acceptedGeometry })
  assert.equal(result.geometryReady, true)
  assert.equal(result.standardWaterAssumptionsApplied, true)
  assert.equal(result.hydraulicReady, false)
  assert.equal(result.hydraulicFeasibility, 'not_calculated_by_scope')
  assert.deepEqual(result.missing, [])
})

test('invalid or unsupported geometry remains blocked', () => {
  const result = evaluateIrrigationIntake({
    geometryValidation: { ...acceptedGeometry, status: 'needs_confirmation' },
  })
  assert.equal(result.geometryReady, false)
  assert.equal(result.status, 'intake_incomplete')
  assert.deepEqual(result.missing, ['supported_lawn_geometry'])
})

test('snapshot stores approximate dimensions and fixed Florial water and pipe assumptions', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'rectangle',
    length: '12',
    width: '8',
    geometryValidation: acceptedGeometry,
    notes: 'Path along the east edge',
  })
  assert.equal(snapshot.schemaVersion, 2)
  assert.equal(snapshot.geometry.areaM2, 96)
  assert.equal(snapshot.geometry.dimensionBasis, 'customer_approximate_dimensions')
  assert.equal(snapshot.water.connection, '1-inch tap')
  assert.equal(snapshot.water.nominalPressureBar, 4)
  assert.equal(snapshot.water.supplyPipeDiameterMm, 25)
  assert.equal(snapshot.water.entryCorner, 'top-right')
  assert.equal(snapshot.water.lineCapacity.sectorHeads, 6)
  assert.equal(snapshot.water.lineCapacity.fullCircleHeads, 4)
  assert.equal(snapshot.pipeDesign.mainDiameterMm, 32)
  assert.equal(snapshot.pipeDesign.zoneDiameterMm, 25)
  assert.equal(snapshot.pipeDesign.hydraulicLossesCalculated, false)
  assert.equal(snapshot.constraints.exclusionsMapped, false)
  assert.equal(snapshot.readiness.hydraulicFeasibility, 'not_calculated_by_scope')
})
