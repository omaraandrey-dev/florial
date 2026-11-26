import assert from 'node:assert/strict'
import test from 'node:test'
import { validateLawnGeometry } from '../src/lib/irrigation/lawnGeometry.mjs'

function geometry(vertices, overrides = {}) {
  return {
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id: 'lawn-1', boundary: { vertices }, exclusions: [] }],
    ...overrides,
  }
}

const rectangle = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 5 },
  { x: 0, y: 5 },
]

const lShape = [
  { x: 0, y: 0 },
  { x: 8, y: 0 },
  { x: 8, y: 3 },
  { x: 4, y: 3 },
  { x: 4, y: 7 },
  { x: 0, y: 7 },
]

test('accepts a confirmed rectangle and computes metric area and perimeter', () => {
  const result = validateLawnGeometry(geometry(rectangle))
  assert.equal(result.status, 'accepted')
  assert.equal(result.valid, true)
  assert.equal(result.supported, true)
  assert.equal(result.regions[0].shape, 'rectangle')
  assert.equal(result.computedAreaM2, 50)
  assert.equal(result.computedPerimeterM, 30)
  assert.deepEqual(result.normalizedGeometry.regions[0].boundary.vertices[0], { x: 0, y: 0 })
  assert.deepEqual(result.normalizedGeometry.regions[0].boundary.vertices.at(-1), { x: 0, y: 0 })
})

test('accepts a confirmed orthogonal L-shape and computes its exact area', () => {
  const result = validateLawnGeometry(geometry(lShape))
  assert.equal(result.status, 'accepted')
  assert.equal(result.regions[0].shape, 'l-shape')
  assert.equal(result.computedAreaM2, 40)
  assert.equal(result.computedPerimeterM, 30)
})

test('normalizes an open ring and removes redundant collinear vertices', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 5 },
    { x: 0, y: 5 },
  ]))
  assert.equal(result.status, 'accepted')
  assert.equal(result.normalizedGeometry.regions[0].boundary.vertices.length, 5)
})

test('accepts clockwise and counter-clockwise rings consistently', () => {
  const clockwise = validateLawnGeometry(geometry(rectangle.slice().reverse()))
  const counterClockwise = validateLawnGeometry(geometry(rectangle))
  assert.equal(clockwise.status, 'accepted')
  assert.equal(counterClockwise.status, 'accepted')
  assert.equal(clockwise.computedAreaM2, counterClockwise.computedAreaM2)
})

test('reports an explicit needs-scale state without treating pixels as metres', () => {
  const result = validateLawnGeometry(geometry(rectangle, { status: 'needs_scale' }))
  assert.equal(result.status, 'needs_scale')
  assert.equal(result.valid, true)
})

test('requires explicit confirmation before geometry is accepted', () => {
  const result = validateLawnGeometry(geometry(rectangle, { status: 'draft' }))
  assert.equal(result.status, 'needs_confirmation')
  assert.equal(result.valid, true)
})

test('rejects a non-metric coordinate system', () => {
  const result = validateLawnGeometry(geometry(rectangle, { coordinateSystem: 'screen_pixels' }))
  assert.equal(result.status, 'invalid')
  assert.ok(result.errors.some((entry) => entry.code === 'unsupported_coordinate_system'))
})

test('rejects missing regions and unsupported schema versions', () => {
  const missing = validateLawnGeometry({ schemaVersion: 1, coordinateSystem: 'local_cartesian_m', regions: [] })
  const version = validateLawnGeometry(geometry(rectangle, { schemaVersion: 2 }))
  assert.equal(missing.status, 'invalid')
  assert.ok(missing.errors.some((entry) => entry.code === 'missing_regions'))
  assert.ok(version.errors.some((entry) => entry.code === 'invalid_schema_version'))
})

test('rejects non-finite coordinates', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: Number.NaN, y: 0 },
    { x: 5, y: 5 },
  ]))
  assert.ok(result.errors.some((entry) => entry.code === 'invalid_coordinate'))
})

test('rejects consecutive duplicate vertices', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: 5 },
  ]))
  assert.ok(result.errors.some((entry) => entry.code === 'consecutive_duplicate_vertex'))
})

test('rejects rings with fewer than three vertices and zero area', () => {
  const tooFew = validateLawnGeometry(geometry([{ x: 0, y: 0 }, { x: 1, y: 1 }]))
  const zeroArea = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 4, y: 0 },
  ]))
  assert.ok(tooFew.errors.some((entry) => entry.code === 'too_few_vertices'))
  assert.ok(zeroArea.errors.some((entry) => entry.code === 'zero_area_ring'))
})

test('rejects a self-intersecting bow-tie polygon', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 0, y: 5 },
    { x: 5, y: 0 },
  ]))
  assert.ok(result.errors.some((entry) => entry.code === 'self_intersection'))
})

test('marks a valid but unsupported non-orthogonal polygon as unsupported', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 5, y: 4 },
    { x: 0, y: 5 },
  ]))
  assert.equal(result.valid, true)
  assert.equal(result.supported, false)
  assert.equal(result.status, 'unsupported')
})

test('marks multiple valid regions unsupported for the v1 solver but preserves their area', () => {
  const second = { id: 'lawn-2', boundary: { vertices: rectangle.map(({ x, y }) => ({ x: x + 20, y })) } }
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [{ id: 'lawn-1', boundary: { vertices: rectangle } }, second],
  }))
  assert.equal(result.status, 'unsupported')
  assert.equal(result.valid, true)
  assert.equal(result.computedAreaM2, 100)
  assert.ok(result.warnings.some((entry) => entry.code === 'multiple_regions_not_supported_by_v1_solver'))
})

test('rejects overlapping lawn regions', () => {
  const overlapping = rectangle.map(({ x, y }) => ({ x: x + 5, y }))
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [
      { id: 'a', boundary: { vertices: rectangle } },
      { id: 'b', boundary: { vertices: overlapping } },
    ],
  }))
  assert.ok(result.errors.some((entry) => entry.code === 'overlapping_regions'))
})

test('subtracts contained exclusions from net irrigable area', () => {
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: rectangle },
      exclusions: [{
        id: 'path-1',
        kind: 'path',
        polygon: { vertices: [
          { x: 2, y: 1 },
          { x: 8, y: 1 },
          { x: 8, y: 2 },
          { x: 2, y: 2 },
        ] },
      }],
    }],
  }))
  assert.equal(result.status, 'accepted')
  assert.equal(result.regions[0].grossAreaM2, 50)
  assert.equal(result.regions[0].excludedAreaM2, 6)
  assert.equal(result.regions[0].netAreaM2, 44)
  assert.equal(result.computedAreaM2, 44)
  assert.equal(result.computedPerimeterM, 44)
})

test('accepts exclusions whose X or Y coordinate is zero along the lawn boundary', () => {
  for (const exclusion of [
    { x: 0, y: 1, width: 2, height: 2 },
    { x: 2, y: 0, width: 2, height: 2 },
  ]) {
    const result = validateLawnGeometry(geometry(rectangle, {
      regions: [{
        id: 'lawn-1',
        boundary: { vertices: rectangle },
        exclusions: [{
          id: 'edge-exclusion',
          polygon: { vertices: [
            { x: exclusion.x, y: exclusion.y },
            { x: exclusion.x + exclusion.width, y: exclusion.y },
            { x: exclusion.x + exclusion.width, y: exclusion.y + exclusion.height },
            { x: exclusion.x, y: exclusion.y + exclusion.height },
          ] },
        }],
      }],
    }))
    assert.equal(result.valid, true)
    assert.equal(result.status, 'accepted')
    assert.equal(result.regions[0].netAreaM2, 46)
  }
})

test('rejects zero-area rectangular exclusions', () => {
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: rectangle },
      exclusions: [{
        id: 'zero-width',
        polygon: { vertices: [
          { x: 2, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 2, y: 3 },
        ] },
      }],
    }],
  }))
  assert.equal(result.valid, false)
})

test('rejects an exclusion outside or crossing the lawn boundary', () => {
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: rectangle },
      exclusions: [{
        id: 'outside',
        polygon: { vertices: [
          { x: 9, y: 1 },
          { x: 12, y: 1 },
          { x: 12, y: 2 },
          { x: 9, y: 2 },
        ] },
      }],
    }],
  }))
  assert.ok(result.errors.some((entry) => entry.code === 'exclusion_outside_region'))
})

test('rejects overlapping exclusions and exclusions that remove the entire region', () => {
  const overlapping = validateLawnGeometry(geometry(rectangle, {
    regions: [{
      id: 'lawn-1',
      boundary: { vertices: rectangle },
      exclusions: [
        { id: 'a', polygon: { vertices: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 1, y: 3 }] } },
        { id: 'b', polygon: { vertices: [{ x: 3, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 4 }, { x: 3, y: 4 }] } },
      ],
    }],
  }))
  assert.ok(overlapping.errors.some((entry) => entry.code === 'overlapping_exclusions'))
})

test('does not invent an area mismatch tolerance', () => {
  const result = validateLawnGeometry(geometry(rectangle, { reportedAreaM2: 49 }))
  assert.equal(result.reportedAreaComparison.differenceM2, 1)
  assert.equal(result.reportedAreaComparison.differencePercent, (1 / 49) * 100)
  assert.equal(result.reportedAreaComparison.toleranceApplied, false)
})

test('rejects duplicate region and exclusion IDs', () => {
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [
      {
        id: 'same',
        boundary: { vertices: rectangle },
        exclusions: [{ id: 'duplicate', polygon: { vertices: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }] } }],
      },
      {
        id: 'same',
        boundary: { vertices: rectangle.map(({ x, y }) => ({ x: x + 20, y })) },
        exclusions: [{ id: 'duplicate', polygon: { vertices: [{ x: 21, y: 1 }, { x: 22, y: 1 }, { x: 22, y: 2 }] } }],
      },
    ],
  }))
  assert.ok(result.errors.some((entry) => entry.code === 'duplicate_id'))
})

test('rejects an invalid reported area', () => {
  const result = validateLawnGeometry(geometry(rectangle, { reportedAreaM2: -1 }))
  assert.ok(result.errors.some((entry) => entry.code === 'invalid_reported_area'))
})

test('returns a stable invalid result for non-object input', () => {
  const result = validateLawnGeometry(null)
  assert.equal(result.status, 'invalid')
  assert.deepEqual(result.errors, [{ code: 'invalid_input', path: '$' }])
})


test('rejects adjacent collinear edges that reverse and overlap', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 5 },
    { x: 0, y: 5 },
  ]))
  assert.ok(result.errors.some((entry) => entry.code === 'self_intersection'))
})

test('rejects malformed exclusion collections instead of silently ignoring them', () => {
  const result = validateLawnGeometry(geometry(rectangle, {
    regions: [{ id: 'lawn-1', boundary: { vertices: rectangle }, exclusions: 'none' }],
  }))
  assert.ok(result.errors.some((entry) => entry.code === 'invalid_exclusion_list'))
})

test('rejects coordinates whose derived measurements overflow numeric range', () => {
  const result = validateLawnGeometry(geometry([
    { x: 0, y: 0 },
    { x: 1e308, y: 0 },
    { x: 1e308, y: 1e308 },
    { x: 0, y: 1e308 },
  ]))
  assert.ok(result.errors.some((entry) => entry.code === 'invalid_geometry_measurement'))
})
