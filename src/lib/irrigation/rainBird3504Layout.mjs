import { evaluateHeadToHeadSpacing } from './lawnSprinklerLayout.mjs'

const ENGINE_VERSION = '1.0.0'
const EPSILON = 1e-8
const ROTOR_RADII_M = Object.freeze([8, 9, 10, 7, 6, 5])
const MAX_TARGET_POINTS = 30000
const MAX_SELECTED_ROTORS = 150

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function pointInRect(point, bounds) {
  return point.x >= bounds.minX - EPSILON && point.x <= bounds.maxX + EPSILON &&
    point.y >= bounds.minY - EPSILON && point.y <= bounds.maxY + EPSILON
}

function sectorContains(point, head) {
  const dx = point.x - head.position.x
  const dy = point.y - head.position.y
  if (Math.hypot(dx, dy) > head.radiusM + EPSILON) return false
  if (head.arcDeg === 360) return true
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360
  const delta = Math.abs(((angle - head.directionDeg + 540) % 360) - 180)
  return delta <= head.arcDeg / 2 + EPSILON
}

function headCoversPoint(head, point) {
  return sectorContains(point, head)
}

function buildTargets(bounds, stepM) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const columns = Math.ceil(width / stepM)
  const rows = Math.ceil(height / stepM)
  if ((columns + 1) * (rows + 1) > MAX_TARGET_POINTS) return null
  const targets = []
  for (let row = 0; row <= rows; row += 1) {
    const y = bounds.minY + height * row / rows
    for (let column = 0; column <= columns; column += 1) {
      const x = bounds.minX + width * column / columns
      targets.push(Object.freeze({ x, y }))
    }
  }
  return targets
}

function axisPositions(length, pitch) {
  if (length <= pitch + EPSILON) return [0, length]
  const intervals = Math.ceil(length / pitch)
  if (length <= 2 * pitch + EPSILON) {
    return Array.from({ length: intervals + 1 }, (_, index) => length * index / intervals)
  }
  const positions = [0]
  for (let value = pitch; value < length - pitch - EPSILON; value += pitch) {
    positions.push(value)
  }
  const inset = length - pitch
  if (inset - positions[positions.length - 1] > EPSILON) positions.push(inset)
  positions.push(length)
  return positions
}

function classifyPosition(x, y, bounds) {
  const onLeft = Math.abs(x - bounds.minX) <= EPSILON
  const onRight = Math.abs(x - bounds.maxX) <= EPSILON
  const onBottom = Math.abs(y - bounds.minY) <= EPSILON
  const onTop = Math.abs(y - bounds.maxY) <= EPSILON
  const horizontalEdge = onBottom || onTop
  const verticalEdge = onLeft || onRight
  if (horizontalEdge && verticalEdge) {
    const direction = onLeft
      ? (onBottom ? 45 : 315)
      : (onBottom ? 135 : 225)
    return { source: 'vertex', arcDeg: 90, directionDeg: direction }
  }
  if (horizontalEdge) {
    return { source: 'edge', arcDeg: 180, directionDeg: onBottom ? 90 : 270 }
  }
  if (verticalEdge) {
    return { source: 'edge', arcDeg: 180, directionDeg: onLeft ? 0 : 180 }
  }
  return { source: 'interior', arcDeg: 360, directionDeg: null }
}

function maximumSafeRadius(x, y, bounds, position) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (position.source === 'vertex') return Math.min(10, width, height)
  if (position.source === 'edge') {
    return Math.min(10, position.arcDeg === 180 && (position.directionDeg === 90 || position.directionDeg === 270)
      ? height : width)
  }
  return Math.min(10, x - bounds.minX, bounds.maxX - x, y - bounds.minY, bounds.maxY - y)
}

function sectorFitsRectangle(head, bounds) {
  const start = head.arcDeg === 360 ? 0 : head.directionDeg - head.arcDeg / 2
  for (let angleOffset = 0; angleOffset <= head.arcDeg + EPSILON; angleOffset += 1) {
    const angle = (start + Math.min(angleOffset, head.arcDeg)) * Math.PI / 180
    for (let radius = 0; radius <= head.radiusM + EPSILON; radius += 0.2) {
      const point = {
        x: head.position.x + Math.cos(angle) * Math.min(radius, head.radiusM),
        y: head.position.y + Math.sin(angle) * Math.min(radius, head.radiusM),
      }
      if (!pointInRect(point, bounds)) return false
    }
  }
  return true
}

function buildGrid(bounds, pitchM, idPrefix) {
  const xs = axisPositions(bounds.maxX - bounds.minX, pitchM)
  const ys = axisPositions(bounds.maxY - bounds.minY, pitchM)
  const heads = []
  for (const localY of ys) {
    for (const localX of xs) {
      const x = bounds.minX + localX
      const y = bounds.minY + localY
      const position = classifyPosition(x, y, bounds)
      const safeRadius = maximumSafeRadius(x, y, bounds, position)
      const radiusM = Math.min(pitchM, safeRadius)
      if (radiusM < 5 - EPSILON) continue
      const head = Object.freeze({
        id: idPrefix + String(heads.length + 1).padStart(4, '0'),
        position: Object.freeze({ x, y }),
        arcDeg: position.arcDeg,
        directionDeg: position.directionDeg,
        source: position.source,
        radiusM,
        performanceModel: '3504-PC',
        family: '3500',
        pattern: 'rotor',
        pressureBar: null,
        flowLpm: null,
      })
      if (sectorFitsRectangle(head, bounds)) heads.push(head)
    }
  }
  return heads
}

function evaluateCoverage(heads, targets) {
  let covered = 0
  const uncovered = []
  for (const target of targets) {
    if (heads.some((head) => headCoversPoint(head, target))) covered += 1
    else if (uncovered.length < 100) uncovered.push(target)
  }
  return {
    sampledPoints: targets.length,
    coveredPoints: covered,
    uncoveredPoints: targets.length - covered,
    coveragePercent: targets.length ? covered / targets.length * 100 : 0,
    uncoveredSamples: Object.freeze(uncovered),
  }
}

function headToHeadPasses(heads) {
  return heads.length > 1 && evaluateHeadToHeadSpacing(heads).every((entry) => entry.passed)
}

function pruneRedundantHeads(input, targets) {
  let heads = input.slice()
  let changed = true
  while (changed && heads.length > 1) {
    changed = false
    const removalOrder = heads.slice().sort((a, b) =>
      (a.source === 'interior' ? 0 : a.source === 'edge' ? 1 : 2) -
        (b.source === 'interior' ? 0 : b.source === 'edge' ? 1 : 2) ||
      a.position.y - b.position.y || a.position.x - b.position.x)
    for (const candidate of removalOrder) {
      const next = heads.filter((head) => head.id !== candidate.id)
      if (!headToHeadPasses(next)) continue
      if (evaluateCoverage(next, targets).uncoveredPoints !== 0) continue
      heads = next
      changed = true
    }
  }
  return heads
}

function rectangleBounds(geometry) {
  const region = geometry?.regions?.[0]
  const vertices = region?.boundary?.vertices
  if (!Array.isArray(vertices) || vertices.length < 4 || region.exclusions?.length) return null
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const bounds = {
    minX: Math.min(...xs), minY: Math.min(...ys),
    maxX: Math.max(...xs), maxY: Math.max(...ys),
  }
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ]
  const unique = new Set(vertices.map((point) => point.x.toFixed(8) + ':' + point.y.toFixed(8)))
  const axisAligned = vertices.every((point, index) => {
    const next = vertices[(index + 1) % vertices.length]
    return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON
  })
  if (unique.size !== 4 || !axisAligned ||
      corners.some((corner) => !vertices.some((point) => distance(point, corner) <= EPSILON))) return null
  return bounds
}

/**
 * Global rectangular 3504-PC layout search.
 * Eight metres is the default planning radius. The solver builds a complete
 * geometric grid, validates it, then removes redundant heads only when both
 * sampled coverage and mutual head-to-head remain valid. It never adds heads
 * greedily to chase a small uncovered tail.
 */
export function generateRainBird3504Layout(geometry, { sampleStepM = 0.5 } = {}) {
  const bounds = rectangleBounds(geometry)
  if (!bounds || !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-global-rectangular-grid-prune-v1',
      status: 'invalid_geometry',
      sprinklers: Object.freeze([]),
    })
  }
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (width <= 0 || height <= 0 || Math.min(width, height) < 5 - EPSILON) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-global-rectangular-grid-prune-v1',
      status: 'no_usable_rotor_candidates',
      sprinklers: Object.freeze([]),
    })
  }
  const targets = buildTargets(bounds, sampleStepM)
  if (!targets) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-global-rectangular-grid-prune-v1',
      status: 'sampling_limit_exceeded',
      sprinklers: Object.freeze([]),
    })
  }

  let lastAttempt = null
  for (const planningRadiusM of ROTOR_RADII_M) {
    const candidates = buildGrid(bounds, planningRadiusM, 'r3504-')
    if (!candidates.length || candidates.length > MAX_SELECTED_ROTORS) continue
    const optimized = pruneRedundantHeads(candidates, targets)
    const coverage = evaluateCoverage(optimized, targets)
    const checks = evaluateHeadToHeadSpacing(optimized)
    const headToHeadPassed = optimized.length > 1 && checks.every((entry) => entry.passed)
    lastAttempt = { planningRadiusM, optimized, coverage, checks, headToHeadPassed }
    if (coverage.uncoveredPoints === 0 && headToHeadPassed) {
      return Object.freeze({
        engineVersion: ENGINE_VERSION,
        algorithm: '3504pc-global-rectangular-grid-prune-v1',
        status: 'coverage_complete_sampled',
        family: '3500',
        model: '3504-PC',
        pressureBar: null,
        planningRadiusM,
        sampleStepM,
        geometry: Object.freeze({
          regionId: geometry.regions[0].id,
          shape: 'rectangle',
          areaM2: width * height,
        }),
        coverage: Object.freeze(coverage),
        sprinklers: Object.freeze(optimized),
        headToHead: Object.freeze({
          passed: true,
          applicable: true,
          checks: Object.freeze(checks),
        }),
        candidateStats: Object.freeze({
          initialGridHeads: candidates.length,
          selectedHeads: optimized.length,
          removedRedundantHeads: candidates.length - optimized.length,
        }),
        warnings: Object.freeze([
          Object.freeze({ code: '3504_pc_radius_is_florial_geometric_planning_value_not_manufacturer_performance_claim', path: 'sprinklers.radiusM' }),
          Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_mathematical_proof', path: 'coverage' }),
          Object.freeze({ code: 'hydraulic_feasibility_and_precipitation_uniformity_not_evaluated', path: 'hydraulics' }),
        ]),
        overspray: 'sampled_inside_rectangle',
        hydraulicFeasibility: 'not_evaluated',
        precipitationUniformity: 'not_evaluated',
        bodyCompatibility: 'not_evaluated',
      })
    }
  }

  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    algorithm: '3504pc-global-rectangular-grid-prune-v1',
    status: 'no_complete_rotor_layout',
    family: '3500',
    model: '3504-PC',
    planningRadiusM: lastAttempt?.planningRadiusM ?? null,
    coverage: lastAttempt?.coverage ?? null,
    sprinklers: Object.freeze([]),
    headToHead: Object.freeze({
      passed: lastAttempt?.headToHeadPassed ?? false,
      applicable: true,
      checks: Object.freeze(lastAttempt?.checks ?? []),
    }),
    warnings: Object.freeze([
      Object.freeze({ code: 'no_complete_3504_pc_grid_passed_coverage_and_head_to_head', path: 'layout' }),
    ]),
  })
}
