import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3500RotorLayout } from '../src/lib/irrigation/rainBird3500LayoutGenerator.mjs'

const rectangleVertices = [
  { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 8 },
]
const lShapeVertices = [
  { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 3 },
  { x: 4, y: 3 }, { x: 4, y: 7 }, { x: 0, y: 7 },
]

function geometry(vertices, id) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{
      id,
      boundary: { vertices: [...vertices, { ...vertices[0] }] },
    }],
  }
}

function transform(vertices, kind) {
  return vertices.map(({ x, y }) => {
    if (kind === 'mirror-x') return { x: -x, y }
    if (kind === 'rotate-90') return { x: -y, y: x }
    return { x, y }
  })
}

function runCase(shape, vertices, settings) {
  const started = process.hrtime.bigint()
  const result = generateRainBird3500RotorLayout({
    geometry: geometry(vertices, shape),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sampleStepM: settings.sampleStepM,
    candidatePositionStepFactor: settings.positionFactor,
    candidateDirectionStepDeg: settings.directionStepDeg,
  })
  const runtimeMs = Number(process.hrtime.bigint() - started) / 1e6
  const failedH2H = result.headToHead?.checks?.filter((check) => !check.passed).length ?? null
  const outsideSamples = result.overspray?.checks?.reduce(
    (sum, check) => sum + check.sampledOutsidePoints, 0,
  ) ?? null
  return {
    shape,
    sampleStepM: settings.sampleStepM,
    candidatePositionStepFactor: settings.positionFactor,
    candidateDirectionStepDeg: settings.directionStepDeg,
    runtimeMs: Number(runtimeMs.toFixed(3)),
    status: result.status,
    testedPositions: result.candidateStats?.testedPositions ?? null,
    testedCandidates: result.candidateStats?.testedCandidates ?? null,
    selectedRotors: result.candidateStats?.selectedRotors ?? null,
    sampledTargets: result.searchCoverage?.sampledTargets ?? null,
    sampledCoveragePercent: Number((result.searchCoverage?.searchCoveragePercent ?? 0).toFixed(4)),
    uncoveredTargets: result.searchCoverage?.uncoveredTargets ?? null,
    headToHeadPassed: result.headToHead?.passed ?? null,
    failedHeadToHeadChecks: failedH2H,
    oversprayStatus: result.overspray?.status ?? null,
    sampledOutsideSectorPoints: outsideSamples,
    totalFlowLpm: result.totalFlowLpm ?? null,
    hydraulicFeasibility: result.hydraulicFeasibility ?? null,
    precipitationUniformity: result.precipitationUniformity ?? null,
  }
}

test('benchmarks Rain Bird 3500 search sensitivity across synthetic geometries and bounded resolutions', (t) => {
  const shapes = [
    ['rectangle-12x8', rectangleVertices],
    ['l-shape', lShapeVertices],
    ['l-shape-mirrored', transform(lShapeVertices, 'mirror-x')],
    ['l-shape-rotated-90', transform(lShapeVertices, 'rotate-90')],
  ]
  const rows = []
  for (const [shape, vertices] of shapes) {
    for (const positionFactor of [0.25, 0.5, 1]) {
      for (const directionStepDeg of [15, 30, 45]) {
        const row = runCase(shape, vertices, {
          sampleStepM: 0.5,
          positionFactor,
          directionStepDeg,
        })
        rows.push(row)
        assert.equal(row.hydraulicFeasibility, 'not_evaluated', shape)
        assert.equal(row.precipitationUniformity, 'not_evaluated', shape)
        assert.ok(row.testedCandidates > 0, shape)
        assert.ok(row.selectedRotors > 0, shape)
        assert.ok(row.sampledCoveragePercent >= 0 && row.sampledCoveragePercent <= 100, shape)
      }
    }
  }
  t.diagnostic('3500_BENCHMARK_MATRIX=' + JSON.stringify(rows))
})

test('benchmarks target-sampling sensitivity independently from candidate-grid settings', (t) => {
  const rows = []
  for (const [shape, vertices] of [
    ['rectangle-12x8', rectangleVertices],
    ['l-shape', lShapeVertices],
  ]) {
    for (const sampleStepM of [0.5, 0.25, 0.125]) {
      const row = runCase(shape, vertices, {
        sampleStepM,
        positionFactor: 0.5,
        directionStepDeg: 45,
      })
      rows.push(row)
      assert.ok(row.sampledTargets > 0, shape)
      assert.ok(row.sampledCoveragePercent >= 0 && row.sampledCoveragePercent <= 100, shape)
      assert.equal(row.hydraulicFeasibility, 'not_evaluated')
      assert.equal(row.precipitationUniformity, 'not_evaluated')
    }
  }
  for (const shape of ['rectangle-12x8', 'l-shape']) {
    const counts = rows.filter((row) => row.shape === shape).map((row) => row.sampledTargets)
    assert.ok(counts[0] < counts[1] && counts[1] < counts[2], shape)
  }
  t.diagnostic('3500_TARGET_SAMPLING_MATRIX=' + JSON.stringify(rows))
})
