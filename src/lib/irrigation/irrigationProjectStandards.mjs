export const FLORIAL_IRRIGATION_PROJECT_STANDARD = Object.freeze({
  source: Object.freeze({
    tapSizeInches: 1,
    inletPressureBar: 4,
    supplyPipeDiameterMm: 25,
    connectionCorner: 'top-right',
  }),
  pipes: Object.freeze({
    mainDiameterMm: 32,
    zoneDiameterMm: 25,
  }),
  zoneCapacity: Object.freeze({
    sectorHeads: 6,
    fullCircleHeads: 4,
  }),
})

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function projectToSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    : 0
  return { x: a.x + t * dx, y: a.y + t * dy }
}

export function buildIrrigationZones(sprinklers = []) {
  const groups = new Map()
  for (const sprinkler of sprinklers) {
    const arc = Number(sprinkler.arcDeg)
    const type = arc === 360 ? 'full_circle' : 'sector'
    const key = type + ':' + arc
    if (!groups.has(key)) groups.set(key, { type, arcDeg: arc, sprinklers: [] })
    groups.get(key).sprinklers.push(sprinkler)
  }

  const zones = []
  for (const group of groups.values()) {
    const limit = group.type === 'full_circle'
      ? FLORIAL_IRRIGATION_PROJECT_STANDARD.zoneCapacity.fullCircleHeads
      : FLORIAL_IRRIGATION_PROJECT_STANDARD.zoneCapacity.sectorHeads
    for (let offset = 0; offset < group.sprinklers.length; offset += limit) {
      const batch = group.sprinklers.slice(offset, offset + limit)
      zones.push(Object.freeze({
        id: 'zone-' + String(zones.length + 1).padStart(2, '0'),
        type: group.type,
        arcDeg: group.arcDeg,
        sprinklerIds: Object.freeze(batch.map((entry) => entry.id)),
        sprinklerCount: batch.length,
        maximumHeads: limit,
      }))
    }
  }
  return Object.freeze(zones)
}

export function buildPerimeterPipeNetwork(geometry, sprinklers = []) {
  const vertices = geometry?.regions?.[0]?.boundary?.vertices
  if (!Array.isArray(vertices) || vertices.length < 4) return null

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
  const ordered = vertices.slice(startIndex).concat(vertices.slice(0, startIndex))
  const mainRoute = [...ordered, ordered[0]].map((point) => Object.freeze({ x: point.x, y: point.y }))
  const boundarySegments = mainRoute.slice(0, -1).map((point, index) => ({
    a: point,
    b: mainRoute[index + 1],
  }))

  const branches = sprinklers.map((sprinkler) => {
    let nearest = null
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const segment of boundarySegments) {
      const candidate = projectToSegment(sprinkler.position, segment.a, segment.b)
      const distance = pointDistance(candidate, sprinkler.position)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = candidate
      }
    }
    return Object.freeze({
      sprinklerId: sprinkler.id,
      points: Object.freeze([
        Object.freeze({ x: nearest.x, y: nearest.y }),
        Object.freeze({ x: sprinkler.position.x, y: sprinkler.position.y }),
      ]),
      diameterMm: FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes.zoneDiameterMm,
    })
  })

  return Object.freeze({
    connectionPoint: Object.freeze(connection),
    mainDiameterMm: FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes.mainDiameterMm,
    mainRoute: Object.freeze(mainRoute),
    branches: Object.freeze(branches),
    hydraulicCalculation: 'not_performed',
  })
}
