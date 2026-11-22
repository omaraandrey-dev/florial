export const FLORIAL_IRRIGATION_PROJECT_STANDARD = Object.freeze({
  source: Object.freeze({
    tapSizeInches: 1,
    inletPressureBar: 4,
    supplyPipeDiameterMm: 25,
    connectionCorner: 'top-right',
  }),
  pipes: Object.freeze({
    mainDiameterMm: 25,
    zoneDiameterMm: 25,
  }),
  zoneCapacity: Object.freeze({
    maxHeadsPerZone: 6,
  }),
})

const EPSILON = 1e-8

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function appendUnique(points, point) {
  const previous = points[points.length - 1]
  if (!previous || pointDistance(previous, point) > EPSILON) {
    points.push(Object.freeze({ x: point.x, y: point.y }))
  }
}

function projectToSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    : 0
  return {
    point: { x: a.x + t * dx, y: a.y + t * dy },
    ratio: t,
  }
}

function buildPerimeterContext(geometry) {
  const rawVertices = geometry?.regions?.[0]?.boundary?.vertices
  if (!Array.isArray(rawVertices) || rawVertices.length < 4) return null

  const vertices = rawVertices.filter((point, index) =>
    index < rawVertices.length - 1 || pointDistance(point, rawVertices[0]) > EPSILON)
  if (vertices.length < 4) return null

  const maxX = Math.max(...vertices.map((point) => point.x))
  const maxY = Math.max(...vertices.map((point) => point.y))
  const connection = { x: maxX, y: maxY }

  let startIndex = 0
  let nearestStart = Number.POSITIVE_INFINITY
  vertices.forEach((point, index) => {
    const distance = pointDistance(point, connection)
    if (distance < nearestStart) {
      nearestStart = distance
      startIndex = index
    }
  })

  const orderedVertices = vertices.slice(startIndex).concat(vertices.slice(0, startIndex))
  const forwardSegments = []
  let perimeterLengthM = 0

  for (let index = 0; index < orderedVertices.length; index += 1) {
    const a = orderedVertices[index]
    const b = orderedVertices[(index + 1) % orderedVertices.length]
    const length = pointDistance(a, b)
    forwardSegments.push({
      a,
      b,
      length,
      startOffsetM: perimeterLengthM,
      endOffsetM: perimeterLengthM + length,
    })
    perimeterLengthM += length
  }

  const reverseSegments = forwardSegments.slice().reverse().map((segment) => ({
    a: segment.b,
    b: segment.a,
    length: segment.length,
  }))

  return {
    connection,
    startVertex: orderedVertices[0],
    forwardSegments,
    reverseSegments,
    perimeterLengthM,
  }
}

function locateSprinklerOnPerimeter(position, context) {
  let nearest = null
  let nearestDistanceM = Number.POSITIVE_INFINITY

  for (const segment of context.forwardSegments) {
    const projected = projectToSegment(position, segment.a, segment.b)
    const distance = pointDistance(position, projected.point)
    let forwardOffsetM = segment.startOffsetM + segment.length * projected.ratio
    if (forwardOffsetM >= context.perimeterLengthM - EPSILON) forwardOffsetM = 0

    if (distance < nearestDistanceM - EPSILON ||
        (Math.abs(distance - nearestDistanceM) <= EPSILON &&
          forwardOffsetM < (nearest?.forwardOffsetM ?? Number.POSITIVE_INFINITY))) {
      nearestDistanceM = distance
      nearest = {
        point: projected.point,
        forwardOffsetM,
        distanceToBoundaryM: distance,
      }
    }
  }

  return nearest
}

function branchDistance(forwardOffsetM, direction, perimeterLengthM) {
  return direction === 'forward'
    ? forwardOffsetM
    : perimeterLengthM - forwardOffsetM
}

/**
 * Assigns sprinklers to source-fed perimeter branches. Sprinkler arc is
 * deliberately ignored: every zone has the same six-head maximum.
 */
export function buildIrrigationZones(sprinklers = [], geometry) {
  const context = buildPerimeterContext(geometry)
  if (!context || !Array.isArray(sprinklers) || sprinklers.length === 0) {
    return Object.freeze([])
  }

  const byDirection = { forward: [], reverse: [] }
  const midpointM = context.perimeterLengthM / 2

  for (const sprinkler of sprinklers) {
    const location = locateSprinklerOnPerimeter(sprinkler.position, context)
    if (!location) continue

    // The exact opposite point belongs to the reverse branch. This keeps
    // the two routes disjoint while preserving a deterministic tie-break.
    const branchDirection = location.forwardOffsetM < midpointM - EPSILON
      ? 'forward'
      : 'reverse'

    byDirection[branchDirection].push({
      sprinkler,
      location,
      distanceFromSourceM: branchDistance(
        location.forwardOffsetM,
        branchDirection,
        context.perimeterLengthM,
      ),
    })
  }

  const zones = []
  for (const branchDirection of ['forward', 'reverse']) {
    const ordered = byDirection[branchDirection].sort((a, b) =>
      a.distanceFromSourceM - b.distanceFromSourceM ||
      String(a.sprinkler.id).localeCompare(String(b.sprinkler.id)))

    const limit = FLORIAL_IRRIGATION_PROJECT_STANDARD.zoneCapacity.maxHeadsPerZone
    const zoneCount = Math.ceil(ordered.length / limit)
    const baseSize = Math.floor(ordered.length / zoneCount)
    const extraHeads = ordered.length % zoneCount
    let offset = 0

    // Balance the last zone instead of creating an avoidable one-head zone
    // (for example, 7 heads become 4 + 3 rather than 6 + 1).
    for (let zoneIndex = 0; zoneIndex < zoneCount; zoneIndex += 1) {
      const batchSize = baseSize + (zoneIndex < extraHeads ? 1 : 0)
      const batch = ordered.slice(offset, offset + batchSize)
      offset += batchSize
      zones.push(Object.freeze({
        id: 'zone-' + String(zones.length + 1).padStart(2, '0'),
        branchDirection,
        sprinklerIds: Object.freeze(batch.map((entry) => entry.sprinkler.id)),
        sprinklerCount: batch.length,
      }))
    }
  }

  return Object.freeze(zones)
}

function buildZoneRoute(context, branchDirection, entries) {
  const segments = branchDirection === 'forward'
    ? context.forwardSegments
    : context.reverseSegments
  const ordered = entries.slice().sort((a, b) =>
    a.distanceFromSourceM - b.distanceFromSourceM)
  const targetDistanceM = ordered[ordered.length - 1]?.distanceFromSourceM ?? 0
  const points = []
  appendUnique(points, context.connection)
  appendUnique(points, context.startVertex)

  const lateralConnections = []
  let traversedM = 0
  let entryIndex = 0

  for (const segment of segments) {
    const segmentStartM = traversedM
    const segmentEndM = traversedM + segment.length

    while (entryIndex < ordered.length &&
      ordered[entryIndex].distanceFromSourceM <= segmentEndM + EPSILON) {
      const entry = ordered[entryIndex]
      const ratio = segment.length > 0
        ? Math.max(0, Math.min(1, (entry.distanceFromSourceM - segmentStartM) / segment.length))
        : 0
      const projectedPoint = {
        x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
        y: segment.a.y + (segment.b.y - segment.a.y) * ratio,
      }
      appendUnique(points, projectedPoint)

      if (entry.location.distanceToBoundaryM > 0.05) {
        lateralConnections.push(Object.freeze({
          sprinklerId: entry.sprinkler.id,
          points: Object.freeze([
            Object.freeze(projectedPoint),
            Object.freeze({
              x: entry.sprinkler.position.x,
              y: entry.sprinkler.position.y,
            }),
          ]),
        }))
      }
      entryIndex += 1
    }

    if (segmentEndM >= targetDistanceM - EPSILON) break
    appendUnique(points, segment.b)
    traversedM = segmentEndM
  }

  return Object.freeze({
    points: Object.freeze(points),
    lateralConnections: Object.freeze(lateralConnections),
  })
}

/**
 * Builds one continuous pipe route per irrigation zone. Perimeter heads are
 * connected in sequence; only interior heads receive short lateral take-offs.
 */
export function buildPerimeterPipeNetwork(geometry, sprinklers = [], zones = null) {
  const context = buildPerimeterContext(geometry)
  if (!context) return null

  const resolvedZones = zones ?? buildIrrigationZones(sprinklers, geometry)
  const branches = resolvedZones.map((zone) => {
    const entries = zone.sprinklerIds
      .map((id) => sprinklers.find((sprinkler) => sprinkler.id === id))
      .filter(Boolean)
      .map((sprinkler) => {
        const location = locateSprinklerOnPerimeter(sprinkler.position, context)
        const distanceFromSourceM = location
          ? branchDistance(location.forwardOffsetM, zone.branchDirection, context.perimeterLengthM)
          : 0
        return { sprinkler, location, distanceFromSourceM }
      })
      .filter((entry) => entry.location)
      .sort((a, b) => a.distanceFromSourceM - b.distanceFromSourceM)

    const route = buildZoneRoute(context, zone.branchDirection, entries)
    return Object.freeze({
      zoneId: zone.id,
      branchDirection: zone.branchDirection,
      sprinklerIds: zone.sprinklerIds,
      points: route.points,
      lateralConnections: route.lateralConnections,
      diameterMm: FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes.zoneDiameterMm,
    })
  })

  return Object.freeze({
    connectionPoint: Object.freeze(context.connection),
    mainRoute: Object.freeze([
      Object.freeze(context.connection),
      Object.freeze(context.startVertex),
    ].filter((point, index, points) =>
      index === 0 || pointDistance(point, points[index - 1]) > EPSILON)),
    mainDiameterMm: FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes.mainDiameterMm,
    zoneDiameterMm: FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes.zoneDiameterMm,
    branches: Object.freeze(branches),
  })
}
