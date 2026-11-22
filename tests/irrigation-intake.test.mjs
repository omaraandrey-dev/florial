import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIrrigationIntakeSnapshot, evaluateIrrigationIntake } from '../src/lib/irrigation/irrigationIntake.mjs'
import { FLORIAL_IRRIGATION_PROJECT_STANDARD } from '../src/lib/irrigation/irrigationProjectStandards.mjs'

const acceptedGeometry = {
  valid: true,
  status: 'accepted',
  supported: true,
  computedAreaM2: 50,
  computedPerimeterM: 30,
  normalizedGeometry: {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices: [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 },
    ] }, exclusions: [] }],
  },
}

test('geometry-only intake is ready for a preliminary layout without water questions', () => {
  const result = evaluateIrrigationIntake({ geometryValidation: acceptedGeometry })
  assert.equal(result.geometryReady, true)
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.deepEqual(result.missing, [])
})

test('invalid or missing geometry blocks layout generation', () => {
  const result = evaluateIrrigationIntake({ geometryValidation: null })
  assert.equal(result.geometryReady, false)
  assert.deepEqual(result.missing, ['valid_rectangle_or_l_shape_dimensions'])
})

test('snapshot records approximate dimensions and fixed Florial water assumptions', () => {
  const snapshot = buildIrrigationIntakeSnapshot({
    language: 'bg',
    shape: 'rectangle',
    length: '10',
    width: '5',
    geometryValidation: acceptedGeometry,
    notes: 'Pool beside the east edge',
  })
  assert.equal(snapshot.schemaVersion, 2)
  assert.equal(snapshot.geometry.areaM2, 50)
  assert.equal(snapshot.geometry.dimensionsAreApproximate, true)
  assert.equal(snapshot.projectStandard.source.tapSizeInches, 1)
  assert.equal(snapshot.projectStandard.source.inletPressureBar, 4)
  assert.equal(snapshot.projectStandard.source.supplyPipeDiameterMm, 25)
  assert.equal(snapshot.projectStandard.source.connectionCorner, 'top-right')
  assert.equal(snapshot.constraints.notes, 'Pool beside the east edge')
  assert.equal(snapshot.readiness.hydraulicFeasibility, 'not_evaluated')
  assert.deepEqual(snapshot.projectStandard, FLORIAL_IRRIGATION_PROJECT_STANDARD)
})
