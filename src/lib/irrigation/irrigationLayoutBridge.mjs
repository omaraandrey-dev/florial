import { evaluateHeadToHeadSpacing, generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { decomposeOrthogonalRegion } from './orthogonalRectangleDecomposition.mjs'
import { validateLawnGeometry } from './lawnGeometry.mjs'
import { generateRainBird3504Layout } from './rainBird3504Layout.mjs'
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
      const part = stripPartByHeadId.get(head.id)
      if (!part) return false
      const bounds = part
      const horizontal = head.stripAxis === 'horizontal'
      const reach = head.stripLengthM
      let footprint
      if (horizontal) {
        const minX = head.stripDirection === 'left' ? head.position.x - reach
          : head.stripDirection === 'right' ? head.position.x
            : head.position.x - reach
        const maxX = head.stripDirection === 'left' ? head.position.x
          : head.stripDirection === 'right' ? head.position.x + reach
            : head.position.x + reach
        footprint = { minX, maxX, minY: bounds.minY, maxY: bounds.maxY }
      } else {
        const minY = head.stripDirection === 'up' ? head.position.y
          : head.stripDirection === 'down' ? head.position.y - reach
            : head.position.y - reach
        const maxY = head.stripDirection === 'up' ? head.position.y + reach
          : head.stripDirection === 'down' ? head.position.y
            : head.position.y + reach
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

function buildDecomposedLShapeLayout(geometry, validation, parts, pressureBar, sampleStepM, shortSideM, initialHeads = []) {
  const orderedParts = parts.slice().sort((a, b) =>
    a.shortSideM - b.shortSideM || a.lengthM - b.lengthM ||
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
    return { ...part, isStrip, rectGeometry, layout }
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

  const circularPart = prepared.find((part) => !part.isStrip)
  if (circularPart && seamHeadParts.length) {
    const stripPart = seamHeadParts[0]
    const seam = connectedStripSeamPoint(stripPart, stripPart.connectedEnd,
      stripPart.connectedEnd === 'left' || stripPart.connectedEnd === 'right')
    circularPart.excludedCandidatePositions = [seam]
  }

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
      previouslyPlacedHeads.push(...part.layout.sprinklers)
      continue
    }
    const selected = selectRvanModel(part.shortSideM)
    part.layout = generateLawnSprinklerLayout({
      geometry: part.rectGeometry,
      family: 'R-VAN',
      model: selected.model,
      pressureBar,
      sampleStepM,
      radiusM: selected.radiusM,
      excludedCandidatePositions: part.excludedCandidatePositions ?? [],
      preventOverspray: true,
      initialSprinklers: previouslyPlacedHeads,
      sprayBoundaryGeometry: geometry,
    })
    if (!['coverage_complete_sampled', 'coverage_incomplete'].includes(part.layout.status)) {
      return result('layout_incomplete', {
        shortSideM,
        reason: 'rectangular_zone_layout_not_available',
        layout: part.layout,
        warnings: Object.freeze([{ code: 'rectangular_zone_layout_not_available', path: 'geometry' }]),
      })
    }
    previouslyPlacedHeads.push(...part.layout.sprinklers)
  }

  const allHeads = initialHeads.slice()
  const circularHeads = initialHeads.filter((head) => head.pattern !== 'strip')
  const sampledCoverage = { sampledPoints: 0, coveredPoints: 0, uncoveredPoints: 0 }
  const modelSet = new Set(initialHeads.map((head) => head.performanceModel))
  const layoutWarnings = initialHeads.length ? [
    { code: '3504pc_radius_is_owner_defined_florial_planning_value', path: 'layout.sprinklers.radiusM' },
    { code: '3504pc_arc_invariant_radius_not_claimed_as_manufacturer_arc_table', path: 'layout.sprinklers.arcDeg' },
    { code: '3504pc_flow_and_nozzle_pressure_not_calculated', path: 'hydraulics' },
    { code: '3504pc_precipitation_uniformity_not_evaluated', path: 'precipitation' },
  ] : []
  let circularCoverageComplete = true
  for (let index = 0; index < prepared.length; index += 1) {
    const part = prepared[index]
    for (const head of part.layout.sprinklers) {
      const prefixed = Object.freeze({ ...head, id: 'z' + (index + 1) + '-' + head.id, calculationRegionId: part.id })
      allHeads.push(prefixed)
      modelSet.add(prefixed.performanceModel)
      if (prefixed.pattern !== 'strip') circularHeads.push(prefixed)
    }
    if (!part.isStrip) {
      sampledCoverage.sampledPoints += part.layout.coverage?.sampledPoints ?? 0
      sampledCoverage.coveredPoints += part.layout.coverage?.coveredPoints ?? 0
      sampledCoverage.uncoveredPoints += part.layout.coverage?.uncoveredPoints ?? 0
      if (part.layout.status !== 'coverage_complete_sampled') circularCoverageComplete = false
    }
    layoutWarnings.push(...part.layout.warnings.filter((warning) =>
      warning.code !== 'overspray_not_evaluated'))
  }

  const oversprayPassed = evaluateCompositeOverspray(allHeads, prepared, geometry)
  const headToHeadChecks = circularHeads.length > 1
    ? evaluateHeadToHeadSpacing(circularHeads)
    : []
  const headToHeadPassed = circularHeads.length > 1
    ? headToHeadChecks.every((entry) => entry.passed)
    : null
  if (initialHeads.length && headToHeadPassed === false) {
    return buildDecomposedLShapeLayout(geometry, validation, parts, pressureBar, sampleStepM, shortSideM, [])
  }
  const coveragePercent = sampledCoverage.sampledPoints
    ? (sampledCoverage.coveredPoints / sampledCoverage.sampledPoints) * 100
    : null
  const hasStrip = stripParts.length > 0
  const coverageScope = hasStrip
    ? (circularHeads.length ? 'decomposed_rectangular_zones' : 'owner_defined_strip_pattern')
    : 'sampled_geometry_only'
  const warnings = [
    ...layoutWarnings,
    { code: 'orthogonal_lawn_split_into_non_overlapping_rectangular_calculation_zones', path: 'geometry' },
    { code: 'spray_footprints_checked_against_original_lawn_and_exclusions_with_spatial_sampling', path: 'layout.overspray' },
  ]
  if (!oversprayPassed) warnings.push({ code: 'sampled_spray_footprint_exceeds_lawn_boundary', path: 'layout.overspray' })
  if (!circularCoverageComplete) warnings.push({ code: 'one_or_more_rectangular_zones_have_uncovered_sample_points', path: 'layout.coverage' })
  if (headToHeadPassed === false) warnings.push({ code: 'head_to_head_spacing_check_failed', path: 'layout.headToHead' })

  const selectedModels = [...modelSet].sort()
  const layout = Object.freeze({
    engineVersion: '0.6.0',
    algorithm: 'decomposed-orthogonal-rectangular-zones-v2',
    status: !oversprayPassed || !circularCoverageComplete || headToHeadPassed === false
      ? 'coverage_incomplete'
      : (circularHeads.length ? 'coverage_complete_sampled' : 'strip_pattern_placement_ready'),
    coverageScope,
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
      uncoveredSamples: Object.freeze(prepared.flatMap((part) =>
        part.isStrip ? [] : (part.layout.coverage?.uncoveredSamples ?? [])).slice(0, 100)),
    }),
    sprinklers: Object.freeze(allHeads),
    headToHead: Object.freeze({
      passed: headToHeadPassed,
      applicable: circularHeads.length > 1,
      checks: Object.freeze(headToHeadChecks),
    }),
    warnings: Object.freeze(warnings.map((warning) => Object.freeze(warning))),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: oversprayPassed ? 'sampled_inside_boundary' : 'sampled_outside_boundary',
    calculationRegions: Object.freeze(prepared.map((part) => Object.freeze({
      id: part.id,
      shortSideM: part.shortSideM,
      lengthM: part.lengthM,
      bounds: Object.freeze({ minX: part.minX, minY: part.minY, maxX: part.maxX, maxY: part.maxY }),
      shape: 'rectangle',
      pattern: part.isStrip ? 'strip' : 'circular',
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
      family: selectedModels.includes('3504-PC') ? (selectedModels.some((model) => model.startsWith('R-VAN')) ? 'mixed' : '3500') : 'R-VAN',
      model: layout.model,
      pressureBar: selectedModels.includes('3504-PC') && !selectedModels.some((model) => model.startsWith('R-VAN')) ? null : pressureBar,
      pressureBasis: selectedModels.includes('3504-PC') ? '3504-PC geometric planning only; nozzle pressure and flow are not calculated' : 'Rain Bird manufacturer recommended nozzle operating point',
      modelSelectionBasis: selectedModels.includes('3504-PC') ? 'owner-approved 3504-PC 10/9/8 m planning-radius priority, then unchanged local R-VAN rules for uncovered geometry' : 'per-rectangle local dimensions; connected narrow arms use the owner-defined directional LCS/RCS/SST pattern',
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
  const vertices = region.boundary.vertices
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || !validation.supported || validation.regions.length !== 1) {
    return result('geometry_not_supported', { reason: 'normalized_geometry_failed_validation_or_orthogonal_support' })
  }
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const shortSideM = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))

  // Rotor-first prepass is isolated from the R-VAN solver. Narrow 1–5 m lawns
  // keep their established R-VAN/strip behavior; wider geometry may be served
  // by owner-approved 3504-PC planning radii before R-VAN fills remaining gaps.
  const rotorLayout = shortSideM >= 6
    ? generateRainBird3504Layout(geometry, { sampleStepM })
    : null
  const initialRotorHeads = rotorLayout?.status === 'layout_generated'
    ? rotorLayout.sprinklers
    : []

  const lShapeParts = validation.regions[0].shape === 'l-shape' && !(region.exclusions?.length)
    ? decomposeOrthogonalLShape(vertices)
    : null
  if (lShapeParts) {
    const partsWithStripEnds = lShapeParts.map((part) => ({
      ...part,
      connectedEnd: SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(part.shortSideM - width) <= 1e-8)
        ? part.connectedEnd
        : null,
    }))
    return buildDecomposedLShapeLayout(
      geometry, validation, partsWithStripEnds, RECOMMENDED_NOZZLE_PRESSURE_BAR,
      sampleStepM, Math.min(...lShapeParts.map((part) => part.shortSideM)), initialRotorHeads,
    )
  }

  if (region.exclusions?.length || validation.regions[0].shape === 'orthogonal-polygon') {
    const parts = decomposeOrthogonalRegion(region, validation.regions[0].netAreaM2)
    if (!parts?.length) {
      return result('layout_incomplete', {
        reason: 'orthogonal_rectangle_decomposition_failed_area_or_overlap_check',
        warnings: Object.freeze([{ code: 'orthogonal_rectangle_decomposition_failed', path: 'geometry' }]),
      })
    }
    const withStripEnds = parts.map((part) => ({
      ...part,
      connectedEnd: SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(part.shortSideM - width) <= 1e-8)
        ? inferConnectedStripEnd(part, parts)
        : null,
    }))
    return buildDecomposedLShapeLayout(
      geometry, validation, withStripEnds, RECOMMENDED_NOZZLE_PRESSURE_BAR,
      sampleStepM, Math.min(...parts.map((part) => part.shortSideM)), initialRotorHeads,
    )
  }

  if (SUPPORTED_STRIP_WIDTHS_M.some((width) => Math.abs(shortSideM - width) <= 1e-8)) {
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
  const createRvanLayout = (initialSprinklers = [], rotorActive = false) => generateLawnSprinklerLayout({
    geometry,
    family: 'R-VAN',
    model,
    pressureBar,
    sampleStepM,
    radiusM,
    initialSprinklers,
    sprayBoundaryGeometry: rotorActive ? geometry : null,
    preventOverspray: rotorActive,
  })
  let rvanLayout = createRvanLayout(initialRotorHeads, initialRotorHeads.length > 0)
  let rotorAccepted = initialRotorHeads.length > 0
  let combinedSprinklers = rotorAccepted
    ? [...initialRotorHeads, ...rvanLayout.sprinklers]
    : [...rvanLayout.sprinklers]
  let combinedHeadToHeadChecks = combinedSprinklers.length > 1
    ? evaluateHeadToHeadSpacing(combinedSprinklers)
    : []
  let combinedHeadToHeadPassed = combinedSprinklers.length > 1
    ? combinedHeadToHeadChecks.every((entry) => entry.passed)
    : null
  if (rotorAccepted && combinedHeadToHeadPassed === false) {
    rotorAccepted = false
    rvanLayout = createRvanLayout([], false)
    combinedSprinklers = [...rvanLayout.sprinklers]
    combinedHeadToHeadChecks = rvanLayout.headToHead?.checks ?? []
    combinedHeadToHeadPassed = rvanLayout.headToHead?.passed ?? null
  }
  const layout = rotorAccepted
    ? Object.freeze({
      ...rvanLayout,
      status: combinedHeadToHeadPassed === false ? 'coverage_incomplete' : rvanLayout.status,
      family: combinedSprinklers.some((head) => head.performanceModel.startsWith('R-VAN')) ? 'mixed' : '3500',
      model: [...new Set(combinedSprinklers.map((head) => head.performanceModel))].sort().join(' / '),
      pressureBar: combinedSprinklers.some((head) => head.performanceModel.startsWith('R-VAN')) ? pressureBar : null,
      sprinklers: Object.freeze(combinedSprinklers),
      headToHead: Object.freeze({ passed: combinedHeadToHeadPassed, applicable: combinedSprinklers.length > 1, checks: Object.freeze(combinedHeadToHeadChecks) }),
      warnings: Object.freeze([
        ...rvanLayout.warnings,
        ...rotorLayout.warnings,
        Object.freeze({ code: '3504pc_rotors_prioritized_before_rvan_gap_fill', path: 'layout.sprinklers' }),
      ]),
    })
    : rvanLayout

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
      family: layout.family ?? 'R-VAN',
      model: layout.model ?? model,
      pressureBar: rotorAccepted && !combinedSprinklers.some((head) => head.performanceModel.startsWith('R-VAN')) ? null : pressureBar,
      pressureBasis: rotorAccepted ? '3504-PC planning radius is owner-defined; pressure and flow are not calculated' : 'Rain Bird manufacturer recommended nozzle operating point',
      modelSelectionBasis: rotorAccepted ? '3504-PC is prioritized at 10/9/8 m planning reach; unchanged R-VAN selection fills uncovered samples' : 'Florial per-position nozzle selection from corner-to-centre reach and adjacent perimeter spacing; radius independent of arc',
      layoutRadiusM: null,
      sourceUrl: rotorAccepted ? 'https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers' : RAIN_BIRD_RVAN_DATASET.source.url,
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
