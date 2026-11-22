import { FLORIAL_IRRIGATION_STANDARD } from './irrigationProjectStandards.mjs'

const normalizeOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Builds a preliminary project snapshot from approximate customer dimensions.
 * Water assumptions are fixed Florial design conditions, not customer inputs.
 */
export function buildIrrigationIntakeSnapshot(input) {
  const geometryValidation = input.geometryValidation ?? null
  const geometryReady = geometryValidation?.valid === true &&
    geometryValidation?.status === 'accepted' &&
    geometryValidation?.supported === true

  return Object.freeze({
    schemaVersion: 2,
    projectType: 'automatic_lawn_irrigation',
    language: input.language,
    geometry: Object.freeze({
      status: geometryReady ? 'preliminary_from_approximate_dimensions' : 'not_ready',
      shape: input.shape,
      dimensionsM: Object.freeze({
        length: normalizeOptionalNumber(input.length),
        width: normalizeOptionalNumber(input.width),
        cutoutWidth: normalizeOptionalNumber(input.cutoutWidth),
        cutoutDepth: normalizeOptionalNumber(input.cutoutDepth),
        cutoutCorner: input.cutoutCorner ?? null,
      }),
      normalized: geometryReady ? geometryValidation.normalizedGeometry : null,
      areaM2: geometryReady ? geometryValidation.computedAreaM2 : null,
      perimeterM: geometryReady ? geometryValidation.computedPerimeterM : null,
      dimensionBasis: 'customer_approximate_dimensions',
    }),
    water: Object.freeze({
      connection: FLORIAL_IRRIGATION_STANDARD.connection.description,
      nominalPressureBar: FLORIAL_IRRIGATION_STANDARD.connection.nominalPressureBar,
      supplyPipeDiameterMm: FLORIAL_IRRIGATION_STANDARD.connection.supplyPipeDiameterMm,
      entryCorner: FLORIAL_IRRIGATION_STANDARD.connection.entryCorner,
      lineCapacity: FLORIAL_IRRIGATION_STANDARD.lineCapacity,
      source: 'standard_florial_assumption',
    }),
    pipeDesign: Object.freeze({
      mainDiameterMm: FLORIAL_IRRIGATION_STANDARD.pipes.mainDiameterMm,
      zoneDiameterMm: FLORIAL_IRRIGATION_STANDARD.pipes.zoneDiameterMm,
      routingPreference: FLORIAL_IRRIGATION_STANDARD.pipes.routingPreference,
      hydraulicLossesCalculated: false,
    }),
    constraints: Object.freeze({
      notes: String(input.notes ?? '').trim(),
      exclusionsMapped: false,
      obstaclesMapped: false,
      elevationProfileCaptured: false,
    }),
    readiness: evaluateIrrigationIntake(input),
  })
}

/**
 * Intake readiness depends on supported lawn geometry only.
 * Hydraulic calculation and measured customer water data are intentionally
 * outside the Florial assistant's scope.
 */
export function evaluateIrrigationIntake(input) {
  const geometry = input.geometryValidation
  const geometryReady = geometry?.valid === true &&
    geometry?.status === 'accepted' &&
    geometry?.supported === true

  return Object.freeze({
    status: geometryReady ? 'geometry_ready_for_preliminary_layout' : 'intake_incomplete',
    geometryReady,
    standardWaterAssumptionsApplied: true,
    hydraulicFeasibility: 'not_calculated_by_scope',
    hydraulicReady: false,
    missing: Object.freeze(geometryReady ? [] : ['supported_lawn_geometry']),
  })
}
