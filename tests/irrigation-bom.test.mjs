import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIrrigationBillOfMaterials } from '../src/lib/irrigation/irrigationBillOfMaterials.mjs'

test('builds a complete catalog bill of materials per sprinkler and sequential zone', () => {
  const layout = {
    model: 'R-VAN24',
    sprinklers: [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: 'p' + index,
        arcDeg: 180,
        performanceModel: 'R-VAN24',
      })),
      ...Array.from({ length: 2 }, (_, index) => ({
        id: 'i' + index,
        arcDeg: 360,
        performanceModel: 'R-VAN24-360',
      })),
    ],
  }
  const zones = [
    { id: 'zone-01', zoneNumber: 1, zoneType: 'perimeter', sprinklerIds: ['p0','p1','p2','p3'] },
    { id: 'zone-02', zoneNumber: 2, zoneType: 'mixed', sprinklerIds: ['p4','p5','i0','i1'] },
  ]

  const result = buildIrrigationBillOfMaterials(layout, zones)
  assert.equal(result.valid, true)
  assert.equal(result.headCount, 8)
  assert.equal(result.zoneCount, 2)
  assert.equal(result.flexPipeRequiredM, 4)
  assert.equal(result.flexPipeCoils30m, 1)
  assert.deepEqual(zones.map((zone) => zone.sprinklerIds.length), [4, 4])
  assert.equal(zones[1].zoneType, 'mixed')

  const quantities = Object.fromEntries(result.items.map((item) => [item.sku, item.quantity]))
  assert.deepEqual(quantities, {
    A84661: 6,
    A84666: 2,
    A44120: 8,
    A46010: 16,
    A82060: 1,
    IQ21520F0N25C: 6,
    IQ21820F0N25B: 2,
    H01000: 2,
    IQ21120M0N25D: 4,
    VBA02672: 2,
    IQ2142000N250: 1,
  })
})

test('flex pipe is planned at 0.5 m per head and sold in 30 m coils up to 60 heads', () => {
  const make = (count) => ({
    model: 'R-VAN18',
    sprinklers: Array.from({ length: count }, (_, index) => ({ id: 's' + index, arcDeg: 180, performanceModel: 'R-VAN18' })),
  })
  const zonesFor = (count) => {
    const zoneCount = Math.ceil(count / 6)
    const baseSize = Math.floor(count / zoneCount)
    const extra = count % zoneCount
    let nextHead = 0
    return Array.from({ length: zoneCount }, (_, zoneIndex) => {
      const size = baseSize + (zoneIndex < extra ? 1 : 0)
      const sprinklerIds = Array.from({ length: size }, (_, index) => 's' + (nextHead + index))
      nextHead += size
      return { sprinklerIds }
    })
  }
  for (const [heads, metres, coils] of [[40, 20, 1], [60, 30, 1], [61, 30.5, 2], [120, 60, 2]]) {
    const result = buildIrrigationBillOfMaterials(make(heads), zonesFor(heads))
    assert.equal(result.valid, true)
    assert.equal(result.flexPipeRequiredM, metres)
    assert.equal(result.flexPipeCoils30m, coils)
    assert.equal(result.items.find((item) => item.sku === 'A82060')?.quantity, coils)
  }
})

test('refuses to build a cart when a selected nozzle has no catalog mapping', () => {
  const result = buildIrrigationBillOfMaterials({
    model: 'unknown',
    sprinklers: [{ id: 's1', arcDeg: 180, performanceModel: 'unknown' }],
  }, [{ sprinklerIds: ['s1'] }])
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'unsupported_nozzle_model')
})

test('refuses to build a cart if any sprinkler is not assigned to a zone', () => {
  const result = buildIrrigationBillOfMaterials({
    model: 'R-VAN18',
    sprinklers: [{ id: 's1', arcDeg: 180, performanceModel: 'R-VAN18' }],
  }, [])
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'missing_layout_or_zones')
})

test('refuses duplicated sprinkler membership across zones', () => {
  const result = buildIrrigationBillOfMaterials({
    model: 'R-VAN18',
    sprinklers: [
      { id: 's1', arcDeg: 180, performanceModel: 'R-VAN18' },
      { id: 's2', arcDeg: 180, performanceModel: 'R-VAN18' },
    ],
  }, [
    { sprinklerIds: ['s1', 's2'] },
    { sprinklerIds: ['s1'] },
  ])
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'zone_assignment_incomplete')
})

test('allows R-VAN-RCS and circular R-VAN heads together in one zone', () => {
  const result = buildIrrigationBillOfMaterials({
    model: 'R-VAN18',
    sprinklers: [
      { id: 'strip', arcDeg: 180, pattern: 'strip', performanceModel: 'R-VAN-RCS' },
      { id: 'circle', arcDeg: 180, pattern: 'circular', performanceModel: 'R-VAN14' },
    ],
  }, [{ id: 'zone-01', zoneNumber: 1, sprinklerIds: ['strip', 'circle'] }])
  assert.equal(result.valid, true)
  const quantities = Object.fromEntries(result.items.map((item) => [item.sku, item.quantity]))
  assert.equal(quantities.A84668, 1)
  assert.equal(quantities.A84659, 1)
  assert.equal(quantities.A44120, 2)
})

test('3504-PC rotors map to the complete rotor SKU without adding an 1804 spray body', () => {
  const result = buildIrrigationBillOfMaterials({
    model: '3504-PC / R-VAN18',
    sprinklers: [
      { id: 'rotor-1', arcDeg: 90, performanceModel: '3504-PC', radiusM: 8 },
      { id: 'rotor-2', arcDeg: 270, performanceModel: '3504-PC', radiusM: 9 },
      { id: 'spray-1', arcDeg: 180, performanceModel: 'R-VAN18' },
      { id: 'spray-2', arcDeg: 360, performanceModel: 'R-VAN18-360' },
    ],
  }, [{ id: 'zone-01', zoneNumber: 1, sprinklerIds: ['rotor-1', 'rotor-2', 'spray-1', 'spray-2'] }])
  assert.equal(result.valid, true)
  const quantities = Object.fromEntries(result.items.map((item) => [item.sku, item.quantity]))
  assert.equal(quantities.Y34001, 2)
  assert.equal(quantities.A84660, 1)
  assert.equal(quantities.A84665, 1)
  assert.equal(quantities.A44120, 2)
  assert.equal(quantities.A46010, 8)
})
