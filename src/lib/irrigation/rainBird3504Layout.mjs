import { validateLawnGeometry } from './lawnGeometry.mjs'

const EPSILON = 1e-8
const PLANNING_RADII_M = Object.freeze([10, 9, 8])
const ARCS = Object.freeze([90, 180, 270, 360])
const DIRECTION_STEP_DEG = 45
const TARGET_STEP_M = 0.5
const POSITION_STEP_FACTOR = 0.5
const MAX_TARGETS = 30000
const MAX_CANDIDATES = 5000
const MAX_ROTORS = 60

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function openRing(vertices = []) {
  return vertices.filter((point, index) => index < vertices.length - 1 ||
    distance(point, vertices[0]) > EPSILON)
}

function pointOnSegment(point, a, b) {
  const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
  return Math.abs(cross) <= EPSILON &&
    point.x >= Math.min(a.x, b.x) - EPSILON && point.x <= Math.max(a.x, b.x) + EPSILON &&
    point.y >= Math.min(a.y, b.y) - EPSILON && point.y <= Math.max(a.y, b.y) + EPSILON
}

function pointInRing(point, ring) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const a = ring[previous]
    const b = ring[index]
    if (pointOnSegment(point, a, b)) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const intersectionX = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (point.x < intersectionX) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function pointInIrrigatedGeometry(point, region) {
  if (pointInRing(point, region.boundary) < 0) return false
  return !region.exclusions.some((ring) => pointInRing(point, ring) > 0)
}

function sectorContains(point, sprinkler) {
  const dx = point.x - sprinkler.position.x
  const dy = point.y - sprinkler.position.y
  if (Math.hypot(dx, dy) > sprinkler.radiusM + EPSILON) return false
  if (sprinkler.arcDeg === 360) return true
  const angle = normalizeDegrees(Math.atan2(dy, dx) * 180 / Math.PI)
  const difference = Math.abs(((angle - sprinkler.directionDeg + 540) % 360) - 180)
  return difference <= sprinkler.arcDeg / 2 + EPSILON
}

function sampleTargets(region, stepM) {
  const xs = region.boundary.map((point) => point.x)
  const ys = region.boundary.map((point) => point.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const columns = Math.ceil((maxX - minX) / stepM)
  const rows = Math.ceil((maxY - minY) / stepM)
  if ((columns + 1) * (rows + 1) > MAX_TARGETS) return null
  const targets = []
  for (let row = 0; row <= rows; row += 1) {
    const y = minY + Math.min(row * stepM, maxY - minY)
    for (let column = 0; column <= columns; column += 1) {
      const x = minX + Math.min(column * stepM, maxX - minX)
      if (pointInIrrigatedGeometry({ x, y }, region)) targets.push(Object.freeze({ x, y }))
    }
  }
  return targets
}

function candidatePositions(region, radiusM) {
  const xs = region.boundary.map((point) => point.x)
  const ys = region.boundary.map((point) => point.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const step = radiusM * POSITION_STEP_FACTOR
  const positions = []
  const seen = new Set()
  const add = (point) => {
    if (!pointInIrrigatedGeometry(point, region)) return
    const key = point.x.toFixed(5) + ':' + point.y.toFixed(5)
    if (seen.has(key)) return
    seen.add(key)
    positions.push(Object.freeze({ x: point.x, y: point.y }))
  }
  for (let y = minY; y <= maxY + EPSILON; y += step) {
    for (let x = minX; x <= maxX + EPSILON; x += step) add({ x: Math.min(x, maxX), y: Math.min(y, maxY) })
  }
  for (const ring of [region.boundary, ...region.exclusions]) {
    for (let index = 0; index < ring.length; index += 1) {
      const a = ring[index], b = ring[(index + 1) % ring.length]
      const divisions = Math.max(1, Math.ceil(distance(a, b) / step))
      for (let part = 0; part <= divisions; part += 1) {
        const ratio = part / divisions
        add({ x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio })
      }
    }
  }
  return positions
}

function sectorFitsGeometry(candidate, region) {
  const start = candidate.arcDeg === 360 ? 0 : candidate.directionDeg - candidate.arcDeg / 2
  const angleStep = 3
  const radialStep = 0.5
  for (let angleOffset = 0; angleOffset <= candidate.arcDeg + EPSILON; angleOffset += angleStep) {
    const angle = (start + angleOffset) * Math.PI / 180
    for (let radius = 0; radius <= candidate.radiusM + EPSILON; radius += radialStep) {
      const point = {
        x: candidate.position.x + Math.cos(angle) * Math.min(radius, candidate.radiusM),
        y: candidate.position.y + Math.sin(angle) * Math.min(radius, candidate.radiusM),
      }
      if (!pointInIrrigatedGeometry(point, region)) return false
    }
  }
  return true
}

function buildCandidates(region, targets, radiusM) {
  const candidates = []
  for (const position of candidatePositions(region, radiusM)) {
    for (const arcDeg of ARCS) {
      const directions = arcDeg === 360 ? [null] : Array.from({ length: 360 / DIRECTION_STEP_DEG }, (_, index) => index * DIRECTION_STEP_DEG)
      for (const directionDeg of directions) {
        const candidate = { position, radiusM, arcDeg, directionDeg }
        if (!sectorFitsGeometry(candidate, region)) continue
        const covered = []
        for (let index = 0; index < targets.length; index += 1) {
          if (sectorContains(targets[index], candidate)) covered.push(index)
        }
        if (covered.length) candidates.push({ ...candidate, covered })
        if (candidates.length > MAX_CANDIDATES) return null
      }
    }
  }
  return candidates
}

function mutuallyReach(a, b) {
  const separation = distance(a.position, b.position)
  return separation > EPSILON &&
    separation <= Math.min(a.radiusM, b.radiusM) + EPSILON &&
    sectorContains(a.position, b) && sectorContains(b.position, a)
}

function selectRotors(candidates, targetCount) {
  if (!candidates.length) return { selected: [], uncovered: new Set(Array.from({ length: targetCount }, (_, i) => i)) }
  const ordered = candidates.slice().sort((a, b) =>
    b.covered.length - a.covered.length ||
    a.position.y - b.position.y || a.position.x - b.position.x ||
    a.arcDeg - b.arcDeg || (a.directionDeg ?? -1) - (b.directionDeg ?? -1))
  const selected = []
  const uncovered = new Set(Array.from({ length: targetCount }, (_, i) => i))
  const first = ordered.find((candidate) => candidate.covered.length > 0)
  if (!first) return { selected, uncovered }
  selected.push(first)
  for (const index of first.covered) uncovered.delete(index)

  while (uncovered.size && selected.length < MAX_ROTORS) {
    let best = null
    let bestGain = 0
    for (const candidate of ordered) {
      if (selected.some((entry) => distance(entry.position, candidate.position) <= EPSILON)) continue
      if (!selected.some((entry) => mutuallyReach(candidate, entry))) continue
      let gain = 0
      for (const index of candidate.covered) if (uncovered.has(index)) gain += 1
      if (gain > bestGain) { best = candidate; bestGain = gain }
    }
    if (!best) break
    selected.push(best)
    for (const index of best.covered) uncovered.delete(index)
  }
  return { selected, uncovered }
}

/**
 * Owner-approved geometric planning path for Rain Bird 3504-PC.
 * Planning reach is 10/9/8 m, independent of selected 90/180/270/360 degree arc.
 * These are Florial planning values, not a claim of arc-specific manufacturer
 * performance data. Hydraulic flow/pressure and precipitation are not inferred.
 */
export function generateRainBird3504Layout(geometry, { sampleStepM = TARGET_STEP_M } = {}) {
  const validation = validateLawnGeometry(geometry)
  const rawRegion = geometry?.regions?.[0]
  if (!rawRegion || geometry.regions.length !== 1 || geometry.status !== 'confirmed' ||
      !validation.valid || !validation.supported || validation.regions.length !== 1 ||
      !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return Object.freeze({ status: 'invalid_geometry', sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
  }
  const region = {
    boundary: openRing(rawRegion.boundary?.vertices ?? []),
    exclusions: (rawRegion.exclusions ?? []).map((entry) => openRing(entry.polygon?.vertices ?? [])),
  }
  if (region.boundary.length < 4) {
    return Object.freeze({ status: 'invalid_geometry', sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
  }
  const targets = sampleTargets(region, sampleStepM)
  if (!targets?.length) {
    return Object.freeze({ status: 'sampling_limit_exceeded', sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
  }

  let selected = []
  let uncovered = new Set(Array.from({ length: targets.length }, (_, i) => i))
  let selectedRadiusM = null
  let candidateCount = 0
  let positionCount = 0
  for (const radiusM of PLANNING_RADII_M) {
    const positions = candidatePositions(region, radiusM)
    positionCount += positions.length
    const candidates = buildCandidates(region, targets, radiusM)
    if (!candidates) {
      return Object.freeze({ status: 'candidate_limit_exceeded', sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
    }
    candidateCount += candidates.length
    const result = selectRotors(candidates, targets.length)
    if (result.selected.length && result.uncovered.size < uncovered.size) {
      selected = result.selected
      uncovered = result.uncovered
      selectedRadiusM = radiusM
    }
    if (uncovered.size === 0) break
  }

  const sprinklers = selected.map((candidate, index) => Object.freeze({
    id: 'rotor-3504-' + String(index + 1).padStart(3, '0'),
    position: candidate.position,
    arcDeg: candidate.arcDeg,
    directionDeg: candidate.directionDeg,
    source: region.boundary.some((a, index) => pointOnSegment(candidate.position, a, region.boundary[(index + 1) % region.boundary.length]))
      ? 'edge' : 'interior',
    radiusM: candidate.radiusM,
    pressureBar: null,
    flowLpm: null,
    precipitationSquareMmH: null,
    precipitationTriangularMmH: null,
    performanceModel: '3504-PC',
    pattern: 'circular',
    planningRadiusSource: 'owner-approved-florial-3504pc-rule',
  }))

  return Object.freeze({
    status: sprinklers.length ? 'layout_generated' : 'no_usable_rotor_candidates',
    family: '3500',
    model: '3504-PC',
    planningRadiusM: selectedRadiusM,
    sprinklers: Object.freeze(sprinklers),
    coverage: Object.freeze({
      sampledPoints: targets.length,
      coveredPoints: targets.length - uncovered.size,
      uncoveredPoints: uncovered.size,
      coveragePercent: (targets.length - uncovered.size) / targets.length * 100,
      uncoveredSamples: Object.freeze([...uncovered].slice(0, 100).map((index) => targets[index])),
    }),
    candidateStats: Object.freeze({ candidatePositions: positionCount, candidates: candidateCount, selectedRotors: sprinklers.length }),
    warnings: Object.freeze([
      Object.freeze({ code: '3504pc_radius_is_owner_defined_florial_planning_value', path: 'layout.sprinklers.radiusM' }),
      Object.freeze({ code: '3504pc_arc_invariant_radius_not_claimed_as_manufacturer_arc_table', path: 'layout.sprinklers.arcDeg' }),
      Object.freeze({ code: '3504pc_flow_and_nozzle_pressure_not_calculated', path: 'hydraulics' }),
      Object.freeze({ code: '3504pc_precipitation_uniformity_not_evaluated', path: 'precipitation' }),
      Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
    ]),
  })
}
