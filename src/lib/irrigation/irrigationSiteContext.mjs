import { validateLawnGeometry } from './lawnGeometry.mjs'

const VERSION = '1.0.0'
const EPSILON = 1e-8

function issue(code, path) {
  return Object.freeze({ code, path })
}

function pointInRing(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const a = vertices[previous]
    const b = vertices[index]
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    const within = point.x >= Math.min(a.x, b.x) - EPSILON &&
      point.x <= Math.max(a.x, b.x) + EPSILON &&
      point.y >= Math.min(a.y, b.y) - EPSILON &&
      point.y <= Math.max(a.y, b.y) + EPSILON
    if (Math.abs(cross) <= EPSILON && within) return 0
    if ((a.y > point.y) !== (b.y > point.y)) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside ? 1 : -1
}

function validatePolygon(polygon, id, path) {
  const result = validateLawnGeometry({
    schemaVersion: 1,
    coordinateSystem: 'local_cartesian_m',
    status: 'confirmed',
    regions: [{ id, boundary: polygon }],
  })
  if (!result.valid || !result.normalizedGeometry) return { error: issue('invalid_polygon', path) }
  return { vertices: result.normalizedGeometry.regions[0].boundary.vertices.slice(0, -1) }
}

function isInsideOrOn(point, vertices) {
  return pointInRing(point, vertices) >= 0
}

function edgesRemainInside(vertices, container) {
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]
    const b = vertices[(index + 1) % vertices.length]
    for (const ratio of [0, 0.25, 0.5, 0.75]) {
      const point = { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio }
      if (!isInsideOrOn(point, container)) return false
    }
  }
  return true
}

/**
 * Validates the whole-property spray context. The target lawn remains in the
 * separate lawn geometry contract. Spray outside that lawn is permitted only
 * in explicitly declared permittedSprayRegions; noSprayRegions always win.
 */
export function validateIrrigationSiteContext(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Object.freeze({ version: VERSION, valid: false, status: 'invalid', errors: Object.freeze([issue('invalid_input', '$')]) })
  }
  if (input.schemaVersion !== 1) errors.push(issue('invalid_schema_version', 'schemaVersion'))
  if (input.coordinateSystem !== 'local_cartesian_m') errors.push(issue('unsupported_coordinate_system', 'coordinateSystem'))
  if (input.status !== 'confirmed') errors.push(issue('confirmed_site_context_required', 'status'))

  const site = validatePolygon(input.siteBoundary, 'site-boundary', 'siteBoundary')
  if (site.error) errors.push(site.error)

  const permitted = []
  const noSpray = []
  const ids = new Set()
  for (const [field, target] of [['permittedSprayRegions', permitted], ['noSprayRegions', noSpray]]) {
    const entries = input[field] ?? []
    if (!Array.isArray(entries)) {
      errors.push(issue('invalid_region_list', field))
      continue
    }
    entries.forEach((entry, index) => {
      const path = field + '[' + index + ']'
      if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || ids.has(entry.id)) {
        errors.push(issue('invalid_or_duplicate_region_id', path + '.id'))
        return
      }
      ids.add(entry.id)
      const polygon = validatePolygon(entry.polygon, entry.id, path + '.polygon')
      if (polygon.error) {
        errors.push(polygon.error)
        return
      }
      if (!site.vertices || !edgesRemainInside(polygon.vertices, site.vertices)) {
        errors.push(issue('region_outside_site_boundary', path))
        return
      }
      target.push(Object.freeze({
        id: entry.id,
        kind: typeof entry.kind === 'string' ? entry.kind : 'other',
        vertices: Object.freeze(polygon.vertices.map((point) => Object.freeze(point))),
      }))
    })
  }

  if (errors.length) {
    return Object.freeze({ version: VERSION, valid: false, status: 'invalid', errors: Object.freeze(errors) })
  }
  return Object.freeze({
    version: VERSION,
    valid: true,
    status: 'accepted',
    siteBoundary: Object.freeze(site.vertices.map((point) => Object.freeze(point))),
    permittedSprayRegions: Object.freeze(permitted),
    noSprayRegions: Object.freeze(noSpray),
    errors: Object.freeze([]),
  })
}

/** Classifies a spray sample; forbidden areas take precedence over permissions. */
export function classifyIrrigationSprayPoint({ point, siteContext, lawnBoundary }) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
      !siteContext?.valid || !Array.isArray(siteContext.siteBoundary) ||
      !Array.isArray(lawnBoundary)) return 'unknown'
  if (siteContext.noSprayRegions.some((region) => pointInRing(point, region.vertices) >= 0)) return 'no_spray'
  if (pointInRing(point, lawnBoundary) >= 0) return 'target_lawn'
  if (pointInRing(point, siteContext.siteBoundary) < 0) return 'outside_site'
  if (siteContext.permittedSprayRegions.some((region) => pointInRing(point, region.vertices) >= 0)) {
    return 'permitted_adjacent'
  }
  return 'unapproved_on_site'
}
