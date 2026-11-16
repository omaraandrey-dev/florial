import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3500RotorLayout } from '../src/lib/irrigation/rainBird3500LayoutGenerator.mjs'

const lShapeVertices = [
  { x: 0, y: 0 },
  { x: 8, y: 0 },
  { x: 8, y: 3 },
  { x: 4, y: 3 },
  { x: 4, y: 7 },
  { x: 0, y: 7 },
]

function geometry(vertices) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{
      id: 'l-shape',
      boundary: { vertices: vertices.concat([{ ...vertices[0] }]) },
    }],
  }
}

function transform(vertices, kind) {
  return vertices.map(({ x, y }) => {
    if (kind === 'mirror-x') return { x: -x, y }
    if (kind === 'mirror-y') return { x, y: -y }
    if (kind === 'rotate-90') return { x: -y, y: x }
    if (kind === 'rotate-180') return { x: -x, y: -y }
    if (kind === 'rotate-270') return { x: y, y: -x }
    return { x, y }
  })
}

function run(vertices, sampleStepM = 0.5) {
  return generateRainBird3500RotorLayout({
    geometry: geometry(vertices),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sampleStepM,
  })
}

test('generates candidates for mirrored and 90-degree rotated L-shapes', () => {
  for (const transformName of ['mirror-x', 'mirror-y', 'rotate-90', 'rotate-180', 'rotate-270']) {
    const result = run(transform(lShapeVertices, transformName))
    assert.equal(result.family, '3500', transformName)
    assert.ok(result.candidateStats.testedCandidates > 0, transformName)
    assert.ok(result.searchCoverage.sampledTargets > 0, transformName)
    assert.ok(result.sprinklers.length > 0, transformName)
    assert.equal(result.headToHead?.passed, true, transformName)
    assert.ok(result.headToHead.checks.every((check) => check.passed), transformName)
    assert.ok(result.sprinklers.every((rotor) => rotor.arcDeg === 180), transformName)
    assert.notEqual(result.status, 'geometry_not_supported', transformName)
    assert.notEqual(result.status, 'geometry_not_accepted', transformName)
  }
})

test('finer target sampling increases sample count without changing the supported operating point', () => {
  const coarse = run(lShapeVertices, 0.5)
  const medium = run(lShapeVertices, 0.25)
  const fine = run(lShapeVertices, 0.125)

  assert.ok(coarse.searchCoverage.sampledTargets < medium.searchCoverage.sampledTargets)
  assert.ok(medium.searchCoverage.sampledTargets < fine.searchCoverage.sampledTargets)
  for (const result of [coarse, medium, fine]) {
    assert.equal(result.operatingPoint.nozzlePressureBar, 2.5)
    assert.equal(result.operatingPoint.nozzle, 4)
    assert.equal(result.operatingPoint.radiusM, 10.1)
    assert.ok(result.searchCoverage.searchCoveragePercent >= 0)
    assert.ok(result.searchCoverage.searchCoveragePercent <= 100)
    assert.equal(result.hydraulicFeasibility, 'not_evaluated')
    assert.equal(result.precipitationUniformity, 'not_evaluated')
    assert.ok(result.sprinklers.every((rotor) => rotor.arcDeg === 180))
  }
})

test('keeps generated rotor IDs and physical positions unique on L-shapes', () => {
  const result = run(lShapeVertices)
  const ids = result.sprinklers.map((rotor) => rotor.id)
  const positions = result.sprinklers.map((rotor) =>
    rotor.position.x.toFixed(5) + ':' + rotor.position.y.toFixed(5))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(positions).size, positions.length)
})
