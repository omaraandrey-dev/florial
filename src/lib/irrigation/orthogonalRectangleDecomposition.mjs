const EPSILON = 1e-8

function openRing(vertices) {
  return vertices.filter((point, index) => index < vertices.length - 1 ||
    Math.hypot(point.x - vertices[0].x, point.y - vertices[0].y) > EPSILON)
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const a = vertices[previous]
    const b = vertices[index]
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    if (Math.abs(cross) <= EPSILON &&
        point.x >= Math.min(a.x, b.x) - EPSILON && point.x <= Math.max(a.x, b.x) + EPSILON &&
        point.y >= Math.min(a.y, b.y) - EPSILON && point.y <= Math.max(a.y, b.y) + EPSILON) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (point.x < x) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => Number(value.toFixed(8))))].sort((a, b) => a - b)
}

/**
 * Partition a simple orthogonal lawn minus rectangular exclusions into
 * non-overlapping axis-aligned rectangles. Horizontal runs are merged across
 * adjacent Y bands when their X interval is identical.
 */
export function decomposeOrthogonalRegion(region, expectedNetAreaM2 = null) {
  const boundary = openRing(region?.boundary?.vertices ?? [])
  if (boundary.length < 4) return null
  const exclusions = (region.exclusions ?? []).map((entry) => openRing(entry.polygon?.vertices ?? []))
  const rings = [boundary, ...exclusions]
  const xs = uniqueSorted(rings.flatMap((ring) => ring.map((point) => point.x)))
  const ys = uniqueSorted(rings.flatMap((ring) => ring.map((point) => point.y)))
  if (xs.length < 2 || ys.length < 2) return null

  const active = new Map()
  const rectangles = []
  for (let row = 0; row < ys.length - 1; row += 1) {
    const minY = ys[row]
    const maxY = ys[row + 1]
    const midY = (minY + maxY) / 2
    const runs = []
    let runStart = null
    let runEnd = null

    for (let column = 0; column < xs.length - 1; column += 1) {
      const minX = xs[column]
      const maxX = xs[column + 1]
      const point = { x: (minX + maxX) / 2, y: midY }
      const inside = pointInRing(point, boundary) === 1 &&
        !exclusions.some((ring) => pointInRing(point, ring) >= 0)
      if (inside) {
        if (runStart === null) runStart = minX
        runEnd = maxX
      } else if (runStart !== null) {
        runs.push({ minX: runStart, maxX: runEnd })
        runStart = null
        runEnd = null
      }
    }
    if (runStart !== null) runs.push({ minX: runStart, maxX: runEnd })

    const nextActive = new Map()
    for (const run of runs) {
      const key = run.minX.toFixed(8) + ':' + run.maxX.toFixed(8)
      const previous = active.get(key)
      if (previous && Math.abs(previous.maxY - minY) <= EPSILON) {
        previous.maxY = maxY
        nextActive.set(key, previous)
      } else {
        nextActive.set(key, { ...run, minY, maxY })
      }
    }
    for (const [key, rectangle] of active) {
      if (!nextActive.has(key)) rectangles.push(rectangle)
    }
    active.clear()
    for (const [key, rectangle] of nextActive) active.set(key, rectangle)
  }
  rectangles.push(...active.values())

  const normalized = rectangles.map((rectangle, index) => {
    const widthM = rectangle.maxX - rectangle.minX
    const heightM = rectangle.maxY - rectangle.minY
    return Object.freeze({
      id: 'rect-' + String(index + 1).padStart(3, '0'),
      ...rectangle,
      widthM,
      heightM,
      shortSideM: Math.min(widthM, heightM),
      lengthM: Math.max(widthM, heightM),
    })
  }).filter((rectangle) => rectangle.widthM > EPSILON && rectangle.heightM > EPSILON)
    .sort((a, b) => a.shortSideM - b.shortSideM ||
      a.lengthM - b.lengthM || a.minY - b.minY || a.minX - b.minX)

  const areaM2 = normalized.reduce((sum, rectangle) => sum +
    rectangle.widthM * rectangle.heightM, 0)
  const netArea = Number.isFinite(expectedNetAreaM2)
    ? expectedNetAreaM2
    : Math.abs(boundary.reduce((sum, point, index) => {
      const next = boundary[(index + 1) % boundary.length]
      return sum + point.x * next.y - next.x * point.y
    }, 0) / 2) - exclusions.reduce((sum, ring) => Math.abs(ring.reduce((total, point, index) => {
      const next = ring[(index + 1) % ring.length]
      return total + point.x * next.y - next.x * point.y
    }, 0) / 2), 0)

  if (Math.abs(areaM2 - netArea) > Math.max(1e-6, netArea * 1e-8)) return null

  for (let first = 0; first < normalized.length; first += 1) {
    for (let second = first + 1; second < normalized.length; second += 1) {
      const a = normalized[first]
      const b = normalized[second]
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (overlapX > EPSILON && overlapY > EPSILON) return null
    }
  }
  return Object.freeze(normalized)
}
