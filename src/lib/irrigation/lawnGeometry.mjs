const VALIDATOR_VERSION = '1.0.0'
const EPSILON = 1e-9

const ERROR = Object.freeze({
  INVALID_INPUT: 'invalid_input',
  INVALID_SCHEMA_VERSION: 'invalid_schema_version',
  UNSUPPORTED_COORDINATE_SYSTEM: 'unsupported_coordinate_system',
  MISSING_REGIONS: 'missing_regions',
  INVALID_REGION_ID: 'invalid_region_id',
  DUPLICATE_ID: 'duplicate_id',
  INVALID_RING: 'invalid_ring',
  INVALID_COORDINATE: 'invalid_coordinate',
  CONSECUTIVE_DUPLICATE_VERTEX: 'consecutive_duplicate_vertex',
  TOO_FEW_VERTICES: 'too_few_vertices',
  ZERO_AREA_RING: 'zero_area_ring',
  SELF_INTERSECTION: 'self_intersection',
  INVALID_EXCLUSION: 'invalid_exclusion',
  INVALID_EXCLUSION_LIST: 'invalid_exclusion_list',
  INVALID_GEOMETRY_MEASUREMENT: 'invalid_geometry_measurement',
  EXCLUSION_OUTSIDE_REGION: 'exclusion_outside_region',
  OVERLAPPING_EXCLUSIONS: 'overlapping_exclusions',
  OVERLAPPING_REGIONS: 'overlapping_regions',
  INVALID_REPORTED_AREA: 'invalid_reported_area',
})

function issue(code, path) {
  return Object.freeze({ code, path })
}

function isFinitePoint(point) {
  return point !== null && typeof point === 'object' &&
    Number.isFinite(point.x) && Number.isFinite(point.y)
}

function samePoint(a, b) {
  return Math.abs(a.x - b.x) <= EPSILON && Math.abs(a.y - b.y) <= EPSILON
}

function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function isBetween(value, a, b) {
  return value >= Math.min(a, b) - EPSILON && value <= Math.max(a, b) + EPSILON
}

function pointOnSegment(point, a, b) {
  return Math.abs(cross(a, b, point)) <= EPSILON &&
    isBetween(point.x, a.x, b.x) && isBetween(point.y, a.y, b.y)
}

function orientation(a, b, c) {
  const value = cross(a, b, c)
  if (Math.abs(value) <= EPSILON) return 0
  return value > 0 ? 1 : -1
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)

  if (o1 * o2 < 0 && o3 * o4 < 0) return true
  if (o1 === 0 && pointOnSegment(c, a, b)) return true
  if (o2 === 0 && pointOnSegment(d, a, b)) return true
  if (o3 === 0 && pointOnSegment(a, c, d)) return true
  if (o4 === 0 && pointOnSegment(b, c, d)) return true
  return false
}

function signedArea(vertices) {
  let twiceArea = 0
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index]
    const next = vertices[(index + 1) % vertices.length]
    twiceArea += current.x * next.y - next.x * current.y
  }
  return twiceArea / 2
}

function removeCollinearVertices(vertices) {
  let result = vertices.slice()
  let changed = true

  while (changed && result.length > 3) {
    changed = false
    const kept = []
    for (let index = 0; index < result.length; index += 1) {
      const previous = result[(index - 1 + result.length) % result.length]
      const current = result[index]
      const next = result[(index + 1) % result.length]
      const collinear = Math.abs(cross(previous, current, next)) <= EPSILON
      const liesBetween = isBetween(current.x, previous.x, next.x) &&
        isBetween(current.y, previous.y, next.y)
      if (collinear && liesBetween) {
        changed = true
      } else {
        kept.push(current)
      }
    }
    if (kept.length < 3) break
    result = kept
  }
  return result
}

function normalizeRing(ring, path, errors) {
  if (!ring || typeof ring !== 'object' || !Array.isArray(ring.vertices)) {
    errors.push(issue(ERROR.INVALID_RING, path))
    return null
  }

  const source = ring.vertices
  if (source.some((point) => !isFinitePoint(point))) {
    errors.push(issue(ERROR.INVALID_COORDINATE, path + '.vertices'))
    return null
  }

  let vertices = source.map((point) => ({ x: point.x, y: point.y }))
  if (vertices.length > 1 && samePoint(vertices[0], vertices[vertices.length - 1])) {
    vertices = vertices.slice(0, -1)
  }

  if (vertices.length < 3) {
    errors.push(issue(ERROR.TOO_FEW_VERTICES, path + '.vertices'))
    return null
  }

  for (let index = 0; index < vertices.length; index += 1) {
    const next = vertices[(index + 1) % vertices.length]
    if (samePoint(vertices[index], next)) {
      errors.push(issue(ERROR.CONSECUTIVE_DUPLICATE_VERTEX, path + '.vertices[' + index + ']'))
    }
  }

  if (vertices.length < 3 || errors.some((entry) => entry.path.startsWith(path))) {
    return null
  }

  const compact = removeCollinearVertices(vertices)
  if (compact.length < 3) {
    errors.push(issue(ERROR.ZERO_AREA_RING, path))
    return null
  }

  const count = compact.length
  for (let first = 0; first < count; first += 1) {
    const firstNext = (first + 1) % count
    for (let second = first + 1; second < count; second += 1) {
      const secondNext = (second + 1) % count
      const adjacent = first === second || firstNext === second || secondNext === first
      if (adjacent) continue
      if (segmentsIntersect(compact[first], compact[firstNext], compact[second], compact[secondNext])) {
        errors.push(issue(ERROR.SELF_INTERSECTION, path))
        return null
      }
    }
  }

  if (Math.abs(signedArea(compact)) <= EPSILON) {
    errors.push(issue(ERROR.ZERO_AREA_RING, path))
    return null
  }

  for (let index = 0; index < count; index += 1) {
    const previous = compact[(index - 1 + count) % count]
    const current = compact[index]
    const next = compact[(index + 1) % count]
    const incomingX = previous.x - current.x
    const incomingY = previous.y - current.y
    const outgoingX = next.x - current.x
    const outgoingY = next.y - current.y
    const reversesAlongSameLine = Math.abs(cross(previous, current, next)) <= EPSILON &&
      incomingX * outgoingX + incomingY * outgoingY > EPSILON
    if (reversesAlongSameLine) {
      errors.push(issue(ERROR.SELF_INTERSECTION, path))
      return null
    }
  }

  const areaM2 = Math.abs(signedArea(compact))
  const perimeterM = compact.reduce((total, point, index) => {
    const next = compact[(index + 1) % compact.length]
    return total + Math.hypot(next.x - point.x, next.y - point.y)
  }, 0)
  if (!Number.isFinite(areaM2) || !Number.isFinite(perimeterM)) {
    errors.push(issue(ERROR.INVALID_GEOMETRY_MEASUREMENT, path))
    return null
  }

  const closed = compact.concat([{ ...compact[0] }])
  return Object.freeze({
    vertices: Object.freeze(closed.map((point) => Object.freeze(point))),
    areaM2,
    perimeterM,
    openVertices: compact,
  })
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const a = vertices[previous]
    const b = vertices[index]
    if (pointOnSegment(point, a, b)) return 0
    const crosses = (a.y > point.y) !== (b.y > point.y)
    if (crosses) {
      const intersectionX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < intersectionX) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function ringsIntersect(first, second) {
  const a = first.openVertices
  const b = second.openVertices
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      if (segmentsIntersect(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true
    }
  }
  return false
}

function segmentLeavesRing(start, end, ringVertices) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const parameters = [0, 1]
  for (let index = 0; index < ringVertices.length; index += 1) {
    const a = ringVertices[index]
    const b = ringVertices[(index + 1) % ringVertices.length]
    const sx = b.x - a.x
    const sy = b.y - a.y
    const denominator = dx * sy - dy * sx
    const qx = a.x - start.x
    const qy = a.y - start.y
    if (Math.abs(denominator) > EPSILON) {
      const t = (qx * sy - qy * sx) / denominator
      const u = (qx * dy - qy * dx) / denominator
      if (t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON) {
        parameters.push(Math.max(0, Math.min(1, t)))
      }
    } else if (Math.abs(qx * dy - qy * dx) <= EPSILON && lengthSquared > EPSILON) {
      const first = (qx * dx + qy * dy) / lengthSquared
      const second = ((b.x - start.x) * dx + (b.y - start.y) * dy) / lengthSquared
      if (first >= -EPSILON && first <= 1 + EPSILON) parameters.push(Math.max(0, Math.min(1, first)))
      if (second >= -EPSILON && second <= 1 + EPSILON) parameters.push(Math.max(0, Math.min(1, second)))
    }
  }
  parameters.sort((a, b) => a - b)
  const unique = parameters.filter((value, index) => index === 0 || value - parameters[index - 1] > EPSILON)
  for (let index = 0; index < unique.length - 1; index += 1) {
    const t = (unique[index] + unique[index + 1]) / 2
    const point = { x: start.x + dx * t, y: start.y + dy * t }
    if (pointInRing(point, ringVertices) < 0) return true
  }
  return false
}

function ringLeavesBoundary(inner, outer) {
  return inner.openVertices.some((point, index) =>
    pointInRing(point, outer.openVertices) < 0 ||
    segmentLeavesRing(point, inner.openVertices[(index + 1) % inner.openVertices.length], outer.openVertices))
}

function classifySupportedShape(ring) {
  const points = ring.openVertices
  const orthogonal = points.every((point, index) => {
    const next = points[(index + 1) % points.length]
    return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON
  })
  if (!orthogonal) return 'unsupported'

  const areaSign = Math.sign(signedArea(points))
  let reflexCount = 0
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length]
    const current = points[index]
    const next = points[(index + 1) % points.length]
    const turn = cross(previous, current, next)
    if (turn * areaSign < -EPSILON) reflexCount += 1
  }

  if (points.length === 4 && reflexCount === 0) return 'rectangle'
  if (points.length === 6 && reflexCount === 1) return 'l-shape'
  // Any simple axis-aligned orthogonal polygon can be decomposed into
  // non-overlapping rectangles by the layout bridge.
  if (points.length >= 6 && points.length % 2 === 0) return 'orthogonal-polygon'
  return 'unsupported'
}

function validateExclusions(region, regionPath, ids, errors) {
  if (region.exclusions !== undefined && !Array.isArray(region.exclusions)) {
    errors.push(issue(ERROR.INVALID_EXCLUSION_LIST, regionPath + '.exclusions'))
    return []
  }
  const exclusions = region.exclusions ?? []
  const normalized = []

  exclusions.forEach((exclusion, index) => {
    const path = regionPath + '.exclusions[' + index + ']'
    if (!exclusion || typeof exclusion !== 'object' || typeof exclusion.id !== 'string' || !exclusion.id.trim()) {
      errors.push(issue(ERROR.INVALID_EXCLUSION, path))
      return
    }
    if (ids.has(exclusion.id)) {
      errors.push(issue(ERROR.DUPLICATE_ID, path + '.id'))
      return
    }
    ids.add(exclusion.id)

    const polygon = normalizeRing(exclusion.polygon, path + '.polygon', errors)
    if (!polygon) return
    const minX = Math.min(...polygon.openVertices.map((point) => point.x))
    const minY = Math.min(...polygon.openVertices.map((point) => point.y))
    if (Math.abs(minX) <= EPSILON && Math.abs(minY) <= EPSILON) {
      errors.push(issue(ERROR.INVALID_EXCLUSION, path + '.polygon.origin'))
      return
    }

    // Boundary contact is valid for an exclusion that starts at X=0 or Y=0.
    // Every segment is checked between boundary intersections so it cannot cross outside.
    if (ringLeavesBoundary(polygon, region.boundary)) {
      errors.push(issue(ERROR.EXCLUSION_OUTSIDE_REGION, path))
      return
    }

    for (const previous of normalized) {
      const overlaps = ringsIntersect(polygon, previous.polygon) ||
        pointInRing(polygon.openVertices[0], previous.polygon.openVertices) === 1 ||
        pointInRing(previous.polygon.openVertices[0], polygon.openVertices) === 1
      if (overlaps) {
        errors.push(issue(ERROR.OVERLAPPING_EXCLUSIONS, path))
        return
      }
    }

    normalized.push(Object.freeze({
      id: exclusion.id,
      kind: typeof exclusion.kind === 'string' ? exclusion.kind : 'other',
      polygon,
    }))
  })

  return normalized
}

/**
 * Validates metric lawn geometry. This module validates geometry only; it does
 * not generate sprinkler layouts or prove coverage/hydraulic feasibility.
 */
export function validateLawnGeometry(input) {
  const errors = []
  const warnings = []

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Object.freeze({
      validatorVersion: VALIDATOR_VERSION,
      valid: false,
      supported: false,
      status: 'invalid',
      errors: Object.freeze([issue(ERROR.INVALID_INPUT, '$')]),
      warnings: Object.freeze([]),
      regions: Object.freeze([]),
    })
  }

  if (input.schemaVersion !== 1) errors.push(issue(ERROR.INVALID_SCHEMA_VERSION, 'schemaVersion'))
  if (input.coordinateSystem !== 'local_cartesian_m') {
    errors.push(issue(ERROR.UNSUPPORTED_COORDINATE_SYSTEM, 'coordinateSystem'))
  }
  if (!Array.isArray(input.regions) || input.regions.length === 0) {
    errors.push(issue(ERROR.MISSING_REGIONS, 'regions'))
  }

  const geometryStatus = input.status ?? 'draft'
  if (!['draft', 'needs_scale', 'needs_confirmation', 'confirmed'].includes(geometryStatus)) {
    errors.push(issue(ERROR.INVALID_INPUT, 'status'))
  }

  if (input.reportedAreaM2 !== undefined &&
      (!Number.isFinite(input.reportedAreaM2) || input.reportedAreaM2 < 0)) {
    errors.push(issue(ERROR.INVALID_REPORTED_AREA, 'reportedAreaM2'))
  }

  const ids = new Set()
  const normalizedRegions = []
  const regionSummaries = []
  let supported = true

  if (Array.isArray(input.regions)) {
    input.regions.forEach((region, index) => {
      const path = 'regions[' + index + ']'
      if (!region || typeof region !== 'object' || typeof region.id !== 'string' || !region.id.trim()) {
        errors.push(issue(ERROR.INVALID_REGION_ID, path + '.id'))
        supported = false
        return
      }
      if (ids.has(region.id)) {
        errors.push(issue(ERROR.DUPLICATE_ID, path + '.id'))
        supported = false
        return
      }
      ids.add(region.id)

      const boundary = normalizeRing(region.boundary, path + '.boundary', errors)
      if (!boundary) {
        supported = false
        return
      }

      const shape = classifySupportedShape(boundary)
      if (shape === 'unsupported') {
        supported = false
        warnings.push(issue('unsupported_region_shape', path + '.boundary'))
      }

      const exclusions = validateExclusions({ ...region, boundary }, path, ids, errors)
      const unsupportedExclusion = exclusions.some((exclusion) => {
        const points = exclusion.polygon.openVertices
        return points.length !== 4 || !points.every((point, pointIndex) => {
          const next = points[(pointIndex + 1) % points.length]
          return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON
        })
      })
      if (unsupportedExclusion) {
        supported = false
        warnings.push(issue('unsupported_exclusion_shape', path + '.exclusions'))
      }
      const excludedAreaM2 = exclusions.reduce((sum, exclusion) => sum + exclusion.polygon.areaM2, 0)
          const summary = Object.freeze({
        id: region.id,
        shape,
        grossAreaM2: boundary.areaM2,
        excludedAreaM2,
        netAreaM2: Math.max(0, boundary.areaM2 - excludedAreaM2),
        outerPerimeterM: boundary.perimeterM,
        exclusionPerimeterM: exclusions.reduce((sum, exclusion) => sum + exclusion.polygon.perimeterM, 0),
      })
      normalizedRegions.push(Object.freeze({
        id: region.id,
        boundary: Object.freeze({ vertices: boundary.vertices }),
        exclusions: Object.freeze(exclusions.map((exclusion) => Object.freeze({
          id: exclusion.id,
          kind: exclusion.kind,
          polygon: Object.freeze({ vertices: exclusion.polygon.vertices }),
        }))),
      }))
      regionSummaries.push(summary)
    })
  }

  for (let first = 0; first < regionSummaries.length; first += 1) {
    for (let second = first + 1; second < regionSummaries.length; second += 1) {
      const firstRing = normalizeRing(normalizedRegions[first].boundary, 'regions[' + first + '].boundary.recheck', [])
      const secondRing = normalizeRing(normalizedRegions[second].boundary, 'regions[' + second + '].boundary.recheck', [])
      if (!firstRing || !secondRing) continue
      const overlap = ringsIntersect(firstRing, secondRing) ||
        pointInRing(firstRing.openVertices[0], secondRing.openVertices) === 1 ||
        pointInRing(secondRing.openVertices[0], firstRing.openVertices) === 1
      if (overlap) errors.push(issue(ERROR.OVERLAPPING_REGIONS, 'regions[' + first + ']/regions[' + second + ']'))
    }
  }

  if (regionSummaries.length > 1) {
    supported = false
    warnings.push(issue('multiple_regions_not_supported_by_v1_solver', 'regions'))
  }

  const valid = errors.length === 0
  const computedAreaM2 = regionSummaries.reduce((sum, region) => sum + region.netAreaM2, 0)
  const computedPerimeterM = regionSummaries.reduce((sum, region) =>
    sum + region.outerPerimeterM + region.exclusionPerimeterM, 0)

  let reportedAreaComparison
  if (Number.isFinite(input.reportedAreaM2) && input.reportedAreaM2 >= 0 && valid) {
    const differenceM2 = computedAreaM2 - input.reportedAreaM2
    reportedAreaComparison = Object.freeze({
      reportedAreaM2: input.reportedAreaM2,
      computedAreaM2,
      differenceM2,
      absoluteDifferenceM2: Math.abs(differenceM2),
      differencePercent: input.reportedAreaM2 === 0
        ? (computedAreaM2 === 0 ? 0 : null)
        : (differenceM2 / input.reportedAreaM2) * 100,
      toleranceApplied: false,
    })
  }

  let status = 'accepted'
  if (!valid) status = 'invalid'
  else if (geometryStatus === 'needs_scale') status = 'needs_scale'
  else if (geometryStatus !== 'confirmed') status = 'needs_confirmation'
  else if (!supported) status = 'unsupported'

  const result = {
    validatorVersion: VALIDATOR_VERSION,
    valid,
    supported,
    status,
    regions: Object.freeze(regionSummaries),
    computedAreaM2,
    computedPerimeterM,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  }

  if (valid) {
    result.normalizedGeometry = Object.freeze({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: geometryStatus,
      regions: Object.freeze(normalizedRegions),
    })
  }
  if (reportedAreaComparison) result.reportedAreaComparison = reportedAreaComparison

  return Object.freeze(result)
}
