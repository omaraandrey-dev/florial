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

const STRIP_MODELS = Object.freeze({
  1: Object.freeze({ endReachM: 3, centerReachM: 3, centerSpacingM: 3, endPairAfterM: 3, centersAfterM: 5 }),
  2: Object.freeze({ endReachM: 4, centerReachM: 4, centerSpacingM: 4, endPairAfterM: 4, centersAfterM: 7 }),
})
const RCS_SUPPORTED_STRIP_WIDTHS_M = Object.freeze([1, 2])

function selectRvanModel(shortSideM) {
  if (shortSideM <= 3 + 1e-8) return Object.freeze({ model: 'R-VAN14', radiusM: 3 })
  if (shortSideM <= 4 + 1e-8) return Object.freeze({ model: 'R-VAN18', radiusM: 4 })
  if (shortSideM <= 5 + 1e-8) return Object.freeze({ model: 'R-VAN18', radiusM: 5 })
  return Object.freeze({ model: 'R-VAN24', radiusM: 6 })
}

function isRectangle(vertices) {
  const open = vertices.filter((point, index) => index < vertices.length - 1 ||
    Math.hypot(point.x - vertices[0].x, point.y - vertices[0].y) > 1e-8)
  return open.length === 4 && open.every((point, index) => {
    const next = open[(index + 1) % open.length]
    return Math.abs(point.x - next.x) <= 1e-8 || Math.abs(point.y - next.y) <= 1e-8
  })
}

function buildRvanStripLayout(geometry, shortSideM) {
  const vertices = geometry.regions[0].boundary.vertices
  if (!isRectangle(vertices)) return null
  const widthM = RCS_SUPPORTED_STRIP_WIDTHS_M.find((width) => Math.abs(width - shortSideM) <= 1e-8)
  if (!widthM) return null

  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const horizontal = maxX - minX >= maxY - minY
  const lengthM = horizontal ? maxX - minX : maxY - minY
  const rule = STRIP_MODELS[widthM]
  const rightOrBottom = horizontal ? maxX : minY
  const fixedSide = horizontal ? minY : maxX
  const makePosition = (offsetFromStart) => horizontal
    ? { x: rightOrBottom - offsetFromStart, y: fixedSide }
    : { x: fixedSide, y: rightOrBottom + offsetFromStart }

  const heads = []
  const addHead = (model, offsetFromStart, direction, reachM) => {
    const point = findRainBirdRvanPerformancePoint(model, RECOMMENDED_NOZZLE_PRESSURE_BAR, null)
    if (!point) return false
    heads.push(Object.freeze({
      id: 's' + String(heads.length + 1).padStart(5, '0'),
      position: Object.freeze(makePosition(offsetFromStart)),
      arcDeg: null,
      directionDeg: null,
      stripDirection: direction,
      stripAxis: horizontal ? 'horizontal' : 'vertical',
      source: 'edge',
      radiusM: null,
      pressureBar: point.pressureBar,
      flowLpm: point.flowLpm,
      precipitationSquareMmH: point.precipitationSquareMmH,
      precipitationTriangularMmH: point.precipitationTriangularMmH,
      performanceModel: model,
      pattern: 'strip',
      stripWidthM: widthM,
      stripLengthM: reachM,
    }))
    return true
  }

  if (lengthM <= rule.endPairAfterM + 1e-8) {
    if (!addHead('R-VAN-RCS', 0, horizontal ? 'left' : 'up', rule.endReachM)) return null
  } else {
    if (!addHead('R-VAN-RCS', 0, horizontal ? 'left' : 'up', rule.endReachM)) return null
    if (lengthM > rule.centersAfterM + 1e-8) {
      for (let offset = rule.centerSpacingM; offset < lengthM - 1e-8; offset += rule.centerSpacingM) {
        if (!addHead('R-VAN-SST', offset, 'both', rule.centerReachM)) return null
      }
    }
    if (!addHead('R-VAN-LCS', lengthM, horizontal ? 'right' : 'down', rule.endReachM)) return null
  }

  const modelSet = [...new Set(heads.map((head) => head.performanceModel))]
  return Object.freeze({
    engineVersion: '0.5.0',
    algorithm: 'owner-defined-rvan-lcs-rcs-sst-strip-placement-v2',
    status: 'strip_pattern_placement_ready',
    coverageScope: 'owner_defined_strip_pattern',
    family: 'R-VAN',
    model: modelSet.join(' / '),
    pressureBar: RECOMMENDED_NOZZLE_PRESSURE_BAR,
    sampleStepM: null,
    geometry: Object.freeze({
      regionId: geometry.regions[0].id,
      shape: 'rectangle',
      areaM2: lengthM * widthM,
    }),
    sprinklers: Object.freeze(heads),
    headToHead: Object.freeze({ passed: null, checks: Object.freeze([]), applicable: false }),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
    warnings: Object.freeze([
      Object.freeze({ code: 'owner_defined_rvan_strip_pattern_not_sampled_as_circular_coverage', path: 'layout.coverage' }),
      Object.freeze({ code: 'strip_head_to_head_circular_sector_check_not_applicable', path: 'layout.headToHead' }),
      Object.freeze({ code: 'hydraulic_calculation_not_performed', path: 'hydraulics' }),
    ]),
  })
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
export function buildPreliminaryLawnLayout(snapshot, { sampleStepM = 0.5 } = {}) {
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

  if (RCS_SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(shortSideM - width) <= 1e-8)) {
    const layout = buildRvanStripLayout(geometry, shortSideM)
    if (layout) {
      const zones = buildIrrigationZones(layout.sprinklers, geometry)
      const pipeNetwork = buildPerimeterPipeNetwork(geometry, layout.sprinklers, zones)
      return result('layout_generated', {
        engine: Object.freeze({
          name: 'Florial deterministic lawn layout',
          version: layout.engineVersion,
          algorithm: layout.algorithm,
        }),
        operatingScenario: Object.freeze({
          manufacturer: 'Rain Bird',
          family: 'R-VAN',
          model: layout.model,
          pressureBar: RECOMMENDED_NOZZLE_PRESSURE_BAR,
          pressureBasis: 'Rain Bird manufacturer recommended nozzle operating point',
          modelSelectionBasis: 'owner_defined_LCS_RCS_SST_strip_width_throw_spacing_and_direction_rules',
          layoutRadiusM: null,
          sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
          actualNozzlePressureVerified: false,
          customerSourceMeasurementsUsedAsNozzlePressure: false,
        }),
        geometry: Object.freeze({
          shape: 'rectangle',
          areaM2: layout.geometry.areaM2,
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
        ]),
      })
    }
  }

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

  const selectedRvan = selectRvanModel(shortSideM)
  const { model, radiusM } = selectedRvan
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
    radiusM,
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
      model: layout.model ?? model,
      pressureBar,
      pressureBasis: 'Rain Bird manufacturer recommended nozzle operating point',
      modelSelectionBasis: 'Florial per-position nozzle selection from corner-to-centre reach and adjacent perimeter spacing; radius independent of arc',
      layoutRadiusM: null,
      sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
      actualNozzlePressureVerified: false,
      customerSourceMeasurementsUsedAsNozzlePressure: false,
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
