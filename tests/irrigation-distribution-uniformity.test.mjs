import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateLowerQuarterDistributionUniformity } from '../src/lib/irrigation/distributionUniformity.mjs'

test('calculates DUlq from the New Mexico State University 24-can example', () => {
  const measurements = [
    13, 35, 40, 29, 39, 41, 45, 45, 30, 35, 47, 35,
    79, 79, 50, 35, 17, 22, 28, 46, 67, 78, 42, 53,
  ]
  const result = calculateLowerQuarterDistributionUniformity(measurements)

  assert.equal(result.status, 'calculated')
  if (result.status !== 'calculated') return
  assert.equal(result.sampleCount, 24)
  assert.equal(result.lowerQuarterCount, 6)
  assert.deepEqual(result.lowestQuarterMeasurements, [13, 17, 22, 28, 29, 30])
  assert.ok(Math.abs(result.averageAll - 42.9166666667) < 1e-8)
  assert.ok(Math.abs(result.averageLowerQuarter - 23.1666666667) < 1e-8)
  assert.ok(Math.abs(result.duLqPercent - 54.0) < 0.1)
  assert.deepEqual(result.warnings, [])
})

test('rounds the lower-quarter sample count upward for non-multiples of four', () => {
  const result = calculateLowerQuarterDistributionUniformity(
    Array.from({ length: 26 }, (_, index) => index + 1),
  )
  assert.equal(result.status, 'calculated')
  if (result.status !== 'calculated') return
  assert.equal(result.lowerQuarterCount, 7)
  assert.deepEqual(result.lowestQuarterMeasurements, [1, 2, 3, 4, 5, 6, 7])
})

test('flags catch-can sets below the recommended 24 samples without hiding the calculation', () => {
  const result = calculateLowerQuarterDistributionUniformity([1, 2, 3, 4, 5, 6, 7, 8])
  assert.equal(result.status, 'calculated')
  if (result.status !== 'calculated') return
  assert.equal(result.duLqPercent, 40)
  assert.ok(result.warnings.some((warning) => warning.code === 'fewer_than_24_catch_cans_reliability_not_established'))
})

test('allows zero readings and correctly reports zero lower-quarter uniformity', () => {
  const result = calculateLowerQuarterDistributionUniformity([0, 1, 2, 3])
  assert.equal(result.status, 'calculated')
  if (result.status !== 'calculated') return
  assert.equal(result.duLqPercent, 0)
})

test('rejects too few, negative, non-finite and all-zero measurements', () => {
  assert.equal(calculateLowerQuarterDistributionUniformity([1, 2, 3]).status, 'invalid_measurements')
  assert.equal(calculateLowerQuarterDistributionUniformity([1, 2, -1, 4]).status, 'invalid_measurements')
  assert.equal(calculateLowerQuarterDistributionUniformity([1, 2, Number.NaN, 4]).status, 'invalid_measurements')
  assert.equal(calculateLowerQuarterDistributionUniformity([0, 0, 0, 0]).status, 'invalid_measurements')
})
