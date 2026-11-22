import { findRainBirdRvanPerformancePoint } from './rainBirdRvanPerformanceData.mjs'

const CIRCULAR_MODEL_RANGES = Object.freeze({
  'R-VAN14': Object.freeze({ minRadiusM: 2.4, maxRadiusM: 4.6, fullCircleModel: 'R-VAN14-360' }),
  'R-VAN18': Object.freeze({ minRadiusM: 4.0, maxRadiusM: 5.5, fullCircleModel: 'R-VAN18-360' }),
  'R-VAN24': Object.freeze({ minRadiusM: 5.2, maxRadiusM: 7.3, fullCircleModel: 'R-VAN24-360' }),
})

const PREFERRED_MODEL_MINIMUM_RADIUS_TOLERANCE_M = 0.2

const STRIP_MODELS = Object.freeze({
  'R-VAN-LCS': Object.freeze({ pattern: 'left_corner_strip', widthM: 1.5, lengthM: 4.6 }),
  'R-VAN-RCS': Object.freeze({ pattern: 'right_corner_strip', widthM: 1.5, lengthM: 4.6 }),
  'R-VAN-SST': Object.freeze({ pattern: 'side_strip', widthM: 1.5, lengthM: 9.1 }),
})

/** Manufacturer-supported radius envelope; this does not predict flow at an adjusted setting. */
export function getRvanRadiusRange(model) {
  return CIRCULAR_MODEL_RANGES[model] ?? null
}

function exactPerformanceModel(model, arcDeg) {
  return arcDeg === 360 ? model + '-360' : model
}

function nominalRadiusAtPressure(model, pressureBar, arcDeg) {
  const point = findRainBirdRvanPerformancePoint(exactPerformanceModel(model, arcDeg), pressureBar, arcDeg)
  return point?.radiusM ?? null
}

/**
 * Clamps the requested geometric radius to the model's minimum and the exact
 * manufacturer radius at the selected pressure/arc. It does not extrapolate
 * beyond the pressure-specific performance row.
 */
export function resolveRvanRadius(model, requestedRadiusM, pressureBar = 3.1, arcDeg = 180) {
  const range = getRvanRadiusRange(model)
  const nominalRadiusM = nominalRadiusAtPressure(model, pressureBar, arcDeg)
  if (!range || !Number.isFinite(requestedRadiusM) || requestedRadiusM <= 0 || !Number.isFinite(nominalRadiusM)) return null
  const radiusM = Math.min(nominalRadiusM, Math.max(range.minRadiusM, requestedRadiusM))
  return Object.freeze({
    model,
    requestedRadiusM,
    radiusM,
    adjusted: Math.abs(radiusM - nominalRadiusM) > 1e-8,
    withinManufacturerRange: requestedRadiusM >= range.minRadiusM && requestedRadiusM <= nominalRadiusM,
    requestedBelowMinimum: requestedRadiusM < range.minRadiusM,
    requestedAboveNominal: requestedRadiusM > nominalRadiusM,
    minRadiusM: range.minRadiusM,
    maxRadiusM: nominalRadiusM,
    nominalRadiusM,
    pressureBar,
    arcDeg,
    performanceFlowStatus: 'nominal_table_point_only',
  })
}

/**
 * Selects the smallest R-VAN model that can produce the required radius,
 * unless a caller-supplied preferred model already supports it. This allows
 * one layout cluster to retain a consistent model while other local zones
 * can select a different R-VAN model.
 */
export function selectRvanModelForRadius(requiredRadiusM, preferredModel = null, pressureBar = 3.1, arcDeg = 180) {
  if (!Number.isFinite(requiredRadiusM) || requiredRadiusM <= 0) return null
  const supports = (model) => {
    const range = getRvanRadiusRange(model)
    const nominalRadiusM = nominalRadiusAtPressure(model, pressureBar, arcDeg)
    return Boolean(range && Number.isFinite(nominalRadiusM) &&
      requiredRadiusM >= range.minRadiusM && requiredRadiusM <= nominalRadiusM)
  }
  if (preferredModel) {
    const preferredRange = getRvanRadiusRange(preferredModel)
    const preferredNominal = nominalRadiusAtPressure(preferredModel, pressureBar, arcDeg)
    const slightlyBelowMinimum = preferredRange &&
      requiredRadiusM < preferredRange.minRadiusM &&
      preferredRange.minRadiusM - requiredRadiusM <= PREFERRED_MODEL_MINIMUM_RADIUS_TOLERANCE_M + 1e-8
    if (preferredRange && Number.isFinite(preferredNominal) &&
        requiredRadiusM <= preferredNominal &&
        (supports(preferredModel) || slightlyBelowMinimum)) return preferredModel
  }
  return ['R-VAN14', 'R-VAN18', 'R-VAN24'].find((model) => {
    const nominalRadiusM = nominalRadiusAtPressure(model, pressureBar, arcDeg)
    return requiredRadiusM >= 2.4 && Number.isFinite(nominalRadiusM) && requiredRadiusM <= nominalRadiusM
  }) ?? null
}

export function getRvanStripSpecification(model) {
  const specification = STRIP_MODELS[model]
  return specification ? Object.freeze({ model, ...specification, dimensionsBasis: 'manufacturer_nominal_at_3_1_bar' }) : null
}
