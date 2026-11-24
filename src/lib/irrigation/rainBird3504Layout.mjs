import { validateLawnGeometry } from './lawnGeometry.mjs'
import { evaluateHeadToHeadSpacing, sprinklersMutuallyReach } from './lawnSprinklerLayout.mjs'

const ENGINE_VERSION = '2.0.0'
const EPSILON = 1e-8
const RADIUS_STAGES_M = Object.freeze([8, 9, 10, 7, 6, 5])
const ALLOWED_RADII_M = Object.freeze([10, 9, 8, 7, 6, 5])
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
  if (source === 'vertex') return Math.min(10, width, height)
  if (source === 'edge') {
    const onHorizontalEdge = Math.abs(y - bounds.minY) <= EPSILON ||
      Math.abs(y - bounds.maxY) <= EPSILON
    return onHorizontalEdge
      ? Math.min(10, width, x - bounds.minX, bounds.maxX - x)
      : Math.min(10, height, y - bounds.minY, bounds.maxY - y)
  }
  return Math.min(10, x - bounds.minX, bounds.maxX - x, y - bounds.minY, bounds.maxY - y)
}

function selectSafeRadius(stageRadiusM, safeMaximumM) {
  return ALLOWED_RADII_M.find((radius) =>
    radius <= stageRadiusM + EPSILON && radius <= safeMaximumM + EPSILON) ?? null
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

function offsetFor(point, offsets) {
  return offsets.find((entry) => entry?.from &&
    distance(point, entry.from) <= 0.001 &&
    Number.isFinite(entry.dx) && Number.isFinite(entry.dy)) ?? null
}

function makeHead(sourcePoint, bounds, stageRadiusM, index, offsets) {
  const positionClass = classifyPosition(sourcePoint.x, sourcePoint.y, bounds)
  const offset = offsetFor(sourcePoint, offsets)
  const position = offset
    ? { x: sourcePoint.x + offset.dx, y: sourcePoint.y + offset.dy }
    : { x: sourcePoint.x, y: sourcePoint.y }
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

function buildCornerOnly(bounds, stageRadiusM, offsets = []) {
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ]
  const heads = corners.map((point, index) =>
    makeHead(point, bounds, stageRadiusM, index + 1, offsets))
  if (heads.some((head) => !head)) return null
  return heads
}

function buildGrid(bounds, stageRadiusM, offsets = []) {
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
      const head = makeHead(point, point, bounds, stageRadiusM, index, offsets)
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

function result(status, extra = {}) {
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    status,
    sprinklers: Object.freeze([]),
    warnings: Object.freeze([]),
    ...extra,
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
 * The 8 m planning stage is preferred. 9/10 m stages are considered only as
 * a lower-head-count alternative or when the corner-only set needs more reach.
 * Local edge/interior clearances can reduce a rotor to 7/6/5 m.
 */
export function generateRainBird3504Layout(geometry, {
  sampleStepM = 0.5,
  candidatePositionOffsets = [],
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
  if (width <= 0 || height <= 0 || Math.min(width, height) < 5 - EPSILON) {
    return result('no_usable_rotor_candidates')
  }
  const targets = buildTargets(bounds, sampleStepM)
  if (!targets) return result('sampling_limit_exceeded')
  const offsets = Array.isArray(candidatePositionOffsets) ? candidatePositionOffsets : []
  const prior = Array.isArray(initialSprinklers) ? initialSprinklers : []

  // Phase 1: all four true rectangle corners, before any interior or side rows.
  for (const stageRadiusM of RADIUS_STAGES_M) {
    const heads = buildCornerOnly(bounds, stageRadiusM, offsets)
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
      candidateStats: Object.freeze({ candidatePositions: 4, selectedRotors: heads.length, offsetCandidatePositions: heads.filter((head) => offsets.some((entry) => distance(head.position, { x: entry.from.x + entry.dx, y: entry.from.y + entry.dy }) <= 0.001)).length }),
      warnings: Object.freeze([
        Object.freeze({ code: '3504pc_four_geometric_corners_tested_before_grid_expansion', path: 'layout.sprinklers' }),
        Object.freeze({ code: '3504pc_radius_is_owner_defined_florial_planning_value', path: 'layout.sprinklers.radiusM' }),
        Object.freeze({ code: '3504pc_flow_and_nozzle_pressure_not_calculated', path: 'hydraulics' }),
        Object.freeze({ code: '3504pc_precipitation_uniformity_not_evaluated', path: 'precipitation' }),
        Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_proof', path: 'coverage' }),
      ]),
    })
  }

  // Phase 2: generate complete cell grids; each cell contributes four corners,
  // while shared coordinates are stored once in the global grid.
  const completeLayouts = []
  for (const stageRadiusM of RADIUS_STAGES_M) {
    const grid = buildGrid(bounds, stageRadiusM, offsets)
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
      coverage,
      spacing,
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

  const sprinklers = Object.freeze(selected.grid.heads.map(({ gridKey, ...head }) => head))
  const offsetCount = sprinklers.filter((head) => offsets.some((entry) =>
    entry?.from && Number.isFinite(entry.dx) && Number.isFinite(entry.dy) &&
    distance(head.position, { x: entry.from.x + entry.dx, y: entry.from.y + entry.dy }) <= 0.001)).length
  return result('layout_generated', {
    family: '3500',
    model: '3504-PC',
    planningRadiusM: selected.stageRadiusM,
    layoutStrategy: 'corner-first-shared-cell-grid',
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
      candidatePositions: selected.grid.heads.length,
      selectedRotors: sprinklers.length,
      offsetCandidatePositions: offsetCount,
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
