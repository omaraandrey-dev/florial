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
      source: 'standard_design_assumption',
      pressure: Object.freeze({
        type: 'design_assumption',
        valueBar: 4.053,
        measuredWhileFlowing: false,
        testPoint: 'one_inch_inlet_tap',
        provenance: 'florial_standard_design_basis',
      }),
      flow: Object.freeze({
        valueLpm: null,
        method: 'not_requested_at_customer_intake',
        provenance: 'not_collected',
      }),
    }),
    designBasis: Object.freeze({
      supplyPressureAtm: 4,
      supplyPressureBar: 4.053,
      hydraulicReferencePoint: 'one_inch_inlet_tap',
      incomingPipeNominalDiameterMm: 25,
      inletTapNominalSizeIn: 1,
      mainPipeNominalDiameterMm: 32,
      zonePipeNominalDiameterMm: 25,
      assumedPipeLossBarPer100m: 1,
      assumedElevationLossBarPer10m: 1,
      siteElevationModel: 'flat_site_assumption',
      sprinklerFamilyPreference: 'Rain Bird R-VAN',
      placementStrategy: 'perimeter_first_then_interior_if_required',
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

  const dynamicPressureReady = false
  const flowReady = false

  const missing = []
  if (!geometryReady) missing.push('confirmed_supported_geometry')

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
