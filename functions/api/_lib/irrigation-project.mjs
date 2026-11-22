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
  if (!isRecord(layout) || layout.headToHeadPassed !== true ||
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
        ![90, 180, 270, 360].includes(sprinkler.arcDeg) ||
        !cleanLabel(sprinkler.performanceModel, 60)) {
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
  for (const item of Array.isArray(input.orderItems) ? input.orderItems : []) {
    if (isRecord(item) && typeof item.sku === 'string') orderSkus.set(item.sku, (orderSkus.get(item.sku) ?? 0) + Number(item.qty))
  }
  if (bom.items.some((item) => orderSkus.get(item.sku) !== item.quantity)) {
    return { valid: false, reason: 'project_bom_does_not_match_order' }
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
        dimensionsM: isRecord(geometry.dimensionsM) ? geometry.dimensionsM : {},
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
        headToHeadPassed: true,
        sprinklers: sprinklers.map((item) => ({
          id: item.id,
          position: { x: item.position.x, y: item.position.y },
          radiusM: item.radiusM,
          arcDeg: item.arcDeg,
          performanceModel: cleanLabel(item.performanceModel, 60),
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
        mainDiameterMm: finite(pipeNetwork.mainDiameterMm, 1, 200) ? pipeNetwork.mainDiameterMm : null,
        zoneDiameterMm: finite(pipeNetwork.zoneDiameterMm, 1, 200) ? pipeNetwork.zoneDiameterMm : null,
        mainRoute: safePoints(pipeNetwork.mainRoute).slice(0, 20),
        branches: Array.isArray(pipeNetwork.branches) ? pipeNetwork.branches.slice(0, 60).map((branch) => ({
          zoneId: cleanLabel(branch.zoneId, 40),
          branchDirection: cleanLabel(branch.branchDirection, 20),
          sprinklerIds: Array.isArray(branch.sprinklerIds) ? branch.sprinklerIds.slice(0, 150) : [],
          points: safePoints(branch.points),
        })) : [],
      } : null,
      billOfMaterials: {
        headCount: bom.headCount,
        zoneCount: bom.zoneCount,
        flexPipeRequiredM: finite(bom.flexPipeRequiredM, 0, 1000) ? bom.flexPipeRequiredM : null,
        flexPipeCoils30m: Number.isInteger(bom.flexPipeCoils30m) ? bom.flexPipeCoils30m : null,
        items: bom.items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
      },
      warnings: Array.isArray(input.warnings) ? input.warnings.slice(0, 30).map((warning) => ({
        code: cleanLabel(warning?.code, 100),
        path: cleanLabel(warning?.path, 100),
      })) : [],
    },
  }
}
