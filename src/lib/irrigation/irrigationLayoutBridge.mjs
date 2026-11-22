import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'
import { RAIN_BIRD_HEVAN_DATASET } from './rainBirdHevanPerformanceData.mjs'

const MIN_HEVAN_SPACING_TARGET_M = 1.8
const MIN_RVAN_SPACING_TARGET_M = 4
const RVAN14_MAX_SPACING_TARGET_M = 4.6
const RVAN18_MAX_SPACING_TARGET_M = 5.5
const RVAN24_MAX_SPACING_TARGET_M = 7.5

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
 * Connects a confirmed, privacy-minimized intake snapshot to the existing
 * deterministic lawn-layout engine.
 *
 * The bridge provides provisional R-VAN and HE-VAN candidates from separate
 * manufacturer datasets. Family/model selection uses the lawn's short side
 * only as a candidate rule; it is not a final nozzle specification.
 * Manufacturer optimum pressure is a scenario, never a site nozzle-pressure
 * measurement. Customer source pressure/flow are not converted into it.
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
    return result('geometry_not_supported', {
      reason: 'single_region_only',
    })
  }

  const region = geometry.regions[0]
  if (!Array.isArray(region.boundary?.vertices) || region.boundary.vertices.length < 4) {
    return result('geometry_not_supported', {
      reason: 'invalid_or_missing_boundary',
    })
  }
  if (region.exclusions?.length) {
    return result('geometry_not_supported', {
      reason: 'exclusions_not_supported_by_layout_engine',
    })
  }

  const vertices = region.boundary.vertices
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const shortSideM = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const perimeterSpacingTargetM = shortSideM / 2

  let family
  let model
  let dataset
  let modelSelectionBasis = 'provisional_half_short_side_head_spacing_candidate_rule'

  // Prefer R-VAN for the supported short-side envelope. Narrower sites use
  // Rain Bird HE-VAN's separate manufacturer spacing bands and exact table.
  if (perimeterSpacingTargetM >= MIN_RVAN_SPACING_TARGET_M && perimeterSpacingTargetM <= RVAN14_MAX_SPACING_TARGET_M) {
    family = 'R-VAN'
    model = 'R-VAN14'
    dataset = RAIN_BIRD_RVAN_DATASET
  } else if (perimeterSpacingTargetM > RVAN14_MAX_SPACING_TARGET_M && perimeterSpacingTargetM <= RVAN18_MAX_SPACING_TARGET_M) {
    family = 'R-VAN'
    model = 'R-VAN18'
    dataset = RAIN_BIRD_RVAN_DATASET
  } else if (perimeterSpacingTargetM > RVAN18_MAX_SPACING_TARGET_M && perimeterSpacingTargetM <= RVAN24_MAX_SPACING_TARGET_M) {
    family = 'R-VAN'
    model = 'R-VAN24'
    dataset = RAIN_BIRD_RVAN_DATASET
  } else if (perimeterSpacingTargetM >= MIN_HEVAN_SPACING_TARGET_M && perimeterSpacingTargetM < MIN_RVAN_SPACING_TARGET_M) {
    family = 'HE-VAN'
    dataset = RAIN_BIRD_HEVAN_DATASET
    modelSelectionBasis = 'provisional_half_short_side_spacing_candidate_rule_using_manufacturer_spacing_ranges'
    const matchingModel = dataset.models.find((entry, index) => {
      const [minimum, maximum] = entry.spacingRangeM
      const isLastModel = index === dataset.models.length - 1
      return perimeterSpacingTargetM >= minimum && (perimeterSpacingTargetM < maximum || (isLastModel && perimeterSpacingTargetM <= maximum))
    })
    model = matchingModel?.model
  } else if (perimeterSpacingTargetM < MIN_HEVAN_SPACING_TARGET_M) {
    return result('short_side_below_supported_spray_nozzle_scope', {
      shortSideM,
      perimeterSpacingTargetM,
      reason: 'half_short_side_below_manufacturer_hevan_spacing_range',
    })
  } else {
    return result('requires_rotor_engine', {
      shortSideM,
      perimeterSpacingTargetM,
      reason: 'half_short_side_exceeds_connected_rotary_nozzle_spacing_range',
      plannedNextFamily: 'Rain Bird 3500',
    })
  }

  const pressureBar = dataset.source.recommendedOperatingPressureBar
  const modelEvidence = dataset.models.find((entry) => entry.model === model)
  if (!modelEvidence) {
    return result('manufacturer_model_mapping_missing', { family, model, pressureBar })
  }

  const layout = generateLawnSprinklerLayout({
    geometry,
    family,
    model,
    pressureBar,
    sampleStepM,
  })

  return result(layout.status === 'coverage_complete_sampled' && layout.headToHead?.passed
    ? 'layout_generated'
    : 'layout_incomplete', {
    engine: Object.freeze({
      name: 'Florial deterministic lawn layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm ?? null,
    }),
    operatingScenario: Object.freeze({
      manufacturer: dataset.manufacturer,
      family,
      model,
      pressureBar,
      pressureBasis: 'manufacturer_recommended_operating_pressure',
      modelSelectionBasis,
      sourceUrl: dataset.source.url,
      actualNozzlePressureVerified: false,
      customerSourceMeasurementsUsedAsNozzlePressure: false,
    }),
    geometry: Object.freeze({
      shape: layout.geometry?.shape ?? null,
      areaM2: layout.geometry?.areaM2 ?? snapshot.geometry.areaM2,
      shortSideM,
      perimeterSpacingTargetM,
    }),
    layout,
    designBasis: snapshot.designBasis ?? null,
    warnings: Object.freeze([
      ...layout.warnings,
      Object.freeze({ code: 'manufacturer_operating_point_is_a_scenario_not_site_measurement', path: 'operatingScenario.pressureBar' }),
      Object.freeze({ code: 'family_and_model_selection_is_provisional_and_requires_engineer_review', path: 'operatingScenario.model' }),
      Object.freeze({ code: 'customer_source_pressure_and_flow_not_used_as_nozzle_operating_point', path: 'intake.water' }),
      Object.freeze({ code: 'hydraulic_network_and_zone_feasibility_not_evaluated', path: 'hydraulics' }),
      Object.freeze({ code: 'obstacles_and_exclusions_not_mapped', path: 'geometry.exclusions' }),
    ]),
  })
}
