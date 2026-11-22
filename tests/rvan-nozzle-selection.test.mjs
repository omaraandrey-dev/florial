import test from 'node:test'
import assert from 'node:assert/strict'
import { getRvanRadiusRange, resolveRvanRadius, selectRvanModelForRadius, getRvanStripSpecification } from '../src/lib/irrigation/rvanNozzleSelection.mjs'

test('R-VAN model radius ranges follow manufacturer limits', () => {
  assert.deepEqual(getRvanRadiusRange('R-VAN14'), { minRadiusM: 2.4, maxRadiusM: 4.6, fullCircleModel: 'R-VAN14-360' })
  assert.deepEqual(getRvanRadiusRange('R-VAN18'), { minRadiusM: 4.0, maxRadiusM: 5.5, fullCircleModel: 'R-VAN18-360' })
  assert.deepEqual(getRvanRadiusRange('R-VAN24'), { minRadiusM: 5.2, maxRadiusM: 7.3, fullCircleModel: 'R-VAN24-360' })
})

test('selects R-VAN model by required radius and retains a compatible preferred model', () => {
  assert.equal(selectRvanModelForRadius(3.5), 'R-VAN14')
  assert.equal(selectRvanModelForRadius(5.0), 'R-VAN18')
  assert.equal(selectRvanModelForRadius(6.5), 'R-VAN24')
  assert.equal(selectRvanModelForRadius(5.2, 'R-VAN24'), 'R-VAN24')
})

test('preferred R-VAN model is retained when possible and changed only when local spacing requires it', () => {
  assert.equal(selectRvanModelForRadius(4.5, 'R-VAN18'), 'R-VAN18')
  assert.equal(selectRvanModelForRadius(3.5, 'R-VAN18'), 'R-VAN14')
  assert.equal(selectRvanModelForRadius(6.0, 'R-VAN18'), 'R-VAN24')
})

test('radius resolution never reduces below the manufacturer's minimum', () => {
  assert.deepEqual(resolveRvanRadius('R-VAN24', 5.0), {
    model: 'R-VAN24', requestedRadiusM: 5.0, radiusM: 5.2, adjusted: true,
    withinManufacturerRange: false, minRadiusM: 5.2, maxRadiusM: 7.3,
    performanceFlowStatus: 'nominal_table_point_only',
  })
})

test('strip nozzle specifications are distinct non-circular patterns', () => {
  assert.deepEqual(getRvanStripSpecification('R-VAN-LCS'), { model: 'R-VAN-LCS', pattern: 'left_corner_strip', widthM: 1.5, lengthM: 4.6, dimensionsBasis: 'manufacturer_nominal_at_3_1_bar' })
  assert.deepEqual(getRvanStripSpecification('R-VAN-RCS'), { model: 'R-VAN-RCS', pattern: 'right_corner_strip', widthM: 1.5, lengthM: 4.6, dimensionsBasis: 'manufacturer_nominal_at_3_1_bar' })
  assert.deepEqual(getRvanStripSpecification('R-VAN-SST'), { model: 'R-VAN-SST', pattern: 'side_strip', widthM: 1.5, lengthM: 9.1, dimensionsBasis: 'manufacturer_nominal_at_3_1_bar' })
})
