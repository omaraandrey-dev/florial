import assert from 'node:assert/strict'
import test from 'node:test'
import { generateLawnSprinklerLayout } from '../src/lib/irrigation/lawnSprinklerLayout.mjs'

function confirmedGeometry(vertices, exclusions = []) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions }],
  }
}

const rectangle = confirmedGeometry([
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 12, y: 8 },
  { x: 0, y: 8 },
])

const lShape = confirmedGeometry([
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 12, y: 3 },
  { x: 5, y: 3 },
  { x: 5, y: 8 },
  { x: 0, y: 8 },
])

test('generates a deterministic sampled-coverage layout for a rectangle using R-VAN', () => {
  const input = { geometry: rectangle, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1, sampleStepM: 0.5 }
  const first = generateLawnSprinklerLayout(input)
  const second = generateLawnSprinklerLayout(input)
  assert.equal(first.status, 'coverage_complete_sampled')
  assert.ok(first.sprinklers.length > 0)
  assert.deepEqual(first.sprinklers, second.sprinklers)
  assert.equal(first.coverage.uncoveredPoints, 0)
  assert.equal(first.hydraulicFeasibility, 'not_evaluated')
  assert.equal(first.precipitationUniformity, 'not_evaluated')
  assert.equal(first.bodyCompatibility, 'not_evaluated')
  assert.equal(first.overspray, 'not_evaluated')
  assert.ok(first.sprinklers.every((entry) => [90, 180, 270, 360].includes(entry.arcDeg)))
})

test('generates a sampled-coverage layout for an orthogonal L-shaped lawn', () => {
  const result = generateLawnSprinklerLayout({
    geometry: lShape,
    family: 'R-VAN',
    model: 'R-VAN18',
    pressureBar: 3.1,
    sampleStepM: 0.5,
  })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.equal(result.geometry.shape, 'l-shape')
  assert.equal(result.coverage.uncoveredPoints, 0)
})

test('supports the HE-VAN alternative using its own exact operating points', () => {
  const result = generateLawnSprinklerLayout({
    geometry: rectangle,
    family: 'HE-VAN',
    model: 'HE-VAN-12',
    pressureBar: 1.72,
    sampleStepM: 0.5,
  })
  assert.equal(result.status, 'coverage_complete_sampled')
  assert.ok(result.sprinklers.every((entry) => entry.pressureBar === 1.72))
})

test('rejects pressure values absent from exact manufacturer tables', () => {
  const result = generateLawnSprinklerLayout({
    geometry: rectangle,
    family: 'R-VAN',
    model: 'R-VAN18',
    pressureBar: 3.0,
  })
  assert.equal(result.status, 'operating_point_not_found')
  assert.equal(result.sprinklers.length, 0)
})

test('does not accept draft geometry or unscaled geometry', () => {
  const result = generateLawnSprinklerLayout({
    geometry: { ...rectangle, status: 'draft' },
    family: 'R-VAN',
    model: 'R-VAN18',
    pressureBar: 3.1,
  })
  assert.equal(result.status, 'geometry_not_accepted')
})

test('does not silently solve multiple regions, exclusions or unsupported shapes', () => {
  const withExclusion = confirmedGeometry(rectangle.regions[0].boundary.vertices, [{
    id: 'path-1',
    kind: 'path',
    polygon: { vertices: [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 2, y: 3 }] },
  }])
  const excluded = generateLawnSprinklerLayout({
    geometry: withExclusion, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1,
  })
  assert.equal(excluded.status, 'geometry_not_supported')
  assert.ok(excluded.warnings.some((entry) => entry.code === 'exclusions_not_yet_supported_by_layout_solver'))

  const multiple = {
    ...rectangle,
    regions: [
      rectangle.regions[0],
      { id: 'lawn-2', boundary: { vertices: rectangle.regions[0].boundary.vertices.map(({ x, y }) => ({ x: x + 20, y })) } },
    ],
  }
  assert.equal(generateLawnSprinklerLayout({
    geometry: multiple, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1,
  }).status, 'geometry_not_supported')
})

test('reports a separate head-to-head spacing check and never calls hydraulic feasibility', () => {
  const result = generateLawnSprinklerLayout({
    geometry: rectangle, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1, sampleStepM: 0.5,
  })
  assert.ok(result.headToHead.checks.length > 0)
  assert.equal(typeof result.headToHead.passed, 'boolean')
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.ok(result.warnings.some((entry) => entry.code === 'sampled_coverage_is_not_a_continuous_mathematical_proof'))
})

test('rejects invalid family/model and malformed sampling input', () => {
  assert.equal(generateLawnSprinklerLayout({
    geometry: rectangle, family: '5000', model: '5004PC30', pressureBar: 3.1,
  }).status, 'model_not_supported')
  assert.equal(generateLawnSprinklerLayout({
    geometry: rectangle, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1, sampleStepM: 0,
  }).status, 'invalid_operating_input')
})
