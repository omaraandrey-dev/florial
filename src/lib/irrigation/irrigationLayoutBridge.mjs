import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from './rainBirdRvanPerformanceData.mjs'
import {
  buildIrrigationZones,
  buildPerimeterPipeNetwork,
  FLORIAL_IRRIGATION_PROJECT_STANDARD,
} from './irrigationProjectStandards.mjs'

const RECOMMENDED_NOZZLE_PRESSURE_BAR = RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar

function result(status, extra = {}) {
  return Object.freeze({
    status,
    hydraulicFeasibility: 'not_evaluated',
    ...extra,
  })
}

function selectRvanModel(shortSideM) {
  const pressureBar = RECOMMENDED_NOZZLE_PRESSURE_BAR
  for (const model of ['R-VAN14', 'R-VAN18', 'R-VAN24']) {
    const point = findRainBirdRvanPerformancePoint(model, pressureBar, 180)
    if (point?.radiusM >= shortSideM - 1e-8) return model
  }
  // R-VAN24 remains the largest supported circular-spray candidate. Wider
  // lawns are handled with additional interior rows instead of rejection.
  return 'R-VAN24'
}
function stripOptions(shortSideM) {
  const exact = []
  for (const model of ['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST']) {
    const point = findRainBirdRvanPerformancePoint(model, RECOMMENDED_NOZZLE_PRESSURE_BAR, null)
    if (!point?.dimensionsM) continue
    if (Math.abs(point.dimensionsM[0] - shortSideM) < 1e-9) {
      exact.push(Object.freeze({
        model,
        dimensionsM: point.dimensionsM,
        pressureBar: point.pressureBar,
      }))
    }
  }
  return Object.freeze(exact)
}

/**
 * Connects approximate customer geometry to the deterministic Rain Bird
 * R-VAN solver and attaches Florial's fixed pipe/zone project standards.
 * No customer water-source, pressure or flow inputs are requested or used.
 */
export function buildPreliminaryLawnLayout(snapshot, { sampleStepM = 0.25 } = {}) {
  if (!snapshot || snapshot.schemaVersion !== 2 ||
      snapshot.projectType !== 'automatic_lawn_irrigation') {
    return result('invalid_intake_snapshot')
  }

  if (snapshot.geometry?.status !== 'preliminary_geometry_available' ||
      snapshot.geometry?.normalized?.status !== 'confirmed') {
    return result('needs_valid_geometry')
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

  if (shortSideM < 2.4) {
    const options = stripOptions(shortSideM)
    return result(options.length
      ? 'strip_nozzle_layout_requires_exact_pattern_engine'
      : 'strip_width_not_supported_by_exact_manufacturer_point', {
      shortSideM,
      manufacturer: 'Rain Bird',
      family: 'R-VAN',
      stripNozzleOptions: options,
      manufacturerPressureBar: RECOMMENDED_NOZZLE_PRESSURE_BAR,
      reason: 'No circular spray substitute is allowed for a narrow strip; exact pattern placement and orientation must be validated.',
      projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    })
  }

  const model = selectRvanModel(shortSideM)
  if (!model) {
    return result('requires_engineer_review', {
      shortSideM,
      reason: 'geometry_exceeds_verified_rvan_layout_envelope',
    })
  }

  const pressureBar = RECOMMENDED_NOZZLE_PRESSURE_BAR
  const layout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model,
    pressureBar,
    sampleStepM,
  })

  if (layout.status !== 'coverage_complete_sampled' && layout.status !== 'coverage_incomplete') {
    return result('layout_incomplete', {
      shortSideM,
      manufacturer: 'Rain Bird',
      family: 'R-VAN',
      model,
      layout,
      projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    })
  }

  const zones = buildIrrigationZones(layout.sprinklers, geometry)
  const pipeNetwork = buildPerimeterPipeNetwork(geometry, layout.sprinklers, zones)

  return result(layout.status === 'coverage_complete_sampled' ? 'layout_generated' : 'layout_incomplete', {
    engine: Object.freeze({
      name: 'Florial deterministic lawn layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm ?? null,
    }),
    operatingScenario: Object.freeze({
      manufacturer: 'Rain Bird',
      family: 'R-VAN',
      model,
      pressureBar,
      pressureBasis: 'Rain Bird manufacturer recommended nozzle operating point',
      sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
      actualNozzlePressureVerified: false,
    }),
    geometry: Object.freeze({
      shape: layout.geometry?.shape ?? null,
      areaM2: layout.geometry?.areaM2 ?? snapshot.geometry.areaM2,
      shortSideM,
      dimensionsAreApproximate: true,
    }),
    projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    zones,
    pipeNetwork,
    layout,
    warnings: Object.freeze([
      ...layout.warnings,
      Object.freeze({ code: 'approximate_customer_dimensions', path: 'geometry' }),
      Object.freeze({ code: 'manufacturer_nozzle_pressure_is_reference_not_measured_site_pressure', path: 'operatingScenario.pressureBar' }),
      Object.freeze({ code: 'hydraulic_calculation_not_performed', path: 'hydraulics' }),
      Object.freeze({ code: 'sampled_coverage_is_not_continuous_proof', path: 'layout.coverage' }),
      Object.freeze({ code: 'overspray_not_evaluated', path: 'layout.overspray' }),
    ]),
  })
}
