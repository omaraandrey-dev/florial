import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPreliminaryRvanLayoutPreview } from '../src/lib/irrigation/lawnLayoutPreview.mjs'

const geometry = {
  schemaVersion: 1,
  coordinateSystem: 'local_cartesian_m',
  status: 'confirmed',
  regions: [{
    id: 'lawn-1',
    boundary: { vertices: [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 8 },
    ] },
    exclusions: [],
  }],
}

const intakeSnapshot = {
  schemaVersion: 1,
  geometry: { status: 'customer_confirmed', normalized: geometry },
  water: { pressure: { type: 'dynamic', valueBar: 1.4, testPoint: 'source' } },
}

test('creates a deterministic sampled R-VAN preview from confirmed geometry', () => {
  const result = buildPreliminaryRvanLayoutPreview({
    intakeSnapshot,
    model: 'R-VAN18',
    sampleStepM: 0.5,
  })
  assert.equal(result.status, 'preview_available')
  assert.equal(result.designBasis.family, 'R-VAN')
  assert.equal(result.designBasis.pressureBar, 3.1)
  assert.equal(result.designBasis.pressureBasis, 'manufacturer_recommended_operating_pressure')
  assert.equal(result.designBasis.sitePressureMeasurement, 'not_used')
  assert.equal(result.layout.status, 'coverage_complete_sampled')
  assert.equal(result.layout.hydraulicFeasibility, 'not_evaluated')
  assert.equal(result.layout.coverageScope, 'sampled_geometry_only')
  assert.equal(result.cartEligible, false)
  assert.ok(result.warnings.includes('target_pressure_is_manufacturer_recommended_not_measured_at_site'))
})

test('does not promote an unconfirmed geometry to a layout preview', () => {
  const result = buildPreliminaryRvanLayoutPreview({
    intakeSnapshot: { ...intakeSnapshot, geometry: { status: 'not_confirmed', normalized: geometry } },
  })
  assert.equal(result.status, 'geometry_not_confirmed')
  assert.equal(result.layout, null)
  assert.equal(result.cartEligible, false)
})

test('does not accept HE-VAN or rotor models in the first R-VAN-only preview', () => {
  const hevan = buildPreliminaryRvanLayoutPreview({ intakeSnapshot, model: 'HE-VAN-12' })
  const rotor = buildPreliminaryRvanLayoutPreview({ intakeSnapshot, model: '3504-PC' })
  assert.equal(hevan.status, 'model_not_supported')
  assert.equal(rotor.status, 'model_not_supported')
  assert.equal(hevan.layout, null)
  assert.equal(rotor.layout, null)
})

test('does not use customer-reported source pressure as sprinkler operating pressure', () => {
  const lowSourcePressure = {
    ...intakeSnapshot,
    water: { pressure: { type: 'dynamic', valueBar: 0.8, testPoint: 'source' } },
  }
  const result = buildPreliminaryRvanLayoutPreview({ intakeSnapshot: lowSourcePressure })
  assert.equal(result.designBasis.pressureBar, 3.1)
  assert.equal(result.designBasis.sitePressureMeasurement, 'not_used')
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
})
