const EPSILON = 1e-8

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function openRing(vertices = []) {
  return vertices.filter((point, index) => index < vertices.length - 1 ||
    distance(point, vertices[0]) > EPSILON)
}

function signedArea(ring) {
  let twiceArea = 0
  for (let index = 0; index < ring.length; index += 1) {
    const a = ring[index]
    const b = ring[(index + 1) % ring.length]
    twiceArea += a.x * b.y - b.x * a.y
  }
  return twiceArea / 2
}

function normalizeTextAngle(angle) {
  let value = angle
  while (value > 90) value -= 180
  while (value < -90) value += 180
  return value
}

/**
 * Creates one outward-offset dimension annotation for every edge of the
 * lawn boundary and every rectangular exclusion. Coordinates remain in the
 * lawn's Y-up metre system; the UI converts them to SVG screen coordinates.
 */
export function buildLawnDimensionAnnotations(boundaryVertices = [], exclusions = []) {
  const rings = [
    { id: 'outer', vertices: openRing(boundaryVertices) },
    ...exclusions.map((entry, index) => ({
      id: entry.id ?? 'exclusion-' + (index + 1),
      vertices: openRing(entry.polygon?.vertices ?? entry.vertices ?? []),
    })),
  ]
  const annotations = []
  for (const ring of rings) {
    if (ring.vertices.length < 3) continue
    const orientation = signedArea(ring.vertices) >= 0 ? 1 : -1
    for (let index = 0; index < ring.vertices.length; index += 1) {
      const a = ring.vertices[index]
      const b = ring.vertices[(index + 1) % ring.vertices.length]
      const lengthM = distance(a, b)
      if (lengthM <= EPSILON) continue
      const dx = (b.x - a.x) / lengthM
      const dy = (b.y - a.y) / lengthM
      const outward = {
        x: orientation * dy,
        y: orientation * -dx,
      }
      const offset = 0.28
      const lineStart = { x: a.x + outward.x * offset, y: a.y + outward.y * offset }
      const lineEnd = { x: b.x + outward.x * offset, y: b.y + outward.y * offset }
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const labelPosition = {
        x: midpoint.x + outward.x * 0.58,
        y: midpoint.y + outward.y * 0.58,
      }
      const screenAngle = Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI
      annotations.push(Object.freeze({
        id: ring.id + '-edge-' + index,
        ringId: ring.id,
        lengthM,
        lineStart: Object.freeze(lineStart),
        lineEnd: Object.freeze(lineEnd),
        labelPosition: Object.freeze(labelPosition),
        angleDeg: normalizeTextAngle(screenAngle),
      }))
    }
  }
  return Object.freeze(annotations)
}
