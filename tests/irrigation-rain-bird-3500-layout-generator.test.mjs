import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRainBird3500RotorLayout } from '../src/lib/irrigation/rainBird3500LayoutGenerator.mjs'

function rectangle(status = 'confirmed') {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status,
    regions: [{
      id: 'lawn-rectangle',
      boundary: { vertices: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 8 },
        { x: 0, y: 8 },
        { x: 0, y: 0 },
      ] },
    }],
  }
}

test('generates deterministic candidates using exact D42378 180-degree data only', () => {
  const input = {
    geometry: rectangle(),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sampleStepM: 0.5,
  }
  const first = generateRainBird3500RotorLayout(input)
  const second = generateRainBird3500RotorLayout(input)
  assert.equal(first.family, '3500')
  assert.equal(first.operatingPoint.nozzlePressureBar, 2.5)
  assert.equal(first.operatingPoint.nozzle, 4)
  assert.equal(first.operatingPoint.radiusM, 10.1)
  assert.ok(first.sprinklers.length > 0)
  assert.ok(first.sprinklers.every((rotor) => rotor.arcDeg === 180))
  assert.deepEqual(first.sprinklers, second.sprinklers)
  assert.equal(first.hydraulicFeasibility, 'not_evaluated')
  assert.equal(first.precipitationUniformity, 'not_evaluated')
  assert.equal(first.bodyCompatibility, 'not_evaluated')
  assert.equal(first.candidateStrategy, '180-degree-sector-grid-greedy-v1')
  assert.ok(first.warnings.some((warning) => warning.code === 'heuristic_grid_search_not_global_optimum'))
  assert.notEqual(first.status, 'design_ready')
})

test('refuses pressure interpolation and nearest-point substitution', () => {
  const result = generateRainBird3500RotorLayout({
    geometry: rectangle(),
    nozzlePressureBar: 2.4,
    nozzle: 4,
  })
  assert.equal(result.status, 'operating_point_not_found')
  assert.equal(result.sprinklers.length, 0)
})

test('requires confirmed supported geometry and rejects exclusions', () => {
  const draft = generateRainBird3500RotorLayout({
    geometry: rectangle('draft'),
    nozzlePressureBar: 2.5,
    nozzle: 4,
  })
  assert.equal(draft.status, 'geometry_not_accepted')

  const excluded = rectangle()
  excluded.regions[0].exclusions = [{
    id: 'path',
    polygon: { vertices: [
      { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 2 },
    ] },
  }]
  const result = generateRainBird3500RotorLayout({
    geometry: excluded,
    nozzlePressureBar: 2.5,
    nozzle: 4,
  })
  assert.equal(result.status, 'geometry_not_supported')
})

test('reports the sampled search separately from hydraulic and uniformity status', () => {
  const result = generateRainBird3500RotorLayout({
    geometry: rectangle(),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sampleStepM: 1,
  })
  assert.ok(result.candidateStats.testedCandidates > 0)
  assert.ok(result.searchCoverage.sampledTargets > 0)
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.equal(result.precipitationUniformity, 'not_evaluated')
})
