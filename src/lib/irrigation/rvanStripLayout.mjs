import { findRainBirdRvanPerformancePoint } from './rainBirdRvanPerformanceData.mjs'

const EPSILON = 1e-8
const DEFAULT_SAMPLE_STEP_M = 0.25
const STRIP_MODELS = Object.freeze(['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'])

function dot(a, b) {
  return a.x * b.x + a.y * b.y
}

function isAxisAlignedRectangle(vertices, bounds) {
  if (!Array.isArray(vertices) || vertices.length !== 4) return false
  const corners = new Set([
    `${bounds.minX.toFixed(6)}:${bounds.minY.toFixed(6)}`,
    `${bounds.maxX.toFixed(6)}:${bounds.minY.toFixed(6)}`,
    `${bounds.maxX.toFixed(6)}:${bounds.maxY.toFixed(6)}`,
    `${bounds.minX.toFixed(6)}:${bounds.maxY.toFixed(6)}`,
  ])
  return vertices.every((point) => corners.has(`${point.x.toFixed(6)}:${point.y.toFixed(6)}`))
}

function makeSprinkler(model, point, position, tangent, inward, alongMode, targetWidthM, targetLengthM, source) {
  const nominalWidthM = point.dimensionsM[0]
  const nominalLengthM = point.dimensionsM[1]
  const sizeAdjusted = Math.abs(targetWidthM - nominalWidthM) > EPSILON ||
    Math.abs(targetLengthM - nominalLengthM) > EPSILON
  return Object.freeze({
    id: model + '-' + String(source).padStart(2, '0'),
    model,
    performanceModel: model,
    pattern: point.pattern,
    patternLabel: model === 'R-VAN-LCS' ? 'Left corner strip' : model === 'R-VAN-RCS' ? 'Right corner strip' : 'Side strip',
    position: Object.freeze({ x: position.x, y: position.y }),
    tangent: Object.freeze({ x: tangent.x, y: tangent.y }),
    inward: Object.freeze({ x: inward.x, y: inward.y }),
    alongMode,
    arcDeg: null,
    directionDeg: Math.atan2(inward.y, inward.x) * 180 / Math.PI,
    radiusM: null,
    dimensionsM: Object.freeze([targetWidthM, targetLengthM]),
    nominalDimensionsM: point.dimensionsM,
    sizeAdjusted,
    sizeAdjustmentVerified: !sizeAdjusted,
    pressureBar: point.pressureBar,
    flowLpm: point.flowLpm,
    precipitationSquareMmH: point.precipitationSquareMmH,
    precipitationTriangularMmH: point.precipitationTriangularMmH,
    flowBasis: 'manufacturer_table_point_at_selected_pressure',
    source: 'strip_' + source,
  })
}

function stripContains(point, sprinkler) {
  const relative = {
    x: point.x - sprinkler.position.x,
    y: point.y - sprinkler.position.y,
  }
  const along = dot(relative, sprinkler.tangent)
  const depth = dot(relative, sprinkler.inward)
  const [widthM, lengthM] = sprinkler.dimensionsM
  if (depth < -EPSILON || depth > widthM + EPSILON) return false
  if (sprinkler.alongMode === 'forward') return along >= -EPSILON && along <= lengthM + EPSILON
  if (sprinkler.alongMode === 'backward') return along <= EPSILON && along >= -lengthM - EPSILON
  return Math.abs(along) <= lengthM / 2 + EPSILON
}

function buildSamples(bounds, stepM) {
  const columns = Math.ceil((bounds.maxX - bounds.minX) / stepM)
  const rows = Math.ceil((bounds.maxY - bounds.minY) / stepM)
  const samples = []
  for (let row = 0; row <= rows; row += 1) {
    const y = row === rows ? bounds.maxY : bounds.minY + row * stepM
    for (let column = 0; column <= columns; column += 1) {
      const x = column === columns ? bounds.maxX : bounds.minX + column * stepM
      samples.push(Object.freeze({ x, y }))
    }
  }
  return samples
}

function overlapChecks(sprinklers) {
  const intervals = sprinklers.map((sprinkler) => {
    const [widthM, lengthM] = sprinkler.dimensionsM
    const along = dot(sprinkler.position, sprinkler.tangent)
    const start = sprinkler.alongMode === 'forward' ? along :
      sprinkler.alongMode === 'backward' ? along - lengthM : along - lengthM / 2
    return { id: sprinkler.id, start, end: start + lengthM, lengthM }
  }).sort((a, b) => a.start - b.start)
  const checks = []
  for (let index = 0; index < intervals.length - 1; index += 1) {
    const current = intervals[index]
    const next = intervals[index + 1]
    const overlapM = Math.max(0, Math.min(current.end, next.end) - Math.max(current.start, next.start))
    const requiredOverlapM = Math.min(current.lengthM, next.lengthM) / 2
    checks.push(Object.freeze({
      from: current.id,
      to: next.id,
      overlapM,
      requiredOverlapM,
      passed: overlapM + EPSILON >= requiredOverlapM,
    }))
  }
  return Object.freeze({ passed: checks.every((check) => check.passed), checks: Object.freeze(checks) })
}

/** Preliminary R-VAN strip layout for a single axis-aligned rectangular lawn strip. */
export function generateRvanStripLayout({ geometry, pressureBar = 3.1, sampleStepM = DEFAULT_SAMPLE_STEP_M } = {}) {
  const vertices = geometry?.regions?.[0]?.boundary?.vertices
  if (!Array.isArray(vertices) || vertices.length !== 4) {
    return Object.freeze({ status: 'strip_geometry_not_supported', reason: 'strip_solver_supports_axis_aligned_rectangles_only' })
  }
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const bounds = Object.freeze({
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  })
  if (!isAxisAlignedRectangle(vertices, bounds)) {
    return Object.freeze({ status: 'strip_geometry_not_supported', reason: 'strip_solver_supports_axis_aligned_rectangles_only' })
  }

  const widthX = bounds.maxX - bounds.minX
  const widthY = bounds.maxY - bounds.minY
  const shortSideM = Math.min(widthX, widthY)
  const longSideM = Math.max(widthX, widthY)
  if (shortSideM < 1 || shortSideM > 2 || longSideM <= shortSideM) {
    return Object.freeze({ status: 'strip_geometry_outside_scope', shortSideM, longSideM })
  }

  const longAlongX = widthX >= widthY
  const tangent = longAlongX ? Object.freeze({ x: 1, y: 0 }) : Object.freeze({ x: 0, y: 1 })
  const inward = longAlongX ? Object.freeze({ x: 0, y: 1 }) : Object.freeze({ x: 1, y: 0 })
  const start = longAlongX ? { x: bounds.minX, y: bounds.minY } : { x: bounds.minX, y: bounds.minY }
  const end = longAlongX ? { x: bounds.maxX, y: bounds.minY } : { x: bounds.minX, y: bounds.maxY }
  const points = Object.fromEntries(STRIP_MODELS.map((model) => [model, findRainBirdRvanPerformancePoint(model, pressureBar, null)]))
  if (STRIP_MODELS.some((model) => !points[model]?.dimensionsM)) {
    return Object.freeze({ status: 'strip_manufacturer_point_missing', pressureBar })
  }

  const lcsLengthM = points['R-VAN-LCS'].dimensionsM[1]
  const rcsLengthM = points['R-VAN-RCS'].dimensionsM[1]
  const sstLengthM = points['R-VAN-SST'].dimensionsM[1]
  const sprinklers = []
  sprinklers.push(makeSprinkler('R-VAN-LCS', points['R-VAN-LCS'], start, tangent, inward, 'forward', shortSideM, lcsLengthM, 1))
  sprinklers.push(makeSprinkler('R-VAN-RCS', points['R-VAN-RCS'], end, tangent, inward, 'backward', shortSideM, rcsLengthM, 2))

  // LCS/RCS alone provide the required 50% overlap up to this length.
  const cornerOnlyLimitM = lcsLengthM + rcsLengthM - Math.min(lcsLengthM, rcsLengthM) / 2
  if (longSideM > cornerOnlyLimitM + EPSILON) {
    const firstCenterM = sstLengthM / 2
    const lastCenterM = longSideM - rcsLengthM - Math.min(sstLengthM, rcsLengthM) / 2
    const centers = []
    if (lastCenterM <= firstCenterM + EPSILON) {
      centers.push(longSideM / 2)
    } else {
      const intervalCount = Math.max(1, Math.ceil((lastCenterM - firstCenterM) / (sstLengthM / 2)))
      for (let index = 0; index <= intervalCount; index += 1) {
        centers.push(firstCenterM + (lastCenterM - firstCenterM) * index / intervalCount)
      }
    }
    for (const [index, centerM] of centers.entries()) {
      const position = {
        x: start.x + tangent.x * centerM,
        y: start.y + tangent.y * centerM,
      }
      const targetLengthM = Math.min(sstLengthM, longSideM)
      sprinklers.push(makeSprinkler('R-VAN-SST', points['R-VAN-SST'], position, tangent, inward, 'centered', shortSideM, targetLengthM, index + 3))
    }
  }

  const samples = buildSamples(bounds, sampleStepM)
  const uncoveredSamples = samples.filter((sample) => !sprinklers.some((sprinkler) => stripContains(sample, sprinkler)))
  const overlap = overlapChecks(sprinklers)
  const sizeAdjusted = sprinklers.some((sprinkler) => sprinkler.sizeAdjusted)
  const coveragePercent = samples.length ? ((samples.length - uncoveredSamples.length) / samples.length) * 100 : 0
  const sampledCoverageComplete = uncoveredSamples.length === 0
  const warnings = []
  if (sizeAdjusted) warnings.push({ code: 'strip_size_adjustment_requires_on_site_verification', path: 'sprinklers.dimensionsM' })
  if (!overlap.passed) warnings.push({ code: 'strip_50_percent_overlap_check_failed', path: 'sprinklers' })
  if (!sampledCoverageComplete) warnings.push({ code: 'strip_sampled_coverage_incomplete', path: 'coverage' })

  return Object.freeze({
    engineVersion: '0.1.0-strip',
    algorithm: 'rvan-strip-corner-first-overlap-v1',
    status: sampledCoverageComplete && overlap.passed ? 'coverage_complete_sampled' : 'coverage_incomplete',
    coverageScope: 'sampled_geometry_only',
    family: 'R-VAN',
    model: 'R-VAN strip',
    modelsUsed: Object.freeze([...new Set(sprinklers.map((sprinkler) => sprinkler.model))]),
    pressureBar,
    sampleStepM,
    geometry: Object.freeze({ shape: 'rectangle', areaM2: widthX * widthY, shortSideM, longSideM }),
    coverage: Object.freeze({
      sampledPoints: samples.length,
      coveredPoints: samples.length - uncoveredSamples.length,
      uncoveredPoints: uncoveredSamples.length,
      coveragePercent,
      uncoveredSamples: Object.freeze(uncoveredSamples.slice(0, 100)),
    }),
    sprinklers: Object.freeze(sprinklers),
    headToHead: overlap,
    totalFlowLpm: sprinklers.reduce((sum, sprinkler) => sum + sprinkler.flowLpm, 0),
    sizeAdjustmentRequired: sizeAdjusted,
    sizeAdjustmentVerified: !sizeAdjusted,
    warnings: Object.freeze(warnings.map((warning) => Object.freeze(warning))),
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
  })
}
