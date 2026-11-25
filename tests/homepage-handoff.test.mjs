import test from 'node:test'
import assert from 'node:assert/strict'
import { completeHomepageHandoff, isHomepageClientReady } from '../src/lib/homepageHandoff.mjs'

const readyState = {
  isHomepageRoute: true,
  headerDataReady: true,
  categoriesReady: true,
  homeCategoriesAndHeroReady: true,
  homeFeaturedPlantsReady: true,
  homeFeaturedEquipmentReady: true,
  homeBlogReady: true,
}

test('homepage handoff waits for every client data group', () => {
  assert.equal(isHomepageClientReady(readyState), true)
  for (const key of Object.keys(readyState)) {
    assert.equal(isHomepageClientReady({ ...readyState, [key]: false }), false, key)
  }
})

test('homepage handoff does not activate for a non-homepage route', () => {
  assert.equal(isHomepageClientReady({ ...readyState, isHomepageRoute: false }), false)
})

test('homepage handoff reveals the client root before hiding the server root', () => {
  const operations = []
  const serverRoot = { set hidden(value) { operations.push(['server', value]) } }
  const clientRoot = { set hidden(value) { operations.push(['client', value]) } }

  assert.equal(completeHomepageHandoff(serverRoot, clientRoot), true)
  assert.deepEqual(operations, [['client', false], ['server', true]])
})

test('homepage handoff safely ignores missing or identical roots', () => {
  assert.equal(completeHomepageHandoff(null, { hidden: true }), false)
  assert.equal(completeHomepageHandoff({ hidden: false }, null), false)
  const root = { hidden: false }
  assert.equal(completeHomepageHandoff(root, root), false)
})
