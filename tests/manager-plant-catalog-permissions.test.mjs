import test from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission, normalizeStaffPermissions } from '../functions/api/manager/_lib.ts'
import { getPlantVariantPermissionChanges } from '../functions/api/manager/plant-direct-lib.ts'

const identity = (role, permissionsObject = {}) => ({
  role,
  user_id: role + '-user',
  permissionsObject: {
    canCreatePlant: false,
    canEditPlantCard: false,
    canAddPlantVariant: false,
    canEditPlantPrice: false,
    canEditPlantStock: false,
    ...permissionsObject,
  },
})

const sellerCatalogPermissions = [
  'canCreatePlant',
  'canEditPlantCard',
  'canAddPlantVariant',
  'canEditPlantPrice',
  'canEditPlantStock',
]

test('seller with plant creation permission receives the complete plant catalog access', () => {
  const seller = identity('seller', { canCreatePlant: true })
  for (const permission of sellerCatalogPermissions) {
    assert.equal(hasPermission(seller, permission), true, permission)
  }
})

test('seller without plant creation permission does not receive catalog write permissions from legacy flags', () => {
  const seller = identity('seller', {
    canAddPlantVariant: true,
    canEditPlantPrice: true,
    canEditPlantStock: true,
    canEditPlantCard: true,
  })
  for (const permission of sellerCatalogPermissions) {
    assert.equal(hasPermission(seller, permission), false, permission)
  }
})

test('manager permissions remain independent', () => {
  const manager = identity('manager', { canCreatePlant: true })
  assert.equal(hasPermission(manager, 'canCreatePlant'), true)
  for (const permission of ['canEditPlantCard', 'canAddPlantVariant', 'canEditPlantPrice', 'canEditPlantStock']) {
    assert.equal(hasPermission(manager, permission), false, permission)
  }
  const editor = identity('manager', { canEditPlantCard: true, canAddPlantVariant: true })
  assert.equal(hasPermission(editor, 'canEditPlantCard'), true)
  assert.equal(hasPermission(editor, 'canAddPlantVariant'), true)
  assert.equal(hasPermission(editor, 'canEditPlantPrice'), false)
})

test('owner retains full catalog permissions', () => {
  const owner = identity('owner')
  for (const permission of sellerCatalogPermissions) {
    assert.equal(hasPermission(owner, permission), true, permission)
  }
})

test('seller catalog access is derived from the normalized D1 permission JSON', () => {
  const storedPermissions = normalizeStaffPermissions(JSON.stringify({
    canCreatePlant: true,
    canEditPlantCard: false,
    canAddPlantVariant: false,
    canEditPlantPrice: false,
    canEditPlantStock: false,
  }))
  const seller = identity('seller', storedPermissions)
  for (const permission of sellerCatalogPermissions) {
    assert.equal(hasPermission(seller, permission), true, permission)
  }
})

test('manager direct editor distinguishes variant, price and stock changes', () => {
  const before = [{ _key: 'variant-0001', priceEUR: 10, oldPriceEUR: null, stockStatus: 'inStock', stockQuantity: 2 }]
  assert.deepEqual(getPlantVariantPermissionChanges(before, before), {
    added: false, priceChanged: false, stockChanged: false,
  })
  assert.deepEqual(getPlantVariantPermissionChanges(before, [{ ...before[0], priceEUR: 12 }]), {
    added: false, priceChanged: true, stockChanged: false,
  })
  assert.deepEqual(getPlantVariantPermissionChanges(before, [{ ...before[0], stockQuantity: 4 }]), {
    added: false, priceChanged: false, stockChanged: true,
  })
  assert.deepEqual(getPlantVariantPermissionChanges(before, [
    ...before,
    { _key: 'variant-0002', priceEUR: 15, stockStatus: 'inStock', stockQuantity: 1 },
  ]), {
    added: true, priceChanged: true, stockChanged: true,
  })
})

test('removing an existing variant is not misclassified as a new variant or a price/stock change', () => {
  const before = [
    { _key: 'variant-0001', priceEUR: 10, stockStatus: 'inStock', stockQuantity: 2 },
    { _key: 'variant-0002', priceEUR: 15, stockStatus: 'onRequest', stockQuantity: null },
  ]
  assert.deepEqual(getPlantVariantPermissionChanges(before, [before[0]]), {
    added: false, priceChanged: false, stockChanged: false,
  })
})
