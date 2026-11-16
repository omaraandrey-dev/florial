import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  findRainBird3500PerformancePoint,
  RAIN_BIRD_3500_DATASET,
} from './irrigationPerformanceData.mjs'

const ENGINE_VERSION = '3500-evaluation-0.1.0'
const EPSILON = 1e-8
const DEFAULT_SAMPLE_STEP_M = 0.25
const MAX_SAMPLE_POINTS = 30000

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const a = vertices[previous]
    const b = vertices[index]
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    const within = point.x >= Math.min(a.x, b.x) - EPSILON &&
      point.x <= Math.max(a.x, b.x) + EPSILON &&
      point.y >= Math.min(a.y, b.y) - EPSILON &&
      point.y <= Math.max(a.y, b.y) + EPSILON
    if (Math.abs(cross) <= EPSILON && within) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function sectorContains(point, sprinkler, radiusM) {
  const dx = point.x - sprinkler.position.x
  const dy = point.y - sprinkler.position.y
  if (Math.hypot(dx, dy) > radiusM + EPSILON) return false
  const angle = normalizeDegrees(Math.atan2(dy, dx) * 180 / Math.PI)
  const difference = Math.abs(((angle - sprinkler.directionDeg + 540) % 360) - 180)
  return difference <= 90 + EPSILON
}

function sampleGeometry(vertices, stepM) {
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const columns = Math.ceil((maxX - minX) / stepM) + 1
  const rows = Math.ceil((maxY - minY) / stepM) + 1
  if (columns * rows > MAX_SAMPLE_POINTS) return null
  const points = []
  const seen = new Set()
  const add = (point) => {
    const key = point.x.toFixed(6) + ':' + point.y.toFixed(6)
    if (!seen.has(key)) {
      seen.add(key)
      points.push(Object.freeze(point))
    }
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = Math.min(maxY, minY + row * stepM)
    for (let column = 0; column <= columns; column += 1) {
      const x = Math.min(maxX, minX + column * stepM)
      if (pointInRing({ x, y }, vertices) >= 0) add({ x, y })
    }
  }
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const divisions = Math.max(1, Math.ceil(distance(a, b) / stepM))
    for (let part = 0; part <= divisions; part += 1) {
      const ratio = part / divisions
      add({ x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio })
    }
  }
  return points
}

function countOverspray(vertices, sprinkler, radiusM, stepM) {
  const extent = radiusM
  const minX = sprinkler.position.x - extent
  const maxX = sprinkler.position.x + extent
  const minY = sprinkler.position.y - extent
  const maxY = sprinkler.position.y + extent
  const columns = Math.ceil((maxX - minX) / stepM)
  const rows = Math.ceil((maxY - minY) / stepM)
  let sectorSamples = 0
  let outsideSamples = 0
  for (let row = 0; row <= rows; row += 1) {
    const y = minY + row * stepM
    for (let column = 0; column <= columns; column += 1) {
      const point = { x: minX + column * stepM, y }
      if (sectorContains(point, sprinkler, radiusM)) {
        sectorSamples += 1
        if (pointInRing(point, vertices) < 0) outsideSamples += 1
      }
    }
  }
  return { sectorSamples, outsideSamples }
}

function invalidResult(status, code, path) {
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    family: '3500',
    status,
    errors: Object.freeze([{ code, path }]),
    warnings: Object.freeze([]),
    sprinklers: Object.freeze([]),
  })
}

/**
 * Evaluates a user/engine-supplied 3500 rotor layout against exact D42378
 * operating points. This first-stage evaluator deliberately supports only
 * 180-degree arcs because D42378 precipitation is explicitly half-circle data.
 * It does not generate rotor positions or certify a design.
 */
export function evaluateRainBird3500RotorLayout({
  geometry,
  pressureBar,
  nozzle,
  sprinklers,
  sampleStepM = DEFAULT_SAMPLE_STEP_M,
}) {
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || validation.status !== 'accepted') {
    return invalidResult('geometry_not_accepted', 'confirmed_valid_geometry_required', 'geometry')
  }
  if (!validation.supported || validation.regions.length !== 1 ||
      !['rectangle', 'l-shape'].includes(validation.regions[0].shape) ||
      geometry.regions[0].exclusions?.length) {
    return invalidResult('geometry_not_supported', 'single_rectangle_or_l_shape_without_exclusions_required', 'geometry')
  }
  if (!Number.isFinite(sampleStepM) || sampleStepM <= 0 ||
      !Number.isFinite(pressureBar) || !Number.isFinite(nozzle)) {
    return invalidResult('invalid_operating_input', 'finite_pressure_nozzle_and_positive_sample_step_required', 'operatingPoint')
  }
  if (!Array.isArray(sprinklers) || sprinklers.length === 0) {
    return invalidResult('invalid_layout', 'at_least_one_rotor_position_required', 'sprinklers')
  }
  if (sprinklers.some((entry) => entry?.arcDeg !== 180)) {
    return invalidResult('unsupported_arc', 'only_180_degree_half_circle_arc_is_supported', 'sprinklers.arcDeg')
  }
  if (sprinklers.some((entry) =>
    typeof entry.id !== 'string' || !entry.id.trim() ||
    !Number.isFinite(entry.position?.x) || !Number.isFinite(entry.position?.y) ||
    !Number.isFinite(entry.directionDeg))) {
    return invalidResult('invalid_layout', 'each_rotor_requires_id_position_and_direction', 'sprinklers')
  }
  if (new Set(sprinklers.map((entry) => entry.id)).size !== sprinklers.length) {
    return invalidResult('invalid_layout', 'sprinkler_ids_must_be_unique', 'sprinklers.id')
  }
  const point = findRainBird3500PerformancePoint(pressureBar, nozzle)
  if (!point) {
    return invalidResult('operating_point_not_found', 'exact_d42378_pressure_and_nozzle_pair_required', 'pressureBar/nozzle')
  }

  const vertices = validation.normalizedGeometry.regions[0].boundary.vertices.slice(0, -1)
  const targets = sampleGeometry(vertices, sampleStepM)
  if (!targets) return invalidResult('sampling_limit_exceeded', 'coverage_sampling_limit_exceeded', 'sampleStepM')

  const normalized = sprinklers.map((entry) => Object.freeze({
    id: entry.id,
    position: Object.freeze({ x: entry.position.x, y: entry.position.y }),
    arcDeg: 180,
    directionDeg: normalizeDegrees(entry.directionDeg),
    nozzle,
    pressureBar,
    radiusM: point.radiusM,
    flowLpm: point.flowLpm,
    precipitationSquareMmH: point.precipitationSquareMmH,
    precipitationTriangularMmH: point.precipitationTriangularMmH,
    performanceSource: 'Rain Bird D42378',
  }))

  const outsidePositions = normalized.filter((entry) =>
    pointInRing(entry.position, vertices) < 0)
  if (outsidePositions.length) {
    return invalidResult('invalid_layout', 'rotor_positions_must_be_inside_or_on_lawn_boundary', 'sprinklers.position')
  }

  const uncovered = targets.filter((target) =>
    !normalized.some((sprinkler) => sectorContains(target, sprinkler, point.radiusM)))
  const overspray = normalized.map((sprinkler) => {
    const counts = countOverspray(vertices, sprinkler, point.radiusM, sampleStepM)
    return Object.freeze({
      sprinklerId: sprinkler.id,
      sampledSectorPoints: counts.sectorSamples,
      sampledOutsidePoints: counts.outsideSamples,
      sampledOutsidePercent: counts.sectorSamples
        ? counts.outsideSamples / counts.sectorSamples * 100
        : 0,
    })
  })

  const headToHead = normalized.map((sprinkler) => {
    const neighbours = normalized.filter((other) => other.id !== sprinkler.id)
      .filter((other) => {
        const separation = distance(sprinkler.position, other.position)
        return separation <= point.radiusM + EPSILON &&
          sectorContains(sprinkler.position, other, point.radiusM) &&
          sectorContains(other.position, sprinkler, point.radiusM)
      })
      .sort((a, b) => distance(sprinkler.position, a.position) - distance(sprinkler.position, b.position))
    const neighbour = neighbours[0] ?? null
    return Object.freeze({
      sprinklerId: sprinkler.id,
      neighbourId: neighbour?.id ?? null,
      separationM: neighbour ? distance(sprinkler.position, neighbour.position) : null,
      requiredMaximumM: neighbour ? point.radiusM : null,
      passed: neighbour !== null,
    })
  })

  const coverageComplete = uncovered.length === 0
  const headToHeadPassed = headToHead.every((entry) => entry.passed)
  const oversprayDetected = overspray.some((entry) => entry.sampledOutsidePoints > 0)
  const warnings = [
    Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
    Object.freeze({ code: 'manufacturer_precipitation_is_half_circle_reference_only', path: 'precipitation' }),
    Object.freeze({ code: 'hydraulics_not_evaluated', path: 'hydraulics' }),
    Object.freeze({ code: 'precipitation_uniformity_not_evaluated', path: 'precipitation' }),
    Object.freeze({ code: 'body_nozzle_package_compatibility_not_verified', path: 'compatibility' }),
    Object.freeze({ code: 'radius_adjustment_not_applied_due_to_source_conflict', path: 'radiusM' }),
  ]
  if (oversprayDetected) warnings.push(Object.freeze({ code: 'sampled_overspray_detected', path: 'boundary' }))
  if (!headToHeadPassed) warnings.push(Object.freeze({ code: 'directional_head_to_head_failed', path: 'headToHead' }))

  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    family: '3500',
    status: coverageComplete && headToHeadPassed && !oversprayDetected
      ? 'coverage_complete_sampled'
      : 'preliminary_review_required',
    coverageScope: 'sampled_geometry_only',
    geometry: Object.freeze({
      regionId: geometry.regions[0].id,
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
    }),
    operatingPoint: Object.freeze({
      pressureBar,
      nozzle,
      arcDeg: 180,
      radiusM: point.radiusM,
      flowLpm: point.flowLpm,
      precipitationSquareMmH: point.precipitationSquareMmH,
      precipitationTriangularMmH: point.precipitationTriangularMmH,
      source: 'Rain Bird D42378',
      precipitationBasis: RAIN_BIRD_3500_DATASET.source.precipitationBasis,
    }),
    coverage: Object.freeze({
      sampledPoints: targets.length,
      coveredPoints: targets.length - uncovered.length,
      uncoveredPoints: uncovered.length,
      coveragePercent: targets.length ? (targets.length - uncovered.length) / targets.length * 100 : 0,
      uncoveredSamples: Object.freeze(uncovered.slice(0, 100)),
    }),
    sprinklers: Object.freeze(normalized),
    headToHead: Object.freeze({ passed: headToHeadPassed, checks: Object.freeze(headToHead) }),
    overspray: Object.freeze({
      status: oversprayDetected ? 'sampled_overspray_detected' : 'no_overspray_in_sampled_sector',
      checks: Object.freeze(overspray),
    }),
    totalFlowLpm: normalized.reduce((sum, entry) => sum + entry.flowLpm, 0),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    warnings: Object.freeze(warnings),
    errors: Object.freeze([]),
  })
}
