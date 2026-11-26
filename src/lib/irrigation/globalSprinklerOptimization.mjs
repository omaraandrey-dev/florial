import { evaluateHeadToHeadSpacing, sprinklersMutuallyReach } from './lawnSprinklerLayout.mjs'

const EPSILON = 1e-8
const COORDINATE_TOLERANCE = 1e-6
const MAX_GLOBAL_TARGETS = 30000
const MAX_SECTOR_VARIANTS = 500

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function pointOnSegment(point, a, b) {
  const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
  return Math.abs(cross) <= EPSILON &&
    point.x >= Math.min(a.x, b.x) - EPSILON &&
    point.x <= Math.max(a.x, b.x) + EPSILON &&
    point.y >= Math.min(a.y, b.y) - EPSILON &&
    point.y <= Math.max(a.y, b.y) + EPSILON
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    if (pointOnSegment(point, a, b)) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const intersectionX = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (point.x < intersectionX) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function pointIsTarget(point, region) {
  if (pointInRing(point, region.boundary.vertices) < 0) return false
  return !(region.exclusions ?? []).some((entry) =>
    pointInRing(point, entry.polygon.vertices) >= 0)
}

function buildGlobalTargets(geometry, stepM, maxTargets) {
  const region = geometry?.regions?.[0]
  const vertices = region?.boundary?.vertices
  if (!region || !Array.isArray(vertices) || vertices.length < 4 ||
      !Number.isFinite(stepM) || stepM <= 0) {
    return { status: 'invalid_geometry', targets: [] }
  }

  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const columns = Math.max(1, Math.ceil((maxX - minX) / stepM))
  const rows = Math.max(1, Math.ceil((maxY - minY) / stepM))
  const targets = []
  const seen = new Set()

  const add = (point) => {
    if (!pointIsTarget(point, region)) return true
    const x = Number(point.x.toFixed(6))
    const y = Number(point.y.toFixed(6))
    const key = x + ':' + y
    if (seen.has(key)) return true
    seen.add(key)
    targets.push(Object.freeze({ x, y }))
    return targets.length <= maxTargets
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = minY + (maxY - minY) * row / rows
    for (let column = 0; column <= columns; column += 1) {
      const x = minX + (maxX - minX) * column / columns
      if (!add({ x, y })) {
        return { status: 'skipped_target_limit', targets: [], estimatedGridPoints: (rows + 1) * (columns + 1) }
      }
    }
  }

  // Add outer-boundary samples independently of the regular grid origin.
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    const divisions = Math.max(1, Math.ceil(distance(a, b) / stepM))
    for (let part = 0; part <= divisions; part += 1) {
      const ratio = part / divisions
      if (!add({
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
      })) {
        return { status: 'skipped_target_limit', targets: [], estimatedGridPoints: (rows + 1) * (columns + 1) }
      }
    }
  }

  if (targets.length > maxTargets) {
    return { status: 'skipped_target_limit', targets: [], estimatedGridPoints: targets.length }
  }
  return { status: 'ready', targets }
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function headCoversPoint(head, point) {
  if (head.pattern === 'strip' && head.stripBounds) {
    const bounds = head.stripBounds
    if (point.x < bounds.minX - EPSILON || point.x > bounds.maxX + EPSILON ||
        point.y < bounds.minY - EPSILON || point.y > bounds.maxY + EPSILON) return false
    if (head.stripAxis === 'horizontal') {
      if (head.stripDirection === 'left') return point.x <= head.position.x + EPSILON &&
        point.x >= head.position.x - head.stripLengthM - EPSILON
      if (head.stripDirection === 'right') return point.x >= head.position.x - EPSILON &&
        point.x <= head.position.x + head.stripLengthM + EPSILON
      return true
    }
    if (head.stripDirection === 'up') return point.y >= head.position.y - EPSILON &&
      point.y <= head.position.y + head.stripLengthM + EPSILON
    if (head.stripDirection === 'down') return point.y <= head.position.y + EPSILON &&
      point.y >= head.position.y - head.stripLengthM - EPSILON
    return true
  }

  if (!Number.isFinite(head.radiusM)) return false
  const dx = point.x - head.position.x
  const dy = point.y - head.position.y
  if (Math.hypot(dx, dy) > head.radiusM + EPSILON) return false
  const arc = head.arcDeg ?? 360
  if (arc === 360) return true
  const angle = normalizeDegrees(Math.atan2(dy, dx) * 180 / Math.PI)
  const direction = normalizeDegrees(head.directionDeg ?? 0)
  const difference = Math.abs(((angle - direction + 540) % 360) - 180)
  return difference <= arc / 2 + EPSILON
}

function coverageForHead(head, targets) {
  const covered = []
  for (let index = 0; index < targets.length; index += 1) {
    if (headCoversPoint(head, targets[index])) covered.push(index)
  }
  return covered
}

function countCoverage(heads, coverageById, targetCount) {
  const counts = new Uint16Array(targetCount)
  for (const head of heads) {
    const covered = coverageById.get(head.id) ?? []
    for (const index of covered) counts[index] += 1
  }
  return counts
}

function allTargetsCovered(counts) {
  for (let index = 0; index < counts.length; index += 1) {
    if (counts[index] === 0) return false
  }
  return counts.length > 0
}

function coverageSummary(counts, targets) {
  let coveredPoints = 0
  const uncoveredSamples = []
  for (let index = 0; index < counts.length; index += 1) {
    if (counts[index] > 0) coveredPoints += 1
    else if (uncoveredSamples.length < 100) uncoveredSamples.push(targets[index])
  }
  return Object.freeze({
    sampledPoints: targets.length,
    coveredPoints,
    uncoveredPoints: targets.length - coveredPoints,
    coveragePercent: targets.length ? coveredPoints / targets.length * 100 : null,
    uncoveredSamples: Object.freeze(uncoveredSamples),
  })
}

function regionIdsForHead(head) {
  if (Array.isArray(head.calculationRegionIds) && head.calculationRegionIds.length) {
    return head.calculationRegionIds
  }
  return head.calculationRegionId ? [head.calculationRegionId] : ['__global__']
}

function buildHeadToHead(heads, baselineRegionSizes) {
  const groups = new Map()
  for (const head of heads) {
    if (head.pattern === 'strip' || !Number.isFinite(head.radiusM)) continue
    for (const regionId of regionIdsForHead(head)) {
      if (!groups.has(regionId)) groups.set(regionId, [])
      if (!groups.get(regionId).some((entry) => entry.id === head.id)) groups.get(regionId).push(head)
    }
  }

  const checks = []
  for (const [regionId, group] of groups) {
    const baselineSize = baselineRegionSizes.get(regionId) ?? group.length
    if (baselineSize > 1 && group.length < 2) {
      return { passed: false, checks, reason: 'required_region_neighbor_missing' }
    }
    if (group.length > 1) {
      const regional = evaluateHeadToHeadSpacing(group)
      checks.push(...regional.map((entry) => Object.freeze({ ...entry, calculationRegionId: regionId })))
      if (regional.some((entry) => !entry.passed)) {
        return { passed: false, checks, reason: 'regional_head_to_head_failed' }
      }
    }
  }

  const circular = heads.filter((head) => head.pattern !== 'strip' && Number.isFinite(head.radiusM))
  const crossRegionChecks = []
  for (let first = 0; first < circular.length; first += 1) {
    for (let second = first + 1; second < circular.length; second += 1) {
      const a = circular[first]
      const b = circular[second]
      const aRegions = regionIdsForHead(a)
      const bRegions = regionIdsForHead(b)
      if (aRegions.some((id) => bRegions.includes(id))) continue
      const separation = distance(a.position, b.position)
      if (separation > 0.05 && separation <= Math.min(a.radiusM, b.radiusM) + EPSILON &&
          sprinklersMutuallyReach(a, b)) {
        crossRegionChecks.push(Object.freeze({
          sprinklerId: a.id,
          neighborId: b.id,
          separationM: separation,
          passed: true,
        }))
      }
    }
  }
  checks.push(...crossRegionChecks)
  return { passed: true, checks }
}

function uniqueContribution(head, counts, coverageById) {
  let unique = 0
  for (const index of coverageById.get(head.id) ?? []) {
    if (counts[index] === 1) unique += 1
  }
  return unique
}

function isRotor(head) {
  return head.performanceModel === '3504-PC' && head.pattern === 'rotor' &&
    Number.isFinite(head.radiusM)
}

function tryRemoveRotor(heads, counts, coverageById, candidate, {
  oversprayCheck,
  baselineRegionSizes,
  excludedId = null,
} = {}) {
  if (candidate.id === excludedId) return null
  const nextHeads = heads.filter((head) => head.id !== candidate.id)
  const nextCounts = counts.slice()
  for (const index of coverageById.get(candidate.id) ?? []) nextCounts[index] -= 1
  if (!allTargetsCovered(nextCounts)) return null
  const headToHead = buildHeadToHead(nextHeads, baselineRegionSizes)
  if (!headToHead.passed || !oversprayCheck(nextHeads)) return null
  return { heads: nextHeads, counts: nextCounts, headToHead }
}

function runRemovalPass(state, options) {
  let { heads, counts, coverageById } = state
  const removedHeadIds = []
  const failed = new Set()

  while (true) {
    const candidates = heads.filter((head) => isRotor(head) && !failed.has(head.id))
      .map((head) => ({ head, unique: uniqueContribution(head, counts, coverageById) }))
      .sort((a, b) => a.unique - b.unique || a.head.id.localeCompare(b.head.id))
    const next = candidates[0]?.head
    if (!next) break
    const accepted = tryRemoveRotor(heads, counts, coverageById, next, options)
    if (!accepted) {
      failed.add(next.id)
      continue
    }
    heads = accepted.heads
    counts = accepted.counts
    removedHeadIds.push(next.id)
  }

  return { heads, counts, coverageById, removedHeadIds }
}

function coordinateKey(head) {
  return Math.round(head.position.x / COORDINATE_TOLERANCE) + ':' +
    Math.round(head.position.y / COORDINATE_TOLERANCE)
}

function candidateDirections(targets, position, radiusM, arcDeg) {
  if (arcDeg === 360) return [null]
  const candidates = []
  for (let direction = 0; direction < 360; direction += 5) {
    const head = { position, radiusM, arcDeg, directionDeg: direction }
    let score = 0
    for (const point of targets) if (headCoversPoint(head, point)) score += 1
    candidates.push({ direction, score })
  }
  candidates.sort((a, b) => b.score - a.score || a.direction - b.direction)
  return candidates.map((entry) => entry.direction)
}

function makeSectorCandidate(group, arcDeg, directionDeg, radiusM) {
  const first = group[0]
  const regionIds = [...new Set(group.flatMap(regionIdsForHead))]
  return Object.freeze({
    ...first,
    id: first.id,
    position: first.position,
    arcDeg,
    directionDeg: arcDeg === 360 ? null : directionDeg,
    radiusM,
    pattern: 'rotor',
    calculationRegionId: regionIds[0],
    calculationRegionIds: Object.freeze(regionIds),
    performanceModel: '3504-PC',
  })
}

function replaceHeads(heads, removeIds, replacement) {
  const remove = new Set(removeIds)
  const next = heads.filter((head) => !remove.has(head.id))
  next.push(replacement)
  return next
}

function adjustedCounts(counts, removedGroups, replacementCoverage) {
  const next = counts.slice()
  for (const covered of removedGroups) {
    for (const index of covered) next[index] -= 1
  }
  for (const index of replacementCoverage) next[index] += 1
  return next
}

function runSectorOptimization(state, options) {
  let { heads, counts, coverageById } = state
  let sectorVariants = 0
  let sectorVariantLimitReached = false
  const consolidatedGroups = []
  const sectorEdits = []

  const groupsByPosition = new Map()
  for (const head of heads.filter(isRotor)) {
    const key = coordinateKey(head)
    if (!groupsByPosition.has(key)) groupsByPosition.set(key, [])
    groupsByPosition.get(key).push(head)
  }

  for (const group of groupsByPosition.values()) {
    if (group.length < 2) continue
    const radiusOptions = [...new Set(group.map((head) => head.radiusM))].sort((a, b) => b - a)
    let accepted = null
    for (const radiusM of radiusOptions) {
      const arcOptions = [270, 360]
      for (const arcDeg of arcOptions) {
        const directions = candidateDirections(options.targets, group[0].position, radiusM, arcDeg)
        for (const directionDeg of directions) {
          if (sectorVariants >= options.maxSectorVariants) {
            sectorVariantLimitReached = true
            break
          }
          sectorVariants += 1
          const replacement = makeSectorCandidate(group, arcDeg, directionDeg, radiusM)
          const removeIds = group.map((head) => head.id)
          const nextHeads = replaceHeads(heads, removeIds, replacement)
          const replacementCoverage = coverageForHead(replacement, options.targets)
          const nextCounts = adjustedCounts(counts,
            group.map((head) => coverageById.get(head.id) ?? []), replacementCoverage)
          if (!allTargetsCovered(nextCounts)) continue
          const headToHead = buildHeadToHead(nextHeads, options.baselineRegionSizes)
          if (!headToHead.passed || !options.oversprayCheck(nextHeads)) continue
          accepted = { replacement, nextHeads, nextCounts, replacementCoverage, headToHead, arcDeg }
          break
        }
        if (accepted || sectorVariantLimitReached) break
      }
      if (accepted || sectorVariantLimitReached) break
    }
    if (accepted) {
      heads = accepted.nextHeads
      counts = accepted.nextCounts
      for (const head of group) coverageById.delete(head.id)
      coverageById.set(accepted.replacement.id, accepted.replacementCoverage)
      consolidatedGroups.push(Object.freeze({
        removedHeadIds: Object.freeze(group.map((head) => head.id)),
        replacementHeadId: accepted.replacement.id,
        arcDeg: accepted.arcDeg,
        position: accepted.replacement.position,
      }))
    }
    if (sectorVariantLimitReached) break
  }

  // A single-head sector change is retained only when it enables another removal.
  if (!sectorVariantLimitReached) {
    const singles = heads.filter(isRotor).slice()
    for (const head of singles) {
      if (!heads.some((entry) => entry.id === head.id)) continue
      const radiusM = head.radiusM
      for (const arcDeg of [270, 360]) {
        if (head.arcDeg === arcDeg) continue
        const directions = candidateDirections(options.targets, head.position, radiusM, arcDeg)
        let accepted = null
        for (const directionDeg of directions) {
          if (sectorVariants >= options.maxSectorVariants) {
            sectorVariantLimitReached = true
            break
          }
          sectorVariants += 1
          const replacement = makeSectorCandidate([head], arcDeg, directionDeg, radiusM)
          const nextHeads = heads.map((entry) => entry.id === head.id ? replacement : entry)
          const oldCoverage = coverageById.get(head.id) ?? []
          const replacementCoverage = coverageForHead(replacement, options.targets)
          const nextCounts = adjustedCounts(counts, [oldCoverage], replacementCoverage)
          if (!allTargetsCovered(nextCounts)) continue
          const headToHead = buildHeadToHead(nextHeads, options.baselineRegionSizes)
          if (!headToHead.passed || !options.oversprayCheck(nextHeads)) continue

          const candidateState = { heads: nextHeads, counts: nextCounts, coverageById: new Map(coverageById) }
          candidateState.coverageById.set(head.id, replacementCoverage)
          const removable = candidateState.heads.filter((entry) =>
            isRotor(entry) && entry.id !== head.id)
            .map((entry) => ({ head: entry, unique: uniqueContribution(entry, nextCounts, candidateState.coverageById) }))
            .sort((a, b) => a.unique - b.unique || a.head.id.localeCompare(b.head.id))
          for (const item of removable) {
            const removed = tryRemoveRotor(candidateState.heads, candidateState.counts,
              candidateState.coverageById, item.head, options)
            if (removed) {
              accepted = { replacement, heads: removed.heads, counts: removed.counts,
                removedId: item.head.id, replacementCoverage }
              break
            }
          }
          if (accepted) break
        }
        if (accepted) {
          heads = accepted.heads
          counts = accepted.counts
          coverageById.set(head.id, accepted.replacementCoverage)
          sectorEdits.push(Object.freeze({
            sprinklerId: head.id,
            arcDeg,
            directionDeg: accepted.replacement.directionDeg,
            removedHeadId: accepted.removedId,
          }))
          break
        }
        if (sectorVariantLimitReached) break
      }
      if (sectorVariantLimitReached) break
    }
  }

  const removal = runRemovalPass({ heads, counts, coverageById }, options)
  return {
    ...removal,
    sectorVariants,
    sectorVariantLimitReached,
    consolidatedGroups,
    sectorEdits,
  }
}

export function optimizeGlobalSprinklerSet({
  sprinklers,
  geometry,
  parts,
  sampleStepM = 0.5,
  oversprayCheck = () => true,
  maxTargetPoints = MAX_GLOBAL_TARGETS,
  maxSectorVariants = MAX_SECTOR_VARIANTS,
} = {}) {
  const originalHeads = Array.isArray(sprinklers) ? sprinklers.slice() : []
  const sampled = buildGlobalTargets(geometry, sampleStepM, maxTargetPoints)
  if (sampled.status !== 'ready') {
    return Object.freeze({
      status: sampled.status,
      sprinklers: Object.freeze(originalHeads),
      baseline: Object.freeze({
        sprinklerCount: originalHeads.length,
        rotorCount: originalHeads.filter(isRotor).length,
        sprinklers: Object.freeze(originalHeads),
      }),
      optimized: Object.freeze({
        sprinklerCount: originalHeads.length,
        rotorCount: originalHeads.filter(isRotor).length,
      }),
      targetCount: null,
      removedHeadIds: Object.freeze([]),
      consolidatedGroups: Object.freeze([]),
      sectorEdits: Object.freeze([]),
      sectorVariants: 0,
      sectorVariantLimitReached: false,
      coverage: null,
      headToHead: null,
      oversprayPassed: null,
    })
  }

  const targets = sampled.targets
  const coverageById = new Map(originalHeads.map((head) => [head.id, coverageForHead(head, targets)]))
  const counts = countCoverage(originalHeads, coverageById, targets.length)
  const baselineRegionSizes = new Map()
  for (const part of parts ?? []) {
    const count = (part.layout?.sprinklers ?? []).filter((head) => head.pattern !== 'strip' && Number.isFinite(head.radiusM)).length
    baselineRegionSizes.set(part.id, count)
  }
  const baselineHeadToHead = buildHeadToHead(originalHeads, baselineRegionSizes)
  const baselineOverspray = Boolean(oversprayCheck(originalHeads))
  const baselineCoveragePassed = allTargetsCovered(counts)
  const baselineCoverage = coverageSummary(counts, targets)

  if (!baselineCoveragePassed || !baselineHeadToHead.passed || !baselineOverspray) {
    return Object.freeze({
      status: 'baseline_failed',
      sprinklers: Object.freeze(originalHeads),
      baseline: Object.freeze({
        sprinklerCount: originalHeads.length,
        rotorCount: originalHeads.filter(isRotor).length,
        sprinklers: Object.freeze(originalHeads),
      }),
      optimized: Object.freeze({
        sprinklerCount: originalHeads.length,
        rotorCount: originalHeads.filter(isRotor).length,
      }),
      targetCount: targets.length,
      removedHeadIds: Object.freeze([]),
      consolidatedGroups: Object.freeze([]),
      sectorEdits: Object.freeze([]),
      sectorVariants: 0,
      sectorVariantLimitReached: false,
      coverage: baselineCoverage,
      headToHead: Object.freeze({ passed: baselineHeadToHead.passed, checks: Object.freeze(baselineHeadToHead.checks) }),
      oversprayPassed: baselineOverspray,
      failure: Object.freeze({
        coverage: !baselineCoveragePassed,
        headToHead: !baselineHeadToHead.passed,
        overspray: !baselineOverspray,
      }),
    })
  }

  const options = {
    targets,
    oversprayCheck,
    baselineRegionSizes,
    maxSectorVariants: Math.min(MAX_SECTOR_VARIANTS, Math.max(0, maxSectorVariants)),
  }
  const firstPass = runRemovalPass({ heads: originalHeads, counts, coverageById }, options)
  const sectorPass = runSectorOptimization(firstPass, options)
  const finalCounts = sectorPass.counts
  const finalHeadToHead = buildHeadToHead(sectorPass.heads, baselineRegionSizes)
  const finalOverspray = Boolean(oversprayCheck(sectorPass.heads))
  const finalCoverage = coverageSummary(finalCounts, targets)
  const finalValid = allTargetsCovered(finalCounts) && finalHeadToHead.passed && finalOverspray

  return Object.freeze({
    status: finalValid ? 'completed' : 'final_validation_failed',
    sprinklers: Object.freeze(finalValid ? sectorPass.heads : originalHeads),
    targetCount: targets.length,
    removedHeadIds: Object.freeze(finalValid
      ? [...firstPass.removedHeadIds, ...sectorPass.removedHeadIds]
      : []),
    consolidatedGroups: Object.freeze(finalValid ? sectorPass.consolidatedGroups : []),
    sectorEdits: Object.freeze(finalValid ? sectorPass.sectorEdits : []),
    sectorVariants: sectorPass.sectorVariants,
    sectorVariantLimitReached: sectorPass.sectorVariantLimitReached,
    coverage: finalValid ? finalCoverage : baselineCoverage,
    headToHead: Object.freeze({
      passed: finalValid ? finalHeadToHead.passed : baselineHeadToHead.passed,
      checks: Object.freeze(finalValid ? finalHeadToHead.checks : baselineHeadToHead.checks),
    }),
    oversprayPassed: finalValid ? finalOverspray : baselineOverspray,
    baseline: Object.freeze({
      sprinklerCount: originalHeads.length,
      rotorCount: originalHeads.filter(isRotor).length,
      sprinklers: Object.freeze(originalHeads),
    }),
    optimized: Object.freeze({
      sprinklerCount: finalValid ? sectorPass.heads.length : originalHeads.length,
      rotorCount: finalValid ? sectorPass.heads.filter(isRotor).length : originalHeads.filter(isRotor).length,
    }),
  })
}
