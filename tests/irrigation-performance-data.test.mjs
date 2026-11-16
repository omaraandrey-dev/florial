import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findRainBird3500PerformancePoint,
  RAIN_BIRD_3500_DATASET,
} from '../src/lib/irrigation/irrigationPerformanceData.mjs'

test('Rain Bird 3500 dataset identifies its exact manufacturer source and assumptions', () => {
  assert.equal(RAIN_BIRD_3500_DATASET.manufacturer, 'Rain Bird')
  assert.equal(RAIN_BIRD_3500_DATASET.source.documentCode, 'D42378')
  assert.equal(RAIN_BIRD_3500_DATASET.source.testStandard, 'ASAE S398.1')
  assert.equal(RAIN_BIRD_3500_DATASET.source.precipitationBasis, 'Half-circle operation')
  assert.equal(RAIN_BIRD_3500_DATASET.source.testConditions, 'Zero wind')
  assert.equal(RAIN_BIRD_3500_DATASET.performancePoints.length, 36)
})

test('each published pressure point contains all six nozzle sizes exactly once', () => {
  for (const pressureBar of RAIN_BIRD_3500_DATASET.pressurePointsBar) {
    const rows = RAIN_BIRD_3500_DATASET.performancePoints.filter((point) => point.pressureBar === pressureBar)
    assert.deepEqual(rows.map((point) => point.nozzle), RAIN_BIRD_3500_DATASET.nozzleTree)
  }
})

test('returns the exact manufacturer operating point without interpolation', () => {
  const point = findRainBird3500PerformancePoint(3.0, 2.0)
  assert.deepEqual(point, {
    pressureBar: 3.0,
    nozzle: 2.0,
    radiusM: 8.2,
    flowM3h: 0.43,
    flowLpm: 7.17,
    precipitationSquareMmH: 13,
    precipitationTriangularMmH: 15,
  })
  assert.equal(findRainBird3500PerformancePoint(2.2, 2.0), null)
  assert.equal(findRainBird3500PerformancePoint(3.0, 2.5), null)
})

test('rejects non-finite lookup inputs', () => {
  assert.equal(findRainBird3500PerformancePoint(Number.NaN, 2.0), null)
  assert.equal(findRainBird3500PerformancePoint(3.0, Number.POSITIVE_INFINITY), null)
  assert.equal(findRainBird3500PerformancePoint('3.0', 2.0), null)
})

test('every performance row contains positive finite values', () => {
  for (const point of RAIN_BIRD_3500_DATASET.performancePoints) {
    for (const value of Object.values(point)) {
      assert.equal(Number.isFinite(value), true)
      assert.ok(value > 0)
    }
  }
})

test('maps only the two verified Florial 3504 catalogue models', () => {
  assert.deepEqual(
    RAIN_BIRD_3500_DATASET.supportedModels.map(({ sku, model, sam }) => ({ sku, model, sam })),
    [
      { sku: 'Y34001', model: '3504-PC', sam: false },
      { sku: 'Y34500', model: '3504-PC-SAM', sam: true },
    ],
  )
})
