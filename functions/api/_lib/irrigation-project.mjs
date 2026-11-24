const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const cleanLabel = (value, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export function validateIrrigationProjectSnapshot(input) {
  if (!isRecord(input) || input.schemaVersion !== 1 || input.projectType !== 'automatic_lawn_irrigation') {
    return { valid: false, reason: 'unsupported_project_snapshot' }
  }

  let serialized
  try { serialized = JSON.stringify(input) } catch { return { valid: false, reason: 'invalid_project_snapshot' } }
  if (serialized.length > 42000) return { valid: false, reason: 'project_snapshot_too_large' }

  const geometry = input.geometry
  const vertices = geometry?.normalized?.regions?.[0]?.boundary?.vertices
  if (!isRecord(geometry) || !Array.isArray(vertices) || vertices.length < 4 || vertices.length > 20 ||
      !finite(geometry.areaM2, 0.01, 100000) || !finite(geometry.perimeterM, 0.1, 10000) ||
      vertices.some((point) => !isRecord(point) || !finite(point.x, -500, 500) || !finite(point.y, -500, 500))) {
    return { valid: false, reason: 'invalid_project_geometry' }
  }

  const layout = input.layout
  const sprinklers = layout?.sprinklers
  const stripOnlyLayout = Array.isArray(sprinklers) && sprinklers.length > 0 &&
    sprinklers.every((sprinkler) => sprinkler?.pattern === 'strip')
  const headToHeadValid = layout?.headToHeadPassed === true ||
    (layout?.headToHeadPassed === null && layout?.headToHeadApplicable === false && stripOnlyLayout)
  if (!isRecord(layout) || !headToHeadValid ||
      !Array.isArray(sprinklers) || sprinklers.length < 1 || sprinklers.length > 150) {
    return { valid: false, reason: 'invalid_project_layout' }
  }
  const sprinklerIds = new Set()
  for (const sprinkler of sprinklers) {
    if (!isRecord(sprinkler) || !cleanLabel(sprinkler.id, 80) ||
        sprinklerIds.has(sprinkler.id) ||
        !finite(sprinkler.position?.x, -500, 500) ||
        !finite(sprinkler.position?.y, -500, 500) ||
        !finite(sprinkler.radiusM, 0.1, 30) ||
        !(sprinkler.pattern === 'strip' ? sprinkler.arcDeg === null : [90, 180, 270, 360].includes(sprinkler.arcDeg)) ||
        !cleanLabel(sprinkler.performanceModel, 60) ||
        (sprinkler.pattern !== undefined && !['circular', 'strip'].includes(sprinkler.pattern)) ||
        (sprinkler.pattern === 'strip' &&
          (sprinkler.performanceModel !== 'R-VAN-RCS' ||
            ![1, 2].includes(sprinkler.stripWidthM) ||
            ![2, 4].includes(sprinkler.stripLengthM)))) {
      return { valid: false, reason: 'invalid_project_sprinkler' }
    }
    sprinklerIds.add(sprinkler.id)
  }

  const zones = input.zones
  const assigned = []
  if (!Array.isArray(zones) || !zones.length || zones.length !== Math.ceil(sprinklers.length / 6)) {
    return { valid: false, reason: 'invalid_project_zones' }
  }
  for (const zone of zones) {
    if (!isRecord(zone) || !cleanLabel(zone.id, 40) || !Array.isArray(zone.sprinklerIds) ||
        zone.sprinklerIds.length < 1 || zone.sprinklerIds.length > 6 ||
        zone.sprinklerIds.some((id) => !sprinklerIds.has(id))) {
      return { valid: false, reason: 'invalid_project_zone_membership' }
    }
    assigned.push(...zone.sprinklerIds)
  }
  if (assigned.length !== sprinklerIds.size || new Set(assigned).size !== sprinklerIds.size) {
    return { valid: false, reason: 'incomplete_project_zone_membership' }
  }
  const zoneSizes = zones.map((zone) => zone.sprinklerIds.length)
  if (Math.max(...zoneSizes) - Math.min(...zoneSizes) > 1) {
    return { valid: false, reason: 'unbalanced_project_zones' }
  }

  const bom = input.billOfMaterials
  if (!isRecord(bom) || bom.headCount !== sprinklers.length || bom.zoneCount !== zones.length ||
      !Array.isArray(bom.items) || !bom.items.length || bom.items.length > 40) {
    return { valid: false, reason: 'invalid_project_bom' }
  }
  const bomSkus = new Set()
  for (const item of bom.items) {
    if (!isRecord(item) || typeof item.sku !== 'string' || !/^[A-Za-z0-9._-]{2,100}$/.test(item.sku) ||
        bomSkus.has(item.sku) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      return { valid: false, reason: 'invalid_project_bom_item' }
    }
    bomSkus.add(item.sku)
  }

  const orderSkus = new Map()
  const orderDetails = new Map()
  for (const item of Array.isArray(input.orderItems) ? input.orderItems : []) {
    if (!isRecord(item) || typeof item.sku !== 'string') continue
    orderSkus.set(item.sku, (orderSkus.get(item.sku) ?? 0) + Number(item.qty))
    orderDetails.set(item.sku, {
      name: cleanLabel(item.name, 160),
      price: finite(item.price, 0, 1000000) ? item.price : null,
    })
  }
  if (bom.items.some((item) => orderSkus.get(item.sku) !== item.quantity)) {
    return { valid: false, reason: 'project_bom_does_not_match_order' }
  }

  const automationInput = input.automation
  let automation = null
  if (automationInput !== undefined && automationInput !== null) {
    if (!isRecord(automationInput) || !['manual', 'tm2', 'rc2', 'bat'].includes(automationInput.type) ||
        !Array.isArray(automationInput.controllers)) {
      return { valid: false, reason: 'invalid_project_automation' }
    }
    const type = automationInput.type
    const skuCapacity = {
      F54234: 4, F54236: 6, F54238: 8,
      F56154: 4, F56156: 6, F56158: 8,
      'ESP-BAT-BT1': 1, 'ESP-BAT-BT2': 2, 'ESP-BAT-BT4': 4, 'ESP-BAT-BT6': 6,
    }
    const allowedControllerSkus = type === 'tm2'
      ? new Set(['F54234', 'F54236', 'F54238'])
      : type === 'rc2'
        ? new Set(['F56154', 'F56156', 'F56158'])
        : type === 'bat'
          ? new Set(['ESP-BAT-BT1', 'ESP-BAT-BT2', 'ESP-BAT-BT4', 'ESP-BAT-BT6'])
          : new Set()
    const controllerCounts = new Map()
    const assignedZones = []
    const controllers = []
    for (const controller of automationInput.controllers) {
      if (!isRecord(controller) || !allowedControllerSkus.has(controller.sku) ||
          controller.capacity !== skuCapacity[controller.sku] ||
          !Number.isInteger(controller.quantity) || controller.quantity !== 1 ||
          !Array.isArray(controller.zoneNumbers) || controller.zoneNumbers.length < 1 ||
          controller.zoneNumbers.length > controller.capacity ||
          controller.zoneNumbers.some((zone) => !Number.isInteger(zone) || zone < 1 || zone > zones.length)) {
        return { valid: false, reason: 'invalid_project_controller_allocation' }
      }
      assignedZones.push(...controller.zoneNumbers)
      controllerCounts.set(controller.sku, (controllerCounts.get(controller.sku) ?? 0) + 1)
      const details = orderDetails.get(controller.sku)
      controllers.push({
        sku: controller.sku,
        capacity: controller.capacity,
        quantity: 1,
        zoneNumbers: controller.zoneNumbers,
        name: details?.name || cleanLabel(controller.name, 160) || controller.sku,
        priceEUR: details?.price ?? null,
      })
    }
    if (type === 'manual') {
      if (controllers.length || automationInput.valve != null || ['H01000', 'H01040', 'B31440', 'VBA02672', 'IQ21120M0N25D', 'IQ2142000N250'].some((sku) => orderSkus.has(sku) || bom.items.some((item) => item.sku === sku)) || Object.keys(skuCapacity).some((sku) => orderSkus.has(sku) || bom.items.some((item) => item.sku === sku)) ||
          automationInput.requiresControlCable !== false || automationInput.wifiRequired !== false) {
        return { valid: false, reason: 'manual_automation_contains_valves_or_controllers' }
      }
    } else {
      const expectedZones = Array.from({ length: zones.length }, (_, index) => index + 1)
      if (!controllers.length || assignedZones.length !== zones.length ||
          new Set(assignedZones).size !== zones.length ||
          expectedZones.some((zone) => !assignedZones.includes(zone))) {
        return { valid: false, reason: 'incomplete_controller_zone_allocation' }
      }
      for (const item of bom.items) {
        if (Object.prototype.hasOwnProperty.call(skuCapacity, item.sku) && !allowedControllerSkus.has(item.sku)) {
          return { valid: false, reason: 'unexpected_controller_family_in_bom' }
        }
        if (allowedControllerSkus.has(item.sku) && controllerCounts.get(item.sku) !== item.quantity) {
          return { valid: false, reason: 'controller_order_quantity_mismatch' }
        }
      }
      for (const [sku, quantity] of controllerCounts) {
        if (orderSkus.get(sku) !== quantity || bom.items.find((item) => item.sku === sku)?.quantity !== quantity) {
          return { valid: false, reason: 'controller_order_quantity_mismatch' }
        }
      }
    }
    const requiresControlCable = type === 'tm2' || type === 'rc2'
    const wifiRequired = type === 'rc2'
    if (automationInput.requiresControlCable !== requiresControlCable || automationInput.wifiRequired !== wifiRequired) {
      return { valid: false, reason: 'invalid_automation_installation_requirements' }
    }
    let valve = null
    if (type === 'bat') {
      const candidate = automationInput.valve
      if (!isRecord(candidate) || candidate.sku !== 'H01040' ||
          candidate.quantity !== zones.length || orderSkus.get('H01040') !== zones.length ||
          bom.items.find((item) => item.sku === 'H01040')?.quantity !== zones.length ||
          orderSkus.has('H01000') || orderSkus.has('B31440') || bom.items.some((item) => ['H01000', 'B31440'].includes(item.sku))) {
        return { valid: false, reason: 'invalid_bat_valve_compatibility' }
      }
      const details = orderDetails.get('H01040')
      valve = {
        sku: 'H01040',
        quantity: zones.length,
        name: details?.name || cleanLabel(candidate.name, 160) || 'Rain Bird 100-HV-9V',
        priceEUR: details?.price ?? null,
      }
    } else if (type === 'tm2' || type === 'rc2') {
      const candidate = automationInput.valve
      if (!isRecord(candidate) || candidate.sku !== 'H01000' || candidate.quantity !== zones.length ||
          orderSkus.get('H01000') !== zones.length ||
          bom.items.find((item) => item.sku === 'H01000')?.quantity !== zones.length ||
          orderSkus.has('B31440') || orderSkus.has('H01040') || bom.items.some((item) => ['B31440', 'H01040'].includes(item.sku))) {
        return { valid: false, reason: 'wired_controller_requires_standard_valves' }
      }
      const details = orderDetails.get('H01000')
      valve = { sku: 'H01000', quantity: zones.length, name: details?.name || cleanLabel(candidate.name, 160) || 'Rain Bird 100-HV', priceEUR: details?.price ?? null }
    } else if (automationInput.valve != null) {
      return { valid: false, reason: 'unexpected_automation_valve' }
    }
    const totalPriceEUR = controllers.reduce((sum, item) => sum + (item.priceEUR ?? 0) * item.quantity, 0) +
      (valve?.priceEUR ?? 0) * (valve?.quantity ?? 0)
    automation = { type, controllers, valve, requiresControlCable, wifiRequired, totalPriceEUR }
  }

  const operating = isRecord(input.operatingScenario) ? input.operatingScenario : {}
  const safePoints = (points) => Array.isArray(points) ? points.slice(0, 40).filter((point) =>
    isRecord(point) && finite(point.x, -500, 500) && finite(point.y, -500, 500)
  ).map((point) => ({ x: point.x, y: point.y })) : []
  const pipeNetwork = isRecord(input.pipeNetwork) ? input.pipeNetwork : null
  return {
    valid: true,
    snapshot: {
      schemaVersion: 1,
      projectType: 'automatic_lawn_irrigation',
      createdAt: cleanLabel(input.createdAt, 40),
      language: ['bg', 'ru', 'en'].includes(input.language) ? input.language : 'bg',
      geometry: {
        shape: cleanLabel(geometry.shape, 40),
        dimensionsM: {
          length: finite(geometry.dimensionsM?.length, 0, 500) ? geometry.dimensionsM.length : null,
          width: finite(geometry.dimensionsM?.width, 0, 500) ? geometry.dimensionsM.width : null,
          cutoutWidth: finite(geometry.dimensionsM?.cutoutWidth, 0, 500) ? geometry.dimensionsM.cutoutWidth : null,
          cutoutDepth: finite(geometry.dimensionsM?.cutoutDepth, 0, 500) ? geometry.dimensionsM.cutoutDepth : null,
          cutoutCorner: cleanLabel(geometry.dimensionsM?.cutoutCorner, 40),
        },
        normalized: { regions: [{ boundary: { vertices } }] },
        areaM2: geometry.areaM2,
        perimeterM: geometry.perimeterM,
        dimensionsAreApproximate: true,
      },
      operatingScenario: {
        manufacturer: cleanLabel(operating.manufacturer, 60),
        family: cleanLabel(operating.family, 60),
        model: cleanLabel(operating.model, 60),
        pressureBar: finite(operating.pressureBar, 0, 10) ? operating.pressureBar : null,
        actualNozzlePressureVerified: false,
      },
      layout: {
        model: cleanLabel(layout.model, 60),
        engineVersion: cleanLabel(layout.engineVersion, 80),
        algorithm: cleanLabel(layout.algorithm, 120),
        headToHeadPassed: layout.headToHeadPassed === null ? null : true,
        headToHeadApplicable: layout.headToHeadApplicable !== false,
        sprinklers: sprinklers.map((item) => ({
          id: item.id,
          position: { x: item.position.x, y: item.position.y },
          radiusM: item.radiusM,
          arcDeg: item.pattern === 'strip' ? null : item.arcDeg,
          performanceModel: cleanLabel(item.performanceModel, 60),
          pattern: item.pattern === 'strip' ? 'strip' : 'circular',
          stripWidthM: item.pattern === 'strip' && finite(item.stripWidthM, 1, 2) ? item.stripWidthM : null,
          stripLengthM: item.pattern === 'strip' && finite(item.stripLengthM, 2, 4) ? item.stripLengthM : null,
          source: item.source === 'interior' ? 'interior' : 'perimeter',
        })),
      },
      zones: zones.map((zone) => ({
        id: cleanLabel(zone.id, 40),
        zoneNumber: Number.isInteger(zone.zoneNumber) ? zone.zoneNumber : 0,
        zoneType: ['perimeter', 'interior', 'mixed'].includes(zone.zoneType) ? zone.zoneType : 'mixed',
        branchDirection: cleanLabel(zone.branchDirection, 20),
        sprinklerIds: zone.sprinklerIds,
      })),
      pipeNetwork: pipeNetwork ? {
        // Fixed Florial standard: all schematic PE pipe runs are Ø25 mm.
        // Ignore client-supplied diameters; hydraulic sizing is out of scope.
        mainDiameterMm: 25,
        zoneDiameterMm: 25,
        mainRoute: safePoints(pipeNetwork.mainRoute).slice(0, 20),
        branches: Array.isArray(pipeNetwork.branches) ? pipeNetwork.branches.slice(0, 60).map((branch) => ({
          zoneId: cleanLabel(branch.zoneId, 40),
          branchDirection: cleanLabel(branch.branchDirection, 20),
          sprinklerIds: Array.isArray(branch.sprinklerIds) ? branch.sprinklerIds.slice(0, 150) : [],
          points: safePoints(branch.points),
          lateralConnections: Array.isArray(branch.lateralConnections) ? branch.lateralConnections.slice(0, 150).map((lateral) => ({
            sprinklerId: cleanLabel(lateral?.sprinklerId, 80),
            points: safePoints(lateral?.points),
          })) : [],
        })) : [],
      } : null,
      automation,
      billOfMaterials: {
        headCount: bom.headCount,
        zoneCount: bom.zoneCount,
        flexPipeRequiredM: finite(bom.flexPipeRequiredM, 0, 1000) ? bom.flexPipeRequiredM : null,
        flexPipeCoils30m: Number.isInteger(bom.flexPipeCoils30m) ? bom.flexPipeCoils30m : null,
        items: bom.items.map((item) => {
          const details = orderDetails.get(item.sku)
          return {
            sku: item.sku,
            quantity: item.quantity,
            name: details?.name || cleanLabel(item.name, 160) || item.sku,
            priceEUR: details?.price ?? null,
          }
        }),
      },
      warnings: Array.isArray(input.warnings) ? input.warnings.slice(0, 30).map((warning) => ({
        code: cleanLabel(warning?.code, 100),
        path: cleanLabel(warning?.path, 100),
      })) : [],
    },
  }
}
