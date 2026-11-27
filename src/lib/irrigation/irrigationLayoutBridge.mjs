import { evaluateHeadToHeadSpacing, generateLawnSprinklerLayout, sprinklersMutuallyReach } from './lawnSprinklerLayout.mjs'
import { decomposeOrthogonalRegion } from './orthogonalRectangleDecomposition.mjs'
import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  generateRainBird3504Layout,
  generateRainBird3504PolygonLayout,
} from './rainBird3504Layout.mjs'
import { optimizeGlobalSprinklerSet } from './globalSprinklerOptimization.mjs'
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
const SUPPORTED_STRIP_WIDTHS_M = Object.freeze([1, 2])

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

function buildRvanStripLayout(geometry, shortSideM, connectedEnd = null) {
  const vertices = geometry.regions[0].boundary.vertices
  if (!isRectangle(vertices)) return null
  const widthM = SUPPORTED_STRIP_WIDTHS_M.find((width) => Math.abs(width - shortSideM) <= 1e-8)
  if (!widthM) return null

  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const horizontal = connectedEnd === 'left' || connectedEnd === 'right'
    ? true
    : connectedEnd === 'top' || connectedEnd === 'bottom'
      ? false
      : maxX - minX >= maxY - minY
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
      stripBounds: Object.freeze({ minX, minY, maxX, maxY }),
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


function rectangleGeometry(regionId, bounds) {
  return Object.freeze({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: Object.freeze([Object.freeze({
      id: regionId,
      boundary: Object.freeze({ vertices: Object.freeze([
        Object.freeze({ x: bounds.minX, y: bounds.minY }),
        Object.freeze({ x: bounds.maxX, y: bounds.minY }),
        Object.freeze({ x: bounds.maxX, y: bounds.maxY }),
        Object.freeze({ x: bounds.minX, y: bounds.maxY }),
      ]) }),
      exclusions: Object.freeze([]),
    })]),
  })
}

function rectangleSize(bounds) {
  return {
    widthM: bounds.maxX - bounds.minX,
    heightM: bounds.maxY - bounds.minY,
    shortSideM: Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY),
    lengthM: Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY),
  }
}

function decomposeOrthogonalLShape(vertices) {
  const points = vertices.filter((point, index) =>
    index < vertices.length - 1 ||
    Math.hypot(point.x - vertices[0].x, point.y - vertices[0].y) > 1e-8)
  if (points.length !== 6) return null
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    if (Math.abs(current.x - next.x) > 1e-8 && Math.abs(current.y - next.y) > 1e-8) return null
  }

  let twiceArea = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    twiceArea += current.x * next.y - next.x * current.y
  }
  const orientation = Math.sign(twiceArea) || 1
  let reflex = null
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length]
    const current = points[index]
    const next = points[(index + 1) % points.length]
    const turn = (current.x - previous.x) * (next.y - current.y) -
      (current.y - previous.y) * (next.x - current.x)
    if (turn * orientation < -1e-8) {
      if (reflex) return null
      reflex = current
    }
  }
  if (!reflex) return null

  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const reflexIndex = points.indexOf(reflex)
  const adjacent = [
    points[(reflexIndex - 1 + points.length) % points.length],
    points[(reflexIndex + 1) % points.length],
  ]
  const horizontalNeighbor = adjacent.find((point) => Math.abs(point.y - reflex.y) <= 1e-8)
  const verticalNeighbor = adjacent.find((point) => Math.abs(point.x - reflex.x) <= 1e-8)
  if (!horizontalNeighbor || !verticalNeighbor) return null
  const notchRight = horizontalNeighbor.x > reflex.x
  const notchTop = verticalNeighbor.y > reflex.y

  const main = {
    id: 'main',
    minX: notchRight ? minX : reflex.x,
    maxX: notchRight ? reflex.x : maxX,
    minY,
    maxY,
    connectedEnd: notchTop ? 'bottom' : 'top',
  }
  const arm = {
    id: 'arm',
    minX: notchRight ? reflex.x : minX,
    maxX: notchRight ? maxX : reflex.x,
    minY: notchTop ? minY : reflex.y,
    maxY: notchTop ? reflex.y : maxY,
    connectedEnd: notchRight ? 'left' : 'right',
  }
  const mainSize = rectangleSize(main)
  const armSize = rectangleSize(arm)
  const sumArea = mainSize.widthM * mainSize.heightM + armSize.widthM * armSize.heightM
  const polygonArea = Math.abs(twiceArea / 2)
  if (Math.abs(sumArea - polygonArea) > 1e-6 ||
      mainSize.widthM <= 0 || mainSize.heightM <= 0 ||
      armSize.widthM <= 0 || armSize.heightM <= 0) return null

  return Object.freeze([
    Object.freeze({ ...main, ...mainSize }),
    Object.freeze({ ...arm, ...armSize }),
  ])
}

function connectedStripNeedsSeamHead(lengthM, widthM) {
  const rule = STRIP_MODELS[widthM]
  return Boolean(rule && lengthM > rule.endPairAfterM + 1e-8 &&
    lengthM <= rule.centersAfterM + 1e-8)
}

function inferConnectedStripEnd(strip, rectangles) {
  const horizontal = strip.widthM >= strip.heightM
  for (const other of rectangles) {
    if (other.id === strip.id) continue
    if (horizontal) {
      const overlap = Math.min(strip.maxY, other.maxY) - Math.max(strip.minY, other.minY)
      if (overlap >= strip.heightM - 1e-8 && Math.abs(other.maxX - strip.minX) <= 1e-8) return 'left'
      if (overlap >= strip.heightM - 1e-8 && Math.abs(other.minX - strip.maxX) <= 1e-8) return 'right'
    } else {
      const overlap = Math.min(strip.maxX, other.maxX) - Math.max(strip.minX, other.minX)
      if (overlap >= strip.widthM - 1e-8 && Math.abs(other.maxY - strip.minY) <= 1e-8) return 'bottom'
      if (overlap >= strip.widthM - 1e-8 && Math.abs(other.minY - strip.maxY) <= 1e-8) return 'top'
    }
  }
  return null
}

function connectedStripSeamPoint(bounds, connectedEnd, horizontal) {
  if (horizontal) {
    return {
      x: connectedEnd === 'left' ? bounds.minX : bounds.maxX,
      y: bounds.minY,
    }
  }
  return {
    x: bounds.maxX,
    y: connectedEnd === 'bottom' ? bounds.minY : bounds.maxY,
  }
}

function buildConnectedRvanStripLayout(geometry, shortSideM, connectedEnd) {
  const base = buildRvanStripLayout(geometry, shortSideM, connectedEnd)
  if (!base) return null
  const vertices = geometry.regions[0].boundary.vertices
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const horizontal = connectedEnd === 'left' || connectedEnd === 'right'
  const lengthM = horizontal ? maxX - minX : maxY - minY
  const widthM = shortSideM
  const rule = STRIP_MODELS[widthM]
  const fixedSide = horizontal ? minY : maxX
  const makePosition = (axisValue) => horizontal
    ? { x: axisValue, y: fixedSide }
    : { x: fixedSide, y: axisValue }
  const connectedAtMin = horizontal ? connectedEnd === 'left' : connectedEnd === 'bottom'
  const freeAtMax = connectedAtMin
  const heads = []
  const addAt = (model, axisValue, direction, reachM) => {
    const point = findRainBirdRvanPerformancePoint(model, RECOMMENDED_NOZZLE_PRESSURE_BAR, null)
    if (!point) return false
    heads.push(Object.freeze({
      id: 's' + String(heads.length + 1).padStart(5, '0'),
      position: Object.freeze(makePosition(axisValue)),
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
      stripBounds: Object.freeze({ minX, minY, maxX, maxY }),
    }))
    return true
  }

  const freeEndModel = horizontal
    ? (freeAtMax ? 'R-VAN-RCS' : 'R-VAN-LCS')
    : (freeAtMax ? 'R-VAN-LCS' : 'R-VAN-RCS')
  const freeEndAxis = freeAtMax ? (horizontal ? maxX : maxY) : (horizontal ? minX : minY)
  const freeEndDirection = horizontal
    ? (freeAtMax ? 'left' : 'right')
    : (freeAtMax ? 'down' : 'up')
  if (!addAt(freeEndModel, freeEndAxis, freeEndDirection, rule.endReachM)) return null

  if (lengthM > rule.centersAfterM + 1e-8) {
    const maxFromConnected = lengthM - rule.endReachM
    const offsets = []
    for (let offset = rule.centerSpacingM; offset <= maxFromConnected + 1e-8; offset += rule.centerSpacingM) {
      offsets.push(offset)
    }
    if (!offsets.length && maxFromConnected > 0) offsets.push(maxFromConnected)
    for (const offset of offsets) {
      const axisValue = connectedAtMin
        ? (horizontal ? minX : minY) + offset
        : (horizontal ? maxX : maxY) - offset
      if (!addAt('R-VAN-SST', axisValue, 'both', rule.centerReachM)) return null
    }
  } else if (lengthM > rule.endPairAfterM + 1e-8) {
    const connectedModel = horizontal
      ? (connectedAtMin ? 'R-VAN-LCS' : 'R-VAN-RCS')
      : (connectedAtMin ? 'R-VAN-RCS' : 'R-VAN-LCS')
    const connectedAxis = connectedAtMin
      ? (horizontal ? minX : minY)
      : (horizontal ? maxX : maxY)
    const connectedDirection = horizontal
      ? (connectedAtMin ? 'right' : 'left')
      : (connectedAtMin ? 'up' : 'down')
    if (!addAt(connectedModel, connectedAxis, connectedDirection, rule.endReachM)) return null
  }

  const modelSet = [...new Set(heads.map((head) => head.performanceModel))].sort()
  return Object.freeze({
    ...base,
    algorithm: 'owner-defined-rvan-connected-lcs-rcs-sst-strip-placement-v1',
    model: modelSet.join(' / '),
    sprinklers: Object.freeze(heads),
    warnings: Object.freeze([
      ...base.warnings.filter((warning) =>
        warning.code !== 'owner_defined_rvan_strip_pattern_not_sampled_as_circular_coverage'),
      Object.freeze({ code: 'connected_strip_end_is_covered_from_the_strip_interior', path: 'layout.sprinklers' }),
      Object.freeze({ code: 'owner_defined_rvan_strip_pattern_not_sampled_as_circular_coverage', path: 'layout.coverage' }),
    ]),
  })
}

function pointOnPolygonSegment(point, a, b) {
  const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
  if (Math.abs(cross) > 1e-7) return false
  return point.x >= Math.min(a.x, b.x) - 1e-7 &&
    point.x <= Math.max(a.x, b.x) + 1e-7 &&
    point.y >= Math.min(a.y, b.y) - 1e-7 &&
    point.y <= Math.max(a.y, b.y) + 1e-7
}

function pointInPolygon(point, vertices) {
  let inside = false
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    if (pointOnPolygonSegment(point, a, b)) return true
    if ((a.y > point.y) !== (b.y > point.y)) {
      const intersectionX = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (point.x < intersectionX) inside = !inside
    }
  }
  return inside
}

function pointOnRingBoundary(point, vertices) {
  return vertices.some((a, index) =>
    pointOnPolygonSegment(point, a, vertices[(index + 1) % vertices.length]))
}

function pointInIrrigatedGeometry(point, geometry) {
  const region = geometry?.regions?.[0]
  if (!region || !pointInPolygon(point, region.boundary.vertices)) return false
  return !(region.exclusions ?? []).some((exclusion) =>
    pointInPolygon(point, exclusion.polygon.vertices) &&
    !pointOnRingBoundary(point, exclusion.polygon.vertices))
}

function sampleRectangleInsideGeometry(bounds, geometry, stepM = 0.2) {
  const xSteps = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / stepM))
  const ySteps = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / stepM))
  for (let yIndex = 0; yIndex <= ySteps; yIndex += 1) {
    const y = bounds.minY + (bounds.maxY - bounds.minY) * yIndex / ySteps
    for (let xIndex = 0; xIndex <= xSteps; xIndex += 1) {
      const x = bounds.minX + (bounds.maxX - bounds.minX) * xIndex / xSteps
      if (!pointInIrrigatedGeometry({ x, y }, geometry)) return false
    }
  }
  return true
}

function evaluateCompositeOverspray(sprinklers, parts, originalGeometry) {
  const stripPartByHeadId = new Map()
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]
    if (!part.isStrip) continue
    for (const head of part.layout.sprinklers) {
      stripPartByHeadId.set('z' + (index + 1) + '-' + head.id, part)
    }
  }

  for (const head of sprinklers) {
    if (head.pattern === 'strip') {
      const part = stripPartByHeadId.get(head.id) ?? head.stripBounds
      if (!part) return false
      const bounds = part
      const horizontal = head.stripAxis === 'horizontal'
      const reach = head.stripLengthM
      let footprint
      if (horizontal) {
        const halfReach = reach / 2
        const minX = head.stripDirection === 'left' ? head.position.x - reach
          : head.stripDirection === 'right' ? head.position.x
            : head.position.x - halfReach
        const maxX = head.stripDirection === 'left' ? head.position.x
          : head.stripDirection === 'right' ? head.position.x + reach
            : head.position.x + halfReach
        footprint = { minX, maxX, minY: bounds.minY, maxY: bounds.maxY }
      } else {
        const halfReach = reach / 2
        const minY = head.stripDirection === 'up' ? head.position.y
          : head.stripDirection === 'down' ? head.position.y - reach
            : head.position.y - halfReach
        const maxY = head.stripDirection === 'up' ? head.position.y + reach
          : head.stripDirection === 'down' ? head.position.y
            : head.position.y + halfReach
        footprint = { minX: bounds.minX, maxX: bounds.maxX, minY, maxY }
      }
      if (!sampleRectangleInsideGeometry(footprint, originalGeometry)) return false
      continue
    }

    const arc = head.arcDeg ?? 360
    const start = arc === 360 ? 0 : (head.directionDeg ?? 0) - arc / 2
    const angleStep = 1
    const radialStep = 0.2
    for (let angleOffset = 0; angleOffset <= arc + 1e-8; angleOffset += angleStep) {
      const angle = (start + angleOffset) * Math.PI / 180
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      for (let distanceM = 0; distanceM <= head.radiusM + 1e-8; distanceM += radialStep) {
        const point = {
          x: head.position.x + dx * Math.min(distanceM, head.radiusM),
          y: head.position.y + dy * Math.min(distanceM, head.radiusM),
        }
        if (!pointInIrrigatedGeometry(point, originalGeometry)) return false
      }
    }
  }
  return true
}

 
function finalizeSingleRegionLayout(layout, geometry, sampleStepM, regionId) {
  const isCornerFirstLShape = layout.geometry?.shape === 'l-shape'
  const globalSectorTargets = isCornerFirstLShape ? null : buildIrrigatedTargets(geometry, sampleStepM)
  // Do not globally reorient or minimize a corner-first L-shape result: the
  // polygon solver has already selected its sectors against the full outline.
  const sectorExpansion = isCornerFirstLShape
    ? Object.freeze({ sprinklers: layout.sprinklers, edits: Object.freeze([]) })
    : maximizeRotorSectors(layout.sprinklers, [], geometry, globalSectorTargets)
  const sectorAdjustedLayout = Object.freeze({
    ...layout,
    sprinklers: sectorExpansion.sprinklers,
    sectorOptimization: sectorExpansion,
  })
  const isStrip = sectorAdjustedLayout.sprinklers.some((head) => head.pattern === 'strip')
  const onlyStrip = isStrip && sectorAdjustedLayout.sprinklers.every((head) => head.pattern === 'strip')
  const part = { id: regionId, isStrip, layout: sectorAdjustedLayout }
  const heads = sectorAdjustedLayout.sprinklers.map((head) => Object.freeze({
    ...head,
    calculationRegionId: regionId,
  }))
  const optimization = isCornerFirstLShape
    ? Object.freeze({
      status: 'skipped_l_shape_corner_first',
      coverage: null,
      headToHead: layout.headToHead,
      oversprayPassed: true,
      removedHeadIds: Object.freeze([]),
      consolidatedGroups: Object.freeze([]),
      sectorEdits: Object.freeze([]),
      sectorVariants: Object.freeze([]),
      sectorVariantLimitReached: false,
    })
    : optimizeGlobalSprinklerSet({
      sprinklers: heads,
      geometry,
      parts: [part],
      sampleStepM,
      oversprayCheck: (candidateHeads) => newlyOpenedFullCircleClearancePassed(candidateHeads, heads) &&
        evaluateCompositeOverspray(candidateHeads, [part], geometry),
    })
  const finalHeads = optimization.status === 'completed'
    ? optimization.sprinklers
    : heads
  const warnings = [...(sectorAdjustedLayout.warnings ?? [])]
  if (optimization.status === 'skipped_l_shape_corner_first') {
    warnings.push(Object.freeze({ code: 'global_head_minimization_skipped_to_preserve_corner_first_l_shape_order', path: 'layout.globalOptimization' }))
  } else if (optimization.status === 'skipped_target_limit') {
    warnings.push(Object.freeze({ code: 'global_head_minimization_skipped_target_limit', path: 'layout.globalOptimization' }))
  } else if (optimization.status === 'baseline_failed' ||
      optimization.status === 'final_validation_failed') {
    warnings.push(Object.freeze({ code: 'global_head_minimization_baseline_validation_failed', path: 'layout.globalOptimization' }))
  } else {
    warnings.push(Object.freeze({ code: 'global_head_minimization_completed', path: 'layout.globalOptimization' }))
  }
  if (optimization.sectorVariantLimitReached) {
    warnings.push(Object.freeze({ code: 'global_sector_optimization_variant_limit_reached', path: 'layout.globalOptimization' }))
  }
  const globalFailed = optimization.status === 'baseline_failed' ||
    optimization.status === 'final_validation_failed'
  const coverage = optimization.coverage
    ? Object.freeze({ ...optimization.coverage, validationScope: 'global_sampled_geometry' })
    : Object.freeze({
      ...(layout.coverage ?? {}),
      validationScope: isCornerFirstLShape ? 'whole_l_shape_solver_sampled_geometry' : 'per_rectangle_only_global_check_skipped',
    })
  const overspray = isCornerFirstLShape
    ? 'sampled_inside_boundary'
    : optimization.status === 'completed'
      ? 'sampled_inside_boundary'
    : (optimization.status === 'baseline_failed' || optimization.status === 'final_validation_failed')
      ? (optimization.oversprayPassed ? 'sampled_inside_boundary' : 'sampled_outside_boundary')
      : (layout.overspray ?? 'not_evaluated')
  return Object.freeze({
    ...sectorAdjustedLayout,
    status: globalFailed ? 'coverage_incomplete' : sectorAdjustedLayout.status,
    sprinklers: Object.freeze(finalHeads),
    coverage,
    headToHead: onlyStrip ? layout.headToHead : (optimization.headToHead ?? layout.headToHead),
    fullCircleRotorSpacing: Object.freeze({
      passed: fullCircleRotorClearancePassed(finalHeads),
      minimumDistanceM: 6,
    }),
    overspray,
    coverageScope: optimization.status === 'skipped_l_shape_corner_first'
      ? 'whole_l_shape_solver_sampled_geometry'
      : optimization.status === 'skipped_target_limit'
        ? 'per_rectangle_sampled_global_optimization_skipped'
      : (onlyStrip ? 'owner_defined_strip_pattern_global_sampled' : 'global_sampled_geometry'),
    sectorOptimization: Object.freeze({
      strategy: 'maximum-safe-3504pc-arc-before-final-removal',
      minimumFullCircleRotorSeparationM: 6,
      edits: sectorExpansion.edits,
    }),
    globalOptimization: Object.freeze({
      status: optimization.status,
      targetCount: optimization.targetCount,
      baseline: optimization.baseline ?? null,
      optimized: optimization.optimized ?? null,
      removedHeadIds: optimization.removedHeadIds,
      consolidatedGroups: optimization.consolidatedGroups,
      sectorEdits: optimization.sectorEdits,
      sectorVariants: optimization.sectorVariants,
      sectorVariantLimitReached: optimization.sectorVariantLimitReached,
      failure: optimization.failure ?? null,
    }),
    warnings: Object.freeze(warnings),
  })
}


function sprinklerCoversPoint(head, point) {
  if (head.pattern === 'strip' && head.stripBounds) {
    const bounds = head.stripBounds
    if (point.x < bounds.minX - 1e-8 || point.x > bounds.maxX + 1e-8 ||
        point.y < bounds.minY - 1e-8 || point.y > bounds.maxY + 1e-8) return false
    if (head.stripAxis === 'horizontal') {
      if (head.stripDirection === 'left') return point.x <= head.position.x + 1e-8 &&
        point.x >= head.position.x - head.stripLengthM - 1e-8
      if (head.stripDirection === 'right') return point.x >= head.position.x - 1e-8 &&
        point.x <= head.position.x + head.stripLengthM + 1e-8
      return Math.abs(point.x - head.position.x) <= head.stripLengthM / 2 + 1e-8
    }
    if (head.stripDirection === 'up') return point.y >= head.position.y - 1e-8 &&
      point.y <= head.position.y + head.stripLengthM + 1e-8
    if (head.stripDirection === 'down') return point.y <= head.position.y + 1e-8 &&
      point.y >= head.position.y - head.stripLengthM - 1e-8
    return Math.abs(point.y - head.position.y) <= head.stripLengthM / 2 + 1e-8
  }
  if (!Number.isFinite(head.radiusM)) return false
  const dx = point.x - head.position.x
  const dy = point.y - head.position.y
  if (Math.hypot(dx, dy) > head.radiusM + 1e-8) return false
  const arc = head.arcDeg ?? 360
  if (arc >= 360) return true
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360
  const direction = ((head.directionDeg ?? 0) % 360 + 360) % 360
  const difference = Math.abs(((angle - direction + 540) % 360) - 180)
  return difference <= arc / 2 + 1e-8
}

function rectangleCoverageByPreviousHeads(part, heads, sampleStepM) {
  const width = part.maxX - part.minX
  const height = part.maxY - part.minY
  const columns = Math.max(1, Math.ceil(width / sampleStepM))
  const rows = Math.max(1, Math.ceil(height / sampleStepM))
  let coveredPoints = 0
  const contributing = new Set()
  for (let row = 0; row <= rows; row += 1) {
    const y = part.minY + (part.maxY - part.minY) * row / rows
    for (let column = 0; column <= columns; column += 1) {
      const x = part.minX + (part.maxX - part.minX) * column / columns
      const point = { x, y }
      const covering = heads.filter((head) => sprinklerCoversPoint(head, point))
      if (covering.length) {
        coveredPoints += 1
        covering.forEach((head) => contributing.add(head.id))
      }
    }
  }
  const sampledPoints = (columns + 1) * (rows + 1)
  return Object.freeze({
    sampledPoints,
    coveredPoints,
    uncoveredPoints: sampledPoints - coveredPoints,
    coveragePercent: sampledPoints ? coveredPoints / sampledPoints * 100 : 0,
    headIds: Object.freeze([...contributing].sort()),
  })
}

function buildPreviouslyCoveredRectangleLayout(coverage) {
  return Object.freeze({
    engineVersion: '0.7.0',
    status: 'coverage_complete_sampled',
    family: 'shared',
    model: 'covered-by-previous-sprinklers',
    algorithm: 'sequential-largest-rectangle-shared-coverage-v1',
    sprinklers: Object.freeze([]),
    coverage: Object.freeze({
      sampledPoints: coverage.sampledPoints,
      coveredPoints: coverage.coveredPoints,
      uncoveredPoints: 0,
      coveragePercent: 100,
      uncoveredSamples: Object.freeze([]),
    }),
    headToHead: Object.freeze({ passed: true, applicable: false, checks: Object.freeze([]) }),
    warnings: Object.freeze([
      Object.freeze({ code: 'rectangle_already_covered_by_previous_sprinklers', path: 'layout.sprinklers' }),
    ]),
  })
}

function buildIrrigatedTargets(geometry, sampleStepM) {
  const vertices = geometry?.regions?.[0]?.boundary?.vertices
  if (!Array.isArray(vertices) || vertices.length < 4) return null
  const minX = Math.min(...vertices.map((point) => point.x))
  const maxX = Math.max(...vertices.map((point) => point.x))
  const minY = Math.min(...vertices.map((point) => point.y))
  const maxY = Math.max(...vertices.map((point) => point.y))
  const columns = Math.max(1, Math.ceil((maxX - minX) / sampleStepM))
  const rows = Math.max(1, Math.ceil((maxY - minY) / sampleStepM))
  if ((columns + 1) * (rows + 1) > 30000) return null
  const targets = []
  const seen = new Set()
  const add = (point) => {
    if (!pointInIrrigatedGeometry(point, geometry)) return true
    const key = point.x.toFixed(6) + ':' + point.y.toFixed(6)
    if (seen.has(key)) return true
    seen.add(key)
    targets.push(Object.freeze({ x: point.x, y: point.y }))
    return targets.length <= 30000
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = minY + (maxY - minY) * row / rows
    for (let column = 0; column <= columns; column += 1) {
      const x = minX + (maxX - minX) * column / columns
      if (!add({ x, y })) return null
    }
  }
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const divisions = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / sampleStepM))
    for (let part = 0; part <= divisions; part += 1) {
      const ratio = part / divisions
      if (!add({ x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio })) return null
    }
  }
  return Object.freeze(targets)
}

function fullCircleRotorClearancePassed(heads, minimumDistanceM = 6) {
  const rotors = heads.filter((head) =>
    head.pattern === 'rotor' && head.performanceModel === '3504-PC')
  for (const fullCircle of rotors.filter((head) => head.arcDeg === 360)) {
    for (const other of rotors) {
      if (other.id === fullCircle.id) continue
      if (Math.hypot(fullCircle.position.x - other.position.x,
        fullCircle.position.y - other.position.y) < minimumDistanceM - 1e-8) return false
    }
  }
  return true
}

function newlyOpenedFullCircleClearancePassed(candidateHeads, originalHeads, minimumDistanceM = 6) {
  const originalFullCircleIds = new Set(originalHeads
    .filter((head) => head.pattern === 'rotor' && head.performanceModel === '3504-PC' &&
      head.arcDeg === 360)
    .map((head) => head.id))
  const rotors = candidateHeads.filter((head) =>
    head.pattern === 'rotor' && head.performanceModel === '3504-PC')
  for (const fullCircle of rotors.filter((head) =>
    head.arcDeg === 360 && !originalFullCircleIds.has(head.id))) {
    for (const other of rotors) {
      if (other.id === fullCircle.id) continue
      if (Math.hypot(fullCircle.position.x - other.position.x,
        fullCircle.position.y - other.position.y) < minimumDistanceM - 1e-8) return false
    }
  }
  return true
}

function newSectorEdgeFits(head, directionOffsetDeg, geometry) {
  const angle = ((head.directionDeg + directionOffsetDeg) * Math.PI) / 180
  for (let distanceM = 0; distanceM <= head.radiusM + 1e-8; distanceM += 0.2) {
    const point = {
      x: head.position.x + Math.cos(angle) * Math.min(distanceM, head.radiusM),
      y: head.position.y + Math.sin(angle) * Math.min(distanceM, head.radiusM),
    }
    if (!pointInIrrigatedGeometry(point, geometry)) return false
  }
  return true
}

function sectorExpansionFits(head, currentArcDeg, nextArcDeg, geometry) {
  const from = currentArcDeg / 2
  const to = nextArcDeg / 2
  for (let offset = from + 0.25; offset <= to + 1e-8; offset += 0.25) {
    if (!newSectorEdgeFits(head, offset, geometry) ||
        !newSectorEdgeFits(head, -offset, geometry)) return false
  }
  return true
}

function headToHeadRelationshipsRemainValid(beforeHeads, candidate) {
  const afterHeads = beforeHeads.map((head) => head.id === candidate.id ? candidate : head)
  for (const head of beforeHeads) {
    const hadNeighbor = beforeHeads.some((other) =>
      other.id !== head.id && sprinklersMutuallyReach(head, other))
    if (!hadNeighbor) continue
    const updated = afterHeads.find((other) => other.id === head.id)
    const stillHasNeighbor = afterHeads.some((other) =>
      other.id !== updated.id && sprinklersMutuallyReach(updated, other))
    if (!stillHasNeighbor) return false
  }
  return true
}

function maximizeRotorSectors(sprinklers, otherHeads, geometry, globalTargets = null) {
  let current = sprinklers.slice()
  const edits = []
  for (const original of sprinklers) {
    if (original.performanceModel !== '3504-PC' || original.pattern !== 'rotor' ||
        !Number.isFinite(original.directionDeg) || !Number.isFinite(original.arcDeg) ||
        original.arcDeg >= 360) continue
    const currentHead = current.find((head) => head.id === original.id)
    if (!currentHead) continue

    const combinedBefore = [
      ...otherHeads.filter((head) => head.id !== currentHead.id),
      ...current.filter((head) => head.id !== currentHead.id),
      currentHead,
    ]
    const others = combinedBefore.filter((head) => head.id !== currentHead.id)
    const uncoveredTargets = globalTargets
      ? globalTargets.filter((point) => !others.some((head) => sprinklerCoversPoint(head, point)))
      : []

    let best = currentHead
    let bestDirectionDelta = 0
    if (!globalTargets) {
      // Keep the safe fixed-direction expansion available when the global
      // target mesh is above its deterministic cap.
      for (let arcDeg = Math.floor(best.arcDeg + 1e-8) + 1; arcDeg <= 360; arcDeg += 1) {
        if (!sectorExpansionFits(best, best.arcDeg, arcDeg, geometry)) break
        const candidate = Object.freeze({ ...best, arcDeg })
        const candidateHeads = [...others, candidate]
        if (arcDeg === 360 && !fullCircleRotorClearancePassed(candidateHeads)) break
        best = candidate
      }
    } else if (uncoveredTargets.length) {
      const directionOffsets = [-90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90]
      for (const offset of directionOffsets) {
        const directionDeg = (currentHead.directionDeg + offset + 360) % 360
        const template = Object.freeze({ ...currentHead, directionDeg, arcDeg: 0 })
        if (!newSectorEdgeFits(template, 0, geometry)) continue
        let safeArc = 0
        for (let arcDeg = 1; arcDeg <= 360; arcDeg += 1) {
          if (!sectorExpansionFits(template, safeArc, arcDeg, geometry)) break
          safeArc = arcDeg
        }
        if (safeArc <= currentHead.arcDeg || safeArc < best.arcDeg) continue
        const candidate = Object.freeze({
          ...currentHead,
          arcDeg: safeArc,
          directionDeg: safeArc === 360 ? null : directionDeg,
        })
        const candidateHeads = combinedBefore.map((head) =>
          head.id === candidate.id ? candidate : head)
        if (safeArc === 360 && !fullCircleRotorClearancePassed(candidateHeads)) continue
        if (!uncoveredTargets.every((point) => sprinklerCoversPoint(candidate, point))) continue
        if (!headToHeadRelationshipsRemainValid(combinedBefore, candidate)) continue
        const directionDelta = Math.abs(((directionDeg - currentHead.directionDeg + 540) % 360) - 180)
        if (safeArc > best.arcDeg ||
            (safeArc === best.arcDeg && directionDelta < bestDirectionDelta)) {
          best = candidate
          bestDirectionDelta = directionDelta
        }
      }
    }

    if (best.arcDeg > currentHead.arcDeg) {
      current = current.map((head) => head.id === best.id ? best : head)
      edits.push(Object.freeze({
        sprinklerId: best.id,
        fromArcDeg: currentHead.arcDeg,
        toArcDeg: best.arcDeg,
        fromDirectionDeg: currentHead.directionDeg,
        toDirectionDeg: best.directionDeg,
      }))
    }
  }
  return Object.freeze({ sprinklers: Object.freeze(current), edits: Object.freeze(edits) })
}

function rectangleRotorLayout(rectGeometry, part, sampleStepM, initialSprinklers = []) {
  if (part.shortSideM < 6 - 1e-8) return null
  const candidate = generateRainBird3504Layout(rectGeometry, { sampleStepM, initialSprinklers })
  if (candidate.status !== 'layout_generated' || candidate.coverage?.uncoveredPoints !== 0) return null
  const checks = candidate.sprinklers.length > 1
    ? evaluateHeadToHeadSpacing(candidate.sprinklers)
    : []
  if (checks.some((entry) => !entry.passed)) return null
  return Object.freeze({
    ...candidate,
    engineVersion: '0.7.0',
    algorithm: 'area-descending-sequential-shared-coverage-3504pc-first-rvan-fallback-max-safe-arc-v2',
    status: 'coverage_complete_sampled',
    coverageScope: 'sampled_geometry_only',
    family: '3500',
    model: '3504-PC',
    pressureBar: null,
    sampleStepM,
    geometry: Object.freeze({
      regionId: rectGeometry.regions[0].id,
      shape: 'rectangle',
      areaM2: part.shortSideM * part.lengthM,
    }),
    headToHead: Object.freeze({
      passed: checks.length ? checks.every((entry) => entry.passed) : null,
      applicable: checks.length > 0,
      checks: Object.freeze(checks),
    }),
    overspray: 'sampled_inside_boundary',
    warnings: Object.freeze([
      ...candidate.warnings,
      Object.freeze({ code: 'rectangle_fully_served_by_3504pc_before_rvan_fallback', path: 'layout.sprinklers' }),
    ]),
  })
}

function inwardSeamOffset(bounds, seam, offsetM = 0.075) {
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }
  const dx = center.x - seam.x
  const dy = center.y - seam.y
  const length = Math.hypot(dx, dy)
  if (length <= 1e-8) return null
  return Object.freeze({ from: seam, dx: dx / length * offsetM, dy: dy / length * offsetM })
}

function buildDecomposedLShapeLayout(geometry, validation, parts, pressureBar, sampleStepM, shortSideM, initialHeads = []) {
  const orderedParts = parts.slice().sort((a, b) =>
    (b.shortSideM * b.lengthM) - (a.shortSideM * a.lengthM) ||
    b.shortSideM - a.shortSideM || b.lengthM - a.lengthM ||
    a.minY - b.minY || a.minX - b.minX)
  const stripParts = orderedParts.filter((part) => SUPPORTED_STRIP_WIDTHS_M.some((width) =>
    Math.abs(part.shortSideM - width) <= 1e-8))
  const prepared = orderedParts.map((part) => {
    const isStrip = stripParts.includes(part)
    const rectGeometry = rectangleGeometry('lawn-' + part.id, part)
    const layout = isStrip
      ? (part.connectedEnd
        ? buildConnectedRvanStripLayout(rectGeometry, part.shortSideM, part.connectedEnd)
        : buildRvanStripLayout(rectGeometry, part.shortSideM))
      : null
    return { ...part, isStrip, rectGeometry, layout, candidatePositionOffsets: [] }
  })

  const seamHeadParts = prepared.filter((part) => part.isStrip &&
    connectedStripNeedsSeamHead(part.lengthM, part.shortSideM))
  if (seamHeadParts.length > 1) {
    return result('layout_incomplete', {
      shortSideM,
      reason: 'adjacent_short_strip_arms_require_conflicting_heads_at_the_shared_corner',
      warnings: Object.freeze([{ code: 'manual_engineering_review_required_at_shared_strip_corner', path: 'geometry' }]),
    })
  }

  for (const stripPart of seamHeadParts) {
    const seam = connectedStripSeamPoint(stripPart, stripPart.connectedEnd,
      stripPart.connectedEnd === 'left' || stripPart.connectedEnd === 'right')
    const adjacentRectangle = prepared.find((part) => !part.isStrip &&
      seam.x >= part.minX - 1e-8 && seam.x <= part.maxX + 1e-8 &&
      seam.y >= part.minY - 1e-8 && seam.y <= part.maxY + 1e-8 &&
      (Math.abs(seam.x - part.minX) <= 1e-8 || Math.abs(seam.x - part.maxX) <= 1e-8 ||
       Math.abs(seam.y - part.minY) <= 1e-8 || Math.abs(seam.y - part.maxY) <= 1e-8))
    if (adjacentRectangle) {
      const offset = inwardSeamOffset(adjacentRectangle, seam, 0.075)
      if (offset) adjacentRectangle.candidatePositionOffsets.push(offset)
    }
  }

  const globalSectorTargets = buildIrrigatedTargets(geometry, sampleStepM)
  const previouslyPlacedHeads = initialHeads.slice()
  for (const part of prepared) {
    if (part.isStrip) {
      if (!part.layout) {
        return result('layout_incomplete', {
          shortSideM,
          reason: 'connected_strip_pattern_not_available',
          warnings: Object.freeze([{ code: 'connected_strip_pattern_not_available', path: 'geometry' }]),
        })
      }
      part.previousCoverage = rectangleCoverageByPreviousHeads(part, previouslyPlacedHeads, sampleStepM)
      if (part.previousCoverage.uncoveredPoints === 0) {
        part.layout = buildPreviouslyCoveredRectangleLayout(part.previousCoverage)
      } else {
        previouslyPlacedHeads.push(...part.layout.sprinklers.map((head) => Object.freeze({
          ...head, id: part.id + '-' + head.id,
        })))
      }
      continue
    }

    const previousCoverage = rectangleCoverageByPreviousHeads(part, previouslyPlacedHeads, sampleStepM)
    part.previousCoverage = previousCoverage
    if (previousCoverage.uncoveredPoints === 0) {
      part.layout = buildPreviouslyCoveredRectangleLayout(previousCoverage)
    } else {
      const rotorLayout = rectangleRotorLayout(part.rectGeometry, part, sampleStepM, previouslyPlacedHeads)
      if (rotorLayout) {
        part.layout = rotorLayout
      } else {
        const selected = selectRvanModel(part.shortSideM)
        part.layout = generateLawnSprinklerLayout({
          geometry: part.rectGeometry,
          family: 'R-VAN',
          model: selected.model,
          pressureBar,
          sampleStepM,
          radiusM: selected.radiusM,
          preventOverspray: true,
          candidatePositionOffsets: part.candidatePositionOffsets,
          initialSprinklers: previouslyPlacedHeads,
          sprayBoundaryGeometry: geometry,
        })
      }
    }
    if (!['coverage_complete_sampled', 'coverage_incomplete'].includes(part.layout.status)) {
      return result('layout_incomplete', {
        shortSideM,
        reason: 'rectangular_zone_layout_not_available',
        layout: part.layout,
        warnings: Object.freeze([{ code: 'rectangular_zone_layout_not_available', path: 'geometry' }]),
      })
    }
    if (part.layout.sprinklers.length) {
      const expanded = maximizeRotorSectors(part.layout.sprinklers, previouslyPlacedHeads, geometry, globalSectorTargets)
      part.layout = Object.freeze({
        ...part.layout,
        sprinklers: expanded.sprinklers,
        sectorOptimization: expanded,
      })
    }
    previouslyPlacedHeads.push(...part.layout.sprinklers.map((head) => Object.freeze({
      ...head, id: part.id + '-' + head.id,
    })))
  }

  // Final whole-layout pass: optimize every head against the complete set,
  // using globally unique working IDs while retaining local IDs in each part.
  let finalWorkingHeads = [
    ...initialHeads,
    ...prepared.flatMap((part, index) => part.layout.sprinklers.map((head) => Object.freeze({
      ...head, id: 'z' + (index + 1) + '-' + head.id,
    }))),
  ]
  const finalSectorEdits = []
  for (const head of finalWorkingHeads.slice()) {
    const others = finalWorkingHeads.filter((entry) => entry.id !== head.id)
    const expanded = maximizeRotorSectors([head], others, geometry, globalSectorTargets)
    const next = expanded.sprinklers[0]
    if (!next || next.arcDeg === head.arcDeg) continue
    finalWorkingHeads = finalWorkingHeads.map((entry) => entry.id === head.id ? next : entry)
    finalSectorEdits.push(...expanded.edits)
  }
  for (let index = 0; index < prepared.length; index += 1) {
    const prefix = 'z' + (index + 1) + '-'
    const updated = finalWorkingHeads.filter((head) => head.id.startsWith(prefix))
      .map((head) => Object.freeze({ ...head, id: head.id.slice(prefix.length) }))
    prepared[index].layout = Object.freeze({
      ...prepared[index].layout,
      sprinklers: Object.freeze(updated),
      finalSectorOptimization: Object.freeze({ edits: Object.freeze(finalSectorEdits.filter((edit) =>
        edit.sprinklerId.startsWith(prefix))) }),
    })
  }

  let allHeads = initialHeads.slice()
  const sampledCoverage = { sampledPoints: 0, coveredPoints: 0, uncoveredPoints: 0 }
  let modelSet = new Set(initialHeads.map((head) => head.performanceModel))
  const layoutWarnings = []
  let circularCoverageComplete = true
  for (let index = 0; index < prepared.length; index += 1) {
    const part = prepared[index]
    for (const head of part.layout.sprinklers) {
      const prefixed = Object.freeze({ ...head, id: 'z' + (index + 1) + '-' + head.id, calculationRegionId: part.id })
      allHeads.push(prefixed)
      modelSet.add(prefixed.performanceModel)
    }
    if (!part.isStrip) {
      sampledCoverage.sampledPoints += part.layout.coverage?.sampledPoints ?? 0
      sampledCoverage.coveredPoints += part.layout.coverage?.coveredPoints ?? 0
      sampledCoverage.uncoveredPoints += part.layout.coverage?.uncoveredPoints ?? 0
      if (part.layout.status !== 'coverage_complete_sampled') circularCoverageComplete = false
    }
    layoutWarnings.push(...(part.layout.warnings ?? []).filter((warning) =>
      warning.code !== 'overspray_not_evaluated'))
  }

  let fullCircleSpacingPassed = fullCircleRotorClearancePassed(allHeads)
  let oversprayPassed = evaluateCompositeOverspray(allHeads, prepared, geometry)
  const localHeadToHeadChecks = prepared.filter((part) => !part.isStrip && part.layout.sprinklers.length > 1)
    .flatMap((part) => evaluateHeadToHeadSpacing(part.layout.sprinklers))
  const crossRegionChecks = []
  for (let first = 0; first < prepared.length; first += 1) {
    const firstHeads = prepared[first].layout.sprinklers.filter((head) =>
      head.pattern !== 'strip' && Number.isFinite(head.radiusM))
    for (let second = first + 1; second < prepared.length; second += 1) {
      const secondHeads = prepared[second].layout.sprinklers.filter((head) =>
        head.pattern !== 'strip' && Number.isFinite(head.radiusM))
      for (const a of firstHeads) for (const b of secondHeads) {
        const separation = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y)
        if (separation > 0.05 && separation <= Math.min(a.radiusM, b.radiusM) + 1e-8 &&
            sprinklersMutuallyReach(a, b)) {
          crossRegionChecks.push(Object.freeze({
            sprinklerId: a.id,
            neighborId: b.id,
            separationM: separation,
            passed: true,
          }))
        }
      }
    }
  }
  let headToHeadChecks = [...localHeadToHeadChecks, ...crossRegionChecks]
  let headToHeadPassed = headToHeadChecks.length
    ? headToHeadChecks.every((entry) => entry.passed)
    : null

  const globalOptimization = optimizeGlobalSprinklerSet({
    sprinklers: allHeads,
    geometry,
    parts: prepared,
    sampleStepM,
    oversprayCheck: (heads) => newlyOpenedFullCircleClearancePassed(heads, allHeads) &&
      evaluateCompositeOverspray(heads, prepared, geometry),
  })
  if (globalOptimization.status === 'completed') {
    allHeads = [...globalOptimization.sprinklers]
    oversprayPassed = globalOptimization.oversprayPassed
    sampledCoverage.sampledPoints = globalOptimization.coverage.sampledPoints
    sampledCoverage.coveredPoints = globalOptimization.coverage.coveredPoints
    sampledCoverage.uncoveredPoints = globalOptimization.coverage.uncoveredPoints
    circularCoverageComplete = globalOptimization.coverage.uncoveredPoints === 0
    headToHeadChecks = [...(globalOptimization.headToHead?.checks ?? [])]
    headToHeadPassed = globalOptimization.headToHead?.passed ?? null
  } else if (globalOptimization.status === 'baseline_failed' ||
      globalOptimization.status === 'final_validation_failed') {
    sampledCoverage.sampledPoints = globalOptimization.coverage?.sampledPoints ?? sampledCoverage.sampledPoints
    sampledCoverage.coveredPoints = globalOptimization.coverage?.coveredPoints ?? sampledCoverage.coveredPoints
    sampledCoverage.uncoveredPoints = globalOptimization.coverage?.uncoveredPoints ?? sampledCoverage.uncoveredPoints
    circularCoverageComplete = globalOptimization.coverage
      ? globalOptimization.coverage.uncoveredPoints === 0
      : circularCoverageComplete
    oversprayPassed = globalOptimization.oversprayPassed ?? oversprayPassed
    headToHeadChecks = [...(globalOptimization.headToHead?.checks ?? headToHeadChecks)]
    headToHeadPassed = globalOptimization.headToHead?.passed ?? headToHeadPassed
  }
  fullCircleSpacingPassed = fullCircleRotorClearancePassed(allHeads)

  modelSet = new Set(allHeads.map((head) => head.performanceModel))
  const circularHeads = allHeads.filter((head) => head.pattern !== 'strip')
  if (circularHeads.length === 0) {
    headToHeadChecks = []
    headToHeadPassed = null
  }
  const hasStrip = stripParts.length > 0
  if (globalOptimization.status === 'skipped_target_limit') {
    layoutWarnings.push({ code: 'global_head_minimization_skipped_target_limit', path: 'layout.globalOptimization' })
  } else if (globalOptimization.status === 'baseline_failed' ||
      globalOptimization.status === 'final_validation_failed') {
    layoutWarnings.push({ code: 'global_head_minimization_baseline_validation_failed', path: 'layout.globalOptimization' })
  } else {
    layoutWarnings.push({ code: 'global_head_minimization_completed', path: 'layout.globalOptimization' })
  }
  if (globalOptimization.sectorVariantLimitReached) {
    layoutWarnings.push({ code: 'global_sector_optimization_variant_limit_reached', path: 'layout.globalOptimization' })
  }
  if (globalOptimization.removedHeadIds?.length) {
    layoutWarnings.push({
      code: 'global_head_minimization_removed_3504pc_heads',
      path: 'layout.sprinklers',
      count: globalOptimization.removedHeadIds.length,
    })
  }
  if (globalOptimization.consolidatedGroups?.length) {
    layoutWarnings.push({
      code: 'global_sector_optimization_consolidated_same_position_rotors',
      path: 'layout.sprinklers',
      count: globalOptimization.consolidatedGroups.length,
    })
  }

  const coveragePercent = sampledCoverage.sampledPoints
    ? (sampledCoverage.coveredPoints / sampledCoverage.sampledPoints) * 100
    : null
  const warnings = [
    ...layoutWarnings,
    { code: 'orthogonal_lawn_split_into_non_overlapping_rectangular_calculation_zones', path: 'geometry' },
    { code: 'rectangles_processed_in_descending_area_order', path: 'geometry.calculationRegions' },
    { code: 'each_rectangle_tries_3504pc_before_rvan_fallback', path: 'layout.sprinklers' },
    { code: 'adjacent_strip_and_rectangle_heads_may_be_offset_by_0_075m', path: 'layout.sprinklers' },
    { code: 'spray_footprints_checked_against_original_lawn_and_exclusions_with_spatial_sampling', path: 'layout.overspray' },
  ]
  if (!fullCircleSpacingPassed) warnings.push({
    code: 'full_circle_3504_rotors_must_be_at_least_6m_apart',
    path: 'layout.sprinklers',
  })
  if (!oversprayPassed) warnings.push({ code: 'sampled_spray_footprint_exceeds_lawn_boundary', path: 'layout.overspray' })
  if (!circularCoverageComplete) warnings.push({ code: 'one_or_more_rectangular_zones_have_uncovered_sample_points', path: 'layout.coverage' })
  if (headToHeadPassed === false) warnings.push({ code: 'head_to_head_spacing_check_failed', path: 'layout.headToHead' })

  const selectedModels = [...modelSet].sort()
  const layout = Object.freeze({
    engineVersion: '0.7.0',
    algorithm: 'area-descending-sequential-shared-coverage-3504pc-first-rvan-fallback-max-safe-arc-v2',
    status: !oversprayPassed || !circularCoverageComplete || headToHeadPassed === false ||
      globalOptimization.status === 'baseline_failed' || globalOptimization.status === 'final_validation_failed'
      ? 'coverage_incomplete'
      : (circularHeads.length ? 'coverage_complete_sampled' : 'strip_pattern_placement_ready'),
    coverageScope: globalOptimization.status === 'skipped_target_limit'
      ? 'per_rectangle_sampled_global_optimization_skipped'
      : (hasStrip
        ? (circularHeads.length ? 'decomposed_rectangular_zones_global_sampled' : 'owner_defined_strip_pattern_global_sampled')
        : 'global_sampled_geometry'),
    sectorOptimization: Object.freeze({
      strategy: 'sequential-shared-coverage-and-maximum-safe-3504pc-arc',
      minimumFullCircleRotorSeparationM: 6,
      finalPassEdits: Object.freeze(finalSectorEdits),
      rectangles: Object.freeze(prepared.map((part) => Object.freeze({
        id: part.id,
        previousCoverage: part.previousCoverage ?? null,
        sectorEdits: part.layout.sectorOptimization?.edits ?? [],
      }))),
    }),
    fullCircleRotorSpacing: Object.freeze({
      passed: fullCircleSpacingPassed,
      minimumDistanceM: 6,
    }),
    globalOptimization: Object.freeze({
      status: globalOptimization.status,
      targetCount: globalOptimization.targetCount,
      baseline: globalOptimization.baseline ?? null,
      optimized: globalOptimization.optimized ?? null,
      removedHeadIds: globalOptimization.removedHeadIds,
      consolidatedGroups: globalOptimization.consolidatedGroups,
      sectorEdits: globalOptimization.sectorEdits,
      sectorVariants: globalOptimization.sectorVariants,
      sectorVariantLimitReached: globalOptimization.sectorVariantLimitReached,
      failure: globalOptimization.failure ?? null,
    }),
    family: selectedModels.includes('3504-PC') ? (selectedModels.some((model) => model.startsWith('R-VAN')) ? 'mixed' : '3500') : 'R-VAN',
    model: selectedModels.join(' / '),
    pressureBar: selectedModels.includes('3504-PC') && !selectedModels.some((model) => model.startsWith('R-VAN')) ? null : pressureBar,
    sampleStepM: circularHeads.length ? sampleStepM : null,
    geometry: Object.freeze({
      regionId: geometry.regions[0].id,
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
    }),
    coverage: Object.freeze({
      sampledPoints: sampledCoverage.sampledPoints,
      coveredPoints: sampledCoverage.coveredPoints,
      uncoveredPoints: sampledCoverage.uncoveredPoints,
      coveragePercent,
      uncoveredSamples: globalOptimization.coverage?.uncoveredSamples ??
        Object.freeze(prepared.flatMap((part) =>
          part.isStrip ? [] : (part.layout.coverage?.uncoveredSamples ?? [])).slice(0, 100)),
      validationScope: globalOptimization.status === 'skipped_target_limit'
        ? 'per_rectangle_only_global_check_skipped'
        : 'global_sampled_geometry',
    }),
    sprinklers: Object.freeze(allHeads),
    headToHead: Object.freeze({
      passed: headToHeadPassed,
      applicable: headToHeadChecks.length > 0,
      checks: Object.freeze(headToHeadChecks),
    }),
    warnings: Object.freeze(warnings.map((warning) => Object.freeze(warning))),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: oversprayPassed ? 'sampled_inside_boundary' : 'sampled_outside_boundary',
    calculationRegions: Object.freeze(prepared.map((part) => Object.freeze({
      id: part.id,
      areaM2: part.shortSideM * part.lengthM,
      shortSideM: part.shortSideM,
      lengthM: part.lengthM,
      bounds: Object.freeze({ minX: part.minX, minY: part.minY, maxX: part.maxX, maxY: part.maxY }),
      shape: 'rectangle',
      pattern: part.isStrip ? 'strip' : 'circular',
      family: part.isStrip ? 'R-VAN' : part.layout.family,
      seamOffsets: Object.freeze(part.candidatePositionOffsets),
      previousCoverage: part.previousCoverage ?? null,
      sprinklerCount: part.layout.sprinklers.length,
    }))),
  })

  const zones = buildIrrigationZones(allHeads, geometry)
  const pipeNetwork = buildPerimeterPipeNetwork(geometry, allHeads, zones)
  const resultStatus = layout.status === 'coverage_complete_sampled' ||
    layout.status === 'strip_pattern_placement_ready' ? 'layout_generated' : 'layout_incomplete'
  return result(resultStatus, {
    shortSideM,
    manufacturer: 'Rain Bird',
    family: layout.family,
    model: layout.model,
    operatingScenario: Object.freeze({
      manufacturer: 'Rain Bird',
      family: layout.family,
      model: layout.model,
      pressureBar: selectedModels.includes('3504-PC') && !selectedModels.some((model) => model.startsWith('R-VAN')) ? null : pressureBar,
      pressureBasis: selectedModels.includes('3504-PC') ? '3504-PC geometric planning only; nozzle pressure and flow are not calculated' : 'Rain Bird manufacturer recommended nozzle operating point',
      modelSelectionBasis: 'process calculation rectangles from largest area to smallest; include already-placed sprinkler coverage before adding heads; expand each new 3504-PC rotor arc as far as the original lawn geometry permits; repeat a final whole-layout arc pass and remove redundant heads only after global coverage, Head-to-Head, overspray and 6 m full-circle rotor clearance checks; 1 m/2 m strips retain their directional R-VAN pattern',
      layoutRadiusM: null,
      sourceUrl: selectedModels.includes('3504-PC') ? 'https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers' : RAIN_BIRD_RVAN_DATASET.source.url,
      actualNozzlePressureVerified: false,
      customerSourceMeasurementsUsedAsNozzlePressure: false,
    }),
    geometry: Object.freeze({
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
      shortSideM,
      dimensionsAreApproximate: true,
    }),
    engine: Object.freeze({
      name: 'Florial decomposed orthogonal lawn layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm,
    }),
    projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    zones,
    pipeNetwork,
    layout,
    overspray: layout.overspray,
    warnings: Object.freeze(warnings.map((warning) => Object.freeze(warning))),
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




function residualStripConnectedEnd(strip, residual, previousHeads, sampleStepM) {
  const horizontal = strip.widthM >= strip.heightM
  const cross = horizontal
    ? (residual.minY + residual.maxY) / 2
    : (residual.minX + residual.maxX) / 2
  const probe = Math.min(0.25, sampleStepM / 2)
  if (horizontal) {
    const leftConnected = residual.minX > strip.minX + 1e-8 &&
      previousHeads.some((head) => sprinklerCoversPoint(head, { x: residual.minX - probe, y: cross }))
    const rightConnected = residual.maxX < strip.maxX - 1e-8 &&
      previousHeads.some((head) => sprinklerCoversPoint(head, { x: residual.maxX + probe, y: cross }))
    if (leftConnected) return 'left'
    if (rightConnected) return 'right'
  } else {
    const topConnected = residual.minY > strip.minY + 1e-8 &&
      previousHeads.some((head) => sprinklerCoversPoint(head, { x: cross, y: residual.minY - probe }))
    const bottomConnected = residual.maxY < strip.maxY - 1e-8 &&
      previousHeads.some((head) => sprinklerCoversPoint(head, { x: cross, y: residual.maxY + probe }))
    if (topConnected) return 'top'
    if (bottomConnected) return 'bottom'
  }
  return null
}

function uncoveredStripRuns(strip, previousHeads, sampleStepM) {
  const horizontal = strip.widthM >= strip.heightM
  const axisStart = horizontal ? strip.minX : strip.minY
  const axisEnd = horizontal ? strip.maxX : strip.maxY
  const crossStart = horizontal ? strip.minY : strip.minX
  const crossEnd = horizontal ? strip.maxY : strip.maxX
  const axisCount = Math.max(1, Math.ceil((axisEnd - axisStart) / sampleStepM))
  const crossCount = Math.max(1, Math.ceil((crossEnd - crossStart) / sampleStepM))
  const uncovered = []
  for (let axisIndex = 0; axisIndex < axisCount; axisIndex += 1) {
    const axis = axisStart + (axisIndex + 0.5) * (axisEnd - axisStart) / axisCount
    let hasUncovered = false
    for (let crossIndex = 0; crossIndex < crossCount; crossIndex += 1) {
      const cross = crossStart + (crossIndex + 0.5) * (crossEnd - crossStart) / crossCount
      const point = horizontal ? { x: axis, y: cross } : { x: cross, y: axis }
      if (!previousHeads.some((head) => sprinklerCoversPoint(head, point))) {
        hasUncovered = true
        break
      }
    }
    uncovered.push(hasUncovered)
  }

  const runs = []
  let runStart = null
  for (let index = 0; index <= uncovered.length; index += 1) {
    if (index < uncovered.length && uncovered[index]) {
      if (runStart === null) runStart = index
      continue
    }
    if (runStart === null) continue
    const start = Math.max(axisStart, axisStart + runStart * (axisEnd - axisStart) / axisCount)
    const end = Math.min(axisEnd, axisStart + index * (axisEnd - axisStart) / axisCount)
    if (end > start + 1e-8) {
      const minX = horizontal ? start : strip.minX
      const maxX = horizontal ? end : strip.maxX
      const minY = horizontal ? strip.minY : start
      const maxY = horizontal ? strip.maxY : end
      const widthM = maxX - minX
      const heightM = maxY - minY
      runs.push(Object.freeze({
        ...strip,
        id: strip.id + '-residual-' + String(runs.length + 1).padStart(2, '0'),
        minX, maxX, minY, maxY,
        widthM, heightM,
        shortSideM: Math.min(widthM, heightM),
        lengthM: Math.max(widthM, heightM),
        areaM2: widthM * heightM,
      }))
    }
    runStart = null
  }
  return runs
}

function mergeDirectionalStripParts(parts) {
  const merged = []
  for (const part of parts) {
    if (!(part.lengthM > part.shortSideM + 1e-8)) continue
    const horizontal = part.widthM >= part.heightM
    const match = merged.find((entry) => {
      if (entry.horizontal !== horizontal ||
          Math.abs(entry.shortSideM - part.shortSideM) > 1e-8) return false
      if (horizontal) {
        return Math.abs(entry.minY - part.minY) <= 1e-8 &&
          Math.abs(entry.maxY - part.maxY) <= 1e-8 &&
          (Math.abs(entry.maxX - part.minX) <= 1e-8 || Math.abs(part.maxX - entry.minX) <= 1e-8)
      }
      return Math.abs(entry.minX - part.minX) <= 1e-8 &&
        Math.abs(entry.maxX - part.maxX) <= 1e-8 &&
        (Math.abs(entry.maxY - part.minY) <= 1e-8 || Math.abs(part.maxY - entry.minY) <= 1e-8)
    })
    if (!match) {
      merged.push({
        ...part,
        horizontal,
      })
      continue
    }
    match.minX = Math.min(match.minX, part.minX)
    match.maxX = Math.max(match.maxX, part.maxX)
    match.minY = Math.min(match.minY, part.minY)
    match.maxY = Math.max(match.maxY, part.maxY)
    match.widthM = match.maxX - match.minX
    match.heightM = match.maxY - match.minY
    match.shortSideM = Math.min(match.widthM, match.heightM)
    match.lengthM = Math.max(match.widthM, match.heightM)
    match.areaM2 = match.widthM * match.heightM
  }
  return merged.map((part, index) => Object.freeze({
    ...part,
    id: 'merged-strip-' + String(index + 1).padStart(3, '0'),
  }))
}

function perimeterMetadataForPosition(position, vertices) {
  const points = vertices.length > 1 &&
    Math.hypot(vertices[0].x - vertices[vertices.length - 1].x,
      vertices[0].y - vertices[vertices.length - 1].y) <= 1e-8
    ? vertices.slice(0, -1)
    : vertices
  let perimeterLengthM = 0
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]
    const b = points[(index + 1) % points.length]
    perimeterLengthM += Math.hypot(b.x - a.x, b.y - a.y)
  }
  let offsetM = 0
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]
    const b = points[(index + 1) % points.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy)
    const cross = dx * (position.y - a.y) - dy * (position.x - a.x)
    const dot = (position.x - a.x) * dx + (position.y - a.y) * dy
    if (Math.abs(cross) <= 1e-6 && dot >= -1e-6 && dot <= length * length + 1e-6) {
      return Object.freeze({
        perimeterOffsetM: offsetM + Math.max(0, Math.min(length, dot / Math.max(length, 1e-12))),
        perimeterLengthM,
      })
    }
    offsetM += length
  }
  return null
}

function attachWholePolygonHeadMetadata(head, regionId, vertices) {
  const perimeter = head.source === 'interior'
    ? null
    : perimeterMetadataForPosition(head.position, vertices)
  return Object.freeze({
    ...head,
    calculationRegionId: regionId,
    ...(perimeter ?? {}),
  })
}

function calculateSampledCoverage(targets, heads) {
  if (!targets) return null
  let coveredPoints = 0
  const uncoveredSamples = []
  for (const point of targets) {
    if (heads.some((head) => sprinklerCoversPoint(head, point))) coveredPoints += 1
    else if (uncoveredSamples.length < 100) uncoveredSamples.push(point)
  }
  const uncoveredPoints = targets.length - coveredPoints
  return Object.freeze({
    sampledPoints: targets.length,
    coveredPoints,
    uncoveredPoints,
    coveragePercent: targets.length ? coveredPoints / targets.length * 100 : null,
    uncoveredSamples: Object.freeze(uncoveredSamples),
  })
}

/**
 * Sequential whole-polygon family-priority layout:
 * 1) all 3504-PC rotors on the complete polygon;
 * 2) R-VAN only for the residual uncovered samples;
 * 3) exact 1 m / 2 m directional strip patterns for any remaining strip areas;
 * 4) one global coverage, mixed-type Head-to-Head, overspray and rotor-removal pass.
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
  if (!Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return result('invalid_layout_options', { reason: 'sample_step_must_be_positive' })
  }

  const geometry = snapshot.geometry.normalized
  if (!Array.isArray(geometry.regions) || geometry.regions.length !== 1) {
    return result('geometry_not_supported', { reason: 'single_region_only' })
  }
  const region = geometry.regions[0]
  const vertices = region.boundary?.vertices
  if (!Array.isArray(vertices) || vertices.length < 4) {
    return result('geometry_not_supported', { reason: 'invalid_or_missing_boundary' })
  }
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || !validation.supported || validation.regions.length !== 1) {
    return result('geometry_not_supported', {
      reason: 'normalized_geometry_failed_validation_or_orthogonal_support',
      errors: validation.errors,
      warnings: validation.warnings,
    })
  }

  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const shortSideM = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const rectangularWithoutExclusions = validation.regions[0].shape === 'rectangle' &&
    !(region.exclusions?.length)
  // Exact 1 m / 2 m rectangles belong to the directional strip solver. Do not
  // let a generic circular pass pre-cover them and suppress the approved
  // LCS/RCS/SST pattern that is responsible for this geometry class.
  const longSideM = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const wholePolygonIsDirectionalStrip = rectangularWithoutExclusions &&
    longSideM > shortSideM + 1e-8 &&
    SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(shortSideM - width) <= 1e-8)
  const rotorAttempt = wholePolygonIsDirectionalStrip
    ? Object.freeze({ sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
    : rectangularWithoutExclusions
      ? generateRainBird3504Layout(geometry, { sampleStepM })
      : generateRainBird3504PolygonLayout(geometry, { sampleStepM })
  let rotorHeads = (rotorAttempt.sprinklers ?? []).map((head) =>
    attachWholePolygonHeadMetadata(head, region.id, vertices))

  // Finish the complete rotor pass before asking R-VAN to fill residuals.
  // Sector expansion is evaluated against the whole polygon and the rotor set
  // alone, so R-VAN heads cannot mask a gap that the rotor pass could safely
  // close. This applies equally to rectangles, L-shapes and polygons with
  // rectangular exclusions.
  const globalTargets = buildIrrigatedTargets(geometry, sampleStepM)
  const expandedRotors = rotorHeads.length
    ? maximizeRotorSectors(rotorHeads, [], geometry, globalTargets)
    : Object.freeze({ sprinklers: Object.freeze(rotorHeads), edits: Object.freeze([]) })
  rotorHeads = [...expandedRotors.sprinklers]

  // Reduce the 3504-PC set before R-VAN is allowed to cover any residual.
  // Only samples already reached by at least one rotor become reduction
  // targets, so this pass cannot hand an existing rotor gap to later R-VAN.
  // True polygon vertex/corner rotors remain protected by the optimizer.
  const rotorReduction = rotorHeads.length
    ? optimizeGlobalSprinklerSet({
      sprinklers: rotorHeads,
      geometry,
      parts: [{ id: region.id, layout: { sprinklers: rotorHeads } }],
      sampleStepM,
      preserveOnlyExistingCoverage: true,
      removalOnly: true,
      oversprayCheck: (candidateHeads) =>
        newlyOpenedFullCircleClearancePassed(candidateHeads, rotorHeads) &&
        evaluateCompositeOverspray(candidateHeads, [], geometry),
    })
    : Object.freeze({
      status: 'not_applicable',
      sprinklers: Object.freeze([]),
      baseline: Object.freeze({ sprinklerCount: 0, rotorCount: 0, sprinklers: Object.freeze([]) }),
      optimized: Object.freeze({ sprinklerCount: 0, rotorCount: 0 }),
      targetCount: 0,
      removedHeadIds: Object.freeze([]),
      proximityCandidates: Object.freeze([]),
      coverage: Object.freeze({ sampledPoints: 0, coveredPoints: 0, uncoveredPoints: 0, coveragePercent: null }),
      headToHead: Object.freeze({ passed: true, checks: Object.freeze([]) }),
      oversprayPassed: true,
    })
  if (rotorReduction.status === 'completed') {
    rotorHeads = [...rotorReduction.sprinklers]
  }

  const selectedRvan = selectRvanModel(shortSideM)
  const pressureBar = RECOMMENDED_NOZZLE_PRESSURE_BAR
  const rvanLayout = wholePolygonIsDirectionalStrip
    ? Object.freeze({ sprinklers: Object.freeze([]), warnings: Object.freeze([]) })
    : generateLawnSprinklerLayout({
      geometry,
      family: 'R-VAN',
      model: selectedRvan.model,
      pressureBar,
      sampleStepM,
      radiusM: selectedRvan.radiusM,
      preventOverspray: true,
      initialSprinklers: rotorHeads,
      sprayBoundaryGeometry: geometry,
    })
  const rvanHeads = (rvanLayout.sprinklers ?? []).map((head) =>
    attachWholePolygonHeadMetadata(head, region.id, vertices))

  let allHeads = [...rotorHeads, ...rvanHeads]
  const stripParts = []
  const stripWarnings = []
  const decomposition = decomposeOrthogonalRegion(region, validation.regions[0].netAreaM2)
  if (decomposition?.length) {
    const stripRegions = mergeDirectionalStripParts(decomposition.filter((part) =>
      SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(part.shortSideM - width) <= 1e-8)))
    for (const strip of stripRegions) {
      const residualRuns = uncoveredStripRuns(strip, allHeads, sampleStepM)
      for (const residual of residualRuns) {
        const previousCoverage = rectangleCoverageByPreviousHeads(residual, allHeads, sampleStepM)
        if (previousCoverage.uncoveredPoints === 0) continue
        const connectedEnd = residualStripConnectedEnd(strip, residual, allHeads, sampleStepM) ??
          inferConnectedStripEnd(residual, decomposition)
        const stripGeometry = rectangleGeometry('strip-' + residual.id, residual)
        const stripLayout = connectedEnd
          ? buildConnectedRvanStripLayout(stripGeometry, residual.shortSideM, connectedEnd)
          : buildRvanStripLayout(stripGeometry, residual.shortSideM)
        if (!stripLayout) continue
        const prefix = 'z' + (stripParts.length + 1) + '-'
        const part = Object.freeze({
          ...residual,
          id: 'strip-' + residual.id,
          isStrip: true,
          connectedEnd,
          previousCoverage,
          layout: stripLayout,
        })
        const candidateHeads = stripLayout.sprinklers.map((head) => Object.freeze({
          ...head,
          id: prefix + head.id,
          calculationRegionId: region.id,
        }))
        const stripBoundaryPassed = evaluateCompositeOverspray(
          [...allHeads, ...candidateHeads],
          [...stripParts, part],
          geometry,
        )
        if (!stripBoundaryPassed) {
          stripWarnings.push(Object.freeze({
            code: 'strip_pattern_rejected_due_to_boundary_overspray',
            path: 'layout.sprinklers',
            stripId: part.id,
          }))
          continue
        }
        stripParts.push(part)
        allHeads.push(...candidateHeads)
      }
    }
  }

  const circularHeads = allHeads.filter((head) => head.pattern !== 'strip')
  const globalOptimization = optimizeGlobalSprinklerSet({
    sprinklers: allHeads,
    geometry,
    parts: stripParts,
    sampleStepM,
    oversprayCheck: (candidateHeads) =>
      newlyOpenedFullCircleClearancePassed(candidateHeads, allHeads) &&
      evaluateCompositeOverspray(candidateHeads, stripParts, geometry),
  })
  if (globalOptimization.status === 'completed') {
    allHeads = [...globalOptimization.sprinklers]
  }

  const finalCircularHeads = allHeads.filter((head) => head.pattern !== 'strip')
  const finalCoverage = globalOptimization.coverage ??
    calculateSampledCoverage(globalTargets, allHeads)
  const headToHeadChecks = finalCircularHeads.length > 1
    ? (globalOptimization.headToHead?.checks?.length
      ? globalOptimization.headToHead.checks
      : evaluateHeadToHeadSpacing(finalCircularHeads))
    : []
  const headToHeadPassed = finalCircularHeads.length > 1
    ? headToHeadChecks.every((entry) => entry.passed)
    : null
  const fullCircleSpacingPassed = fullCircleRotorClearancePassed(allHeads)
  const oversprayPassed = evaluateCompositeOverspray(allHeads, stripParts, geometry)
  const optimizationFailed = ['baseline_failed', 'final_validation_failed'].includes(globalOptimization.status)
  const optimizationSkipped = globalOptimization.status === 'skipped_target_limit'
  const coverageComplete = finalCoverage?.uncoveredPoints === 0
  const selectedModels = [...new Set(allHeads.map((head) => head.performanceModel))].sort()
  const hasRotor = selectedModels.includes('3504-PC')
  const hasRvan = selectedModels.some((model) => model.startsWith('R-VAN'))
  const family = hasRotor ? (hasRvan ? 'mixed' : '3500') : 'R-VAN'
  const model = selectedModels.join(' / ')
  const hasStrip = allHeads.some((head) => head.pattern === 'strip')
  const layoutStatus = coverageComplete && oversprayPassed && headToHeadPassed !== false &&
    !optimizationFailed && !optimizationSkipped
    ? (finalCircularHeads.length ? 'coverage_complete_sampled' : 'strip_pattern_placement_ready')
    : 'coverage_incomplete'

  const warnings = [
    ...stripWarnings,
    ...(rotorAttempt.warnings ?? []),
    ...(rvanLayout.warnings ?? []),
    Object.freeze({ code: 'whole_polygon_rotor_pass_runs_before_rvan', path: 'layout.sprinklers' }),
    Object.freeze({ code: 'rotor_reduction_runs_before_rvan_and_preserves_existing_rotor_coverage', path: 'layout.rotorReduction' }),
    Object.freeze({ code: 'rotor_within_half_its_throw_radius_is_prioritized_for_removal_trial_only', path: 'layout.rotorReduction.proximityCandidates' }),
    Object.freeze({ code: 'rvan_pass_receives_only_residual_uncovered_samples_after_rotors', path: 'layout.sprinklers' }),
    Object.freeze({ code: 'one_and_two_metre_strip_patterns_run_after_rotors_and_rvan', path: 'layout.sprinklers' }),
    Object.freeze({ code: 'mixed_rotor_rvan_head_to_head_is_fully_mutual', path: 'layout.headToHead' }),
    Object.freeze({ code: 'global_sampled_coverage_and_overspray_are_rechecked_after_all_three_passes', path: 'layout.coverage' }),
    Object.freeze({ code: 'sampled_coverage_is_not_a_continuous_mathematical_proof', path: 'layout.coverage' }),
    Object.freeze({ code: 'site_specific_pressure_flow_losses_are_not_calculated_by_geometry_solver', path: 'hydraulics' }),
  ]
  if (!rotorHeads.length) warnings.push(Object.freeze({
    code: 'no_3504pc_rotors_passed_the_whole_polygon_6m_safe_radius_gate',
    path: 'layout.sprinklers',
  }))
  if (!rvanHeads.length) warnings.push(Object.freeze({
    code: 'rvan_added_no_new_heads_after_rotor_coverage',
    path: 'layout.sprinklers',
  }))
  if (shortSideM < 2.4 && !hasStrip) warnings.push(Object.freeze({
    code: 'narrow_area_has_no_exact_one_or_two_metre_strip_pattern',
    path: 'geometry',
  }))
  if (optimizationSkipped) warnings.push(Object.freeze({
    code: 'global_validation_and_minimization_skipped_target_limit',
    path: 'layout.globalOptimization',
  }))
  if (optimizationFailed) warnings.push(Object.freeze({
    code: 'global_baseline_validation_failed',
    path: 'layout.globalOptimization',
  }))
  if (headToHeadPassed === false) warnings.push(Object.freeze({
    code: 'head_to_head_spacing_check_failed',
    path: 'layout.headToHead',
  }))
  if (!fullCircleSpacingPassed) warnings.push(Object.freeze({
    code: 'full_circle_3504_rotors_must_be_at_least_6m_apart',
    path: 'layout.sprinklers',
  }))
  if (!oversprayPassed) warnings.push(Object.freeze({
    code: 'sampled_spray_footprint_exceeds_lawn_boundary_or_exclusion',
    path: 'layout.overspray',
  }))
  if (!coverageComplete) warnings.push(Object.freeze({
    code: 'whole_polygon_layout_has_uncovered_samples',
    path: 'layout.coverage',
  }))

  const layout = Object.freeze({
    engineVersion: '0.8.0',
    algorithm: 'whole-polygon-sequential-3504pc-rvan-strip-v1',
    status: layoutStatus,
    coverageScope: optimizationSkipped
      ? 'global_validation_skipped_target_limit'
      : (finalCircularHeads.length ? 'global_sampled_geometry' : 'owner_defined_strip_pattern_global_sampled'),
    family,
    model,
    pressureBar: hasRvan ? pressureBar : null,
    sampleStepM,
    geometry: Object.freeze({
      regionId: region.id,
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
    }),
    coverage: finalCoverage ? Object.freeze({
      ...finalCoverage,
      validationScope: optimizationSkipped ? 'not_fully_verified_target_limit' : 'whole_polygon_global_sampled_geometry',
    }) : Object.freeze({
      sampledPoints: 0,
      coveredPoints: 0,
      uncoveredPoints: null,
      coveragePercent: null,
      uncoveredSamples: Object.freeze([]),
      validationScope: 'not_verified_target_limit',
    }),
    sprinklers: Object.freeze(allHeads),
    headToHead: Object.freeze({
      passed: headToHeadPassed,
      applicable: finalCircularHeads.length > 1,
      checks: Object.freeze(headToHeadChecks),
    }),
    fullCircleRotorSpacing: Object.freeze({
      passed: fullCircleSpacingPassed,
      minimumDistanceM: 6,
    }),
    sectorOptimization: Object.freeze({
      strategy: 'whole-polygon-maximum-safe-3504pc-sector-expansion',
      minimumFullCircleRotorSeparationM: 6,
      edits: expandedRotors.edits,
    }),
    rotorReduction: Object.freeze({
      status: rotorReduction.status,
      targetCount: rotorReduction.targetCount ?? null,
      baseline: rotorReduction.baseline ?? null,
      optimized: rotorReduction.optimized ?? null,
      removedHeadIds: rotorReduction.removedHeadIds ?? Object.freeze([]),
      proximityCandidates: rotorReduction.proximityCandidates ?? Object.freeze([]),
      coverage: rotorReduction.coverage ?? null,
      headToHead: rotorReduction.headToHead ?? null,
      oversprayPassed: rotorReduction.oversprayPassed ?? null,
      preservesExistingRotorCoverageOnly: true,
    }),
    globalOptimization: Object.freeze({
      status: globalOptimization.status,
      targetCount: globalOptimization.targetCount,
      baseline: globalOptimization.baseline ?? null,
      optimized: globalOptimization.optimized ?? null,
      removedHeadIds: globalOptimization.removedHeadIds ?? Object.freeze([]),
      consolidatedGroups: globalOptimization.consolidatedGroups ?? Object.freeze([]),
      sectorEdits: globalOptimization.sectorEdits ?? Object.freeze([]),
      sectorVariants: globalOptimization.sectorVariants ?? 0,
      sectorVariantLimitReached: globalOptimization.sectorVariantLimitReached ?? false,
      failure: globalOptimization.failure ?? null,
    }),
    calculationRegions: Object.freeze([Object.freeze({
      id: region.id,
      shape: validation.regions[0].shape,
      pattern: 'whole-polygon',
      family,
      areaM2: validation.regions[0].netAreaM2,
      sprinklerCount: allHeads.length,
    }), ...stripParts.map((part) => Object.freeze({
      id: part.id,
      shape: 'rectangle',
      pattern: 'directional-strip',
      family: 'R-VAN',
      widthM: part.shortSideM,
      lengthM: part.lengthM,
      previousCoverage: part.previousCoverage,
      sprinklerCount: part.layout.sprinklers.length,
    }))]),
    warnings: Object.freeze(warnings),
    hydraulicFeasibility: hasRotor && hasRvan ? 'owner_confirmed_compatible' : 'not_evaluated',
    hydraulicCompatibilityBasis: hasRotor && hasRvan ? 'owner_confirmed' : 'not_applicable',
    precipitationIntensityCompatibility: hasRotor && hasRvan ? 'owner_confirmed_similar' : 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: oversprayPassed ? 'sampled_inside_boundary' : 'sampled_outside_boundary',
  })

  const zones = buildIrrigationZones(allHeads, geometry)
  const pipeNetwork = buildPerimeterPipeNetwork(geometry, allHeads, zones)
  const resultStatus = layoutStatus === 'coverage_complete_sampled' ||
    layoutStatus === 'strip_pattern_placement_ready' ? 'layout_generated' : 'layout_incomplete'
  return result(resultStatus, {
    hydraulicFeasibility: hasRotor && hasRvan ? 'owner_confirmed_compatible' : 'not_evaluated',
    hydraulicCompatibilityBasis: hasRotor && hasRvan ? 'owner_confirmed' : 'not_applicable',
    precipitationIntensityCompatibility: hasRotor && hasRvan ? 'owner_confirmed_similar' : 'not_evaluated',
    shortSideM,
    manufacturer: 'Rain Bird',
    family,
    model,
    operatingScenario: Object.freeze({
      manufacturer: 'Rain Bird',
      family,
      model,
      pressureBar: hasRvan ? pressureBar : null,
      pressureBasis: hasRotor && hasRvan
        ? 'owner-confirmed rotor/R-VAN compatibility; site-specific pressure and flow calculations remain outside this geometric planner'
        : hasRotor
          ? '3504-PC geometric planning only; nozzle pressure and flow are not calculated'
          : 'Rain Bird manufacturer recommended R-VAN nozzle operating point; site pressure is not measured',
      modelSelectionBasis: 'first place Rain Bird 3504-PC rotors over the complete polygon; then place R-VAN heads only for residual uncovered areas; finally apply exact 1m/2m directional strip patterns; verify combined rotor/R-VAN Head-to-Head, whole-polygon coverage and overspray; minimize redundant rotors only after all global checks',
      layoutRadiusM: null,
      sourceUrl: hasRotor
        ? 'https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers'
        : RAIN_BIRD_RVAN_DATASET.source.url,
      actualNozzlePressureVerified: false,
      customerSourceMeasurementsUsedAsNozzlePressure: false,
    }),
    geometry: Object.freeze({
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
      shortSideM,
      dimensionsAreApproximate: true,
    }),
    engine: Object.freeze({
      name: 'Florial whole-polygon sequential sprinkler layout',
      version: layout.engineVersion,
      algorithm: layout.algorithm,
    }),
    projectStandard: FLORIAL_IRRIGATION_PROJECT_STANDARD,
    zones,
    pipeNetwork,
    layout,
    overspray: layout.overspray,
    warnings,
  })
}
