const finitePositive = (value) => Number.isFinite(value) && value > 0

const normalizeOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Build a privacy-minimized, versioned intake snapshot for the lawn assistant.
 * It is an in-memory project contract only; it does not persist or transmit data.
 */
export function buildIrrigationIntakeSnapshot(input) {
  const geometryValidation = input.geometryValidation ?? null
  const geometryAccepted = geometryValidation?.valid === true &&
    geometryValidation?.status === 'accepted' &&
    geometryValidation?.supported === true

  return Object.freeze({
    schemaVersion: 1,
    projectType: 'automatic_lawn_irrigation',
    language: input.language,
    geometry: Object.freeze({
      status: geometryAccepted ? 'customer_confirmed' : 'not_confirmed',
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
      confirmation: 'customer_assertion',
    }),
    water: Object.freeze({
      source: input.waterSource ?? 'unknown',
      pressure: Object.freeze({
        type: input.pressureType ?? 'unknown',
        valueBar: normalizeOptionalNumber(input.pressureBar),
        measuredWhileFlowing: input.pressureMeasuredWhileFlowing === true,
        testPoint: input.pressureTestPoint ?? 'unknown',
        provenance: 'customer_input',
      }),
      flow: Object.freeze({
        valueLpm: normalizeOptionalNumber(input.flowRate),
        method: input.flowMeasurementMethod ?? 'unknown',
        provenance: 'customer_input',
      }),
    }),
    constraints: Object.freeze({
      notes: String(input.notes ?? '').trim(),
      exclusionsMapped: false,
      obstaclesMapped: false,
      elevationProfileCaptured: false,
      pipeNetworkCaptured: false,
    }),
    readiness: evaluateIrrigationIntake(input),
  })
}

/**
 * Readiness gates are intentionally conservative. Intake completion is not
 * hydraulic readiness and never certifies source/network feasibility.
 */
export function evaluateIrrigationIntake(input) {
  const geometry = input.geometryValidation
  const geometryReady = geometry?.valid === true &&
    geometry?.status === 'accepted' &&
    geometry?.supported === true

  const pressureBar = normalizeOptionalNumber(input.pressureBar)
  const flowRate = normalizeOptionalNumber(input.flowRate)
  const dynamicPressureReady = input.pressureType === 'dynamic' &&
    finitePositive(pressureBar) &&
    input.pressureMeasuredWhileFlowing === true &&
    typeof input.pressureTestPoint === 'string' &&
    input.pressureTestPoint !== 'unknown'

  const flowReady = finitePositive(flowRate) &&
    ['bucket', 'flow_meter', 'other_verified'].includes(input.flowMeasurementMethod)

  const missing = []
  if (!geometryReady) missing.push('confirmed_supported_geometry')
  if (!input.waterSource || input.waterSource === 'unknown') missing.push('water_source')
  if (!dynamicPressureReady) missing.push('dynamic_pressure_and_test_point')
  if (!flowReady) missing.push('measured_flow_and_method')
  if (input.pipeNetworkCaptured !== true) missing.push('pipe_network')
  if (input.elevationProfileCaptured !== true) missing.push('elevation_profile_or_verified_zero')
  if (input.restrictionsCaptured !== true) missing.push('network_restrictions')

  return Object.freeze({
    status: geometryReady ? 'geometry_ready_for_preliminary_layout' : 'intake_incomplete',
    geometryReady,
    dynamicPressureReady,
    flowReady,
    hydraulicFeasibility: 'not_evaluated',
    hydraulicReady: false,
    missing: Object.freeze(missing),
  })
}
