export const FLORIAL_IRRIGATION_STANDARD = Object.freeze({
  connection: Object.freeze({
    description: '1-inch tap',
    nominalPressureBar: 4,
    supplyPipeDiameterMm: 25,
    entryCorner: 'top-right',
  }),
  pipes: Object.freeze({
    mainDiameterMm: 32,
    zoneDiameterMm: 25,
    routingPreference: 'perimeter-first',
  }),
  lineCapacity: Object.freeze({
    sectorHeads: 6,
    fullCircleHeads: 4,
  }),
})

export function buildIrrigationZones(sprinklers = []) {
  const groups = [
    { key: 'sector', limit: FLORIAL_IRRIGATION_STANDARD.lineCapacity.sectorHeads, entries: [] },
    { key: 'full-circle', limit: FLORIAL_IRRIGATION_STANDARD.lineCapacity.fullCircleHeads, entries: [] },
  ]
  for (const sprinkler of sprinklers) {
    groups[sprinkler.arcDeg === 360 ? 1 : 0].entries.push(sprinkler)
  }

  const zones = []
  const assignment = new Map()
  for (const group of groups) {
    for (let offset = 0; offset < group.entries.length; offset += group.limit) {
      const chunk = group.entries.slice(offset, offset + group.limit)
      const id = 'Z' + String(zones.length + 1).padStart(2, '0')
      for (const sprinkler of chunk) assignment.set(sprinkler.id, id)
      zones.push(Object.freeze({
        id,
        type: group.key,
        sprinklerIds: Object.freeze(chunk.map((entry) => entry.id)),
        sprinklerCount: chunk.length,
        maximumHeads: group.limit,
        rule: group.key === 'full-circle'
          ? 'maximum_four_full_circle_R-VAN_heads_per_line'
          : 'maximum_six_sector_R-VAN_heads_per_line',
      }))
    }
  }

  return Object.freeze({
    zones: Object.freeze(zones),
    sprinklers: Object.freeze(sprinklers.map((entry) => Object.freeze({
      ...entry,
      zoneId: assignment.get(entry.id) ?? null,
    }))),
    basis: 'owner_defined_florial_line_capacity_rules',
  })
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function projectToSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return { x: a.x, y: a.y }
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
  return { x: a.x + t * dx, y: a.y + t * dy }
}

function pointInRing(point, vertices) {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const a = vertices[j]
    const b = vertices[i]
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside
}

function pathInside(path, vertices) {
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1]
    const b = path[i]
    const length = distance(a, b)
    const samples = Math.max(2, Math.ceil(length / 0.25))
    for (let step = 1; step < samples; step += 1) {
      const t = step / samples
      if (!pointInRing({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, vertices)) return false
    }
  }
  return true
}

function simplifyPath(points) {
  return points.filter((point, index) => index === 0 ||
    distance(point, points[index - 1]) > 1e-6)
}

/**
 * Creates a schematic pipe route only. It does not calculate pipe losses,
 * hydraulic pressure, flow or pump requirements.
 */
export function buildPerimeterPipeNetwork(geometry, sprinklers = []) {
  const sourceVertices = geometry?.regions?.[0]?.boundary?.vertices
  if (!Array.isArray(sourceVertices) || sourceVertices.length < 4) {
    return Object.freeze({ status: 'geometry_not_supported', trunk: Object.freeze([]), branches: Object.freeze([]) })
  }
  const vertices = sourceVertices.filter((point, index) =>
    index < sourceVertices.length - 1 || distance(point, sourceVertices[0]) > 1e-8)
  const maxX = Math.max(...vertices.map((point) => point.x))
  const maxY = Math.max(...vertices.map((point) => point.y))
  const source = { x: maxX, y: maxY }
  let sourceIndex = 0
  let sourceDistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < vertices.length; i += 1) {
    const d = distance(source, vertices[i])
    if (d < sourceDistance) { sourceDistance = d; sourceIndex = i }
  }
  const ordered = [...vertices.slice(sourceIndex), ...vertices.slice(0, sourceIndex), vertices[sourceIndex]]
  const trunk = Object.freeze(ordered.map((point) => Object.freeze({ x: point.x, y: point.y })))

  const branches = sprinklers.map((sprinkler) => {
    let attachment = null
    let attachmentDistance = Number.POSITIVE_INFINITY
    for (let i = 0; i < vertices.length; i += 1) {
      const projected = projectToSegment(sprinkler.position, vertices[i], vertices[(i + 1) % vertices.length])
      const d = distance(sprinkler.position, projected)
      if (d < attachmentDistance) { attachmentDistance = d; attachment = projected }
    }
    if (!attachment) return null
    const horizontalFirst = simplifyPath([
      attachment,
      { x: sprinkler.position.x, y: attachment.y },
      sprinkler.position,
    ])
    const verticalFirst = simplifyPath([
      attachment,
      { x: attachment.x, y: sprinkler.position.y },
      sprinkler.position,
    ])
    const horizontalValid = pathInside(horizontalFirst, vertices)
    const verticalValid = pathInside(verticalFirst, vertices)
    const chosen = horizontalValid ? horizontalFirst
      : verticalValid ? verticalFirst
        : [attachment, sprinkler.position]
    return Object.freeze({
      sprinklerId: sprinkler.id,
      zoneId: sprinkler.zoneId ?? null,
      points: Object.freeze(chosen.map((point) => Object.freeze({ x: point.x, y: point.y }))),
      connection: 'nearest_perimeter_point',
      routeInsideLawnChecked: horizontalValid || verticalValid,
    })
  }).filter(Boolean)

  return Object.freeze({
    status: 'schematic_route_generated',
    source: Object.freeze({ ...source, label: 'top_right_corner' }),
    trunk: Object.freeze(trunk),
    branches: Object.freeze(branches),
    mainPipeDiameterMm: FLORIAL_IRRIGATION_STANDARD.pipes.mainDiameterMm,
    zonePipeDiameterMm: FLORIAL_IRRIGATION_STANDARD.pipes.zoneDiameterMm,
    routingPreference: 'perimeter_first_with_internal_branches',
    hydraulicLossesCalculated: false,
  })
}
