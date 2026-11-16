const MINIMUM_MEASUREMENTS = 4
const RECOMMENDED_CATCH_CAN_COUNT = 24

/**
 * Calculates lower-quarter distribution uniformity from measured catch-can
 * volumes or depths. All measurements must use the same unit and represent
 * equally weighted sample areas.
 *
 * This is a measurement calculation, not a prediction of sprinkler
 * performance. It does not calculate scheduling coefficient or precipitation
 * rate.
 */
export function calculateLowerQuarterDistributionUniformity(measurements) {
  if (!Array.isArray(measurements) || measurements.length < MINIMUM_MEASUREMENTS) {
    return Object.freeze({
      status: 'invalid_measurements',
      errors: Object.freeze([{ code: 'at_least_four_measurements_required' }]),
      warnings: Object.freeze([]),
    })
  }

  if (measurements.some((value) => !Number.isFinite(value) || value < 0)) {
    return Object.freeze({
      status: 'invalid_measurements',
      errors: Object.freeze([{ code: 'measurements_must_be_finite_non_negative_numbers' }]),
      warnings: Object.freeze([]),
    })
  }

  const averageAll = measurements.reduce((sum, value) => sum + value, 0) / measurements.length
  if (averageAll <= 0) {
    return Object.freeze({
      status: 'invalid_measurements',
      errors: Object.freeze([{ code: 'average_measurement_must_be_greater_than_zero' }]),
      warnings: Object.freeze([]),
    })
  }

  const lowerQuarterCount = Math.ceil(measurements.length / 4)
  const lowestQuarter = measurements.slice().sort((a, b) => a - b).slice(0, lowerQuarterCount)
  const averageLowerQuarter = lowestQuarter.reduce((sum, value) => sum + value, 0) / lowerQuarterCount
  const duLq = averageLowerQuarter / averageAll
  const warnings = measurements.length < RECOMMENDED_CATCH_CAN_COUNT
    ? [{ code: 'fewer_than_24_catch_cans_reliability_not_established' }]
    : []

  return Object.freeze({
    status: 'calculated',
    method: 'lower_quarter_distribution_uniformity',
    weighting: 'equal_sample_weight',
    sampleCount: measurements.length,
    lowerQuarterCount,
    averageAll,
    averageLowerQuarter,
    duLq,
    duLqPercent: duLq * 100,
    lowestQuarterMeasurements: Object.freeze(lowestQuarter),
    recommendedMinimumCatchCans: RECOMMENDED_CATCH_CAN_COUNT,
    warnings: Object.freeze(warnings.map((warning) => Object.freeze(warning))),
    errors: Object.freeze([]),
  })
}
