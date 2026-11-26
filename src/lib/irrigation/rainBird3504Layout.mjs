import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  evaluateHeadToHeadSpacing,
  generateLawnSprinklerLayout,
  sprinklersMutuallyReach,
} from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'

const ENGINE_VERSION = '2.0.0'
const EPSILON = 1e-8
const BASE_RADIUS_STAGES_M = Object.freeze([8, 9])
const RADIUS_STAGES_M = Object.freeze([8, 9, 7, 6])
const MAX_TARGETS = 30000
const MAX_ROTORS = 150

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function openRing(vertices = []) {
  return vertices.filter((point, index) =>
    index < vertices.length - 1 || distance(point, vertices[0]) > EPSILON)
}

function rectangleBounds(geometry) {
  const region = geometry?.regions?.[0]
  const vertices = openRing(region?.boundary?.vertices ?? [])
  if (!region || geometry.regions.length !== 1 || region.exclusions?.length ||
      vertices.length !== 4) return null
  const bounds = {
    minX: Math.min(...vertices.map((point) => point.x)),
    minY: Math.min(...vertices.map((point) => point.y)),
    maxX: Math.max(...vertices.map((point) => point.x)),
    maxY: Math.max(...vertices.map((point) => point.y)),
  }
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ]
  const axisAligned = vertices.every((point, index) => {
    const next = vertices[(index + 1) % vertices.length]
    return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON
  })
  if (!axisAligned || corners.some((corner) =>
    !vertices.some((point) => distance(point, corner) <= EPSILON))) return null
  return bounds
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
  if (head.pattern === 'strip' && head.stripBounds) {
    const bounds = head.stripBounds
    if (!pointInRect(point, bounds)) return false
    if (head.stripAxis === 'horizontal') {
      if (head.stripDirection === 'left') return point.x <= head.position.x + EPSILON &&
        point.x >= head.position.x - head.stripLengthM - EPSILON
      if (head.stripDirection === 'right') return point.x >= head.position.x - EPSILON &&
        point.x <= head.position.x + head.stripLengthM + EPSILON
      return true
    }
    if (head.stripDirection === 'up') return point.y >= head.position.y - EPSILON &&
      point.y <= head.position.y + head.stripLengthM + EPSILON
    if (head.stripDirection === 'down') return point.y <= head.position.y + EPSILON &&
      point.y >= head.position.y - head.stripLengthM - EPSILON
    return true
  }
  return Number.isFinite(head.radiusM) && sectorContains(point, head)
}

function buildTargets(bounds, stepM) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const columns = Math.ceil(width / stepM)
  const rows = Math.ceil(height / stepM)
  if ((columns + 1) * (rows + 1) > MAX_TARGETS) return null
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

function classifyPosition(x, y, bounds) {
  const onLeft = Math.abs(x - bounds.minX) <= EPSILON
  const onRight = Math.abs(x - bounds.maxX) <= EPSILON
  const onBottom = Math.abs(y - bounds.minY) <= EPSILON
  const onTop = Math.abs(y - bounds.maxY) <= EPSILON
  const horizontalEdge = onBottom || onTop
  const verticalEdge = onLeft || onRight
  if (horizontalEdge && verticalEdge) {
    const directionDeg = onLeft
      ? (onBottom ? 45 : 315)
      : (onBottom ? 135 : 225)
    return { source: 'vertex', arcDeg: 90, directionDeg }
  }
  if (horizontalEdge) {
    return { source: 'edge', arcDeg: 180, directionDeg: onBottom ? 90 : 270 }
  }
  if (verticalEdge) {
    return { source: 'edge', arcDeg: 180, directionDeg: onLeft ? 0 : 180 }
  }
  return { source: 'interior', arcDeg: 360, directionDeg: null }
}

function maximumSafeRadius(x, y, bounds, source) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (source === 'vertex') return Math.min(9, width, height)
  if (source === 'edge') {
    const onHorizontalEdge = Math.abs(y - bounds.minY) <= EPSILON ||
      Math.abs(y - bounds.maxY) <= EPSILON
    return onHorizontalEdge
      ? Math.min(9, width, x - bounds.minX, bounds.maxX - x)
      : Math.min(9, height, y - bounds.minY, bounds.maxY - y)
  }
  return Math.min(9, x - bounds.minX, bounds.maxX - x, y - bounds.minY, bounds.maxY - y)
}

function selectSafeRadius(stageRadiusM, safeMaximumM) {
  if (!Number.isFinite(stageRadiusM) || stageRadiusM <= 0 ||
      !Number.isFinite(safeMaximumM) || safeMaximumM <= 0) return null
  // Planning radius is continuous: retain the exact geometric clearance
  // instead of snapping it to a catalogue of whole-metre values.
  const radiusM = Math.min(stageRadiusM, safeMaximumM)
  return radiusM >= 6 - EPSILON ? radiusM : null
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

function makeHead(sourcePoint, bounds, stageRadiusM, index) {
  const positionClass = classifyPosition(sourcePoint.x, sourcePoint.y, bounds)
  const position = { x: sourcePoint.x, y: sourcePoint.y }
  const safeMaximum = maximumSafeRadius(
    sourcePoint.x, sourcePoint.y, bounds, positionClass.source)
  const radiusM = selectSafeRadius(stageRadiusM, safeMaximum)
  if (!radiusM) return null
  const head = Object.freeze({
    id: 'rotor-3504-' + String(index).padStart(4, '0'),
    position: Object.freeze(position),
    arcDeg: positionClass.arcDeg,
    directionDeg: positionClass.directionDeg,
    source: positionClass.source,
    radiusM,
    pressureBar: null,
    flowLpm: null,
    precipitationSquareMmH: null,
    precipitationTriangularMmH: null,
    performanceModel: '3504-PC',
    pattern: 'rotor',
    planningRadiusSource: 'owner-approved-florial-3504pc-corner-first-grid',
  })
  return sectorFitsRectangle(head, bounds) ? head : null
}

function evaluateCoverage(heads, targets, initialHeads = []) {
  const combined = [...initialHeads, ...heads]
  let covered = 0
  const uncovered = []
  for (const target of targets) {
    if (combined.some((head) => headCoversPoint(head, target))) covered += 1
    else if (uncovered.length < 100) uncovered.push(target)
  }
  return Object.freeze({
    sampledPoints: targets.length,
    coveredPoints: covered,
    uncoveredPoints: targets.length - covered,
    coveragePercent: targets.length ? covered / targets.length * 100 : 0,
    uncoveredSamples: Object.freeze(uncovered),
  })
}

function evaluateGridHeadToHead(heads, grid) {
  const byKey = new Map(heads.map((head) => [
    head.gridKey,
    head,
  ]))
  const edges = []
  for (let row = 0; row < grid.ys.length; row += 1) {
    for (let column = 0; column < grid.xs.length; column += 1) {
      const current = byKey.get(row + ':' + column)
      if (!current) return Object.freeze({ passed: false, checks: Object.freeze(edges) })
      if (column + 1 < grid.xs.length) {
        const next = byKey.get(row + ':' + (column + 1))
        if (!next || !sprinklersMutuallyReach(current, next)) {
          edges.push(Object.freeze({ sprinklerId: current.id, neighborId: next?.id ?? null, passed: false }))
          return Object.freeze({ passed: false, checks: Object.freeze(edges) })
        }
        edges.push(Object.freeze({ sprinklerId: current.id, neighborId: next.id, separationM: distance(current.position, next.position), passed: true }))
      }
      if (row + 1 < grid.ys.length) {
        const next = byKey.get((row + 1) + ':' + column)
        if (!next || !sprinklersMutuallyReach(current, next)) {
          edges.push(Object.freeze({ sprinklerId: current.id, neighborId: next?.id ?? null, passed: false }))
          return Object.freeze({ passed: false, checks: Object.freeze(edges) })
        }
        edges.push(Object.freeze({ sprinklerId: current.id, neighborId: next.id, separationM: distance(current.position, next.position), passed: true }))
      }
    }
  }
  return Object.freeze({ passed: edges.length > 0 && edges.every((entry) => entry.passed), checks: Object.freeze(edges) })
}

function evaluateCornerHeadToHead(heads, bounds) {
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ]
  const byCorner = corners.map((point) => heads.find((head) =>
    distance(head.position, point) <= 0.001))
  if (byCorner.some((head) => !head)) return Object.freeze({ passed: false, checks: Object.freeze([]) })
  const checks = []
  for (let index = 0; index < 4; index += 1) {
    const a = byCorner[index]
    const b = byCorner[(index + 1) % 4]
    const passed = sprinklersMutuallyReach(a, b)
    checks.push(Object.freeze({
      sprinklerId: a.id,
      neighborId: b.id,
      separationM: distance(a.position, b.position),
      passed,
    }))
  }
  return Object.freeze({ passed: checks.every((entry) => entry.passed), checks: Object.freeze(checks) })
}

function buildCornerOnly(bounds, stageRadiusM) {
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ]
  const heads = corners.map((point, index) =>
    makeHead(point, bounds, stageRadiusM, index + 1))
  if (heads.some((head) => !head)) return null
  return heads
}

function buildGrid(bounds, stageRadiusM) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const localXs = axisPositions(width, stageRadiusM)
  const localYs = axisPositions(height, stageRadiusM)
  const xs = localXs.map((value) => bounds.minX + value)
  const ys = localYs.map((value) => bounds.minY + value)
  const heads = []
  let index = 1
  for (let row = 0; row < ys.length; row += 1) {
    for (let column = 0; column < xs.length; column += 1) {
      const point = { x: xs[column], y: ys[row] }
      const isCorner = (row === 0 || row === ys.length - 1) &&
        (column === 0 || column === xs.length - 1)
      const baseCorner = stageRadiusM < 8 && isCorner
        ? makeHead(point, bounds, 8, index)
        : null
      const head = baseCorner?.radiusM === 8
        ? baseCorner
        : makeHead(point, bounds, stageRadiusM, index)
      if (!head) return null
      heads.push(Object.freeze({ ...head, gridKey: row + ':' + column }))
      index += 1
    }
  }
  return {
    heads,
    xs,
    ys,
    cells: Math.max(0, xs.length - 1) * Math.max(0, ys.length - 1),
  }
}


function fullCircleRotorClearancePassed(heads, minimumDistanceM = 6) {
  const rotors = heads.filter((head) =>
    head.pattern === 'rotor' && head.performanceModel === '3504-PC')
  for (const fullCircle of rotors.filter((head) => head.arcDeg === 360)) {
    for (const other of rotors) {
      if (other.id === fullCircle.id) continue
      if (distance(fullCircle.position, other.position) < minimumDistanceM - EPSILON) return false
    }
  }
  return true
}

function buildSideMidpointCenterCandidate(bounds, stageRadiusM, targets, prior) {
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const points = [
    { x: centerX, y: bounds.minY },
    { x: bounds.maxX, y: centerY },
    { x: centerX, y: bounds.maxY },
    { x: bounds.minX, y: centerY },
    { x: centerX, y: centerY },
  ]
  const heads = points.map((point, index) => makeHead(point, bounds, stageRadiusM, index + 1))
  if (heads.some((head) => !head)) return null
  if (!fullCircleRotorClearancePassed([...prior, ...heads])) return null
  if (heads.some((head) => !sectorFitsRectangle(head, bounds))) return null
  const coverage = evaluateCoverage(heads, targets, prior)
  if (coverage.uncoveredPoints !== 0) return null
  const spacing = evaluateHeadToHeadSpacing(heads)
  if (spacing.some((entry) => !entry.passed)) return null
  return { heads, coverage, spacing }
}

function result(status, extra = {}) {
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    status,
    sprinklers: Object.freeze([]),
    warnings: Object.freeze([]),
    ...extra,
  })
}


function polygonPointInRing(point, vertices) {
  let inside = false
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const crossValue = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    const within = point.x >= Math.min(a.x, b.x) - EPSILON &&
      point.x <= Math.max(a.x, b.x) + EPSILON &&
      point.y >= Math.min(a.y, b.y) - EPSILON &&
      point.y <= Math.max(a.y, b.y) + EPSILON
    if (Math.abs(crossValue) <= EPSILON && within) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (point.x < x) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function rotorSectorFitsGeometry(head, radiusM, geometry) {
  const region = geometry?.regions?.[0]
  const vertices = region?.boundary?.vertices
  if (!Array.isArray(vertices)) return false
  const arc = head.arcDeg ?? 360
  const start = arc === 360 ? 0 : (head.directionDeg ?? 0) - arc / 2
  for (let angleOffset = 0; angleOffset <= arc + EPSILON; angleOffset += 1) {
    const angle = (start + Math.min(angleOffset, arc)) * Math.PI / 180
    for (let distanceM = 0; distanceM <= radiusM + EPSILON; distanceM += 0.2) {
      const point = {
        x: head.position.x + Math.cos(angle) * Math.min(distanceM, radiusM),
        y: head.position.y + Math.sin(angle) * Math.min(distanceM, radiusM),
      }
      if (polygonPointInRing(point, vertices) < 0 ||
          (region.exclusions ?? []).some((entry) =>
            polygonPointInRing(point, entry.polygon.vertices) > 0)) return false
    }
  }
  return true
}

function maximumPolygonRotorRadius(head, geometry) {
  if (!rotorSectorFitsGeometry(head, 6, geometry)) return null
  if (rotorSectorFitsGeometry(head, 9, geometry)) return 9
  let low = 6
  let high = 9
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const middle = (low + high) / 2
    if (rotorSectorFitsGeometry(head, middle, geometry)) low = middle
    else high = middle
  }
  return Math.floor((low + 1e-8) * 100) / 100
}

/**
 * Whole-polygon 3504-PC pass for L-shaped and other supported orthogonal
 * regions. It uses the same corner-first/perimeter/interior candidate
 * progression as R-VAN, then assigns each accepted rotor its own continuous
 * 6–9 m geometric radius against the original polygon and exclusions.
 * R-VAN manufacturer values are not copied to the rotor output.
 */
export function generateRainBird3504PolygonLayout(geometry, {
  sampleStepM = 0.5,
} = {}) {
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || !validation.supported || validation.regions.length !== 1 ||
      geometry?.status !== 'confirmed' || !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return result('invalid_geometry')
  }

  const candidateLayout = generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model: 'R-VAN24',
    pressureBar: RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar,
    sampleStepM,
    radiusM: 6,
    preventOverspray: true,
    sprayBoundaryGeometry: geometry,
  })
  if (!['coverage_complete_sampled', 'coverage_incomplete'].includes(candidateLayout.status) ||
      !candidateLayout.sprinklers.length) {
    return result('no_complete_rotor_layout', {
      candidateStatus: candidateLayout.status,
      candidateWarnings: candidateLayout.warnings ?? [],
      coverage: candidateLayout.coverage ?? null,
    })
  }

  const converted = candidateLayout.sprinklers.map((candidate, index) => {
    const template = {
      position: candidate.position,
      arcDeg: candidate.arcDeg,
      directionDeg: candidate.directionDeg,
    }
    const radiusM = maximumPolygonRotorRadius(template, geometry)
    if (!radiusM || radiusM < 6 - EPSILON) return null
    return Object.freeze({
      id: 'rotor-3504-polygon-' + String(index + 1).padStart(4, '0'),
      position: Object.freeze({ x: candidate.position.x, y: candidate.position.y }),
      arcDeg: candidate.arcDeg,
      directionDeg: candidate.arcDeg === 360 ? null : candidate.directionDeg,
      source: candidate.source,
      radiusM,
      pressureBar: null,
      flowLpm: null,
      precipitationSquareMmH: null,
      precipitationTriangularMmH: null,
      performanceModel: '3504-PC',
      pattern: 'rotor',
      planningRadiusSource: 'owner-approved-continuous-6-to-9m-whole-polygon',
      ...(Number.isFinite(candidate.perimeterOffsetM) ? {
        perimeterOffsetM: candidate.perimeterOffsetM,
        perimeterLengthM: candidate.perimeterLengthM,
      } : {}),
    })
  }).filter(Boolean)

  const conflicts = new Set()
  for (const head of converted.filter((entry) => entry.arcDeg === 360)) {
    for (const other of converted) {
      if (other.id !== head.id && distance(head.position, other.position) < 6 - EPSILON) {
        conflicts.add(head.id)
      }
    }
  }
  const sprinklers = Object.freeze(converted.filter((head) => !conflicts.has(head.id)))
  const checks = sprinklers.length > 1 ? evaluateHeadToHeadSpacing(sprinklers) : []
  const headToHeadPassed = checks.length ? checks.every((entry) => entry.passed) : null
  const completeConversion = sprinklers.length === candidateLayout.sprinklers.length
  const warnings = [
    ...(candidateLayout.warnings ?? []),
    Object.freeze({ code: '3504pc_whole_polygon_corner_first_perimeter_interior', path: 'layout.sprinklers' }),
    Object.freeze({ code: '3504pc_individual_continuous_safe_geometric_radius_6_to_9m', path: 'layout.sprinklers.radiusM' }),
    Object.freeze({ code: '3504pc_radius_is_not_manufacturer_throw_or_hydraulic_performance', path: 'layout.sprinklers.radiusM' }),
  ]
  if (!completeConversion) warnings.push(Object.freeze({
    code: '3504pc_candidates_below_6m_safe_clearance_or_full_circle_spacing_left_for_rvan',
    path: 'layout.sprinklers',
  }))
  if (headToHeadPassed === false) warnings.push(Object.freeze({
    code: 'head_to_head_spacing_check_failed',
    path: 'layout.headToHead',
  }))

  return result(completeConversion && candidateLayout.status === 'coverage_complete_sampled' && headToHeadPassed !== false
    ? 'layout_generated'
    : 'layout_incomplete', {
    family: '3500',
    model: '3504-PC',
    planningRadiusM: sprinklers.length
      ? Math.max(...sprinklers.map((head) => head.radiusM))
      : null,
    layoutStrategy: 'whole-polygon-corner-first-perimeter-interior',
    sprinklers,
    coverage: completeConversion ? candidateLayout.coverage : null,
    headToHead: Object.freeze({
      passed: headToHeadPassed,
      applicable: checks.length > 0,
      checks: Object.freeze(checks),
    }),
    candidateStats: Object.freeze({
      candidatePositions: candidateLayout.sprinklers.length,
      selectedRotors: sprinklers.length,
      rejectedForSafeRadiusOrFullCircleSpacing: candidateLayout.sprinklers.length - sprinklers.length,
    }),
    warnings: Object.freeze(warnings),
    geometry: candidateLayout.geometry,
  })
}

/**
 * Corner-first Rain Bird 3504-PC layout for one rectangular calculation zone.
 *
 * Each rectangular cell is defined by four corner positions. Shared cell
 * corners are represented by one physical rotor. Four perimeter corners are
 * always tested first; only when they cannot satisfy sampled coverage and
 * mutual Head-to-Head does the solver add complete rows/columns of cell corners.
 *
 * The 8 m planning stage is preferred; 9 m is the only larger alternative.
 * Only after both stages fail does the solver expand the shared-cell grid at
 * 7/6 m to add further rotor positions before any R-VAN fallback. 10 m and 5 m are excluded.
 */
export function generateRainBird3504Layout(geometry, {
  sampleStepM = 0.5,
  initialSprinklers = [],
} = {}) {
  const validation = validateLawnGeometry(geometry)
  const bounds = rectangleBounds(geometry)
  if (!bounds || geometry.status !== 'confirmed' || !validation.valid ||
      !validation.supported || validation.regions.length !== 1 ||
      !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return result('invalid_geometry')
  }
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (width <= 0 || height <= 0) return result('no_usable_rotor_candidates')
  const targets = buildTargets(bounds, sampleStepM)
  if (!targets) return result('sampling_limit_exceeded')
  const prior = Array.isArray(initialSprinklers) ? initialSprinklers : []
  const priorCoverage = evaluateCoverage([], targets, prior)
  if (priorCoverage.uncoveredPoints === 0) {
    return result('layout_generated', {
      family: 'shared',
      model: 'covered-by-previous-sprinklers',
      planningRadiusM: null,
      layoutStrategy: 'covered-by-previous-rectangles',
      grid: Object.freeze({ columns: 0, rows: 0, cells: 0, uniqueCornerPositions: 0 }),
      sprinklers: Object.freeze([]),
      coverage: priorCoverage,
      headToHead: Object.freeze({ passed: true, applicable: false, checks: Object.freeze([]) }),
      candidateStats: Object.freeze({ candidatePositions: 0, selectedRotors: 0, priorHeads: prior.length }),
      warnings: Object.freeze([
        Object.freeze({ code: 'rectangle_already_covered_by_previous_sprinklers', path: 'layout.sprinklers' }),
      ]),
    })
  }
  if (Math.min(width, height) < 6 - EPSILON) return result('no_usable_rotor_candidates')

  // Phase 1: all four true rectangle corners, before any interior or side rows.
  for (const stageRadiusM of BASE_RADIUS_STAGES_M) {
    const heads = buildCornerOnly(bounds, stageRadiusM)
    if (!heads) continue
    const coverage = evaluateCoverage(heads, targets, prior)
    if (coverage.uncoveredPoints !== 0) continue
    const spacing = evaluateCornerHeadToHead(heads, bounds)
    if (!spacing.passed) continue
    return result('layout_generated', {
      family: '3500',
      model: '3504-PC',
      planningRadiusM: stageRadiusM,
      layoutStrategy: 'four-corners-first',
      grid: Object.freeze({ columns: 1, rows: 1, cells: 1, cornerPositionsPerCell: 4, uniqueCornerPositions: 4 }),
      sprinklers: Object.freeze(heads),
      coverage,
      headToHead: Object.freeze({ passed: true, applicable: true, checks: spacing.checks }),
      candidateStats: Object.freeze({ candidatePositions: 4, selectedRotors: heads.length }),
      warnings: Object.freeze([
        Object.freeze({ code: '3504pc_four_geometric_corners_tested_before_grid_expansion', path: 'layout.sprinklers' }),
        Object.freeze({ code: '3504pc_radius_is_owner_defined_florial_planning_value', path: 'layout.sprinklers.radiusM' }),
        Object.freeze({ code: '3504pc_flow_and_nozzle_pressure_not_calculated', path: 'hydraulics' }),
        Object.freeze({ code: '3504pc_precipitation_uniformity_not_evaluated', path: 'precipitation' }),
        Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
      ]),
    })
  }

  // Phase 2: continue the same corner-first search with shared perimeter
  // and interior grid candidates. No alternative pattern may bypass the
  // already tested true polygon corners.
  // Expand a shared-position grid only after the true corner seed is insufficient.
  for (const stageRadiusM of RADIUS_STAGES_M) {
    const grid = buildGrid(bounds, stageRadiusM)
    if (!grid || grid.heads.length > MAX_ROTORS) continue
    const coverage = evaluateCoverage(grid.heads, targets, prior)
    if (coverage.uncoveredPoints !== 0) continue
    const spacing = evaluateGridHeadToHead(grid.heads, grid)
    if (!spacing.passed) continue
    const diagnostic = evaluateHeadToHeadSpacing(grid.heads)
    if (diagnostic.some((entry) => !entry.passed)) continue
    const radiusPenalty = Math.abs(stageRadiusM - 8) * 1.5
    completeLayouts.push({
      stageRadiusM,
      grid,
      heads: grid.heads,
      coverage,
      spacing,
      layoutStrategy: 'corner-first-shared-cell-grid',
      score: grid.heads.length + radiusPenalty,
    })
  }
  completeLayouts.sort((a, b) =>
    a.score - b.score || Math.abs(a.stageRadiusM - 8) - Math.abs(b.stageRadiusM - 8) ||
    a.stageRadiusM - b.stageRadiusM)
  const selected = completeLayouts[0]
  if (!selected) return result('no_complete_rotor_layout', {
    coverage: Object.freeze({
      sampledPoints: targets.length,
      coveredPoints: 0,
      uncoveredPoints: targets.length,
      coveragePercent: 0,
      uncoveredSamples: Object.freeze(targets.slice(0, 100)),
    }),
  })

  const sprinklers = Object.freeze(selected.heads.map(({ gridKey, ...head }) => head))
  return result('layout_generated', {
    family: '3500',
    model: '3504-PC',
    planningRadiusM: selected.stageRadiusM < 8 ? 8 : selected.stageRadiusM,
    supplementalRadiusM: selected.stageRadiusM < 8 ? selected.stageRadiusM : null,
    layoutStrategy: selected.layoutStrategy,
    grid: Object.freeze({
      columns: selected.grid.xs.length - 1,
      rows: selected.grid.ys.length - 1,
      cells: selected.grid.cells,
      cornerPositionsPerCell: 4,
      uniqueCornerPositions: selected.grid.heads.length,
    }),
    sprinklers,
    coverage: selected.coverage,
    headToHead: Object.freeze({ passed: true, applicable: true, checks: selected.spacing.checks }),
    candidateStats: Object.freeze({
      candidatePositions: selected.heads.length,
      selectedRotors: sprinklers.length,
    }),
    warnings: Object.freeze([
      Object.freeze({ code: '3504pc_four_corners_seeded_before_shared_cell_grid', path: 'layout.sprinklers' }),
      Object.freeze({ code: '3504pc_shared_cell_corner_positions_deduplicated', path: 'layout.sprinklers' }),
      Object.freeze({ code: '3504pc_radius_is_owner_defined_florial_planning_value', path: 'layout.sprinklers.radiusM' }),
      Object.freeze({ code: '3504pc_flow_and_nozzle_pressure_not_calculated', path: 'hydraulics' }),
      Object.freeze({ code: '3504pc_precipitation_uniformity_not_evaluated', path: 'precipitation' }),
      Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
    ]),
  })
}
