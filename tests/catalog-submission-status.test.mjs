import test from 'node:test'
import assert from 'node:assert/strict'
import { canSetCatalogSubmissionStatus } from '../functions/api/manager/_lib.ts'

const identity = (role, userId, permissions = {}) => ({
  role,
  user_id: userId,
  permissionsObject: permissions,
})

const ownDraft = { created_by: 'seller-1', operation: 'create' }

test('owner can submit a new plant draft for review', () => {
  assert.equal(
    canSetCatalogSubmissionStatus(identity('owner', 'owner-1'), { ...ownDraft, created_by: 'owner-1' }, 'submitted'),
    true,
  )
})

test('seller can submit their own draft but cannot submit another employee submission', () => {
  const seller = identity('seller', 'seller-1', { canCreatePlant: true })
  assert.equal(canSetCatalogSubmissionStatus(seller, ownDraft, 'submitted'), true)
  assert.equal(canSetCatalogSubmissionStatus(seller, ownDraft, 'draft'), true)
  assert.equal(canSetCatalogSubmissionStatus(seller, { ...ownDraft, created_by: 'seller-2' }, 'submitted'), false)
})

test('seller cannot approve, reject, review or publish a plant submission', () => {
  const seller = identity('seller', 'seller-1', { canCreatePlant: true })
  for (const status of ['in_review', 'changes_requested', 'approved', 'rejected', 'publishing', 'published', 'publish_failed']) {
    assert.equal(canSetCatalogSubmissionStatus(seller, ownDraft, status), false, status)
  }
})

test('manager submission and review actions require their individual permissions', () => {
  const manager = identity('manager', 'manager-1', {
    canCreatePlant: true,
    canReviewPlantSubmissions: true,
    canApprovePlantSubmission: false,
    canPublishPlant: true,
  })
  const managerDraft = { created_by: 'manager-1', operation: 'create' }
  assert.equal(canSetCatalogSubmissionStatus(manager, managerDraft, 'submitted'), true)
  assert.equal(canSetCatalogSubmissionStatus(manager, ownDraft, 'in_review'), true)
  assert.equal(canSetCatalogSubmissionStatus(manager, ownDraft, 'approved'), false)
  assert.equal(canSetCatalogSubmissionStatus(manager, ownDraft, 'published'), false)
})

test('owner can review and approve but protected publication states remain server-controlled', () => {
  const owner = identity('owner', 'owner-1')
  assert.equal(canSetCatalogSubmissionStatus(owner, ownDraft, 'in_review'), true)
  assert.equal(canSetCatalogSubmissionStatus(owner, ownDraft, 'approved'), true)
  assert.equal(canSetCatalogSubmissionStatus(owner, ownDraft, 'published'), false)
  assert.equal(canSetCatalogSubmissionStatus(owner, { ...ownDraft, operation: 'update' }, 'approved'), false)
})

test('no staff role can set a protected publication status through the generic data endpoint', () => {
  const users = [
    identity('owner', 'owner-1'),
    identity('manager', 'manager-1', { canPublishPlant: true }),
    identity('seller', 'seller-1', { canCreatePlant: true }),
  ]
  for (const user of users) {
    for (const status of ['publishing', 'published', 'publish_failed']) {
      assert.equal(canSetCatalogSubmissionStatus(user, ownDraft, status), false, `${user.role}:${status}`)
    }
  }
})
