import type { PolygonRing, Point2M } from './lawnGeometry.mjs'

export interface IrrigationSiteRegion {
  readonly id: string
  readonly kind?: string
  readonly polygon: PolygonRing
}

export interface IrrigationSiteContextInput {
  readonly schemaVersion: 1
  readonly coordinateSystem: 'local_cartesian_m'
  readonly status: 'draft' | 'confirmed'
  readonly siteBoundary: PolygonRing
  readonly permittedSprayRegions?: ReadonlyArray<IrrigationSiteRegion>
  readonly noSprayRegions?: ReadonlyArray<IrrigationSiteRegion>
}

export interface ValidatedIrrigationSiteContext {
  readonly version: string
  readonly valid: boolean
  readonly status: 'accepted' | 'invalid'
  readonly errors: ReadonlyArray<{ readonly code: string; readonly path: string }>
  readonly siteBoundary?: ReadonlyArray<Point2M>
  readonly permittedSprayRegions?: ReadonlyArray<{ readonly id: string; readonly kind: string; readonly vertices: ReadonlyArray<Point2M> }>
  readonly noSprayRegions?: ReadonlyArray<{ readonly id: string; readonly kind: string; readonly vertices: ReadonlyArray<Point2M> }>
}

export type IrrigationSprayPointClass =
  | 'target_lawn'
  | 'permitted_adjacent'
  | 'no_spray'
  | 'unapproved_on_site'
  | 'outside_site'
  | 'unknown'

export function validateIrrigationSiteContext(input: IrrigationSiteContextInput): ValidatedIrrigationSiteContext
export function classifyIrrigationSprayPoint(input: {
  readonly point: Point2M
  readonly siteContext: ValidatedIrrigationSiteContext
  readonly lawnBoundary: ReadonlyArray<Point2M>
}): IrrigationSprayPointClass
