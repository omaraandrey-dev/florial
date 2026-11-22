import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildIrrigationZones,
  buildPerimeterPipeNetwork,
  FLORIAL_IRRIGATION_PROJECT_STANDARD,
} from '../src/lib/irrigation/irrigationProjectStandards.mjs'

const rectangle = {
  regions: [{
    boundary: {
      vertices: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 25, y: 5 },
        { x: 0, y: 5 },
      ],
    },
  }],
}

const mixedPerimeterHeads = [
  { id: 'top-0', position: { x: 25, y: 5 }, arcDeg: 90 },
  { id: 'top-1', position: { x: 20, y: 5 }, arcDeg: 180 },
  { id: 'top-2', position: { x: 15, y: 5 }, arcDeg: 180 },
  { id: 'top-3', position: { x: 10, y: 5 }, arcDeg: 180 },
  { id: 'top-4', position: { x: 5, y: 5 }, arcDeg: 180 },
  { id: 'top-5', position: { x: 0, y: 5 }, arcDeg: 90 },
  { id: 'bottom-0', position: { x: 25, y: 0 }, arcDeg: 90 },
  { id: 'bottom-1', position: { x: 20, y: 0 }, arcDeg: 180 },
  { id: 'bottom-2', position: { x: 15, y: 0 }, arcDeg: 180 },
  { id: 'bottom-3', position: { x: 10, y: 0 }, arcDeg: 180 },
  { id: 'bottom-4', position: { x: 5, y: 0 }, arcDeg: 180 },
  { id: 'bottom-5', position: { x: 0, y: 0 }, arcDeg: 90 },
]

test('Florial standard uses the top-right source and Ø25 mm throughout', () => {
  assert.deepEqual(FLORIAL_IRRIGATION_PROJECT_STANDARD.source, {
    tapSizeInches: 1,
    inletPressureBar: 4,
    supplyPipeDiameterMm: 25,
    connectionCorner: 'top-right',
  })
  assert.deepEqual(FLORIAL_IRRIGATION_PROJECT_STANDARD.pipes, {
    mainDiameterMm: 25,
    zoneDiameterMm: 25,
  })
  assert.equal(FLORIAL_IRRIGATION_PROJECT_STANDARD.zoneCapacity.maxHeadsPerZone, 6)
})

test('mixed 90° and 180° heads form two source-fed zones of six, not arc-based zones', () => {
  const zones = buildIrrigationZones(mixedPerimeterHeads, rectangle)
  assert.equal(zones.length, 2)
  assert.deepEqual(zones.map((zone) => zone.sprinklerCount), [6, 6])
  assert.deepEqual(zones.map((zone) => zone.branchDirection), ['forward', 'reverse'])
  assert.ok(zones.every((zone) => zone.sprinklerIds.length <= 6))
  assert.deepEqual(zones[0].sprinklerIds, [
    'top-0', 'top-1', 'top-2', 'top-3', 'top-4', 'top-5',
  ])
  assert.deepEqual(zones[1].sprinklerIds, [
    'bottom-0', 'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5',
  ])
})

test('pipe network draws one sequential perimeter route per zone from the source', () => {
  const zones = buildIrrigationZones(mixedPerimeterHeads, rectangle)
  const network = buildPerimeterPipeNetwork(rectangle, mixedPerimeterHeads, zones)
  assert.deepEqual(network.connectionPoint, { x: 25, y: 5 })
  assert.equal(network.mainDiameterMm, 25)
  assert.equal(network.zoneDiameterMm, 25)
  assert.equal(network.branches.length, 2)

  for (const branch of network.branches) {
    assert.equal(branch.points[0].x, 25)
    assert.equal(branch.points[0].y, 5)
    assert.equal(branch.diameterMm, 25)
    assert.equal(branch.sprinklerIds.length, 6)
    assert.ok(branch.points.length >= 6)
    assert.equal(branch.lateralConnections.length, 0)
  }
})

test('a branch with more than six heads is split into independent zones of at most six', () => {
  const extended = mixedPerimeterHeads.concat([
    { id: 'interior-1', position: { x: 12.5, y: 2.5 }, arcDeg: 360 },
  ])
  const zones = buildIrrigationZones(extended, rectangle)
  assert.deepEqual(zones.map((zone) => zone.sprinklerCount), [4, 3, 6])
  assert.ok(zones.every((zone) => zone.sprinklerCount <= 6))
  assert.ok(zones.every((zone) => zone.sprinklerCount > 1))
  assert.equal(zones.reduce((sum, zone) => sum + zone.sprinklerCount, 0), extended.length)
})
