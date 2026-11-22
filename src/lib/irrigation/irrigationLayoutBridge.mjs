import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'
import { selectRvanModelForRadius, getRvanRadiusRange, getRvanStripSpecification } from './rvanNozzleSelection.mjs'

function result(status, extra = {}) {
  return Object.freeze({
    status,
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
    ...extra,
  })
}

/**
 * Connects the customer geometry snapshot to the R-VAN-only preliminary
 * layout engine. HE-VAN is intentionally not used as a fallback.
 */
export function buildPreliminaryLawnLayout(snapshot, { sampleStepM = 0.25 } = {}) {
  if (!snapshot || snapshot.schemaVersion !== 1 ||
      snapshot.projectType !== 'automatic_lawn_irrigation') {
    return result('invalid_intake_snapshot')
  }

  if (snapshot.geometry?.status !== 'customer_confirmed' ||
      snapshot.geometry?.normalized?.status !== 'confirmed') {
    return result('needs_confirmed_geometry')
  }

  const geometry = snapshot.geometry.normalized
  if (!Array.isArray(geometry.regions) || geometry.regions.length !== 1) {
    return result('geometry_not_supported', { reason: 'single_region_only' })
  }

  const region = geometry.regions[0]
  if (!Array.isArray(region.boundary?.vertices) || region.boundary.vertices.length < 4) {
    return result('geometry_not_supported', { reason: 'invalid_or_missing_boundary' })
  }
  if (region.exclusions?.length) {
    return result('geometry_not_supported', { reason: 'exclusions_not_supported_by_layout_engine' })
  }

  const vertices = region.boundary.vertices
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const shortSideM = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))

  // Strip products have rectangular spray patterns, not circular radii. Keep
  // them out of the circular solver until their footprint/overlap engine is used.
  if (shortSideM >= 1 && shortSideM <= 2) {
    const stripSpecifications = ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST']
      .map((model) => getRvanStripSpecification(model))
    return result('strip_nozzle_layout_required', {
      shortSideM,
      stripSpecifications,
      nominalStripWidthM: 1.5,
      sizeAdjustmentRequired: Math.abs(shortSideM - 1.5) > 1e-8,
      reason: 'strip_patterns_require_dedicated_footprint_and_overlap_solver',
      manufacturerSizeAdjustmentLimitsPublished: false,
    })
  }

  if (shortSideM < 2.4) {
    return result('short_side_below_supported_rvan_scope', {
      shortSideM,
      reason: 'outside_verified_rvan_circular_and_nominal_strip_ranges',
    })
  }

  // Select a circular model whose manufacturer envelope covers the local
  // short-side spacing. For wider lawns, retain R-VAN24 and require internal
  // rows rather than switching to HE-VAN or an unsupported rotor calculation.
  const model = shortSideM <= 7.3
    ? selectRvanModelForRadius(shortSideM)
    : shortSideM <= 14.6 ? 'R-VAN24' : null
  if (!model) {
    return result('requires_rotor_engine', {
      shortSideM,
      reason: 'beyond_current_rvan_multirow_scope',
      plannedNextFamily: 'Rain Bird 3500',
    })
  }

  const modelRange = getRvanRadiusRange(model)
  const requiresInternalRows = shortSideM > modelRange.maxRadiusM
  const dataset = RAIN_BIRD_RVAN_DATASET
  const pressureBar = dataset.source.recommendedOperatingPressureBar
  const modelEvidence = dataset.models.find((entry) => entry.model === model)
  if (!modelEvidence) return result('manufacturer_model_mapping_missing', { family: 'R-VAN', model, pressureBar })

  const layout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model,
    pressureBar,
    sampleStepM,
  })

  return result(layout.status === 'coverage_complete_sampled' ? 'layout_generated' : 'layout_incomplete', {
    engine: Object.freeze({
      name: 'Florial deterministic lawn layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm ?? null,
    }),
    operatingScenario: Object.freeze({
      manufacturer: dataset.manufacturer,
      family: 'R-VAN',
      model,
      modelsUsed: layout.modelsUsed,
      pressureBar,
      pressureBasis: 'manufacturer_recommended_operating_pressure',
      modelSelectionBasis: 'R-VAN_model_selected_from_manufacturer_radius_envelope',
      modelRadiusRangeM: Object.freeze([modelRange.minRadiusM, modelRange.maxRadiusM]),
      requiresInternalRows,
      sourceUrl: dataset.source.url,
      actualNozzlePressureVerified: false,
      customerSourceMeasurementsUsedAsNozzlePressure: false,
    }),
    geometry: Object.freeze({
      shape: layout.geometry?.shape ?? null,
      areaM2: layout.geometry?.areaM2 ?? snapshot.geometry.areaM2,
      shortSideM,
    }),
    layout,
    warnings: Object.freeze([
      ...layout.warnings,
      Object.freeze({ code: 'manufacturer_operating_point_is_a_scenario_not_site_measurement', path: 'operatingScenario.pressureBar' }),
      Object.freeze({ code: 'rvan_model_selection_is_preliminary_and_requires_engineer_review', path: 'operatingScenario.model' }),
      Object.freeze({ code: 'customer_source_pressure_and_flow_not_used_as_nozzle_operating_point', path: 'intake.water' }),
      Object.freeze({ code: 'hydraulic_network_and_zone_feasibility_not_evaluated', path: 'hydraulics' }),
      Object.freeze({ code: 'obstacles_and_exclusions_not_mapped', path: 'geometry.exclusions' }),
      ...(requiresInternalRows ? [Object.freeze({ code: 'internal_rows_required_but_corner_first_rule_set_is_pending', path: 'layout.sprinklers' })] : []),
    ]),
  })
}
