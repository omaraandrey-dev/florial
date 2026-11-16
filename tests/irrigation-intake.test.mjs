import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIrrigationIntakeSnapshot, IRRIGATION_INTAKE_SCHEMA_VERSION } from '../src/lib/irrigation/irrigationIntake.mjs'

const acceptedGeometry = {
  valid: true,
  status: 'accepted',
  computedAreaM2: 60,
  computedPerimeterM: 32,
}

test('creates a versioned intake-only snapshot and preserves measurement provenance', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    geometryValidation: acceptedGeometry,
    shape: 'rectangle',
    lengthM: 12,
    widthM: 5,
    waterSource: 'mains',
    flowLpm: 35,
    flowMeasurementMethod: 'timed_volume',
    pressureBar: 3.1,
    pressureType: 'dynamic',
    pressureMeasurementPoint: 'irrigation_point',
  })

  assert.equal(snapshot.schemaVersion, IRRIGATION_INTAKE_SCHEMA_VERSION)
  assert.equal(snapshot.workflowStatus, 'intake_only')
  assert.equal(snapshot.engineeringStatus, 'not_calculated')
  assert.equal(snapshot.geometry.areaM2, 60)
  assert.equal(snapshot.geometry.customerConfirmed, true)
  assert.equal(snapshot.water.flowProvenance, 'customer_reported')
  assert.equal(snapshot.water.pressureType, 'dynamic')
  assert.equal(snapshot.water.pressureMeasurementPoint, 'irrigation_point')
  assert.deepEqual(snapshot.warnings, [])
})

test('does not treat static or source pressure as verified dynamic sprinkler pressure', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    geometryValidation: acceptedGeometry,
    flowLpm: 20,
    pressureBar: 4,
    pressureType: 'static',
    pressureMeasurementPoint: 'source',
  })

  assert.ok(snapshot.warnings.includes('dynamic_pressure_not_confirmed'))
  assert.ok(snapshot.warnings.includes('pressure_at_irrigation_point_not_confirmed'))
  assert.equal(snapshot.engineeringStatus, 'not_calculated')
})

test('rejects invalid measurements and keeps geometry unconfirmed', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    geometryValidation: { valid: true, status: 'needs_confirmation', computedAreaM2: 40 },
    flowLpm: -2,
    pressureBar: '3.2',
    notes: '  path and trees  ',
  })

  assert.equal(snapshot.geometry.areaM2, null)
  assert.equal(snapshot.geometry.customerConfirmed, false)
  assert.equal(snapshot.water.flowLpm, null)
  assert.equal(snapshot.water.pressureBar, null)
  assert.equal(snapshot.notes, 'path and trees')
  assert.ok(snapshot.warnings.includes('geometry_not_customer_confirmed_or_validated'))
  assert.ok(snapshot.warnings.includes('flow_measurement_missing'))
  assert.ok(snapshot.warnings.includes('pressure_measurement_missing'))
})

test('preserves a measured zero flow or pressure instead of treating it as missing', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    geometryValidation: acceptedGeometry,
    flowLpm: 0,
    pressureBar: 0,
    pressureType: 'dynamic',
    pressureMeasurementPoint: 'irrigation_point',
    flowMeasurementMethod: 'flow_meter',
  })
  assert.equal(snapshot.water.flowLpm, 0)
  assert.equal(snapshot.water.pressureBar, 0)
  assert.equal(snapshot.water.flowProvenance, 'customer_reported')
  assert.equal(snapshot.water.pressureProvenance, 'customer_reported')
})
