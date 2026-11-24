import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from './rainBirdRvanPerformanceData.mjs'
import {
  findRainBirdHevanPerformancePoint,
  RAIN_BIRD_HEVAN_DATASET,
} from './rainBirdHevanPerformanceData.mjs'

const ENGINE_VERSION = '0.2.0'
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

function buildCandidates(vertices, family, model, pressureBar, radiusM) {
  const candidates = []
  const orientation = Math.sign(signedArea(vertices)) || 1
  const segmentLengths = vertices.map((point, index) =>
    distance(point, vertices[(index + 1) % vertices.length]))
  const perimeterOffsets = []
  let perimeterLengthM = 0
  for (const length of segmentLengths) {
    perimeterOffsets.push(perimeterLengthM)
    perimeterLengthM += length
  }

  const add = (position, arcDeg, direction, source, perimeterOffsetM = null) => {
    const point = performanceFor(family, model, pressureBar, arcDeg)
    if (!point || !Number.isFinite(point.radiusM) || point.radiusM <= 0) return
    const candidate = {
      id: 's' + String(candidates.length + 1).padStart(5, '0'),
      position: Object.freeze({ x: position.x, y: position.y }),
      arcDeg,
      directionDeg: arcDeg === 360 ? null : normalizeDegrees(Math.atan2(direction.y, direction.x) * 180 / Math.PI),
      source,
      radiusM: family === 'R-VAN' ? radiusM : point.radiusM,
      pressureBar: point.pressureBar,
      precipitationSquareMmH: point.precipitationSquareMmH,
      precipitationTriangularMmH: point.precipitationTriangularMmH,
      performanceModel: arcDeg === 360 && family === 'R-VAN' ? model + '-360' : model,
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
    if (!incoming || !outgoing) return { arcDeg: 90, direction: { x: 1, y: 0 }, radiusM }
    const bisector = unit({ x: incoming.x + outgoing.x, y: incoming.y + outgoing.y })
    const convex = cross(previous, current, next) * orientation > 0
    const arcDeg = convex ? 90 : 270
    const point = performanceFor(family, model, pressureBar, arcDeg)
    return {
      arcDeg,
      direction: bisector ?? incoming,
      radiusM: family === 'R-VAN' ? radiusM : Number.isFinite(point?.radiusM) && point.radiusM > 0 ? point.radiusM : radiusM,
    }
  })

  // Every boundary vertex is a candidate, with its exact 90° or 270° table radius.
  for (let index = 0; index < vertices.length; index += 1) {
    const spec = vertexSpecs[index]
    add(vertices[index], spec.arcDeg, spec.direction, 'vertex', perimeterOffsets[index])
  }

  // Divide every boundary edge using the smaller radius of its two corner
  // heads and the straight-edge head. This prevents a corner-to-edge gap.
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const length = segmentLengths[index]
    const nextIndex = (index + 1) % vertices.length
    const spacingRadiusM = Math.min(radiusM, vertexSpecs[index].radiusM, vertexSpecs[nextIndex].radiusM)
    const divisions = Math.max(1, Math.ceil(length / spacingRadiusM))
    const normal = inwardNormal(a, b, orientation)
    if (!normal) continue
    for (let part = 1; part < divisions; part += 1) {
      const ratio = part / divisions
      add({
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
      }, 180, normal, 'edge', perimeterOffsets[index] + length * ratio)
    }
  }

  // Rectangles use a perimeter-first, multi-row interior candidate lattice.
  // The centreline is always included when there is room for an interior row;
  // additional rows are added only as the dimensions require them. The
  // sampled set-cover pass decides whether any of these candidates are needed.
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
      // For a medium-width rectangle, a single true centre row is sufficient.
      // Wider rectangles get additional evenly spaced rows as well.
      if (lengthY <= radiusM * 2 + 1) {
        yPositions.add((minY + maxY) / 2)
      } else {
        for (let part = 1; part < yDivisions; part += 1) {
          yPositions.add(minY + lengthY * part / yDivisions)
        }
        yPositions.add((minY + maxY) / 2)
      }
    }

    if (xPositions.size > 0 && yPositions.size > 0) {
      for (const y of [...yPositions].sort((a, b) => a - b)) {
        for (const x of [...xPositions].sort((a, b) => a - b)) {
          const position = { x, y }
          if (pointInRing(position, vertices) === 1) {
            add(position, 360, { x: 1, y: 0 }, 'interior')
          }
        }
      }
    }
  } else {
    // All supported orthogonal shapes use the same axis-aligned rectangular
    // candidate lattice. For an L-shape, pointInRing clips every candidate
    // to the actual polygon; no triangular/staggered rows are generated.
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

  const candidates = buildCandidates(vertices, family, model, pressureBar, effectiveRadiusM)
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
  const perimeterPass = selectGreedy(perimeterCandidates, targets.length)
  let coverageSelection = perimeterPass.selected
  let uncovered = perimeterPass.uncovered

  // Keep the perimeter-first pattern: add interior heads only for points
  // that remain uncovered after all useful perimeter candidates are selected.
  if (uncovered.size > 0 && interiorCandidates.length > 0) {
    const interiorPass = selectGreedy(interiorCandidates, targets.length, uncovered)
    coverageSelection = coverageSelection.concat(interiorPass.selected)
    uncovered = interiorPass.uncovered
  }

  const spacingSelection = enforceHeadToHeadSpacing(coverageSelection, evaluated)
  const sprinklers = spacingSelection.map(({ covered, ...candidate }) => Object.freeze(candidate))
  const checks = evaluateHeadToHeadSpacing(sprinklers)
  const allHeadToHead = checks.every((entry) => entry.passed)
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
    algorithm: 'perimeter-first-rectangular-grid-greedy-set-cover-v4',
    status: uncovered.size === 0 ? 'coverage_complete_sampled' : 'coverage_incomplete',
    coverageScope: 'sampled_geometry_only',
    family,
    model,
    pressureBar,
    sampleStepM,
    radiusM: effectiveRadiusM,
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
