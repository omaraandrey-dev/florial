import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allocateIrrigationControllers,
  buildIrrigationAutomationBillOfMaterials,
  buildIrrigationAutomationPlan,
} from '../src/lib/irrigation/irrigationAutomation.mjs'

test('TM2 and RC2 allocations preserve Florial controller selection rules', () => {
  assert.deepEqual(allocateIrrigationControllers('tm2', 4), [4])
  assert.deepEqual(allocateIrrigationControllers('rc2', 6), [6])
  assert.deepEqual(allocateIrrigationControllers('tm2', 8), [8])
  assert.deepEqual(allocateIrrigationControllers('tm2', 9), [6, 4])
  assert.deepEqual(allocateIrrigationControllers('rc2', 10), [6, 6])
  assert.deepEqual(allocateIrrigationControllers('tm2', 12), [6, 6])
  assert.deepEqual(allocateIrrigationControllers('tm2', 14), [8, 6])
  assert.deepEqual(allocateIrrigationControllers('tm2', 16), [8, 8])
  assert.deepEqual(allocateIrrigationControllers('tm2', 17), [8, 6, 4])
})

test('BAT allocations use 1, 2, 4 and 6 station controllers', () => {
  assert.deepEqual(allocateIrrigationControllers('bat', 1), [1])
  assert.deepEqual(allocateIrrigationControllers('bat', 2), [2])
  assert.deepEqual(allocateIrrigationControllers('bat', 4), [4])
  assert.deepEqual(allocateIrrigationControllers('bat', 6), [6])
  assert.deepEqual(allocateIrrigationControllers('bat', 7), [6, 2])
  assert.deepEqual(allocateIrrigationControllers('bat', 10), [6, 4])
  assert.deepEqual(allocateIrrigationControllers('bat', 12), [6, 6])
  assert.deepEqual(allocateIrrigationControllers('bat', 19), [6, 6, 6, 1])
})

test('controller plans assign sequential zone numbers and require cable only for TM2/RC2', () => {
  const tm2 = buildIrrigationAutomationPlan('tm2', 9)
  assert.deepEqual(tm2.controllers.map((item) => item.zoneNumbers), [[1, 2, 3, 4, 5, 6], [7, 8, 9]])
  assert.equal(tm2.requiresControlCable, true)
  assert.equal(tm2.wifiRequired, false)

  const rc2 = buildIrrigationAutomationPlan('rc2', 10)
  assert.equal(rc2.requiresControlCable, true)
  assert.equal(rc2.wifiRequired, true)

  const bat = buildIrrigationAutomationPlan('bat', 7)
  assert.equal(bat.requiresControlCable, false)
  assert.equal(bat.valve.sku, 'H01040')
  assert.equal(bat.valve.quantity, 7)
})

test('manual BOM excludes solenoid valves; BAT replaces them with compatible 9V valves', () => {
  const base = {
    valid: true, headCount: 12, zoneCount: 2,
    items: [{ sku: 'A44120', quantity: 12 }, { sku: 'H01000', quantity: 2 }, { sku: 'VBA02672', quantity: 2 }],
  }
  const manual = buildIrrigationAutomationBillOfMaterials(base, buildIrrigationAutomationPlan('manual', 2))
  assert.equal(manual.items.some((item) => item.sku === 'H01000'), false)
  assert.equal(manual.items.some((item) => item.sku === 'VBA02672'), false)
  assert.equal(manual.items.some((item) => item.sku === 'H01040'), false)
  assert.equal(manual.items.some((item) => item.sku === 'B31440'), false)

  const bat = buildIrrigationAutomationBillOfMaterials(base, buildIrrigationAutomationPlan('bat', 2))
  assert.equal(bat.items.some((item) => item.sku === 'H01000'), false)
  assert.equal(bat.items.some((item) => item.sku === 'B31440'), false)
  assert.equal(bat.items.find((item) => item.sku === 'H01040')?.quantity, 2)
  assert.equal(bat.items.find((item) => item.sku === 'ESP-BAT-BT2')?.quantity, 1)
})
