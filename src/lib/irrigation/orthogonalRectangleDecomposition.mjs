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

function buildPartition(boundary, exclusions, xs, ys, orientation) {
  const sweepCoordinates = orientation === 'horizontal' ? ys : xs
  const crossCoordinates = orientation === 'horizontal' ? xs : ys
  const active = new Map()
  const rectangles = []

  for (let band = 0; band < sweepCoordinates.length - 1; band += 1) {
    const sweepStart = sweepCoordinates[band]
    const sweepEnd = sweepCoordinates[band + 1]
    const sweepMidpoint = (sweepStart + sweepEnd) / 2
    const runs = []
    let runStart = null
    let runEnd = null

    for (let interval = 0; interval < crossCoordinates.length - 1; interval += 1) {
      const crossStart = crossCoordinates[interval]
      const crossEnd = crossCoordinates[interval + 1]
      const crossMidpoint = (crossStart + crossEnd) / 2
      const point = orientation === 'horizontal'
        ? { x: crossMidpoint, y: sweepMidpoint }
        : { x: sweepMidpoint, y: crossMidpoint }
      const inside = pointInRing(point, boundary) === 1 &&
        !exclusions.some((ring) => pointInRing(point, ring) >= 0)

      if (inside) {
        if (runStart === null) runStart = crossStart
        runEnd = crossEnd
      } else if (runStart !== null) {
        runs.push({ start: runStart, end: runEnd })
        runStart = null
        runEnd = null
      }
    }
    if (runStart !== null) runs.push({ start: runStart, end: runEnd })

    const nextActive = new Map()
    for (const run of runs) {
      const key = run.start.toFixed(8) + ':' + run.end.toFixed(8)
      const previous = active.get(key)
      if (previous) {
        if (orientation === 'horizontal') previous.maxY = sweepEnd
        else previous.maxX = sweepEnd
        nextActive.set(key, previous)
      } else {
        const rectangle = orientation === 'horizontal'
          ? { minX: run.start, maxX: run.end, minY: sweepStart, maxY: sweepEnd }
          : { minX: sweepStart, maxX: sweepEnd, minY: run.start, maxY: run.end }
        nextActive.set(key, rectangle)
      }
    }
    for (const [key, rectangle] of active) {
      if (!nextActive.has(key)) rectangles.push(rectangle)
    }
    active.clear()
    for (const [key, rectangle] of nextActive) active.set(key, rectangle)
  }
  rectangles.push(...active.values())

  return rectangles.map((rectangle, index) => {
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
}

function partitionPenalty(rectangles) {
  return rectangles.reduce((total, rectangle) => {
    const ratio = rectangle.shortSideM / rectangle.lengthM
    return total + rectangle.widthM * rectangle.heightM * (1 - ratio)
  }, 0)
}

function hasNoOverlap(rectangles) {
  for (let first = 0; first < rectangles.length; first += 1) {
    for (let second = first + 1; second < rectangles.length; second += 1) {
      const a = rectangles[first]
      const b = rectangles[second]
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (overlapX > EPSILON && overlapY > EPSILON) return false
    }
  }
  return true
}

/**
 * Partition a simple orthogonal lawn minus rectangular exclusions into
 * non-overlapping axis-aligned rectangles. Both sweep orientations are
 * evaluated; the partition with less artificial elongation is preferred.
 * This keeps compact areas (for example a 2 x 2 m L-shape corner) intact
 * instead of splitting them into narrow directional-strip fragments.
 */
export function decomposeOrthogonalRegion(region, expectedNetAreaM2 = null) {
  const boundary = openRing(region?.boundary?.vertices ?? [])
  if (boundary.length < 4) return null
  const exclusions = (region.exclusions ?? []).map((entry) => openRing(entry.polygon?.vertices ?? []))
  const rings = [boundary, ...exclusions]
  const xs = uniqueSorted(rings.flatMap((ring) => ring.map((point) => point.x)))
  const ys = uniqueSorted(rings.flatMap((ring) => ring.map((point) => point.y)))
  if (xs.length < 2 || ys.length < 2) return null

  const horizontal = buildPartition(boundary, exclusions, xs, ys, 'horizontal')
  const vertical = buildPartition(boundary, exclusions, xs, ys, 'vertical')
  const horizontalPenalty = partitionPenalty(horizontal)
  const verticalPenalty = partitionPenalty(vertical)
  // Keep the historical horizontal sweep on ties to preserve deterministic
  // ordering for rectangles and geometries without a meaningful alternative.
  const normalized = verticalPenalty + EPSILON < horizontalPenalty ? vertical : horizontal

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

  if (Math.abs(areaM2 - netArea) > Math.max(1e-6, netArea * 1e-8) ||
      !hasNoOverlap(normalized)) return null

  return Object.freeze(normalized)
}
