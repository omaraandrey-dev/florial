import { sprinklersMutuallyReach } from './lawnSprinklerLayout.mjs'

const ENGINE_VERSION = '1.1.0'
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

function axisPositions(length, pitch) {
  if (length <= pitch + EPSILON) return [0, length]
  const intervals = Math.ceil(length / pitch)
  if (length <= 2 * pitch + EPSILON) {
    return Array.from({ length: intervals + 1 }, (_, index) => length * index / intervals)
  }
  const positions = [0]
  for (let value = pitch; value < length - pitch - EPSILON; value += pitch) positions.push(value)
  const inset = length - pitch
  if (inset - positions[positions.length - 1] > EPSILON) positions.push(inset)
  positions.push(length)
  return positions
}

function classifyPosition(x, y, bounds) {
  const left = Math.abs(x - bounds.minX) <= EPSILON
  const right = Math.abs(x - bounds.maxX) <= EPSILON
  const bottom = Math.abs(y - bounds.minY) <= EPSILON
  const top = Math.abs(y - bounds.maxY) <= EPSILON
  if ((left || right) && (bottom || top)) {
    return {
      source: 'vertex',
      arcDeg: 90,
      directionDeg: left ? (bottom ? 45 : 315) : (bottom ? 135 : 225),
    }
  }
  if (bottom) return { source: 'edge', arcDeg: 180, directionDeg: 90 }
  if (top) return { source: 'edge', arcDeg: 180, directionDeg: 270 }
  if (left) return { source: 'edge', arcDeg: 180, directionDeg: 0 }
  if (right) return { source: 'edge', arcDeg: 180, directionDeg: 180 }
  return { source: 'interior', arcDeg: 360, directionDeg: null }
}

function maximumSafeRadius(x, y, bounds, position) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (position.source === 'vertex') return Math.min(10, width, height)
  if (position.source === 'edge') {
    if (position.directionDeg === 90 || position.directionDeg === 270) {
      return Math.min(10, x - bounds.minX, bounds.maxX - x, height)
    }
    return Math.min(10, y - bounds.minY, bounds.maxY - y, width)
  }
  return Math.min(10, x - bounds.minX, bounds.maxX - x, y - bounds.minY, bounds.maxY - y)
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

function sectorFitsRectangle(head, bounds) {
  const start = head.arcDeg === 360 ? 0 : head.directionDeg - head.arcDeg / 2
  for (let angleOffset = 0; angleOffset <= head.arcDeg + EPSILON; angleOffset += 1) {
    const angle = (start + Math.min(angleOffset, head.arcDeg)) * Math.PI / 180
    for (let radius = 0; radius <= head.radiusM + EPSILON; radius += 0.2) {
      const reach = Math.min(radius, head.radiusM)
      if (!pointInRect({
        x: head.position.x + Math.cos(angle) * reach,
        y: head.position.y + Math.sin(angle) * reach,
      }, bounds)) return false
    }
  }
  return true
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

function buildCornerFirstGrid(bounds, planningRadiusM, candidatePositionOffsets = []) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const pitch = Math.min(planningRadiusM, width, height)
  const xs = axisPositions(width, pitch)
  const ys = axisPositions(height, pitch)
  const heads = []
  const byCoordinate = new Map()

  for (let row = 0; row < ys.length; row += 1) {
    for (let column = 0; column < xs.length; column += 1) {
      const x = bounds.minX + xs[column]
      const y = bounds.minY + ys[row]
      const position = classifyPosition(x, y, bounds)
      const offset = candidatePositionOffsets.find((entry) => entry?.from &&
        Number.isFinite(entry.from.x) && Number.isFinite(entry.from.y) &&
        distance(entry.from, { x, y }) <= 0.001 &&
        Number.isFinite(entry.dx) && Number.isFinite(entry.dy))
      const placedX = x + (offset?.dx ?? 0)
      const placedY = y + (offset?.dy ?? 0)
      const safeRadius = maximumSafeRadius(x, y, bounds, position)
      if (safeRadius < 5 - EPSILON) return null
      const radiusM = Math.min(planningRadiusM, safeRadius)
      const head = Object.freeze({
        id: 'r3504-r' + row + '-c' + column,
        position: Object.freeze({ x: placedX, y: placedY }),
        arcDeg: position.arcDeg,
        directionDeg: position.directionDeg,
        source: position.source,
        radiusM,
        performanceModel: '3504-PC',
        family: '3500',
        pattern: 'rotor',
        pressureBar: null,
        flowLpm: null,
        planningRadiusSource: 'owner-approved-florial-3504pc-rule',
        ...(offset ? { seamOffsetM: Math.hypot(offset.dx, offset.dy) } : {}),
      })
      if (!sectorFitsRectangle(head, bounds)) return null
      heads.push(head)
      byCoordinate.set(row + ':' + column, head)
    }
  }

  const cells = []
  for (let row = 0; row < ys.length - 1; row += 1) {
    for (let column = 0; column < xs.length - 1; column += 1) {
      const corners = [
        byCoordinate.get(row + ':' + column),
        byCoordinate.get(row + ':' + (column + 1)),
        byCoordinate.get((row + 1) + ':' + (column + 1)),
        byCoordinate.get((row + 1) + ':' + column),
      ]
      if (corners.some((head) => !head)) return null
      cells.push(Object.freeze({
        id: 'cell-r' + row + '-c' + column,
        cornerHeadIds: Object.freeze(corners.map((head) => head.id)),
      }))
    }
  }

  const adjacentPairs = []
  for (let row = 0; row < ys.length; row += 1) {
    for (let column = 0; column < xs.length; column += 1) {
      const current = byCoordinate.get(row + ':' + column)
      if (column + 1 < xs.length) adjacentPairs.push([current, byCoordinate.get(row + ':' + (column + 1))])
      if (row + 1 < ys.length) adjacentPairs.push([current, byCoordinate.get((row + 1) + ':' + column)])
    }
  }
  const headToHeadChecks = adjacentPairs.map(([a, b]) => {
    const separationM = distance(a.position, b.position)
    return Object.freeze({
      sprinklerId: a.id,
      neighborId: b.id,
      separationM,
      requiredMaximumM: Math.min(a.radiusM, b.radiusM),
      passed: separationM <= Math.min(a.radiusM, b.radiusM) + EPSILON &&
        sprinklersMutuallyReach(a, b),
    })
  })

  return { heads, cells, headToHeadChecks, pitchM: pitch, columns: xs.length, rows: ys.length }
}

function evaluateCoverage(heads, targets) {
  let covered = 0
  const uncovered = []
  for (const target of targets) {
    if (heads.some((head) => sectorContains(target, head))) covered += 1
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
 * Corner-first 3504-PC layout.
 * Every calculation cell is created from four required corner positions.
 * Shared cell corners are one physical head, never duplicate heads.
 * The first accepted stage is 8 m; 9/10 m are expansion options, followed
 * by 7/6/5 m denser grids. Values are Florial geometric planning assumptions.
 */
export function generateRainBird3504Layout(geometry, { sampleStepM = 0.5, candidatePositionOffsets = [] } = {}) {
  const bounds = rectangleBounds(geometry)
  if (!bounds || !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-corner-first-shared-cell-grid-v1',
      status: 'invalid_geometry',
      sprinklers: Object.freeze([]),
      warnings: Object.freeze([]),
    })
  }
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (width <= 0 || height <= 0 || Math.min(width, height) < 5 - EPSILON) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-corner-first-shared-cell-grid-v1',
      status: 'no_usable_rotor_candidates',
      sprinklers: Object.freeze([]),
      warnings: Object.freeze([]),
    })
  }
  const targets = buildTargets(bounds, sampleStepM)
  if (!targets) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      algorithm: '3504pc-corner-first-shared-cell-grid-v1',
      status: 'sampling_limit_exceeded',
      sprinklers: Object.freeze([]),
      warnings: Object.freeze([]),
    })
  }

  let lastAttempt = null
  for (const planningRadiusM of ROTOR_RADII_M) {
    const grid = buildCornerFirstGrid(bounds, planningRadiusM, candidatePositionOffsets)
    if (!grid || grid.heads.length > MAX_SELECTED_ROTORS) continue
    const coverage = evaluateCoverage(grid.heads, targets)
    const headToHeadPassed = grid.headToHeadChecks.length > 0 &&
      grid.headToHeadChecks.every((entry) => entry.passed)
    lastAttempt = { planningRadiusM, grid, coverage, headToHeadPassed }
    if (coverage.uncoveredPoints === 0 && headToHeadPassed) {
      const sprinklers = Object.freeze(grid.heads.map((head, index) => Object.freeze({
        ...head,
        id: 'rotor-3504-' + String(index + 1).padStart(3, '0'),
      })))
      const idMap = new Map(grid.heads.map((head, index) => [head.id, sprinklers[index].id]))
      const cells = Object.freeze(grid.cells.map((cell) => Object.freeze({
        ...cell,
        cornerHeadIds: Object.freeze(cell.cornerHeadIds.map((id) => idMap.get(id))),
      })))
      const checks = Object.freeze(grid.headToHeadChecks.map((entry) => Object.freeze({
        ...entry,
        sprinklerId: idMap.get(entry.sprinklerId),
        neighborId: idMap.get(entry.neighborId),
      })))
      return Object.freeze({
        engineVersion: ENGINE_VERSION,
        algorithm: '3504pc-corner-first-shared-cell-grid-v1',
        status: 'layout_generated',
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
        coverage,
        sprinklers,
        cells,
        grid: Object.freeze({ pitchM: grid.pitchM, columns: grid.columns, rows: grid.rows }),
        headToHead: Object.freeze({
          passed: true,
          applicable: true,
          checks,
        }),
        candidateStats: Object.freeze({
          requiredCornerPositions: grid.heads.length,
          offsetCandidatePositions: grid.heads.filter((head) => candidatePositionOffsets.some((entry) =>
            entry?.from && Number.isFinite(entry.dx) && Number.isFinite(entry.dy) &&
            distance(head.position, { x: entry.from.x + entry.dx, y: entry.from.y + entry.dy }) <= 0.001)).length,
          cellCount: grid.cells.length,
          sharedCellCornersDeduplicated: grid.cells.length * 4 - grid.heads.length,
          selectedRotors: sprinklers.length,
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
    algorithm: '3504pc-corner-first-shared-cell-grid-v1',
    status: 'no_complete_rotor_layout',
    family: '3500',
    model: '3504-PC',
    planningRadiusM: lastAttempt?.planningRadiusM ?? null,
    coverage: lastAttempt?.coverage ?? null,
    sprinklers: Object.freeze([]),
    headToHead: Object.freeze({
      passed: lastAttempt?.headToHeadPassed ?? false,
      applicable: true,
      checks: Object.freeze(lastAttempt?.grid?.headToHeadChecks ?? []),
    }),
    warnings: Object.freeze([
      Object.freeze({ code: 'no_corner_first_3504_pc_grid_passed_coverage_and_head_to_head', path: 'layout' }),
    ]),
  })
}
