import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateHeadToHeadSpacing, generateLawnSprinklerLayout } from '../src/lib/irrigation/lawnSprinklerLayout.mjs'

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
  assert.equal(first.headToHead.passed, true)
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
  assert.equal(result.headToHead.passed, true)
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


test('covers narrow and medium residential rectangle widths deterministically', () => {
  const cases = [4, 5, 6, 8].map((width) => ({
    width,
    geometry: confirmedGeometry([
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: width },
      { x: 0, y: width },
    ]),
  }))

  for (const { width, geometry } of cases) {
    const input = {
      geometry,
      family: 'R-VAN',
      model: 'R-VAN18',
      pressureBar: 3.1,
      sampleStepM: 0.25,
    }
    const first = generateLawnSprinklerLayout(input)
    const second = generateLawnSprinklerLayout(input)

    assert.equal(first.status, 'coverage_complete_sampled', `sampled coverage at width ${width}m`)
    assert.equal(first.coverage.uncoveredPoints, 0, `uncovered samples at width ${width}m`)
    assert.equal(first.coverage.coveragePercent, 100, `coverage percentage at width ${width}m`)
    assert.deepEqual(first.sprinklers, second.sprinklers, `determinism at width ${width}m`)
    assert.ok(first.coverage.sampledPoints > 0, `samples at width ${width}m`)
    assert.equal(first.headToHead.passed, true, `head-to-head at width ${width}m`)
    assert.equal(first.hydraulicFeasibility, 'not_evaluated')
  }
})

test('handles mirrored and rotated L-shaped outlines with reflex-corner diagnostics', () => {
  const variants = [
    lShape.regions[0].boundary.vertices,
    lShape.regions[0].boundary.vertices.map(({ x, y }) => ({ x: y, y: x })),
    lShape.regions[0].boundary.vertices.slice().reverse(),
  ]

  for (const vertices of variants) {
    const result = generateLawnSprinklerLayout({
      geometry: confirmedGeometry(vertices),
      family: 'R-VAN',
      model: 'R-VAN18',
      pressureBar: 3.1,
      sampleStepM: 0.25,
    })
    assert.equal(result.geometry.shape, 'l-shape')
    assert.equal(result.status, 'coverage_complete_sampled')
    assert.equal(result.coverage.uncoveredPoints, 0)
    assert.equal(result.coverage.coveragePercent, 100)
    assert.ok(result.coverage.sampledPoints > 0)
    assert.equal(result.headToHead.passed, true)
    assert.ok(result.sprinklers.some((entry) => entry.arcDeg === 270))
    assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  }
})


test('sampled coverage remains complete at a finer spatial resolution', () => {
  const cases = [
    { name: 'rectangle', geometry: rectangle },
    { name: 'L-shape', geometry: lShape },
  ]

  for (const { name, geometry } of cases) {
    for (const sampleStepM of [0.25, 0.125]) {
      const result = generateLawnSprinklerLayout({
        geometry,
        family: 'R-VAN',
        model: 'R-VAN18',
        pressureBar: 3.1,
        sampleStepM,
      })
      assert.equal(result.status, 'coverage_complete_sampled', `${name} at ${sampleStepM}m`)
      assert.equal(result.coverage.uncoveredPoints, 0, `uncovered samples: ${name} at ${sampleStepM}m`)
      assert.equal(result.headToHead.passed, true, `head-to-head: ${name} at ${sampleStepM}m`)
    }
  }
})



test('R-VAN planning radius is fixed by model and does not change with arc', () => {
  for (const [model, radiusM] of [['R-VAN14', 3], ['R-VAN18', 5], ['R-VAN24', 6]]) {
    const result = generateLawnSprinklerLayout({
      geometry: confirmedGeometry([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 30 }, { x: 0, y: 30 }]), family: 'R-VAN', model, pressureBar: 3.1, sampleStepM: 0.5,
    })
    assert.ok(result.sprinklers.length > 0)
    assert.ok(result.sprinklers.every((head) => head.radiusM === radiusM))
    assert.ok(result.sprinklers.some((head) => head.arcDeg === 90))
    assert.ok(result.sprinklers.some((head) => head.arcDeg === 180))
    assert.ok(result.sprinklers.some((head) => head.arcDeg === 360))
  }
})

test('default control mesh interval is 0.5 metres', () => {
  const result = generateLawnSprinklerLayout({
    geometry: rectangle, family: 'R-VAN', model: 'R-VAN18', pressureBar: 3.1,
  })
  assert.equal(result.sampleStepM, 0.5)
})

test('head-to-head spacing rejects nearby sprinklers whose sectors face away from each other', () => {
  const checks = evaluateHeadToHeadSpacing([
    { id: 'a', position: { x: 0, y: 0 }, arcDeg: 90, directionDeg: 0, radiusM: 5 },
    { id: 'b', position: { x: 0, y: 3 }, arcDeg: 90, directionDeg: 180, radiusM: 5 },
  ])
  assert.equal(checks.length, 2)
  assert.ok(checks.every((entry) => entry.separationM === 3))
  assert.ok(checks.every((entry) => entry.passed === false))
  assert.ok(checks.every((entry) => entry.headToHeadNeighborId === null))
})

test('head-to-head spacing accepts mutually facing sectors within both throw radii', () => {
  const checks = evaluateHeadToHeadSpacing([
    { id: 'a', position: { x: 0, y: 0 }, arcDeg: 90, directionDeg: 90, radiusM: 5 },
    { id: 'b', position: { x: 0, y: 3 }, arcDeg: 90, directionDeg: 270, radiusM: 5 },
  ])
  assert.ok(checks.every((entry) => entry.passed === true))
  assert.ok(checks.every((entry) => entry.headToHeadSeparationM === 3))
})

test('head-to-head spacing treats full-circle rotor sectors as omnidirectional', () => {
  const checks = evaluateHeadToHeadSpacing([
    { id: 'a', position: { x: 0, y: 0 }, arcDeg: 360, directionDeg: null, radiusM: 5 },
    { id: 'b', position: { x: 0, y: 3 }, arcDeg: 360, directionDeg: null, radiusM: 5 },
  ])
  assert.ok(checks.every((entry) => entry.passed === true))
})
