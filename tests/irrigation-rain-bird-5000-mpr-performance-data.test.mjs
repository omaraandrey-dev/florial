import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findRainBird5000MprPerformancePoint,
  RAIN_BIRD_5000_MPR_DATASET,
} from '../src/lib/irrigation/rainBird5000MprPerformanceData.mjs'

test('Rain Bird 5000 MPR dataset records manufacturer source and exact supported configuration', () => {
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.manufacturer, 'Rain Bird')
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.family, '5000-MPR')
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.source.testStandard, 'ASABE S398.1')
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.source.testConditions, 'Zero wind')
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.nozzlePack.manufacturerModel, '5000MPRMPK')
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.nozzlePack.florialSanityProductMapping, 'not_verified')
  assert.deepEqual(RAIN_BIRD_5000_MPR_DATASET.compatibleRotorSeries, ['5000', '5000+'])
  assert.equal(RAIN_BIRD_5000_MPR_DATASET.performancePoints.length, 60)
})

test('each radius class has exact data for four manufacturer arc patterns and five pressures', () => {
  for (const radiusClassFt of RAIN_BIRD_5000_MPR_DATASET.nozzlePack.radiusClassesFt) {
    for (const arcDeg of [90, 120, 180, 360]) {
      const rows = RAIN_BIRD_5000_MPR_DATASET.performancePoints.filter((point) =>
        point.radiusClassFt === radiusClassFt && point.arcDeg === arcDeg)
      assert.deepEqual(rows.map((point) => point.pressureBar), [1.7, 2.4, 3.1, 3.8, 4.5])
    }
  }
})

test('returns exact MPR operating point by radius class, arc and pressure', () => {
  assert.deepEqual(findRainBird5000MprPerformancePoint({
    radiusClassFt: 30, arcDeg: 180, pressureBar: 3.1,
  }), {
    radiusClassFt: 30,
    arcDeg: 180,
    pressureBar: 3.1,
    radiusM: 9.1,
    flowM3h: 0.67,
    flowLpm: 11.4,
    precipitationSquareMmH: 16.1,
    precipitationTriangularMmH: 18.6,
  })

  assert.deepEqual(findRainBird5000MprPerformancePoint({
    radiusClassFt: 35, arcDeg: 360, pressureBar: 4.5,
  }), {
    radiusClassFt: 35,
    arcDeg: 360,
    pressureBar: 4.5,
    radiusM: 10.7,
    flowM3h: 2.09,
    flowLpm: 34.8,
    precipitationSquareMmH: 18.3,
    precipitationTriangularMmH: 21.2,
  })
})

test('does not infer unsupported arcs, pressures or radius classes', () => {
  assert.equal(findRainBird5000MprPerformancePoint({
    radiusClassFt: 30, arcDeg: 270, pressureBar: 3.1,
  }), null)
  assert.equal(findRainBird5000MprPerformancePoint({
    radiusClassFt: 30, arcDeg: 180, pressureBar: 3.0,
  }), null)
  assert.equal(findRainBird5000MprPerformancePoint({
    radiusClassFt: 40, arcDeg: 180, pressureBar: 3.1,
  }), null)
})

test('rejects malformed lookup arguments', () => {
  assert.equal(findRainBird5000MprPerformancePoint(), null)
  assert.equal(findRainBird5000MprPerformancePoint({
    radiusClassFt: Number.NaN, arcDeg: 90, pressureBar: 3.1,
  }), null)
  assert.equal(findRainBird5000MprPerformancePoint({
    radiusClassFt: 30, arcDeg: 90, pressureBar: '3.1',
  }), null)
})

test('all published MPR rows contain positive finite operating values', () => {
  for (const point of RAIN_BIRD_5000_MPR_DATASET.performancePoints) {
    for (const value of Object.values(point)) {
      assert.equal(Number.isFinite(value), true)
      assert.ok(value > 0)
    }
  }
})
