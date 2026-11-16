export type DistributionUniformityErrorCode =
  | 'at_least_four_measurements_required'
  | 'measurements_must_be_finite_non_negative_numbers'
  | 'average_measurement_must_be_greater_than_zero'

export interface DistributionUniformityError {
  code: DistributionUniformityErrorCode
}

export interface DistributionUniformityWarning {
  code: 'fewer_than_24_catch_cans_reliability_not_established'
}

export interface InvalidDistributionUniformityResult {
  status: 'invalid_measurements'
  errors: readonly DistributionUniformityError[]
  warnings: readonly []
}

export interface CalculatedDistributionUniformityResult {
  status: 'calculated'
  method: 'lower_quarter_distribution_uniformity'
  weighting: 'equal_sample_weight'
  sampleCount: number
  lowerQuarterCount: number
  averageAll: number
  averageLowerQuarter: number
  duLq: number
  duLqPercent: number
  lowestQuarterMeasurements: readonly number[]
  recommendedMinimumCatchCans: 24
  warnings: readonly DistributionUniformityWarning[]
  errors: readonly []
}

/**
 * Calculates measured lower-quarter distribution uniformity from catch-can
 * volumes or depths in one consistent unit. Equal-area sampling is required.
 * This function does not predict sprinkler performance or calculate SC.
 */
export function calculateLowerQuarterDistributionUniformity(
  measurements: readonly number[],
): InvalidDistributionUniformityResult | CalculatedDistributionUniformityResult
