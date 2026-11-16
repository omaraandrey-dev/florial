import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateRainBird3500RotorLayout } from '../src/lib/irrigation/rainBird3500RotorEngine.mjs'

function geometry(status = 'confirmed', vertices = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 12, y: 8 },
  { x: 0, y: 8 },
]) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status,
    regions: [{ id: 'lawn-1', boundary: { vertices } }],
  }
}

const twoRotors = [
  { id: 'rotor-a', position: { x: 3, y: 4 }, directionDeg: 0, arcDeg: 180 },
  { id: 'rotor-b', position: { x: 9, y: 4 }, directionDeg: 180, arcDeg: 180 },
]

test('evaluates only exact D42378 180-degree operating points', () => {
  const result = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: twoRotors,
    sampleStepM: 0.5,
  })
  assert.equal(result.family, '3500')
  assert.equal(result.operatingPoint.arcDeg, 180)
  assert.equal(result.operatingPoint.radiusM, 7)
  assert.equal(result.operatingPoint.flowLpm, 4.94)
  assert.equal(result.operatingPoint.precipitationBasis, 'Half-circle operation')
  assert.equal(result.hydraulicFeasibility, 'not_evaluated')
  assert.equal(result.precipitationUniformity, 'not_evaluated')
  assert.equal(result.bodyCompatibility, 'not_evaluated')
  assert.equal(result.coverageScope, 'sampled_geometry_only')
})

test('rejects every arc other than 180 degrees instead of reusing half-circle data', () => {
  for (const arcDeg of [40, 90, 179, 181, 270, 360]) {
    const result = evaluateRainBird3500RotorLayout({
      geometry: geometry(),
      nozzlePressureBar: 2.5,
      nozzle: 1.5,
      sprinklers: [{ ...twoRotors[0], arcDeg }],
    })
    assert.equal(result.status, 'unsupported_arc', 'arc ' + arcDeg)
    assert.equal(result.sprinklers.length, 0)
  }
})

test('rejects non-tabulated pressure/nozzle combinations without interpolation', () => {
  const result = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.2,
    nozzle: 1.5,
    sprinklers: twoRotors,
  })
  assert.equal(result.status, 'operating_point_not_found')
})

test('requires confirmed geometry and rejects exclusions or unsupported regions', () => {
  const draft = evaluateRainBird3500RotorLayout({
    geometry: geometry('draft'),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: twoRotors,
  })
  assert.equal(draft.status, 'geometry_not_accepted')

  const excluded = geometry()
  excluded.regions[0].exclusions = [{
    id: 'path',
    kind: 'path',
    polygon: { vertices: [
      { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 4, y: 3 },
    ] },
  }]
  const result = evaluateRainBird3500RotorLayout({
    geometry: excluded,
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: twoRotors,
  })
  assert.equal(result.status, 'geometry_not_supported')
})

test('checks directional head-to-head independently from sampled coverage', () => {
  const result = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: [
      { id: 'a', position: { x: 3, y: 4 }, directionDeg: 0, arcDeg: 180 },
      { id: 'b', position: { x: 9, y: 4 }, directionDeg: 180, arcDeg: 180 },
    ],
    sampleStepM: 0.5,
  })
  assert.equal(result.headToHead.passed, true)
  assert.ok(result.headToHead.checks.every((entry) => entry.neighbourId))
  assert.equal(result.overspray.status, 'sampled_overspray_detected')
  assert.equal(result.precipitationUniformity, 'not_evaluated')
})

test('rejects duplicate IDs, missing directions and rotor positions outside the lawn', () => {
  const duplicate = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: [twoRotors[0], { ...twoRotors[1], id: 'rotor-a' }],
  })
  assert.equal(duplicate.status, 'invalid_layout')

  const missingDirection = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: [{ id: 'x', position: { x: 2, y: 2 }, arcDeg: 180 }],
  })
  assert.equal(missingDirection.status, 'invalid_layout')

  const outside = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 1.5,
    sprinklers: [{ id: 'x', position: { x: 30, y: 30 }, directionDeg: 0, arcDeg: 180 }],
  })
  assert.equal(outside.status, 'invalid_layout')
})

function siteContext({ noSprayRegions = [] } = {}) {
  const square = (x1, y1, x2, y2) => ({
    vertices: [
      { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 },
      { x: x1, y: y2 }, { x: x1, y: y1 },
    ],
  })
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    siteBoundary: square(0, 0, 20, 12),
    permittedSprayRegions: [{ id: 'adjacent-bed', polygon: square(12, 0, 20, 12) }],
    noSprayRegions,
  }
}

test('whole-site context distinguishes permitted adjacent spray from prohibited overflow', () => {
  const allowed = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sprinklers: [{ id: 'east-head', position: { x: 3, y: 4 }, directionDeg: 0, arcDeg: 180 }],
    sampleStepM: 0.5,
    siteContext: siteContext(),
  })
  assert.equal(allowed.siteContext.status, 'confirmed')
  assert.equal(allowed.overspray.scope, 'site_boundary_and_spray_policy')
  assert.ok(allowed.overspray.checks[0].sampledOutsidePoints > 0)
  assert.equal(allowed.overspray.checks[0].sampledForbiddenPoints, 0)
  assert.ok(allowed.overspray.checks[0].sampledPermittedAdjacentPoints > 0)
  assert.equal(allowed.overspray.status, 'no_forbidden_spray_in_sampled_sector')
})

test('whole-site context flags spray entering a no-spray pool even inside the property', () => {
  const pool = { id: 'pool', kind: 'pool', polygon: {
    vertices: [
      { x: 12, y: 2 }, { x: 16, y: 2 }, { x: 16, y: 7 },
      { x: 12, y: 7 }, { x: 12, y: 2 },
    ],
  } }
  const result = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sprinklers: [{ id: 'east-head', position: { x: 3, y: 4 }, directionDeg: 0, arcDeg: 180 }],
    sampleStepM: 0.5,
    siteContext: siteContext({ noSprayRegions: [pool] }),
  })
  assert.ok(result.overspray.checks[0].sampledNoSprayPoints > 0)
  assert.ok(result.overspray.checks[0].sampledForbiddenPoints > 0)
  assert.equal(result.overspray.status, 'sampled_forbidden_spray_detected')
})

test('rejects unconfirmed or lawn-external site contexts before evaluation', () => {
  const draft = siteContext()
  draft.status = 'draft'
  const unconfirmed = evaluateRainBird3500RotorLayout({
    geometry: geometry(), nozzlePressureBar: 2.5, nozzle: 4,
    sprinklers: twoRotors, siteContext: draft,
  })
  assert.equal(unconfirmed.status, 'site_context_not_accepted')
  const outside = siteContext()
  outside.siteBoundary = { vertices: [
    { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
  ] }
  const notContained = evaluateRainBird3500RotorLayout({
    geometry: geometry(), nozzlePressureBar: 2.5, nozzle: 4,
    sprinklers: twoRotors, siteContext: outside,
  })
  assert.equal(notContained.status, 'site_context_not_accepted')
})

test('whole-site context separately counts spray beyond the property boundary', () => {
  const context = siteContext()
  context.siteBoundary = {
    vertices: [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 },
      { x: 0, y: 8 }, { x: 0, y: 0 },
    ],
  }
  context.permittedSprayRegions = []
  const result = evaluateRainBird3500RotorLayout({
    geometry: geometry(),
    nozzlePressureBar: 2.5,
    nozzle: 4,
    sprinklers: [{ id: 'east-head', position: { x: 3, y: 4 }, directionDeg: 0, arcDeg: 180 }],
    sampleStepM: 0.5,
    siteContext: context,
  })
  assert.ok(result.overspray.checks[0].sampledOutsideSitePoints > 0)
  assert.ok(result.overspray.checks[0].sampledForbiddenPoints > 0)
})
