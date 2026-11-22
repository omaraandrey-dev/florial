import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'
import { buildIrrigationZones, buildPerimeterPipeNetwork, FLORIAL_IRRIGATION_STANDARD } from './irrigationProjectStandards.mjs'

const RVAN_RECOMMENDED_PRESSURE_BAR = RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar
const RVAN_MODELS = Object.freeze([
  { model: 'R-VAN14', maximumShortSideM: 4.3 },
  { model: 'R-VAN18', maximumShortSideM: 10.0 },
  { model: 'R-VAN24', maximumShortSideM: 15.0 },
])

function result(status, extra = {}) {
  return Object.freeze({
    status,
    hydraulicFeasibility: 'not_calculated_by_scope',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
    ...extra,
  })
}

/**
 * Generates a preliminary R-VAN-only lawn layout. The 4 bar / 1-inch tap /
 * 25 mm supply and line-count limits are fixed Florial assumptions.
 * No hydraulic network calculation is performed.
 */
export function buildPreliminaryLawnLayout(snapshot, { sampleStepM = 0.25 } = {}) {
  if (!snapshot || ![1, 2].includes(snapshot.schemaVersion) ||
      snapshot.projectType !== 'automatic_lawn_irrigation') {
    return result('invalid_intake_snapshot')
  }

  if (snapshot.geometry?.status !== 'preliminary_from_approximate_dimensions' &&
      snapshot.geometry?.status !== 'customer_confirmed') {
    return result('needs_geometry')
  }

  const geometry = snapshot.geometry.normalized
  if (!Array.isArray(geometry?.regions) || geometry.regions.length !== 1) {
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

  if (shortSideM < 2) {
    return result('strip_nozzle_layout_requires_exact_pattern_engine', {
      shortSideM,
      supportedStripModels: ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'],
      note: 'Strip nozzles must be placed only after their exact footprint orientation and overlap are represented.',
    })
  }

  const selected = RVAN_MODELS.find((entry) => shortSideM <= entry.maximumShortSideM)
  if (!selected) {
    return result('requires_rotor_engine', {
      shortSideM,
      reason: 'short_side_exceeds_rvan24_single_row_spacing_envelope',
      plannedNextFamily: 'Rain Bird 3500',
    })
  }

  const model = selected.model
  const modelEvidence = RAIN_BIRD_RVAN_DATASET.models.find((entry) => entry.model === model)
  if (!modelEvidence) return result('manufacturer_model_mapping_missing', { family: 'R-VAN', model })

  const layout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model,
    pressureBar: RVAN_RECOMMENDED_PRESSURE_BAR,
    sampleStepM,
  })

  if (!['coverage_complete_sampled', 'coverage_incomplete'].includes(layout.status)) {
    return result('layout_engine_incomplete', {
      shortSideM,
      family: 'R-VAN',
      model,
      layout,
    })
  }

  const zoned = buildIrrigationZones(layout.sprinklers)
  const pipeNetwork = buildPerimeterPipeNetwork(geometry, zoned.sprinklers)
  const layoutWithNetwork = Object.freeze({
    ...layout,
    sprinklers: zoned.sprinklers,
    zones: zoned.zones,
    zoneBasis: zoned.basis,
    pipeNetwork,
  })

  return result(layout.status === 'coverage_complete_sampled' ? 'layout_generated' : 'layout_incomplete', {
    engine: Object.freeze({
      name: 'Florial R-VAN perimeter-first preliminary layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm ?? null,
    }),
    operatingScenario: Object.freeze({
      manufacturer: 'Rain Bird',
      family: 'R-VAN',
      model,
      manufacturerTablePressureBar: RVAN_RECOMMENDED_PRESSURE_BAR,
      sourcePressureBar: FLORIAL_IRRIGATION_STANDARD.connection.nominalPressureBar,
      sourcePressureBasis: 'fixed_florial_design_assumption_at_one_inch_tap',
      sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
    }),
    standardAssumptions: FLORIAL_IRRIGATION_STANDARD,
    geometry: Object.freeze({
      shape: layout.geometry?.shape ?? null,
      areaM2: layout.geometry?.areaM2 ?? snapshot.geometry.areaM2,
      shortSideM,
      dimensionsBasis: 'approximate_customer_dimensions',
    }),
    layout: layoutWithNetwork,
    warnings: Object.freeze([
      ...layout.warnings,
      Object.freeze({ code: 'fixed_florial_water_assumptions_applied', path: 'standardAssumptions' }),
      Object.freeze({ code: 'source_pressure_is_not_a_measured_nozzle_pressure', path: 'operatingScenario' }),
      Object.freeze({ code: 'line_capacity_uses_owner_defined_head_count_rules_not_hydraulic_calculation', path: 'layout.zones' }),
      Object.freeze({ code: 'pipe_routes_are_schematic_not_hydraulic_design', path: 'layout.pipeNetwork' }),
      Object.freeze({ code: 'obstacles_and_exclusions_not_mapped', path: 'geometry.exclusions' }),
    ]),
  })
}
