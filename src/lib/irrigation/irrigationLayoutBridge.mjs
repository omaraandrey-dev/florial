import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'

const MIN_RVAN_SHORT_SIDE_M = 4
const RVAN14_MAX_SHORT_SIDE_M = 4.6
const RVAN18_MAX_SHORT_SIDE_M = 5.5

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
 * This bridge deliberately supports only the current R-VAN geometric scope.
 * It uses the manufacturer's recommended 3.1 bar operating point as a
 * geometric scenario, never as an assertion about pressure at the sprinklers.
 * Customer source pressure/flow are not converted into nozzle pressure.
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

  let model
  if (shortSideM >= MIN_RVAN_SHORT_SIDE_M && shortSideM <= RVAN14_MAX_SHORT_SIDE_M) {
    model = 'R-VAN14'
  } else if (shortSideM > RVAN14_MAX_SHORT_SIDE_M && shortSideM <= RVAN18_MAX_SHORT_SIDE_M) {
    model = 'R-VAN18'
  } else {
    if (shortSideM < MIN_RVAN_SHORT_SIDE_M) {
      return result('short_side_below_rvan_v1_scope', {
        shortSideM,
        reason: 'short_side_below_current_verified_layout_envelope',
      })
    }
    return result('requires_rotor_engine', {
      shortSideM,
      reason: 'requires_large_rotor_engine_or_engineer_review',
      plannedNextFamily: 'Rain Bird 3500',
    })
  }

  const pressureBar = RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar
  const modelEvidence = RAIN_BIRD_RVAN_DATASET.models.find((entry) => entry.model === model)
  if (!modelEvidence) {
    return result('manufacturer_model_mapping_missing', { model, pressureBar })
  }

  const layout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model,
    pressureBar,
    sampleStepM,
  })

  return result(layout.status === 'coverage_complete_sampled'
    ? 'layout_generated'
    : 'layout_incomplete', {
    engine: Object.freeze({
      name: 'Florial deterministic lawn layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm ?? null,
    }),
    operatingScenario: Object.freeze({
      manufacturer: RAIN_BIRD_RVAN_DATASET.manufacturer,
      family: 'R-VAN',
      model,
      pressureBar,
      pressureBasis: 'manufacturer_recommended_operating_pressure',
      modelSelectionBasis: 'provisional_short_side_candidate_rule',
      sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
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
      Object.freeze({ code: 'short_side_model_selection_is_provisional_and_requires_engineer_review', path: 'operatingScenario.model' }),
      Object.freeze({ code: 'customer_source_pressure_and_flow_not_used_as_nozzle_operating_point', path: 'intake.water' }),
      Object.freeze({ code: 'hydraulic_network_and_zone_feasibility_not_evaluated', path: 'hydraulics' }),
      Object.freeze({ code: 'obstacles_and_exclusions_not_mapped', path: 'geometry.exclusions' }),
    ]),
  })
}
