import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findRainBirdHevanPerformancePoint,
  RAIN_BIRD_HEVAN_DATASET,
} from '../src/lib/irrigation/rainBirdHevanPerformanceData.mjs'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from '../src/lib/irrigation/rainBirdRvanPerformanceData.mjs'

test('HE-VAN dataset records the Rain Bird metric chart and 64 discrete rows', () => {
  assert.equal(RAIN_BIRD_HEVAN_DATASET.manufacturer, 'Rain Bird')
  assert.match(RAIN_BIRD_HEVAN_DATASET.source.title, /HE-VAN/)
  assert.equal(RAIN_BIRD_HEVAN_DATASET.source.testConditions, 'Zero wind')
  assert.equal(RAIN_BIRD_HEVAN_DATASET.performancePoints.length, 64)
  assert.equal(RAIN_BIRD_HEVAN_DATASET.source.optimumPressureBar, 2.1)
  assert.equal(RAIN_BIRD_HEVAN_DATASET.source.recommendedOperatingPressureBar, 2.07)
  assert.deepEqual(RAIN_BIRD_HEVAN_DATASET.models.map(({ spacingRangeM }) => spacingRangeM), [[1.8, 2.4], [2.4, 3.0], [3.0, 3.7], [3.7, 4.6]])
})

test('HE-VAN dataset maps the four published Florial nozzle SKUs', () => {
  assert.deepEqual(
    RAIN_BIRD_HEVAN_DATASET.models.map(({ model, sku }) => ({ model, sku })),
    [
      { model: 'HE-VAN-8', sku: 'HE0801' },
      { model: 'HE-VAN-10', sku: 'HE1001' },
      { model: 'HE-VAN-12', sku: 'HE1201' },
      { model: 'HE-VAN-15', sku: 'HE1501' },
    ],
  )
  assert.equal(RAIN_BIRD_HEVAN_DATASET.models[0].sanityProductId, '21e4bb9f-c635-4d6f-882d-c9fefb70b8d3')
})

test('each HE-VAN model contains four exact arcs and four manufacturer pressure points', () => {
  for (const model of RAIN_BIRD_HEVAN_DATASET.models) {
    const rows = RAIN_BIRD_HEVAN_DATASET.performancePoints.filter((point) => point.model === model.model)
    assert.equal(rows.length, 16)
    assert.deepEqual([...new Set(rows.map((point) => point.arcDeg))].sort((a, b) => a - b), [90, 180, 270, 360])
    assert.deepEqual([...new Set(rows.map((point) => point.pressureBar))].sort((a, b) => a - b), [1.03, 1.38, 1.72, 2.07])
  }
})

test('HE-VAN exact lookup preserves manufacturer operating values', () => {
  assert.deepEqual(
    findRainBirdHevanPerformancePoint('HE-VAN-12', 1.72, 180),
    {
      model: 'HE-VAN-12',
      pattern: 'circular',
      arcDeg: 180,
      pressureBar: 1.72,
      radiusM: 3.4,
      flowM3h: 0.25,
      flowLpm: 4.09,
      precipitationSquareMmH: 43.7,
      precipitationTriangularMmH: 50.4,
    },
  )
  assert.equal(findRainBirdHevanPerformancePoint('HE-VAN-12', 1.7, 180), null)
  assert.equal(findRainBirdHevanPerformancePoint('HE-VAN-12', 1.72, 45), null)
})

test('every HE-VAN point contains positive finite manufacturer values', () => {
  for (const point of RAIN_BIRD_HEVAN_DATASET.performancePoints) {
    for (const value of [
      point.arcDeg,
      point.pressureBar,
      point.radiusM,
      point.flowM3h,
      point.flowLpm,
      point.precipitationSquareMmH,
      point.precipitationTriangularMmH,
    ]) {
      assert.equal(Number.isFinite(value), true)
      assert.ok(value > 0)
    }
  }
})

test('R-VAN and HE-VAN retain separate, family-specific manufacturer operating points', () => {
  const rvan = findRainBirdRvanPerformancePoint('R-VAN18', 3.1, 180)
  const hevan = findRainBirdHevanPerformancePoint('HE-VAN-12', 1.72, 180)
  assert.equal(rvan.flowLpm, 3.82)
  assert.equal(hevan.flowLpm, 4.09)
  assert.equal(rvan.pressureBar, 3.1)
  assert.equal(hevan.pressureBar, 1.72)
  assert.notEqual(rvan.radiusM, hevan.radiusM)
  assert.notEqual(rvan.precipitationSquareMmH, hevan.precipitationSquareMmH)
})
