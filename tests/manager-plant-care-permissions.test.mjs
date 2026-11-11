import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlantSet } from '../functions/api/manager/plant-direct-lib.ts'

const botanicalData = {
  plantCare: {
    light: 'sun',
    waterNeeds: 'medium',
    minWinterTempC: -8,
    adultHeightCm: 450,
    foliageType: 'evergreen',
    floweringSeason: ['spring'],
    plantingSeason: ['spring', 'autumn'],
    blackSeaCoast: 'needsVerification',
  },
  careGuide: 'Поливайте умерено и осигурете добре дренирана почва.',
}

for (const role of ['owner', 'manager', 'seller']) {
  test('saves botanical characteristics and care guide for ' + role, async () => {
    const result = await buildPlantSet({} as any, botanicalData, role)
    assert.deepEqual(result.set.plantCare, botanicalData.plantCare)
    assert.equal(Array.isArray(result.set.careGuide), true)
    assert.equal(result.set.careGuide[0].children[0].text, botanicalData.careGuide)
    assert.ok(result.changedFields.includes('plantCare'))
    assert.ok(result.changedFields.includes('careGuide'))
  })
}
