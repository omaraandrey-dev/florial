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

test('static pressure and an unqualified flow do not unlock hydraulic readiness', () => {
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
  assert.ok(result.missing.includes('dynamic_pressure_and_test_point'))
  assert.ok(result.missing.includes('measured_flow_and_method'))
  assert.ok(result.missing.includes('pipe_network'))
})

test('dynamic pressure is accepted only with flowing condition and defined test point', () => {
  const base = {
    geometryValidation: acceptedGeometry,
    waterSource: 'mains',
    pressureType: 'dynamic',
    pressureBar: '3,1',
    pressureMeasuredWhileFlowing: true,
    pressureTestPoint: 'lawn_entry',
    flowRate: '18,5',
    flowMeasurementMethod: 'bucket',
  }
  const result = evaluateIrrigationIntake(base)
  assert.equal(result.dynamicPressureReady, true)
  assert.equal(result.flowReady, true)
  assert.equal(result.hydraulicReady, false)
  assert.ok(result.missing.includes('pipe_network'))
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
  assert.equal(snapshot.water.pressure.valueBar, 3.5)
  assert.equal(snapshot.constraints.exclusionsMapped, false)
  assert.equal(snapshot.readiness.hydraulicFeasibility, 'not_evaluated')
})
