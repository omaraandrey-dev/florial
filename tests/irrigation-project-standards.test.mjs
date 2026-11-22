import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIrrigationZones, buildPerimeterPipeNetwork, FLORIAL_IRRIGATION_STANDARD } from '../src/lib/irrigation/irrigationProjectStandards.mjs'

test('Florial standard water and pipe assumptions are fixed and explicit', () => {
  assert.equal(FLORIAL_IRRIGATION_STANDARD.connection.description, '1-inch tap')
  assert.equal(FLORIAL_IRRIGATION_STANDARD.connection.nominalPressureBar, 4)
  assert.equal(FLORIAL_IRRIGATION_STANDARD.connection.supplyPipeDiameterMm, 25)
  assert.equal(FLORIAL_IRRIGATION_STANDARD.connection.entryCorner, 'top-right')
  assert.equal(FLORIAL_IRRIGATION_STANDARD.pipes.mainDiameterMm, 32)
  assert.equal(FLORIAL_IRRIGATION_STANDARD.pipes.zoneDiameterMm, 25)
})

test('zone grouping respects the owner-defined six-sector and four-full-circle limits', () => {
  const heads = [
    ...Array.from({ length: 7 }, (_, index) => ({ id: 's' + index, arcDeg: 180 })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: 'f' + index, arcDeg: 360 })),
  ]
  const result = buildIrrigationZones(heads)
  assert.deepEqual(result.zones.map((zone) => zone.sprinklerCount), [6, 1, 4, 1])
  assert.ok(result.zones.every((zone) => zone.sprinklerCount <= zone.maximumHeads))
  assert.equal(result.sprinklers.find((head) => head.id === 'f0').zoneId, 'Z03')
})

test('pipe network starts at the top-right corner and adds branches from the perimeter', () => {
  const geometry = { regions: [{ boundary: { vertices: [
    { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 },
  ] } }] }
  const result = buildPerimeterPipeNetwork(geometry, [
    { id: 'edge', position: { x: 5, y: 0 }, zoneId: 'Z01' },
    { id: 'center', position: { x: 5, y: 2.5 }, zoneId: 'Z01' },
  ])
  assert.equal(result.status, 'schematic_route_generated')
  assert.deepEqual(result.source, { x: 10, y: 5, label: 'top_right_corner' })
  assert.equal(result.trunk.length, 5)
  assert.equal(result.branches.length, 2)
  assert.equal(result.mainPipeDiameterMm, 32)
  assert.equal(result.zonePipeDiameterMm, 25)
  assert.equal(result.hydraulicLossesCalculated, false)
})
