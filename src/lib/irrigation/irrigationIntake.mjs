import { FLORIAL_IRRIGATION_PROJECT_STANDARD } from './irrigationProjectStandards.mjs'

const normalizeOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Build a privacy-minimized, versioned geometry-only intake snapshot.
 * Water and pipe assumptions are fixed Florial standards, not customer questions.
 */
export function buildIrrigationIntakeSnapshot(input) {
  const geometryValidation = input.geometryValidation ?? null
  const geometryAccepted = geometryValidation?.valid === true &&
    geometryValidation?.status === 'accepted' &&
    geometryValidation?.supported === true

  return Object.freeze({
    schemaVersion: 2,
    projectType: 'automatic_lawn_irrigation',
    language: input.language,
    geometry: Object.freeze({
      status: geometryAccepted ? 'preliminary_geometry_available' : 'not_available',
      shape: input.shape,
      dimensionsM: Object.freeze({
        length: normalizeOptionalNumber(input.length),
        width: normalizeOptionalNumber(input.width),
        cutoutWidth: normalizeOptionalNumber(input.cutoutWidth),
        cutoutDepth: normalizeOptionalNumber(input.cutoutDepth),
        cutoutCorner: input.cutoutCorner ?? null,
      }),
      normalized: geometryAccepted ? geometryValidation.normalizedGeometry : null,
      areaM2: geometryAccepted ? geometryValidation.computedAreaM2 : null,
      perimeterM: geometryAccepted ? geometryValidation.computedPerimeterM : null,
      dimensionsAreApproximate: true,
    }),
    projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    constraints: Object.freeze({
      notes: String(input.notes ?? '').trim(),
      exclusionsMapped: false,
      obstaclesMapped: false,
      elevationProfileCaptured: false,
    }),
    readiness: Object.freeze({
      geometryReady: geometryAccepted,
      hydraulicFeasibility: 'not_evaluated',
    }),
  })
}

export function evaluateIrrigationIntake(input) {
  const geometry = input.geometryValidation
  const geometryReady = geometry?.valid === true &&
    geometry?.status === 'accepted' &&
    geometry?.supported === true
  return Object.freeze({
    status: geometryReady ? 'geometry_ready_for_preliminary_layout' : 'geometry_incomplete',
    geometryReady,
    hydraulicFeasibility: 'not_evaluated',
    missing: Object.freeze(geometryReady ? [] : ['valid_rectangle_or_l_shape_dimensions']),
  })
}
