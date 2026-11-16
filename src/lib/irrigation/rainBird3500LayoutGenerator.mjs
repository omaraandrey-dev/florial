import { validateLawnGeometry } from './lawnGeometry.mjs'
import { findRainBird3500PerformancePoint } from './irrigationPerformanceData.mjs'
import { evaluateRainBird3500RotorLayout } from './rainBird3500RotorEngine.mjs'

const ENGINE_VERSION = '3500-candidate-generator-0.1.0'
const EPSILON = 1e-8
const DEFAULT_SAMPLE_STEP_M = 0.5
const MAX_TARGETS = 30000
const MAX_CANDIDATES = 2400
const MAX_ROTORS = 60
const DEFAULT_DIRECTION_STEP_DEG = 45
const ALLOWED_DIRECTION_STEPS = Object.freeze([15, 30, 45])
const ALLOWED_POSITION_STEP_FACTORS = Object.freeze([0.25, 0.5, 1])

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

function sectorContains(point, center, directionDeg, radiusM) {
  const dx = point.x - center.x
  const dy = point.y - center.y
  if (Math.hypot(dx, dy) > radiusM + EPSILON) return false
  const angle = normalizeDegrees(Math.atan2(dy, dx) * 180 / Math.PI)
  const difference = Math.abs(((angle - directionDeg + 540) % 360) - 180)
  return difference <= 90 + EPSILON
}

function buildTargets(vertices, stepM) {
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const columns = Math.ceil((maxX - minX) / stepM) + 1
  const rows = Math.ceil((maxY - minY) / stepM) + 1
  if (columns * rows > MAX_TARGETS) return null
  const targets = []
  const seen = new Set()
  const add = (point) => {
    const key = point.x.toFixed(6) + ':' + point.y.toFixed(6)
    if (seen.has(key)) return
    seen.add(key)
    targets.push(Object.freeze(point))
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
  return targets
}

function buildCandidatePositions(vertices, radiusM, positionStepFactor, directionStepDeg) {
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const step = radiusM * positionStepFactor
  const positions = []
  const seen = new Set()
  const add = (point) => {
    if (pointInRing(point, vertices) < 0) return
    const key = point.x.toFixed(5) + ':' + point.y.toFixed(5)
    if (seen.has(key)) return
    seen.add(key)
    positions.push(Object.freeze({ x: point.x, y: point.y }))
  }
  for (let y = minY; y <= maxY + EPSILON; y += step) {
    for (let x = minX; x <= maxX + EPSILON; x += step) {
      add({ x: Math.min(x, maxX), y: Math.min(y, maxY) })
      if (positions.length * (360 / directionStepDeg) > MAX_CANDIDATES) return null
    }
  }
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const divisions = Math.max(1, Math.ceil(distance(a, b) / step))
    for (let part = 0; part <= divisions; part += 1) {
      const ratio = part / divisions
      add({ x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio })
      if (positions.length * (360 / directionStepDeg) > MAX_CANDIDATES) return null
    }
  }
  return positions
}

function buildCandidates(positions, targets, radiusM, flowLpm, directionStepDeg) {
  const candidates = []
  for (const position of positions) {
    for (let directionDeg = 0; directionDeg < 360; directionDeg += directionStepDeg) {
      const covered = []
      for (let index = 0; index < targets.length; index += 1) {
        if (sectorContains(targets[index], position, directionDeg, radiusM)) covered.push(index)
      }
      if (covered.length) {
        candidates.push({
          id: '3500-candidate-' + String(candidates.length + 1).padStart(4, '0'),
          position,
          directionDeg,
          arcDeg: 180,
          covered,
          flowLpm,
        })
      }
      if (candidates.length > MAX_CANDIDATES) return null
    }
  }
  return candidates
}

function areMutualHeadToHeadNeighbors(a, b, radiusM) {
  const separation = distance(a.position, b.position)
  return separation > EPSILON && separation <= radiusM + EPSILON &&
    sectorContains(b.position, a.position, a.directionDeg, radiusM) &&
    sectorContains(a.position, b.position, b.directionDeg, radiusM)
}

function combinedCoverageCount(a, b) {
  let aIndex = 0
  let bIndex = 0
  let intersection = 0
  while (aIndex < a.covered.length && bIndex < b.covered.length) {
    if (a.covered[aIndex] === b.covered[bIndex]) {
      intersection += 1
      aIndex += 1
      bIndex += 1
    } else if (a.covered[aIndex] < b.covered[bIndex]) {
      aIndex += 1
    } else {
      bIndex += 1
    }
  }
  return a.covered.length + b.covered.length - intersection
}

function selectGreedy(candidates, targetCount, radiusM) {
  // Seed with a mutually reachable pair so no returned rotor is isolated.
  const ranked = candidates.slice().sort((a, b) =>
    b.covered.length - a.covered.length || a.id.localeCompare(b.id))
  const maximumCoverage = ranked[0]?.covered.length ?? 0
  let bestPair = null
  let bestUnion = -1
  let bestMinimumCoverage = -1
  let bestCombinedCoverage = -1

  for (let aIndex = 0; aIndex < ranked.length; aIndex += 1) {
    const a = ranked[aIndex]
    if (a.covered.length + maximumCoverage < bestUnion) break
    for (let bIndex = aIndex + 1; bIndex < ranked.length; bIndex += 1) {
      const b = ranked[bIndex]
      if (a.covered.length + b.covered.length < bestUnion) break
      if (!areMutualHeadToHeadNeighbors(a, b, radiusM)) continue
      const unionCoverage = combinedCoverageCount(a, b)
      const minimumCoverage = Math.min(a.covered.length, b.covered.length)
      const combinedCoverage = a.covered.length + b.covered.length
      if (unionCoverage > bestUnion ||
          (unionCoverage === bestUnion && minimumCoverage > bestMinimumCoverage) ||
          (unionCoverage === bestUnion && minimumCoverage === bestMinimumCoverage &&
            combinedCoverage > bestCombinedCoverage)) {
        bestPair = [a, b]
        bestUnion = unionCoverage
        bestMinimumCoverage = minimumCoverage
        bestCombinedCoverage = combinedCoverage
      }
    }
  }

  if (!bestPair) return null

  const selected = [...bestPair]
  const uncovered = new Set(Array.from({ length: targetCount }, (_, index) => index))
  for (const chosen of selected) {
    for (const targetIndex of chosen.covered) uncovered.delete(targetIndex)
  }
  const available = candidates.filter((candidate) =>
    selected.every((chosen) => distance(candidate.position, chosen.position) > EPSILON))

  while (uncovered.size && selected.length < MAX_ROTORS) {
    let bestIndex = -1
    let bestGain = 0
    for (let index = 0; index < available.length; index += 1) {
      const candidate = available[index]
      if (!selected.some((chosen) => areMutualHeadToHeadNeighbors(candidate, chosen, radiusM))) continue
      let gain = 0
      for (const targetIndex of candidate.covered) {
        if (uncovered.has(targetIndex)) gain += 1
      }
      if (gain > bestGain) {
        bestGain = gain
        bestIndex = index
      }
    }
    if (bestIndex < 0) break
    const [chosen] = available.splice(bestIndex, 1)
    selected.push(chosen)
    for (let index = available.length - 1; index >= 0; index -= 1) {
      if (distance(available[index].position, chosen.position) <= EPSILON) {
        available.splice(index, 1)
      }
    }
    for (const targetIndex of chosen.covered) uncovered.delete(targetIndex)
  }
  return { selected, uncovered }
}

function failure(status, code, path) {
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    family: '3500',
    status,
    candidateStrategy: '180-degree-sector-grid-h2h-greedy-v2',
    sprinklers: Object.freeze([]),
    errors: Object.freeze([{ code, path }]),
    warnings: Object.freeze([]),
  })
}

/**
 * Generates a preliminary candidate arrangement using only 180-degree
 * half-circle performance rows from Rain Bird D42378.
 *
 * Candidate positions are sampled on a radius/2 grid plus boundary samples.
 * Eight fixed sector directions are tested at each position; greedy set cover
 * selects a compact sampled-coverage candidate. This is a heuristic, not an
 * optimized or certified irrigation design. Overspray and head-to-head are
 * checked by the independent evaluator after selection.
 */
export function generateRainBird3500RotorLayout({
  geometry,
  nozzlePressureBar,
  nozzle,
  sampleStepM = DEFAULT_SAMPLE_STEP_M,
  candidatePositionStepFactor = 0.5,
  candidateDirectionStepDeg = DEFAULT_DIRECTION_STEP_DEG,
}) {
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || validation.status !== 'accepted') {
    return failure('geometry_not_accepted', 'confirmed_valid_geometry_required', 'geometry')
  }
  if (!validation.supported || validation.regions.length !== 1 ||
      !['rectangle', 'l-shape'].includes(validation.regions[0].shape) ||
      geometry.regions[0].exclusions?.length) {
    return failure('geometry_not_supported', 'single_rectangle_or_l_shape_without_exclusions_required', 'geometry')
  }
  if (!Number.isFinite(nozzlePressureBar) || !Number.isFinite(nozzle) ||
      !Number.isFinite(sampleStepM) || sampleStepM <= 0 ||
      !ALLOWED_POSITION_STEP_FACTORS.includes(candidatePositionStepFactor) ||
      !ALLOWED_DIRECTION_STEPS.includes(candidateDirectionStepDeg)) {
    return failure('invalid_operating_input', 'exact_nozzle_pressure_nozzle_and_positive_sample_step_required', 'operatingPoint')
  }
  const point = findRainBird3500PerformancePoint(nozzlePressureBar, nozzle)
  if (!point) {
    return failure('operating_point_not_found', 'exact_d42378_pressure_and_nozzle_pair_required', 'operatingPoint')
  }

  const vertices = validation.normalizedGeometry.regions[0].boundary.vertices.slice(0, -1)
  const targets = buildTargets(vertices, sampleStepM)
  if (!targets) return failure('sampling_limit_exceeded', 'coverage_sampling_limit_exceeded', 'sampleStepM')
  const positions = buildCandidatePositions(vertices, point.radiusM, candidatePositionStepFactor, candidateDirectionStepDeg)
  if (!positions) return failure('candidate_limit_exceeded', 'candidate_position_limit_exceeded', 'geometry')
  const candidates = buildCandidates(positions, targets, point.radiusM, point.flowLpm, candidateDirectionStepDeg)
  if (!candidates) return failure('candidate_limit_exceeded', 'candidate_count_limit_exceeded', 'geometry')
  if (!candidates.length) return failure('no_candidates', 'no_usable_180_degree_candidates', 'geometry')

  const selection = selectGreedy(candidates, targets.length, point.radiusM)
  if (!selection?.selected.length) return failure('no_head_to_head_layout', 'no_mutually_connected_180_degree_candidate_pair', 'headToHead')
  const layout = selection.selected.map((candidate) => ({
    id: candidate.id,
    position: candidate.position,
    directionDeg: candidate.directionDeg,
    arcDeg: 180,
  }))
  const evaluation = evaluateRainBird3500RotorLayout({
    geometry,
    nozzlePressureBar,
    nozzle,
    sprinklers: layout,
    sampleStepM,
  })
  const uncovered = selection.uncovered.size
  const warnings = [
    Object.freeze({ code: 'heuristic_grid_search_not_global_optimum', path: 'candidateStrategy' }),
    Object.freeze({ code: 'selection_requires_mutual_head_to_head_neighbor', path: 'headToHead' }),
    Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
    Object.freeze({ code: 'hydraulics_and_precipitation_uniformity_not_evaluated', path: 'hydraulics/precipitation' }),
    Object.freeze({ code: 'candidate_direction_resolution_' + candidateDirectionStepDeg + '_degrees', path: 'candidateStrategy' }),
  ]
  if (uncovered > 0) warnings.push(Object.freeze({ code: 'uncovered_sample_points_remain', path: 'coverage' }))
  return Object.freeze({
    ...evaluation,
    engineVersion: ENGINE_VERSION,
    candidateStrategy: '180-degree-sector-grid-h2h-greedy-v2',
    candidateStats: Object.freeze({
      testedPositions: positions.length,
      testedCandidates: candidates.length,
      selectedRotors: layout.length,
      candidateDirectionStepDeg,
      candidatePositionStepM: point.radiusM * candidatePositionStepFactor,
      candidatePositionStepFactor,
    }),
    searchCoverage: Object.freeze({
      sampledTargets: targets.length,
      uncoveredTargets: uncovered,
      searchCoveragePercent: targets.length
        ? (targets.length - uncovered) / targets.length * 100
        : 0,
    }),
    warnings: Object.freeze([...evaluation.warnings, ...warnings]),
    status: uncovered > 0 || evaluation.status !== 'coverage_complete_sampled'
      ? 'preliminary_review_required'
      : 'coverage_complete_sampled',
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
  })
}
