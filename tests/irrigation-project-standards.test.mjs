import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIrrigationZones, buildPerimeterPipeNetwork, FLORIAL_IRRIGATION_PROJECT_STANDARD } from '../src/lib/irrigation/irrigationProjectStandards.mjs'

test('fixed Florial standard contains the agreed source and pipe assumptions', () => {
  assert.deepEqual(FLORIAL_IRRIGATION_PROJECT_STANDARD.source, {
    tapSizeInches: 1, inletPressureBar: 4, supplyPipeDiameterMm: 25, connectionCorner: 'top-right',
  })
  assert.deepEqual(FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes, { mainDiameterMm: 32, zoneDiameterMm: 25 })
})

test('sector and full-circle sprinklers are split into bounded lines', () => {
  const sprinklers = [
    ...Array.from({ length: 7 }, (_, index) => ({ id: 's' + index, arcDeg: 180 })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: 'f' + index, arcDeg: 360 })),
  ]
  const zones = buildIrrigationZones(sprinklers)
  assert.deepEqual(zones.map((zone) => zone.sprinklerCount), [6, 1, 4, 1])
  assert.deepEqual(zones.map((zone) => zone.maximumHeads), [6, 6, 4, 4])
})

test('perimeter pipe route starts at the assumed top-right tap and branches to sprinklers', () => {
  const geometry = { regions: [{ boundary: { vertices: [
    { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 },
  ] } }] }
  const sprinklers = [{ id: 'corner', position: { x: 10, y: 5 }, arcDeg: 90 }]
  const network = buildPerimeterPipeNetwork(geometry, sprinklers)
  assert.deepEqual(network.connectionPoint, { x: 10, y: 5 })
  assert.deepEqual(network.mainRoute[0], { x: 10, y: 5 })
  assert.equal(network.mainDiameterMm, 32)
  assert.equal(network.branches[0].diameterMm, 25)
  assert.equal(network.hydraulicCalculation, 'not_performed')
})
