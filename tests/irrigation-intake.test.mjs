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

test('customer intake uses the standard design basis without requesting source or flow measurements', () => {
  const result = evaluateIrrigationIntake({
    geometryValidation: acceptedGeometry,
    waterSource: 'mains',
    pressureType: 'static',
    pressureBar: '3.5',
    pressureMeasuredWhileFlowing: false,
    pressureTestPoint: 'source',
    flowRate: '20',
    flowMeasurementMethod: 'unknown',
  })
  assert.equal(result.geometryReady, true)
  assert.equal(result.dynamicPressureReady, false)
  assert.equal(result.flowReady, false)
  assert.equal(result.hydraulicReady, false)
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.deepEqual(result.missing, [])
})

test('geometry readiness does not depend on customer source or flow measurements', () => {
  const result = evaluateIrrigationIntake({
    geometryValidation: acceptedGeometry,
  })
  assert.equal(result.geometryReady, true)
  assert.equal(result.dynamicPressureReady, false)
  assert.equal(result.flowReady, false)
  assert.equal(result.hydraulicReady, false)
  assert.deepEqual(result.missing, [])
})

test('unconfirmed geometry never becomes eligible for preliminary layout', () => {
  const result = evaluateIrrigationIntake({
    geometryValidation: { ...acceptedGeometry, status: 'needs_confirmation' },
    waterSource: 'unknown',
  })
  assert.equal(result.geometryReady, false)
  assert.equal(result.status, 'intake_incomplete')
  assert.ok(result.missing.includes('confirmed_supported_geometry'))
})

test('snapshot is versioned, metric and records customer confirmation as provenance', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'rectangle',
    length: '12',
    width: '8',
    geometryValidation: acceptedGeometry,
    waterSource: 'mains',
    pressureType: 'static',
    pressureBar: '3,5',
    pressureTestPoint: 'source',
    flowRate: '20',
    flowMeasurementMethod: 'bucket',
    notes: 'Path along the east edge',
  })
  assert.equal(snapshot.schemaVersion, 1)
  assert.equal(snapshot.geometry.areaM2, 96)
  assert.equal(snapshot.geometry.confirmation, 'customer_assertion')
  assert.equal(snapshot.water.pressure.valueBar, 4.053)
  assert.equal(snapshot.water.pressure.provenance, 'florial_standard_design_basis')
  assert.equal(snapshot.designBasis.supplyPressureAtm, 4)
  assert.equal(snapshot.designBasis.incomingPipeNominalDiameterMm, 25)
  assert.equal(snapshot.designBasis.inletTapNominalSizeIn, 1)
  assert.equal(snapshot.designBasis.mainPipeNominalDiameterMm, 32)
  assert.equal(snapshot.designBasis.zonePipeNominalDiameterMm, 25)
  assert.equal(snapshot.designBasis.siteElevationModel, 'flat_site_assumption')
  assert.equal(snapshot.constraints.exclusionsMapped, false)
  assert.equal(snapshot.readiness.hydraulicFeasibility, 'not_evaluated')
})
