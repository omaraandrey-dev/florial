const CONTROLLER_SKUS = Object.freeze({
  tm2: Object.freeze({ 4: 'F54234', 6: 'F54236', 8: 'F54238' }),
  rc2: Object.freeze({ 4: 'F56154', 6: 'F56156', 8: 'F56158' }),
  bat: Object.freeze({ 1: 'ESP-BAT-BT1', 2: 'ESP-BAT-BT2', 4: 'ESP-BAT-BT4', 6: 'ESP-BAT-BT6' }),
})

export const IRRIGATION_AUTOMATION_PRODUCT_SKUS = Object.freeze([
  ...Object.values(CONTROLLER_SKUS.tm2),
  ...Object.values(CONTROLLER_SKUS.rc2),
  ...Object.values(CONTROLLER_SKUS.bat),
  'H01040',
])

const chooseCapacities = (zoneCount, sizes) => {
  const maxCapacity = Math.max(...sizes)
  const limit = zoneCount + maxCapacity
  const dp = Array(limit + 1).fill(null)
  dp[0] = []
  for (let total = 1; total <= limit; total += 1) {
    for (const size of sizes) {
      if (total < size || !dp[total - size]) continue
      const candidate = [...dp[total - size], size].sort((a, b) => b - a)
      const current = dp[total]
      if (!current || candidate.length < current.length ||
          (candidate.length === current.length && candidate.reduce((sum, n) => sum + n, 0) <
            current.reduce((sum, n) => sum + n, 0)) ||
          (candidate.length === current.length &&
            candidate.reduce((sum, n) => sum + n, 0) === current.reduce((sum, n) => sum + n, 0) &&
            (() => { for (let index = 0; index < candidate.length; index += 1) { if (candidate[index] !== current[index]) return candidate[index] > current[index] } return false })())) {
        dp[total] = candidate
      }
    }
  }
  for (let total = zoneCount; total <= limit; total += 1) {
    if (dp[total]) return dp[total]
  }
  return []
}

export function allocateIrrigationControllers(type, zoneCount) {
  if (!Number.isInteger(zoneCount) || zoneCount < 1 || zoneCount > 150) return []
  if (type === 'tm2' || type === 'rc2') {
    if (zoneCount <= 4) return [4]
    if (zoneCount <= 6) return [6]
    if (zoneCount <= 8) return [8]
    if (zoneCount === 9) return [6, 4]
    if (zoneCount <= 12) return [6, 6]
    if (zoneCount <= 14) return [8, 6]
    if (zoneCount <= 16) return [8, 8]
    return chooseCapacities(zoneCount, [8, 6, 4])
  }
  if (type === 'bat') {
    if (zoneCount === 1) return [1]
    if (zoneCount === 2) return [2]
    if (zoneCount <= 4) return [4]
    if (zoneCount <= 6) return [6]
    if (zoneCount <= 8) return [6, 2]
    if (zoneCount <= 10) return [6, 4]
    if (zoneCount <= 12) return [6, 6]
    if (zoneCount <= 14) return [6, 6, 2]
    if (zoneCount <= 18) return [6, 6, 6]
    return chooseCapacities(zoneCount, [6, 4, 2, 1])
  }
  return []
}

export function buildIrrigationAutomationPlan(type, zoneCount) {
  if (!['manual', 'tm2', 'rc2', 'bat'].includes(type) ||
      !Number.isInteger(zoneCount) || zoneCount < 1 || zoneCount > 150) return null

  if (type === 'manual') {
    return Object.freeze({
      type,
      controllers: Object.freeze([]),
      valve: null,
      requiresControlCable: false,
      wifiRequired: false,
    })
  }

  const capacities = allocateIrrigationControllers(type, zoneCount)
  const skuMap = CONTROLLER_SKUS[type]
  if (!capacities.length || !skuMap) return null

  let nextZone = 1
  const controllers = capacities.map((capacity) => {
    const assignedZones = Array.from(
      { length: Math.min(capacity, Math.max(0, zoneCount - nextZone + 1)) },
      (_, index) => nextZone + index,
    )
    nextZone += assignedZones.length
    return Object.freeze({
      sku: skuMap[capacity],
      capacity,
      quantity: 1,
      zoneNumbers: Object.freeze(assignedZones),
    })
  })

  const valve = type === 'bat'
    ? Object.freeze({ sku: 'H01040', quantity: zoneCount })
    : Object.freeze({ sku: 'H01000', quantity: zoneCount })

  return Object.freeze({
    type,
    controllers: Object.freeze(controllers),
    valve,
    requiresControlCable: type === 'tm2' || type === 'rc2',
    wifiRequired: type === 'rc2',
  })
}

export function buildIrrigationAutomationBillOfMaterials(baseBom, plan) {
  if (!baseBom?.valid || !Array.isArray(baseBom.items) || !plan) {
    return Object.freeze({ valid: false, reason: 'invalid_automation_input', items: Object.freeze([]) })
  }

  const quantities = new Map(baseBom.items.map((item) => [item.sku, item.quantity]))
  quantities.delete('H01000')
  quantities.delete('H01040')
  quantities.delete('B31440')
  if (plan.type === 'manual') {
    quantities.delete('VBA02672')
    quantities.delete('IQ21120M0N25D')
    quantities.delete('IQ2142000N250')
  }

  if (plan.type === 'tm2' || plan.type === 'rc2') {
    quantities.set('H01000', baseBom.zoneCount)
  }
  if (plan.type === 'bat') {
    quantities.set('H01040', plan.valve?.quantity ?? baseBom.zoneCount)
  }
  for (const controller of plan.controllers) {
    quantities.set(controller.sku, (quantities.get(controller.sku) ?? 0) + controller.quantity)
  }

  const items = [...quantities.entries()]
    .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
    .map(([sku, quantity]) => Object.freeze({ sku, quantity }))

  return Object.freeze({
    ...baseBom,
    items: Object.freeze(items),
  })
}
