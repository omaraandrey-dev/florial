const PRODUCT_SKUS = Object.freeze({
  rotor3504: 'Y34001',
  body1804: 'A44120',
  flex30m: 'A82060',
  sbe050: 'A46010',
  valve100HV: 'H01000',
  valveBoxSmall: 'VBA02672',
  manifoldTee25: 'IQ2142000N250',
  sprinklerTee25Half: 'IQ21520F0N25C',
  sprinklerElbow25Half: 'IQ21820F0N25B',
  valveAdapter25OneInch: 'IQ21120M0N25D',
  nozzles: Object.freeze({
    'R-VAN14': 'A84659',
    'R-VAN18': 'A84660',
    'R-VAN24': 'A84661',
    'R-VAN14-360': 'A84664',
    'R-VAN18-360': 'A84665',
    'R-VAN24-360': 'A84666',
    'R-VAN-LCS': 'A84667',
    'R-VAN-RCS': 'A84668',
    'R-VAN-SST': 'A84669',
  }),
})

/**
 * Creates a catalog-SKU bill of materials from the deterministic sprinkler
 * layout and the sequential Florial zone assignment.
 *
 * Flex pipe is sold only as a 30 m coil. The planning baseline is 0.5 m
 * per sprinkler (the expected installation range is 0.5–1.5 m per head),
 * so one coil covers up to 60 sprinklers. All other quantities are discrete pieces.
 */
export function buildIrrigationBillOfMaterials(layout, zones) {
  const sprinklers = Array.isArray(layout?.sprinklers) ? layout.sprinklers : []
  if (!sprinklers.length || !Array.isArray(zones) || !zones.length) {
    return Object.freeze({ valid: false, reason: 'missing_layout_or_zones', items: Object.freeze([]) })
  }

  const counts = new Map()
  const add = (sku, quantity) => {
    if (!sku || !Number.isInteger(quantity) || quantity <= 0) return
    counts.set(sku, (counts.get(sku) ?? 0) + quantity)
  }

  const assignedHeadIds = zones.flatMap((zone) => zone.sprinklerIds ?? [])
  const zoneHeadIds = new Set(assignedHeadIds)
  const zoneSizes = zones.map((zone) => zone.sprinklerIds?.length ?? 0)
  if (assignedHeadIds.length !== sprinklers.length ||
      zoneHeadIds.size !== sprinklers.length ||
      zones.length !== Math.ceil(sprinklers.length / 6) ||
      zones.some((zone) => !zone.sprinklerIds?.length || zone.sprinklerIds.length > 6) ||
      Math.max(...zoneSizes) - Math.min(...zoneSizes) > 1 ||
      sprinklers.some((sprinkler) => !zoneHeadIds.has(sprinkler.id))) {
    return Object.freeze({ valid: false, reason: 'zone_assignment_incomplete', items: Object.freeze([]) })
  }

  const nozzleCounts = new Map()
  let rotorCount = 0
  let sprayBodyCount = 0
  for (const sprinkler of sprinklers) {
    const baseModel = String(sprinkler.performanceModel ?? layout.model ?? '').replace(/-360$/, '')
    if (baseModel === '3504-PC') {
      if (sprinkler.pattern !== 'rotor' ||
          !Number.isFinite(sprinkler.radiusM) ||
          sprinkler.radiusM < 5 || sprinkler.radiusM > 9) {
        return Object.freeze({
          valid: false,
          reason: 'invalid_3504_pc_head_definition',
          items: Object.freeze([]),
        })
      }
      rotorCount += 1
      continue
    }
    if (sprinkler.pattern === 'rotor') {
      return Object.freeze({
        valid: false,
        reason: 'invalid_3504_pc_head_definition',
        items: Object.freeze([]),
      })
    }
    const nozzleKey = sprinkler.arcDeg === 360 ? baseModel + '-360' : baseModel
    const sku = PRODUCT_SKUS.nozzles[nozzleKey]
    if (!sku) {
      return Object.freeze({
        valid: false,
        reason: 'unsupported_nozzle_model',
        unsupportedNozzle: nozzleKey,
        items: Object.freeze([]),
      })
    }
    nozzleCounts.set(sku, (nozzleCounts.get(sku) ?? 0) + 1)
    sprayBodyCount += 1
  }

  add(PRODUCT_SKUS.rotor3504, rotorCount)

  for (const [sku, quantity] of nozzleCounts) add(sku, quantity)

  const headCount = sprinklers.length
  add(PRODUCT_SKUS.body1804, sprayBodyCount)
  add(PRODUCT_SKUS.sbe050, headCount * 2)
  add(PRODUCT_SKUS.flex30m, Math.max(1, Math.ceil(headCount / 60)))

  for (const zone of zones) {
    const zoneHeadCount = zone.sprinklerIds?.length ?? 0
    if (!zoneHeadCount) {
      return Object.freeze({ valid: false, reason: 'empty_zone', items: Object.freeze([]) })
    }
    add(PRODUCT_SKUS.sprinklerTee25Half, Math.max(0, zoneHeadCount - 1))
    add(PRODUCT_SKUS.sprinklerElbow25Half, 1)
  }

  const zoneCount = zones.length
  add(PRODUCT_SKUS.valve100HV, zoneCount)
  add(PRODUCT_SKUS.valveAdapter25OneInch, zoneCount * 2)
  add(PRODUCT_SKUS.valveBoxSmall, zoneCount)
  add(PRODUCT_SKUS.manifoldTee25, Math.max(0, zoneCount - 1))

  return Object.freeze({
    valid: true,
    headCount,
    zoneCount,
    flexPipeRequiredM: headCount * 0.5,
    flexPipeCoils30m: Math.max(1, Math.ceil(headCount / 60)),
    items: Object.freeze([...counts.entries()].map(([sku, quantity]) =>
      Object.freeze({ sku, quantity }))),
  })
}

export const IRRIGATION_BOM_PRODUCT_SKUS = Object.freeze([
  ...new Set([
    PRODUCT_SKUS.rotor3504,
    PRODUCT_SKUS.body1804,
    PRODUCT_SKUS.flex30m,
    PRODUCT_SKUS.sbe050,
    PRODUCT_SKUS.valve100HV,
    PRODUCT_SKUS.valveBoxSmall,
    PRODUCT_SKUS.manifoldTee25,
    PRODUCT_SKUS.sprinklerTee25Half,
    PRODUCT_SKUS.sprinklerElbow25Half,
    PRODUCT_SKUS.valveAdapter25OneInch,
    ...Object.values(PRODUCT_SKUS.nozzles),
  ]),
])
