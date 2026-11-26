import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from './rainBirdRvanPerformanceData.mjs'
import {
  findRainBirdHevanPerformancePoint,
  RAIN_BIRD_HEVAN_DATASET,
} from './rainBirdHevanPerformanceData.mjs'

const ENGINE_VERSION = '0.4.0'
const EPSILON = 1e-8
const DEFAULT_SAMPLE_STEP_M = 0.5
const MAX_SAMPLE_POINTS = 30000
const MAX_CANDIDATES = 12000
const MAX_SELECTED_SPRINKLERS = 150
const DEFAULT_RVAN_LAYOUT_RADII_M = Object.freeze({ 'R-VAN14': 3, 'R-VAN18': 5, 'R-VAN24': 6 })

function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function signedArea(points) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0) / 2
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const a = vertices[previous]
    const b = vertices[index]
    const crossValue = cross(a, b, point)
    const within = point.x >= Math.min(a.x, b.x) - EPSILON &&
      point.x <= Math.max(a.x, b.x) + EPSILON &&
      point.y >= Math.min(a.y, b.y) - EPSILON &&
      point.y <= Math.max(a.y, b.y) + EPSILON
    if (Math.abs(crossValue) <= EPSILON && within) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function unit(vector) {
  const length = Math.hypot(vector.x, vector.y)
  return length > EPSILON ? { x: vector.x / length, y: vector.y / length } : null
}

function inwardNormal(a, b, orientation) {
  const tangent = unit({ x: b.x - a.x, y: b.y - a.y })
  if (!tangent) return null
  return orientation > 0
    ? { x: -tangent.y, y: tangent.x }
    : { x: tangent.y, y: -tangent.x }
}

function sectorContains(point, center, directionDeg, arcDeg, radiusM) {
  const dx = point.x - center.x
  const dy = point.y - center.y
  if (Math.hypot(dx, dy) > radiusM + EPSILON) return false
  if (arcDeg === 360) return true
  const angle = normalizeDegrees(Math.atan2(dy, dx) * 180 / Math.PI)
  const difference = Math.abs(((angle - directionDeg + 540) % 360) - 180)
  return difference <= arcDeg / 2 + EPSILON
}

function sprinklerCoversPoint(sprinkler, point) {
  if (sprinkler.pattern === 'strip' && sprinkler.stripBounds) {
    const bounds = sprinkler.stripBounds
    if (point.x < bounds.minX - EPSILON || point.x > bounds.maxX + EPSILON ||
        point.y < bounds.minY - EPSILON || point.y > bounds.maxY + EPSILON) return false
    if (sprinkler.stripAxis === 'horizontal') {
      if (sprinkler.stripDirection === 'left') return point.x <= sprinkler.position.x + EPSILON &&
        point.x >= sprinkler.position.x - sprinkler.stripLengthM - EPSILON
      if (sprinkler.stripDirection === 'right') return point.x >= sprinkler.position.x - EPSILON &&
        point.x <= sprinkler.position.x + sprinkler.stripLengthM + EPSILON
      return point.x >= bounds.minX - EPSILON && point.x <= bounds.maxX + EPSILON
    }
    if (sprinkler.stripDirection === 'up') return point.y >= sprinkler.position.y - EPSILON &&
      point.y <= sprinkler.position.y + sprinkler.stripLengthM + EPSILON
    if (sprinkler.stripDirection === 'down') return point.y <= sprinkler.position.y + EPSILON &&
      point.y >= sprinkler.position.y - sprinkler.stripLengthM - EPSILON
    return point.y >= bounds.minY - EPSILON && point.y <= bounds.maxY + EPSILON
  }
  return Number.isFinite(sprinkler.radiusM) && sectorContains(
    point,
    sprinkler.position,
    sprinkler.directionDeg ?? 0,
    sprinkler.arcDeg ?? 360,
    sprinkler.radiusM,
  )
}

function pointInsideSprayBoundary(point, geometry) {
  const region = geometry?.regions?.[0]
  if (!region?.boundary?.vertices) return false
  if (pointInRing(point, region.boundary.vertices) < 0) return false
  return !(region.exclusions ?? []).some((exclusion) =>
    pointInRing(point, exclusion.polygon.vertices) > 0)
}

function candidateSectorFitsGeometry(candidate, geometry) {
  const arc = candidate.arcDeg ?? 360
  const start = arc === 360 ? 0 : (candidate.directionDeg ?? 0) - arc / 2
  for (let offset = 0; offset <= arc + EPSILON; offset += 1) {
    const angle = (start + Math.min(offset, arc)) * Math.PI / 180
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    for (let distanceM = 0; distanceM <= candidate.radiusM + EPSILON; distanceM += 0.2) {
      const point = {
        x: candidate.position.x + dx * Math.min(distanceM, candidate.radiusM),
        y: candidate.position.y + dy * Math.min(distanceM, candidate.radiusM),
      }
      if (!pointInsideSprayBoundary(point, geometry)) return false
    }
  }
  return true
}

function addTarget(targets, seen, point) {
  const key = point.x.toFixed(6) + ':' + point.y.toFixed(6)
  if (seen.has(key)) return
  seen.add(key)
  targets.push(Object.freeze({ x: point.x, y: point.y }))
}

function buildTargetSamples(vertices, stepM) {
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const columns = Math.ceil((maxX - minX) / stepM) + 1
  const rows = Math.ceil((maxY - minY) / stepM) + 1
  if (columns * rows > MAX_SAMPLE_POINTS) return null

  const targets = []
  const seen = new Set()
  for (let row = 0; row <= rows; row += 1) {
    const y = Math.min(maxY, minY + row * stepM)
    for (let column = 0; column <= columns; column += 1) {
      const x = Math.min(maxX, minX + column * stepM)
      if (pointInRing({ x, y }, vertices) >= 0) addTarget(targets, seen, { x, y })
    }
  }

  // Include boundary samples independently so a grid origin cannot leave an
  // unsampled edge interval.
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const length = distance(a, b)
    const divisions = Math.max(1, Math.ceil(length / stepM))
    for (let part = 0; part <= divisions; part += 1) {
      const ratio = part / divisions
      addTarget(targets, seen, {
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
      })
    }
  }
  return targets
}

function performanceFor(family, model, pressureBar, arcDeg) {
  if (family === 'R-VAN') {
    const exactModel = arcDeg === 360 ? model + '-360' : model
    return findRainBirdRvanPerformancePoint(exactModel, pressureBar, arcDeg)
  }
  return findRainBirdHevanPerformancePoint(model, pressureBar, arcDeg)
}

function supportedModel(family, model) {
  if (family === 'R-VAN') return RAIN_BIRD_RVAN_DATASET.models.some((entry) =>
    entry.model === model && ['R-VAN14', 'R-VAN18', 'R-VAN24'].includes(entry.model))
  if (family === 'HE-VAN') return RAIN_BIRD_HEVAN_DATASET.models.some((entry) => entry.model === model)
  return false
}

function polygonCentroid(vertices) {
  let crossSum = 0
  let xSum = 0
  let ySum = 0
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index]
    const next = vertices[(index + 1) % vertices.length]
    const factor = current.x * next.y - next.x * current.y
    crossSum += factor
    xSum += (current.x + next.x) * factor
    ySum += (current.y + next.y) * factor
  }
  if (Math.abs(crossSum) <= EPSILON) {
    return {
      x: vertices.reduce((sum, point) => sum + point.x, 0) / vertices.length,
      y: vertices.reduce((sum, point) => sum + point.y, 0) / vertices.length,
    }
  }
  return { x: xSum / (3 * crossSum), y: ySum / (3 * crossSum) }
}

function selectRvanModelForRequiredRadius(requiredRadiusM) {
  if (requiredRadiusM <= 3 + EPSILON) return { model: 'R-VAN14', radiusM: 3 }
  if (requiredRadiusM <= 5.5 + EPSILON) {
    const radiusM = Math.min(5.5, Math.max(4, Math.ceil((requiredRadiusM - EPSILON) * 2) / 2))
    return { model: 'R-VAN18', radiusM }
  }
  return { model: 'R-VAN24', radiusM: 6 }
}

function selectRvanModelForMaximumRadius(maximumRadiusM) {
  if (maximumRadiusM >= 6 - EPSILON) return { model: 'R-VAN24', radiusM: 6 }
  if (maximumRadiusM >= 5.5 - EPSILON) return { model: 'R-VAN18', radiusM: 5.5 }
  if (maximumRadiusM >= 5 - EPSILON) return { model: 'R-VAN18', radiusM: 5 }
  if (maximumRadiusM >= 4.5 - EPSILON) return { model: 'R-VAN18', radiusM: 4.5 }
  if (maximumRadiusM >= 4 - EPSILON) return { model: 'R-VAN18', radiusM: 4 }
  if (maximumRadiusM >= 3 - EPSILON) return { model: 'R-VAN14', radiusM: 3 }
  return null
}

function candidateSectorFitsBounds(candidate, bounds) {
  const arc = candidate.arcDeg ?? 360
  const start = arc === 360 ? 0 : (candidate.directionDeg ?? 0) - arc / 2
  for (let offset = 0; offset <= arc + EPSILON; offset += 1) {
    const angle = (start + offset) * Math.PI / 180
    const x = candidate.position.x + Math.cos(angle) * candidate.radiusM
    const y = candidate.position.y + Math.sin(angle) * candidate.radiusM
    if (x < bounds.minX - EPSILON || x > bounds.maxX + EPSILON ||
        y < bounds.minY - EPSILON || y > bounds.maxY + EPSILON) return false
  }
  return true
}

function buildCandidates(vertices, family, model, pressureBar, radiusM, { preventOverspray = false } = {}) {
  const candidates = []
  const orientation = Math.sign(signedArea(vertices)) || 1
  const center = polygonCentroid(vertices)
  const segmentLengths = vertices.map((point, index) =>
    distance(point, vertices[(index + 1) % vertices.length]))
  const perimeterOffsets = []
  let perimeterLengthM = 0
  for (const length of segmentLengths) {
    perimeterOffsets.push(perimeterLengthM)
    perimeterLengthM += length
  }

  const nozzleForRadius = (requiredRadiusM) => family === 'R-VAN'
    ? selectRvanModelForRequiredRadius(requiredRadiusM)
    : { model, radiusM }

  const add = (
    position,
    arcDeg,
    direction,
    source,
    perimeterOffsetM = null,
    nozzle = { model, radiusM },
  ) => {
    const candidateModel = nozzle.model
    const point = performanceFor(family, candidateModel, pressureBar, arcDeg)
    if (!point || (family !== 'R-VAN' && (!Number.isFinite(point.radiusM) || point.radiusM <= 0))) return
    const candidate = {
      id: 's' + String(candidates.length + 1).padStart(5, '0'),
      position: Object.freeze({ x: position.x, y: position.y }),
      arcDeg,
      directionDeg: arcDeg === 360 ? null : normalizeDegrees(Math.atan2(direction.y, direction.x) * 180 / Math.PI),
      source,
      radiusM: family === 'R-VAN' ? nozzle.radiusM : point.radiusM,
      pressureBar: point.pressureBar,
      precipitationSquareMmH: point.precipitationSquareMmH,
      precipitationTriangularMmH: point.precipitationTriangularMmH,
      performanceModel: arcDeg === 360 && family === 'R-VAN' ? candidateModel + '-360' : candidateModel,
    }
    if (Number.isFinite(perimeterOffsetM)) {
      candidate.perimeterOffsetM = perimeterOffsetM
      candidate.perimeterLengthM = perimeterLengthM
    }
    candidates.push(candidate)
  }

  const vertexSpecs = vertices.map((current, index) => {
    const previous = vertices[(index - 1 + vertices.length) % vertices.length]
    const next = vertices[(index + 1) % vertices.length]
    const incoming = inwardNormal(previous, current, orientation)
    const outgoing = inwardNormal(current, next, orientation)
    if (!incoming || !outgoing) {
      const nozzle = nozzleForRadius(radiusM)
      return { arcDeg: 90, direction: { x: 1, y: 0 }, nozzle }
    }
    const bisector = unit({ x: incoming.x + outgoing.x, y: incoming.y + outgoing.y })
    const convex = cross(previous, current, next) * orientation > 0
    const arcDeg = convex ? 90 : 270
    // A corner nozzle must reach the polygon's centre of area. This selects
    // the smallest Florial nozzle range that can reach the central coverage
    // area; it is independent of the sector angle.
    // On a 3 m-wide rectangular lawn, corner heads serve the local corner
    // and connect through perimeter heads along the long edges. Do not size
    // them against the distant global centroid: that over-selects R-VAN24.
    const boundsShortSideM = Math.min(
      Math.max(...vertices.map((point) => point.x)) - Math.min(...vertices.map((point) => point.x)),
      Math.max(...vertices.map((point) => point.y)) - Math.min(...vertices.map((point) => point.y)),
    )
    const rectangleCornerReachLimitM = vertices.length === 4 && boundsShortSideM <= 5 + EPSILON
      ? boundsShortSideM
      : null
    const cornerRequiredRadiusM = rectangleCornerReachLimitM
      ? Math.min(distance(current, center), rectangleCornerReachLimitM)
      : distance(current, center)
    const nozzle = family === 'R-VAN'
      ? nozzleForRadius(cornerRequiredRadiusM)
      : { model, radiusM: performanceFor(family, model, pressureBar, arcDeg)?.radiusM ?? radiusM }
    return { arcDeg, direction: bisector ?? incoming, nozzle }
  })

  // Corner positions are sized independently from the lawn's centre of area.
  for (let index = 0; index < vertices.length; index += 1) {
    const spec = vertexSpecs[index]
    add(vertices[index], spec.arcDeg, spec.direction, 'vertex', perimeterOffsets[index], spec.nozzle)
  }

  // Edge candidates can optionally be inset by their own planning radius.
  // This keeps their complete semicircular spray sector inside a rectangular
  // calculation region instead of spacing heads from the edge endpoints and
  // accidentally selecting a larger radius than the local clearance.
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const length = segmentLengths[index]
    const nextIndex = (index + 1) % vertices.length
    const spacingRadiusM = family === 'R-VAN'
      ? Math.min(6, vertexSpecs[index].nozzle.radiusM, vertexSpecs[nextIndex].nozzle.radiusM)
      : Math.min(radiusM, vertexSpecs[index].nozzle.radiusM, vertexSpecs[nextIndex].nozzle.radiusM)
    const normal = inwardNormal(a, b, orientation)
    if (!normal) continue

    if (preventOverspray && family === 'R-VAN') {
      const safeMaximumRadiusM = Math.min(6, spacingRadiusM, length / 2)
      if (safeMaximumRadiusM < 3 - EPSILON) continue
      // An L-shape edge can be locally blocked by its concave notch even when
      // the bounding rectangle is clear. Generate a descending set of exact
      // R-VAN planning radii; the polygon-footprint gate below keeps only
      // sectors that really fit the irrigated outline.
      const radiusStages = [6, 5.5, 5, 4.5, 4, 3]
      const addedRadii = new Set()
      for (const stageRadiusM of radiusStages) {
        if (stageRadiusM > safeMaximumRadiusM + EPSILON) continue
        const edgeNozzle = selectRvanModelForMaximumRadius(stageRadiusM)
        if (!edgeNozzle || addedRadii.has(edgeNozzle.radiusM)) continue
        addedRadii.add(edgeNozzle.radiusM)
        const divisions = Math.max(1, Math.ceil(length / edgeNozzle.radiusM))
        for (let part = 1; part < divisions; part += 1) {
          const offsetM = length * part / divisions
          const ratio = offsetM / length
          add({
            x: a.x + (b.x - a.x) * ratio,
            y: a.y + (b.y - a.y) * ratio,
          }, 180, normal, 'edge', perimeterOffsets[index] + offsetM, edgeNozzle)
        }
      }
      continue
    }

    const divisions = Math.max(1, Math.ceil(length / spacingRadiusM))
    const edgeSpacingM = length / divisions
    const edgeNozzle = family === 'R-VAN' ? nozzleForRadius(edgeSpacingM) : { model, radiusM }
    for (let part = 1; part < divisions; part += 1) {
      const ratio = part / divisions
      add({
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
      }, 180, normal, 'edge', perimeterOffsets[index] + length * ratio, edgeNozzle)
    }
  }

  // Rectangles and orthogonal L-shapes use the same axis-aligned interior
  // lattice, clipped to the actual polygon. Interior nozzle size follows the
  // spacing of that lattice, not the model chosen for the overall short side.
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const isRectangle = vertices.length === 4 &&
    vertices.every((point, index) => {
      const next = vertices[(index + 1) % vertices.length]
      return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON
    })

  if (isRectangle || vertices.length > 4) {
    const lengthX = maxX - minX
    const lengthY = maxY - minY
    const xDivisions = Math.max(1, Math.ceil(lengthX / radiusM))
    const yDivisions = Math.max(1, Math.ceil(lengthY / radiusM))
    const xPositions = new Set()
    const yPositions = new Set()

    if (xDivisions > 1) {
      for (let part = 1; part < xDivisions; part += 1) {
        xPositions.add(minX + lengthX * part / xDivisions)
      }
    }
    if (yDivisions > 1) {
      if (lengthY <= radiusM * 2 + 1) {
        yPositions.add((minY + maxY) / 2)
      } else {
        for (let part = 1; part < yDivisions; part += 1) {
          yPositions.add(minY + lengthY * part / yDivisions)
        }
        yPositions.add((minY + maxY) / 2)
      }
    }

    const interiorSpacingM = preventOverspray
      ? Math.min(lengthX / 2, lengthY / 2)
      : Math.min(lengthX / xDivisions, lengthY / yDivisions)
    const interiorNozzle = family === 'R-VAN' ? nozzleForRadius(interiorSpacingM) : { model, radiusM }
    if (preventOverspray && family === 'R-VAN' && interiorNozzle.radiusM > 0) {
      const safeRadiusM = interiorNozzle.radiusM
      if (lengthX >= safeRadiusM * 2 - EPSILON) {
        xPositions.add(minX + safeRadiusM)
        xPositions.add(maxX - safeRadiusM)
      }
      if (lengthY >= safeRadiusM * 2 - EPSILON) {
        yPositions.add(minY + safeRadiusM)
        yPositions.add(maxY - safeRadiusM)
      }
    }
    if (xPositions.size > 0 && yPositions.size > 0) {
      for (const y of [...yPositions].sort((a, b) => a - b)) {
        for (const x of [...xPositions].sort((a, b) => a - b)) {
          const position = { x, y }
          if (pointInRing(position, vertices) === 1) {
            add(position, 360, { x: 1, y: 0 }, 'interior', null, interiorNozzle)
          }
        }
      }
    }
  }
  return candidates
}

function evaluateCandidates(candidates, targets) {
  return candidates.map((candidate) => {
    const covered = []
    for (let index = 0; index < targets.length; index += 1) {
      if (sectorContains(
        targets[index],
        candidate.position,
        candidate.directionDeg ?? 0,
        candidate.arcDeg,
        candidate.radiusM,
      )) covered.push(index)
    }
    return { ...candidate, covered }
  })
}

function selectGreedy(candidates, targetCount, initiallyUncovered = null) {
  const uncovered = initiallyUncovered
    ? new Set(initiallyUncovered)
    : new Set(Array.from({ length: targetCount }, (_, index) => index))
  const selected = []
  const available = candidates.slice()

  while (uncovered.size > 0 && selected.length < MAX_SELECTED_SPRINKLERS) {
    let bestIndex = -1
    let bestGain = 0
    for (let index = 0; index < available.length; index += 1) {
      const candidate = available[index]
      let gain = 0
      for (const targetIndex of candidate.covered) if (uncovered.has(targetIndex)) gain += 1
      if (gain > bestGain || (gain === bestGain && gain > 0 &&
          (bestIndex < 0 || candidate.id.localeCompare(available[bestIndex].id) < 0))) {
        bestIndex = index
        bestGain = gain
      }
    }
    if (bestIndex < 0) break
    const [chosen] = available.splice(bestIndex, 1)
    selected.push(chosen)
    for (const targetIndex of chosen.covered) uncovered.delete(targetIndex)
  }
  return { selected, uncovered }
}

function selectGreedyConnected(candidates, initiallyUncovered, selectedInput, priorHeads = []) {
  const uncovered = new Set(initiallyUncovered)
  const selected = selectedInput.slice()
  const available = candidates.slice()

  while (uncovered.size > 0 && selected.length < MAX_SELECTED_SPRINKLERS) {
    const scored = available.map((candidate) => {
      let gain = 0
      for (const targetIndex of candidate.covered) if (uncovered.has(targetIndex)) gain += 1
      const connected = [...priorHeads, ...selected].some((head) =>
        sectorsMutuallyReach(candidate, head))
      return { candidate, gain, connected }
    }).filter((entry) => entry.gain > 0)
    if (!scored.length) break

    // Prefer candidates that are Head-to-Head connected to the corner seed.
    // If a remaining uncovered pocket is separated by a gap, retain the best
    // coverage candidate and let the explicit spacing-repair pass bridge it.
    scored.sort((a, b) =>
      Number(b.connected) - Number(a.connected) ||
      b.gain - a.gain ||
      a.candidate.id.localeCompare(b.candidate.id))
    const chosen = scored[0].candidate
    available.splice(available.findIndex((entry) => entry.id === chosen.id), 1)
    selected.push(chosen)
    for (const targetIndex of chosen.covered) uncovered.delete(targetIndex)
  }
  return { selected: selected.slice(selectedInput.length), uncovered }
}

function selectCornerFirstPerimeter(perimeterCandidates, initiallyUncovered, priorHeads = []) {
  const uncovered = new Set(initiallyUncovered)
  const corners = perimeterCandidates.filter((candidate) => candidate.source === 'vertex')
  const edges = perimeterCandidates.filter((candidate) => candidate.source === 'edge')
  const selected = []

  // Seed the actual polygon vertices first, including the reflex corner of an L.
  for (const candidate of corners) {
    const gain = candidate.covered.reduce((sum, index) => sum + Number(uncovered.has(index)), 0)
    if (gain <= 0 || selected.length >= MAX_SELECTED_SPRINKLERS) continue
    selected.push(candidate)
    for (const index of candidate.covered) uncovered.delete(index)
  }

  const edgePass = selectGreedyConnected(edges, uncovered, selected, priorHeads)
  selected.push(...edgePass.selected)
  return { selected, uncovered: edgePass.uncovered }
}

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus
}

function sectorsMutuallyReach(a, b) {
  const separation = distance(a.position, b.position)
  if (separation > Math.min(a.radiusM, b.radiusM) + EPSILON) return false
  return sectorContains(
    a.position,
    b.position,
    b.directionDeg ?? 0,
    b.arcDeg,
    b.radiusM,
  ) && sectorContains(
    b.position,
    a.position,
    a.directionDeg ?? 0,
    a.arcDeg,
    a.radiusM,
  )
}

export function sprinklersMutuallyReach(a, b) {
  return sectorsMutuallyReach(a, b)
}

export function evaluateHeadToHeadSpacing(selected) {
  const perimeterHeads = selected
    .filter((entry) => Number.isFinite(entry.perimeterOffsetM) && Number.isFinite(entry.perimeterLengthM))
    .slice()
    .sort((a, b) => a.perimeterOffsetM - b.perimeterOffsetM)
  const perimeterLengthM = perimeterHeads[0]?.perimeterLengthM ?? null

  return Object.freeze(selected.map((sprinkler) => {
    let nearest = null
    let nearestDistanceM = Number.POSITIVE_INFINITY
    let headToHeadNeighbor = null
    let headToHeadDistanceM = Number.POSITIVE_INFINITY

    for (const other of selected) {
      if (other.id === sprinkler.id) continue
      const separation = distance(sprinkler.position, other.position)
      if (separation < nearestDistanceM) {
        nearestDistanceM = separation
        nearest = other
      }
      if (sectorsMutuallyReach(sprinkler, other) && separation < headToHeadDistanceM) {
        headToHeadDistanceM = separation
        headToHeadNeighbor = other
      }
    }

    const nearestLimit = nearest ? Math.min(sprinkler.radiusM, nearest.radiusM) : null
    const perimeterIndex = perimeterHeads.findIndex((entry) => entry.id === sprinkler.id)
    let perimeterPreviousSprinklerId = null
    let perimeterNextSprinklerId = null
    let perimeterPreviousGapM = null
    let perimeterNextGapM = null
    let perimeterSpacingPassed = null
    let passed = headToHeadNeighbor !== null

    if (perimeterIndex >= 0 && perimeterHeads.length > 1 && perimeterLengthM > 0) {
      const previous = perimeterHeads[(perimeterIndex - 1 + perimeterHeads.length) % perimeterHeads.length]
      const next = perimeterHeads[(perimeterIndex + 1) % perimeterHeads.length]
      perimeterPreviousSprinklerId = previous.id
      perimeterNextSprinklerId = next.id
      perimeterPreviousGapM = positiveModulo(
        sprinkler.perimeterOffsetM - previous.perimeterOffsetM,
        perimeterLengthM,
      )
      perimeterNextGapM = positiveModulo(
        next.perimeterOffsetM - sprinkler.perimeterOffsetM,
        perimeterLengthM,
      )
      const previousPasses = perimeterPreviousGapM <= Math.min(sprinkler.radiusM, previous.radiusM) + EPSILON &&
        sectorsMutuallyReach(sprinkler, previous)
      const nextPasses = perimeterNextGapM <= Math.min(sprinkler.radiusM, next.radiusM) + EPSILON &&
        sectorsMutuallyReach(sprinkler, next)
      perimeterSpacingPassed = previousPasses && nextPasses
      passed = perimeterSpacingPassed
      headToHeadNeighbor = nextPasses ? next : previousPasses ? previous : null
      headToHeadDistanceM = headToHeadNeighbor
        ? distance(sprinkler.position, headToHeadNeighbor.position)
        : Number.POSITIVE_INFINITY
    } else if (perimeterIndex >= 0) {
      perimeterSpacingPassed = false
      passed = false
      headToHeadNeighbor = null
      headToHeadDistanceM = Number.POSITIVE_INFINITY
    }

    return Object.freeze({
      sprinklerId: sprinkler.id,
      nearestSprinklerId: nearest?.id ?? null,
      separationM: Number.isFinite(nearestDistanceM) ? nearestDistanceM : null,
      requiredMaximumM: nearestLimit,
      headToHeadNeighborId: headToHeadNeighbor?.id ?? null,
      headToHeadSeparationM: Number.isFinite(headToHeadDistanceM) ? headToHeadDistanceM : null,
      headToHeadRequiredMaximumM: headToHeadNeighbor
        ? Math.min(sprinkler.radiusM, headToHeadNeighbor.radiusM)
        : null,
      perimeterPreviousSprinklerId,
      perimeterNextSprinklerId,
      perimeterPreviousGapM,
      perimeterNextGapM,
      perimeterSpacingPassed,
      passed,
    })
  }))
}

function findPerimeterGapRepair(current, next, gapM, perimeterLengthM, candidates, selected) {
  return candidates
    .filter((candidate) =>
      Number.isFinite(candidate.perimeterOffsetM) &&
      !selected.some((entry) => entry.id === candidate.id))
    .map((candidate) => {
      const alongGapM = positiveModulo(candidate.perimeterOffsetM - current.perimeterOffsetM, perimeterLengthM)
      const remainingGapM = gapM - alongGapM
      const reachesCurrent = alongGapM > EPSILON &&
        alongGapM <= Math.min(current.radiusM, candidate.radiusM) + EPSILON &&
        sectorsMutuallyReach(current, candidate)
      const reachesNext = remainingGapM > EPSILON &&
        remainingGapM <= Math.min(candidate.radiusM, next.radiusM) + EPSILON &&
        sectorsMutuallyReach(candidate, next)
      return {
        candidate,
        alongGapM,
        reachesCurrent,
        reachesNext,
      }
    })
    .filter(({ alongGapM, reachesCurrent, reachesNext }) =>
      alongGapM > EPSILON && alongGapM < gapM - EPSILON &&
      (reachesCurrent || reachesNext))
    .sort((a, b) =>
      Number(b.reachesCurrent && b.reachesNext) - Number(a.reachesCurrent && a.reachesNext) ||
      Math.max(a.alongGapM, gapM - a.alongGapM) - Math.max(b.alongGapM, gapM - b.alongGapM) ||
      Math.abs(a.alongGapM - gapM / 2) - Math.abs(b.alongGapM - gapM / 2) ||
      a.candidate.id.localeCompare(b.candidate.id))[0]?.candidate ?? null
}

function enforceHeadToHeadSpacing(selectedInput, candidates) {
  const selected = selectedInput.slice()
  let attempts = 0

  while (selected.length < MAX_SELECTED_SPRINKLERS && attempts < MAX_SELECTED_SPRINKLERS * 2) {
    attempts += 1
    let repair = null

    const perimeterHeads = selected
      .filter((entry) => Number.isFinite(entry.perimeterOffsetM) && Number.isFinite(entry.perimeterLengthM))
      .slice()
      .sort((a, b) => a.perimeterOffsetM - b.perimeterOffsetM)
    const perimeterLengthM = perimeterHeads[0]?.perimeterLengthM

    if (perimeterHeads.length > 1 && perimeterLengthM > 0) {
      for (let index = 0; index < perimeterHeads.length; index += 1) {
        const current = perimeterHeads[index]
        const next = perimeterHeads[(index + 1) % perimeterHeads.length]
        const gapM = positiveModulo(
          next.perimeterOffsetM - current.perimeterOffsetM,
          perimeterLengthM,
        )
        const spacingOk = gapM <= Math.min(current.radiusM, next.radiusM) + EPSILON
        if (spacingOk && sectorsMutuallyReach(current, next)) continue
        repair = findPerimeterGapRepair(
          current,
          next,
          gapM,
          perimeterLengthM,
          candidates.filter((candidate) => candidate.source !== 'interior'),
          selected,
        )
        if (repair) break
      }
    }

    if (repair) {
      selected.push(repair)
      continue
    }

    const failedInterior = evaluateHeadToHeadSpacing(selected).find((check) => {
      const sprinkler = selected.find((entry) => entry.id === check.sprinklerId)
      return sprinkler && !Number.isFinite(sprinkler.perimeterOffsetM) && !check.passed
    })
    if (failedInterior) {
      const sprinkler = selected.find((entry) => entry.id === failedInterior.sprinklerId)
      repair = candidates
        .filter((candidate) =>
          !selected.some((entry) => entry.id === candidate.id) &&
          sectorsMutuallyReach(sprinkler, candidate))
        .sort((a, b) =>
          distance(sprinkler.position, a.position) - distance(sprinkler.position, b.position) ||
          a.id.localeCompare(b.id))[0] ?? null
      if (repair) {
        selected.push(repair)
        continue
      }
    }

    break
  }

  return selected
}

/**
 * Generates a preliminary one-region lawn layout using exact Rain Bird
 * operating points and a deterministic greedy set-cover search.
 *
 * This is sampled geometric coverage only. It does not prove hydraulic
 * feasibility, precipitation uniformity, body compatibility or overspray.
 */
export function generateLawnSprinklerLayout({
  geometry,
  family,
  model,
  pressureBar,
  sampleStepM = DEFAULT_SAMPLE_STEP_M,
  radiusM = null,
  excludedCandidatePositions = [],
  candidatePositionOffsets = [],
  preventOverspray = false,
  initialSprinklers = [],
  sprayBoundaryGeometry = null,
}) {
  const validation = validateLawnGeometry(geometry)
  if (!validation.valid || !['accepted', 'unsupported'].includes(validation.status)) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'geometry_not_accepted',
      errors: validation.errors,
      warnings: validation.warnings,
      sprinklers: Object.freeze([]),
    })
  }
  if (!validation.supported || validation.regions.length !== 1 ||
      !['rectangle', 'l-shape'].includes(validation.regions[0].shape)) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'geometry_not_supported',
      errors: Object.freeze([]),
      warnings: Object.freeze([{ code: 'single_rectangle_or_l_shape_only', path: 'geometry.regions' }]),
      sprinklers: Object.freeze([]),
    })
  }
  if (geometry.regions[0].exclusions?.length) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'geometry_not_supported',
      errors: Object.freeze([]),
      warnings: Object.freeze([{ code: 'exclusions_not_yet_supported_by_layout_solver', path: 'geometry.regions[0].exclusions' }]),
      sprinklers: Object.freeze([]),
    })
  }
  if (!supportedModel(family, model)) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'model_not_supported',
      errors: Object.freeze([{ code: 'unsupported_family_or_model', path: 'model' }]),
      warnings: Object.freeze([]),
      sprinklers: Object.freeze([]),
    })
  }
  if (!Number.isFinite(pressureBar) || !Number.isFinite(sampleStepM) || sampleStepM <= 0) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'invalid_operating_input',
      errors: Object.freeze([{ code: 'invalid_pressure_or_sample_step', path: 'pressureBar/sampleStepM' }]),
      warnings: Object.freeze([]),
      sprinklers: Object.freeze([]),
    })
  }

  const vertices = geometry.regions[0].boundary.vertices
    .filter((point, index, points) => index < points.length - 1 ||
      distance(point, points[0]) > EPSILON)
  const probeArc = 180
  const probe = performanceFor(family, model, pressureBar, probeArc)
  if (!probe) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'operating_point_not_found',
      errors: Object.freeze([{ code: 'no_exact_manufacturer_operating_point', path: 'family/model/pressureBar' }]),
      warnings: Object.freeze([]),
      sprinklers: Object.freeze([]),
    })
  }

  const effectiveRadiusM = family === 'R-VAN'
    ? (Number.isFinite(radiusM) && radiusM > 0 ? radiusM : DEFAULT_RVAN_LAYOUT_RADII_M[model])
    : probe.radiusM
  if (!Number.isFinite(effectiveRadiusM) || effectiveRadiusM <= 0) {
    return Object.freeze({ engineVersion: ENGINE_VERSION, status: 'invalid_operating_input', errors: Object.freeze([{ code: 'invalid_layout_radius', path: 'radiusM' }]), warnings: Object.freeze([]), sprinklers: Object.freeze([]) })
  }

  const targets = buildTargetSamples(vertices, sampleStepM)
  if (!targets) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'sampling_limit_exceeded',
      errors: Object.freeze([{ code: 'coverage_sampling_limit_exceeded', path: 'sampleStepM' }]),
      warnings: Object.freeze([]),
      sprinklers: Object.freeze([]),
    })
  }

  const excluded = Array.isArray(excludedCandidatePositions) ? excludedCandidatePositions : []
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const candidateBounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  const positionOffsets = family === 'R-VAN' && Array.isArray(candidatePositionOffsets)
    ? candidatePositionOffsets
    : []
  const candidates = buildCandidates(vertices, family, model, pressureBar, effectiveRadiusM, { preventOverspray })
    .map((candidate) => {
      if (candidate.source !== 'vertex') return candidate
      const offset = positionOffsets.find((entry) => entry?.from &&
        Number.isFinite(entry.from.x) && Number.isFinite(entry.from.y) &&
        distance(candidate.position, entry.from) <= EPSILON)
      if (!offset || !Number.isFinite(offset.dx) || !Number.isFinite(offset.dy)) return candidate
      return {
        ...candidate,
        id: candidate.id + '-offset',
        position: Object.freeze({
          x: candidate.position.x + offset.dx,
          y: candidate.position.y + offset.dy,
        }),
      }
    })
    .filter((candidate) => !preventOverspray || candidateSectorFitsBounds(candidate, candidateBounds))
    .filter((candidate) => !sprayBoundaryGeometry || candidateSectorFitsGeometry(candidate, sprayBoundaryGeometry))
    .filter((candidate) => !excluded.some((point) => point &&
      Number.isFinite(point.x) && Number.isFinite(point.y) &&
      distance(candidate.position, point) <= EPSILON))
  if (!candidates || candidates.length > MAX_CANDIDATES) {
    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      status: 'candidate_limit_exceeded',
      errors: Object.freeze([{ code: 'layout_candidate_limit_exceeded', path: 'geometry' }]),
      warnings: Object.freeze([]),
      sprinklers: Object.freeze([]),
    })
  }
  const evaluated = evaluateCandidates(candidates, targets)
  const perimeterCandidates = evaluated.filter((candidate) => candidate.source !== 'interior')
  const interiorCandidates = evaluated.filter((candidate) => candidate.source === 'interior')
  const priorHeads = Array.isArray(initialSprinklers) ? initialSprinklers : []
  const initiallyUncovered = new Set()
  for (let index = 0; index < targets.length; index += 1) {
    if (!priorHeads.some((head) => sprinklerCoversPoint(head, targets[index]))) initiallyUncovered.add(index)
  }
  const isLShape = validation.regions[0].shape === 'l-shape'
  const perimeterPass = isLShape
    ? selectCornerFirstPerimeter(perimeterCandidates, initiallyUncovered, priorHeads)
    : selectGreedy(perimeterCandidates, targets.length, initiallyUncovered)
  let coverageSelection = perimeterPass.selected
  let uncovered = perimeterPass.uncovered

  // On L-shapes, corners are seeded first; edge and interior additions then
  // advance through the uncovered samples while preferring mutual Head-to-Head
  // links to the already installed heads.
  if (uncovered.size > 0 && interiorCandidates.length > 0) {
    const interiorPass = isLShape
      ? selectGreedyConnected(interiorCandidates, uncovered, coverageSelection, priorHeads)
      : selectGreedy(interiorCandidates, targets.length, uncovered)
    coverageSelection = coverageSelection.concat(interiorPass.selected)
    uncovered = interiorPass.uncovered
  }

  const spacingSelection = enforceHeadToHeadSpacing(coverageSelection, evaluated)
  const sprinklers = spacingSelection.map(({ covered, ...candidate }) => Object.freeze(candidate))
  const checks = evaluateHeadToHeadSpacing(sprinklers)
  const allHeadToHead = checks.every((entry) => entry.passed)
  const selectedModels = [...new Set(sprinklers.map((head) => head.performanceModel))].sort()
  const resultModel = family === 'R-VAN' ? selectedModels.join(' / ') : model
  const warnings = [
    { code: 'sampled_coverage_is_not_a_continuous_mathematical_proof', path: 'coverage' },
    { code: 'hydraulic_feasibility_not_evaluated', path: 'hydraulics' },
    { code: 'precipitation_uniformity_not_evaluated', path: 'precipitation' },
    { code: 'body_nozzle_compatibility_not_evaluated', path: 'compatibility' },
    { code: 'overspray_not_evaluated', path: 'boundary' },
  ]
  if (!allHeadToHead) warnings.push({ code: 'head_to_head_spacing_check_failed', path: 'sprinklers' })
  if (family === 'R-VAN' && pressureBar !== 3.1) {
    warnings.push({ code: 'rvan_pressure_differs_from_recommended_3_1_bar', path: 'pressureBar' })
  }
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    algorithm: isLShape
      ? 'l-shape-corner-first-uncovered-head-to-head-v1'
      : 'perimeter-first-mixed-rvan-spacing-aware-set-cover-v5',
    status: uncovered.size === 0 ? 'coverage_complete_sampled' : 'coverage_incomplete',
    coverageScope: 'sampled_geometry_only',
    family,
    model: resultModel,
    pressureBar,
    sampleStepM,
    radiusM: family === 'R-VAN' ? null : effectiveRadiusM,
    geometry: Object.freeze({
      regionId: geometry.regions[0].id,
      shape: validation.regions[0].shape,
      areaM2: validation.regions[0].netAreaM2,
    }),
    coverage: Object.freeze({
      sampledPoints: targets.length,
      coveredPoints: targets.length - uncovered.size,
      uncoveredPoints: uncovered.size,
      coveragePercent: targets.length ? ((targets.length - uncovered.size) / targets.length) * 100 : 0,
      uncoveredSamples: Object.freeze([...uncovered].slice(0, 100).map((index) => targets[index])),
    }),
    sprinklers: Object.freeze(sprinklers),
    headToHead: Object.freeze({
      passed: allHeadToHead,
      checks: Object.freeze(checks),
    }),
    warnings: Object.freeze(warnings.map((entry) => Object.freeze(entry))),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
  })
}
