import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from '../src/lib/irrigation/rainBirdRvanPerformanceData.mjs'
import { RAIN_BIRD_SELECTION_PREFERENCE } from '../src/lib/irrigation/rainBirdSelectionPreference.mjs'

test('R-VAN dataset identifies exact manufacturer source and test assumptions', () => {
  assert.equal(RAIN_BIRD_RVAN_DATASET.manufacturer, 'Rain Bird')
  assert.equal(RAIN_BIRD_RVAN_DATASET.source.documentCode, 'D41159B')
  assert.equal(RAIN_BIRD_RVAN_DATASET.source.testedBodyPopUpCm, 10.2)
  assert.equal(RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar, 3.1)
  assert.deepEqual(RAIN_BIRD_RVAN_DATASET.source.pressureRangeBar, [2.1, 3.8])
  assert.equal(RAIN_BIRD_RVAN_DATASET.source.testConditions, 'Zero wind')
  assert.equal(RAIN_BIRD_RVAN_DATASET.performancePoints.length, 108)
})

test('all nine published Florial R-VAN nozzle SKUs have exact model bindings', () => {
  assert.deepEqual(
    RAIN_BIRD_RVAN_DATASET.models.map(({ model, sku }) => ({ model, sku })),
    [
      { model: 'R-VAN14', sku: 'A84659' },
      { model: 'R-VAN14-360', sku: 'A84664' },
      { model: 'R-VAN18', sku: 'A84660' },
      { model: 'R-VAN18-360', sku: 'A84665' },
      { model: 'R-VAN24', sku: 'A84661' },
      { model: 'R-VAN24-360', sku: 'A84666' },
      { model: 'R-VAN-LCS', sku: 'A84667' },
      { model: 'R-VAN-RCS', sku: 'A84668' },
      { model: 'R-VAN-SST', sku: 'A84669' },
    ],
  )
})

test('every R-VAN performance point has valid pressure, flow and precipitation', () => {
  for (const point of RAIN_BIRD_RVAN_DATASET.performancePoints) {
    assert.ok(RAIN_BIRD_RVAN_DATASET.models.some((model) => model.model === point.model))
    assert.ok(RAIN_BIRD_RVAN_DATASET.pressurePointsBar.includes(point.pressureBar))
    assert.ok(Number.isFinite(point.flowLpm) && point.flowLpm > 0)
    assert.ok(Number.isFinite(point.precipitationSquareMmH) && point.precipitationSquareMmH > 0)
    assert.ok(Number.isFinite(point.precipitationTriangularMmH) && point.precipitationTriangularMmH > 0)
    if (point.pattern === 'circular') {
      assert.ok(Number.isFinite(point.radiusM) && point.radiusM > 0)
      assert.ok([90, 180, 210, 270, 360].includes(point.arcDeg))
    } else {
      assert.equal(point.radiusM, null)
      assert.equal(point.arcDeg, null)
      assert.equal(point.dimensionsM.length, 2)
      assert.ok(point.dimensionsM.every((value) => Number.isFinite(value) && value > 0))
    }
  }
})

test('returns only exact manufacturer operating points without interpolation', () => {
  assert.deepEqual(
    findRainBirdRvanPerformancePoint('R-VAN18', 3.1, 180),
    {
      model: 'R-VAN18',
      pattern: 'circular',
      arcDeg: 180,
      pressureBar: 3.1,
      radiusM: 5.2,
      flowLpm: 3.82,
      precipitationSquareMmH: 16,
      precipitationTriangularMmH: 19,
    },
  )
  assert.equal(findRainBirdRvanPerformancePoint('R-VAN18', 3.0, 180), null)
  assert.equal(findRainBirdRvanPerformancePoint('R-VAN18', 3.1, 45), null)
  assert.equal(findRainBirdRvanPerformancePoint('R-VAN18', 3.1, 360), null)
  assert.equal(findRainBirdRvanPerformancePoint('R-VAN18-360', 3.1, 360).flowLpm, 7)
})

test('strip models are queried without circular arc and do not pretend to have radius', () => {
  const point = findRainBirdRvanPerformancePoint('R-VAN-SST', 3.1)
  assert.deepEqual(point.dimensionsM, [1.5, 9.1])
  assert.equal(point.radiusM, null)
  assert.equal(findRainBirdRvanPerformancePoint('R-VAN-SST', 3.1, 180), null)
})

test('selection preference reflects owner direction but does not waive engineering gates', () => {
  assert.equal(RAIN_BIRD_SELECTION_PREFERENCE.sprayNozzles.preferredFamily, 'R-VAN')
  assert.equal(RAIN_BIRD_SELECTION_PREFERENCE.sprayNozzles.alternativeFamily, 'HE-VAN')
  assert.deepEqual(RAIN_BIRD_SELECTION_PREFERENCE.rotors.preferredRadiusRangeM, [6, 8.5])
  assert.equal(RAIN_BIRD_SELECTION_PREFERENCE.rotors.conditionalUpperRadiusM, 9)
  assert.ok(RAIN_BIRD_SELECTION_PREFERENCE.safeguards.some((rule) => rule.includes('lower per-head flow')))
})
