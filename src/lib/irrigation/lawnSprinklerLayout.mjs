import { validateLawnGeometry } from './lawnGeometry.mjs'
import {
  findRainBirdRvanPerformancePoint,
  RAIN_BIRD_RVAN_DATASET,
} from './rainBirdRvanPerformanceData.mjs'
import {
  findRainBirdHevanPerformancePoint,
  RAIN_BIRD_HEVAN_DATASET,
} from './rainBirdHevanPerformanceData.mjs'

const ENGINE_VERSION = '0.1.0'
const EPSILON = 1e-8
const DEFAULT_SAMPLE_STEP_M = 0.25
const MAX_SAMPLE_POINTS = 30000
const MAX_CANDIDATES = 12000
const MAX_SELECTED_SPRINKLERS = 150

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
  const add = (position, arcDeg, direction, source) => {
    const point = performanceFor(family, model, pressureBar, arcDeg)
    if (!point || !Number.isFinite(point.radiusM) || point.radiusM <= 0) return
    candidates.push({
      id: 's' + String(candidates.length + 1).padStart(5, '0'),
      position: Object.freeze({ x: position.x, y: position.y }),
      arcDeg,
      directionDeg: arcDeg === 360 ? null : normalizeDegrees(Math.atan2(direction.y, direction.x) * 180 / Math.PI),
      source,
      radiusM: point.radiusM,
      flowLpm: point.flowLpm,
      pressureBar: point.pressureBar,
      precipitationSquareMmH: point.precipitationSquareMmH,
      precipitationTriangularMmH: point.precipitationTriangularMmH,
      performanceModel: arcDeg === 360 && family === 'R-VAN' ? model + '-360' : model,
    })
  }

  // Vertex heads: 90-degree arcs at convex corners and 270-degree arcs at
  // reflex corners, oriented along the inward angle bisector.
  for (let index = 0; index < vertices.length; index += 1) {
    const previous = vertices[(index - 1 + vertices.length) % vertices.length]
    const current = vertices[index]
    const next = vertices[(index + 1) % vertices.length]
    const incoming = inwardNormal(previous, current, orientation)
    const outgoing = inwardNormal(current, next, orientation)
    if (!incoming || !outgoing) continue
    const bisector = unit({ x: incoming.x + outgoing.x, y: incoming.y + outgoing.y })
    if (!bisector) continue
    const convex = cross(previous, current, next) * orientation > 0
    add(current, convex ? 90 : 270, bisector, 'vertex')
  }

  // Straight boundary heads: exact 180-degree inward-facing sectors. The
  // subdivision is based on the tested throw radius, not a generic lawn grid.
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const length = distance(a, b)
    const divisions = Math.max(1, Math.ceil(length / radiusM))
    const normal = inwardNormal(a, b, orientation)
    if (!normal) continue
    for (let part = 1; part < divisions; part += 1) {
      const ratio = part / divisions
      add({
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
      }, 180, normal, 'edge')
    }
  }

  // Build an orthogonal row/column grid from the selected R-VAN throw
  // radius. This preserves perimeter-first placement and adds internal rows
  // only when the lawn width exceeds one head-to-head spacing.
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const xDivisions = Math.max(1, Math.ceil((maxX - minX) / radiusM))
  const yDivisions = Math.max(1, Math.ceil((maxY - minY) / radiusM))
  for (let row = 1; row < yDivisions; row += 1) {
    const y = minY + (maxY - minY) * row / yDivisions
    for (let column = 1; column < xDivisions; column += 1) {
      const x = minX + (maxX - minX) * column / xDivisions
      const position = { x, y }
      if (pointInRing(position, vertices) === 1) {
        add(position, 360, { x: 1, y: 0 }, 'interior_row')
      }
      if (candidates.length > MAX_CANDIDATES) return null
    }
  }

  // Additional triangular candidates remain available only as coverage
  // completion candidates; they do not replace mandatory corner/perimeter
  // positions or the orthogonal H2H rows above.
  const rowStep = radiusM * Math.sqrt(3) / 2
  let row = 0
  for (let y = minY + rowStep / 2; y < maxY - EPSILON; y += rowStep) {
    const offset = row % 2 ? radiusM / 2 : 0
    for (let x = minX + radiusM / 2 + offset; x < maxX - EPSILON; x += radiusM) {
      const position = { x, y }
      if (pointInRing(position, vertices) === 1) add(position, 360, { x: 1, y: 0 }, 'interior')
      if (candidates.length > MAX_CANDIDATES) return null
    }
    row += 1
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

function selectGreedy(candidates, targetCount) {
  const uncovered = new Set(Array.from({ length: targetCount }, (_, index) => index))
  // Corner and perimeter positions are mandatory. Orthogonal interior rows
  // are also mandatory whenever the geometry requires additional H2H rows.
  const mandatory = candidates.filter((candidate) =>
    ['vertex', 'edge', 'interior_row'].includes(candidate.source))
  const selected = mandatory.slice(0, MAX_SELECTED_SPRINKLERS)
  const selectedIds = new Set(selected.map((candidate) => candidate.id))
  for (const candidate of selected) {
    for (const targetIndex of candidate.covered) uncovered.delete(targetIndex)
  }
  const available = candidates.filter((candidate) => !selectedIds.has(candidate.id))

  while (uncovered.size > 0 && selected.length < MAX_SELECTED_SPRINKLERS) {
    let bestIndex = -1
    let bestGain = 0
    let bestFlow = Number.POSITIVE_INFINITY
    for (let index = 0; index < available.length; index += 1) {
      const candidate = available[index]
      let gain = 0
      for (const targetIndex of candidate.covered) if (uncovered.has(targetIndex)) gain += 1
      if (gain > bestGain || (gain === bestGain && gain > 0 && candidate.flowLpm < bestFlow)) {
        bestIndex = index
        bestGain = gain
        bestFlow = candidate.flowLpm
      }
    }
    if (bestIndex < 0) break
    const [chosen] = available.splice(bestIndex, 1)
    selected.push(chosen)
    for (const targetIndex of chosen.covered) uncovered.delete(targetIndex)
  }
  return { selected, uncovered }
}

export function evaluateHeadToHeadSpacing(selected) {
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

      const maximumSpacing = Math.min(sprinkler.radiusM, other.radiusM)
      const mutuallyReaches = separation <= maximumSpacing + EPSILON &&
        sectorContains(
          sprinkler.position,
          other.position,
          other.directionDeg ?? 0,
          other.arcDeg,
          other.radiusM,
        ) &&
        sectorContains(
          other.position,
          sprinkler.position,
          sprinkler.directionDeg ?? 0,
          sprinkler.arcDeg,
          sprinkler.radiusM,
        )
      if (mutuallyReaches && separation < headToHeadDistanceM) {
        headToHeadDistanceM = separation
        headToHeadNeighbor = other
      }
    }

    const nearestLimit = nearest ? Math.min(sprinkler.radiusM, nearest.radiusM) : null
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
      passed: headToHeadNeighbor !== null,
    })
  }))
}

function enforceHeadToHeadSpacing(selectedInput, candidates) {
  const selected = selectedInput.slice()
  let changed = true
  while (changed && selected.length < MAX_SELECTED_SPRINKLERS) {
    changed = false
    const checks = evaluateHeadToHeadSpacing(selected)
    for (const check of checks) {
      if (check.passed) continue
      const sprinkler = selected.find((entry) => entry.id === check.sprinklerId)
      if (!sprinkler) continue
      const neighbour = candidates
        .filter((candidate) => !selected.some((entry) => entry.id === candidate.id))
        .map((candidate) => ({
          candidate,
          separation: distance(sprinkler.position, candidate.position),
        }))
        .filter(({ candidate, separation }) =>
          separation <= Math.min(sprinkler.radiusM, candidate.radiusM) + EPSILON &&
          sectorContains(
            sprinkler.position,
            candidate.position,
            candidate.directionDeg ?? 0,
            candidate.arcDeg,
            candidate.radiusM,
          ) &&
          sectorContains(
            candidate.position,
            sprinkler.position,
            sprinkler.directionDeg ?? 0,
            sprinkler.arcDeg,
            sprinkler.radiusM,
          ))
        .sort((a, b) =>
          a.separation - b.separation ||
          a.candidate.flowLpm - b.candidate.flowLpm ||
          a.candidate.id.localeCompare(b.candidate.id))[0]
      if (neighbour) {
        selected.push(neighbour.candidate)
        changed = true
      }
    }
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
  const probeArc = family === 'R-VAN' ? 180 : 180
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

  const candidates = buildCandidates(vertices, family, model, pressureBar, probe.radiusM)
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
  const { selected: coverageSelection, uncovered } = selectGreedy(evaluated, targets.length)
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
    algorithm: 'deterministic-greedy-set-cover-v1',
    status: uncovered.size === 0 ? 'coverage_complete_sampled' : 'coverage_incomplete',
    coverageScope: 'sampled_geometry_only',
    family,
    model,
    pressureBar,
    sampleStepM,
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
    totalFlowLpm: sprinklers.reduce((sum, sprinkler) => sum + sprinkler.flowLpm, 0),
    warnings: Object.freeze(warnings.map((entry) => Object.freeze(entry))),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
  })
}
