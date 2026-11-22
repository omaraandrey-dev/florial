const CIRCULAR_MODEL_RANGES = Object.freeze({
  'R-VAN14': Object.freeze({ minRadiusM: 2.4, maxRadiusM: 4.6, fullCircleModel: 'R-VAN14-360' }),
  'R-VAN18': Object.freeze({ minRadiusM: 4.0, maxRadiusM: 5.5, fullCircleModel: 'R-VAN18-360' }),
  'R-VAN24': Object.freeze({ minRadiusM: 5.2, maxRadiusM: 7.3, fullCircleModel: 'R-VAN24-360' }),
})

const STRIP_MODELS = Object.freeze({
  'R-VAN-LCS': Object.freeze({ pattern: 'left_corner_strip', widthM: 1.5, lengthM: 4.6 }),
  'R-VAN-RCS': Object.freeze({ pattern: 'right_corner_strip', widthM: 1.5, lengthM: 4.6 }),
  'R-VAN-SST': Object.freeze({ pattern: 'side_strip', widthM: 1.5, lengthM: 9.1 }),
})

/** Manufacturer-supported radius envelope; this does not predict flow at an adjusted setting. */
export function getRvanRadiusRange(model) {
  return CIRCULAR_MODEL_RANGES[model] ?? null
}

/**
 * Keeps the requested model when possible and clamps only to its published
 * radius envelope. The caller must surface a warning when the requested
 * radius is outside the model range; no interpolation of flow/precipitation
 * is performed here.
 */
export function resolveRvanRadius(model, requestedRadiusM) {
  const range = getRvanRadiusRange(model)
  if (!range || !Number.isFinite(requestedRadiusM) || requestedRadiusM <= 0) return null
  const radiusM = Math.min(range.maxRadiusM, Math.max(range.minRadiusM, requestedRadiusM))
  return Object.freeze({
    model,
    requestedRadiusM,
    radiusM,
    adjusted: Math.abs(radiusM - requestedRadiusM) > 1e-8,
    withinManufacturerRange: requestedRadiusM >= range.minRadiusM && requestedRadiusM <= range.maxRadiusM,
    minRadiusM: range.minRadiusM,
    maxRadiusM: range.maxRadiusM,
    performanceFlowStatus: 'nominal_table_point_only',
  })
}

/**
 * Selects the smallest R-VAN model that can produce the required radius,
 * unless a caller-supplied preferred model already supports it. This allows
 * one layout cluster to retain a consistent model while other local zones
 * can select a different R-VAN model.
 */
export function selectRvanModelForRadius(requiredRadiusM, preferredModel = null) {
  if (!Number.isFinite(requiredRadiusM) || requiredRadiusM <= 0) return null
  if (preferredModel && getRvanRadiusRange(preferredModel)) {
    const preferred = getRvanRadiusRange(preferredModel)
    if (requiredRadiusM >= preferred.minRadiusM && requiredRadiusM <= preferred.maxRadiusM) {
      return preferredModel
    }
  }
  return ['R-VAN14', 'R-VAN18', 'R-VAN24'].find((model) => {
    const range = CIRCULAR_MODEL_RANGES[model]
    return requiredRadiusM >= range.minRadiusM && requiredRadiusM <= range.maxRadiusM
  }) ?? null
}

export function getRvanStripSpecification(model) {
  const specification = STRIP_MODELS[model]
  return specification ? Object.freeze({ model, ...specification, dimensionsBasis: 'manufacturer_nominal_at_3_1_bar' }) : null
}
