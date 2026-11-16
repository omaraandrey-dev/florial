export interface Point2M {
  readonly x: number
  readonly y: number
}

export interface PolygonRing {
  readonly vertices: ReadonlyArray<Point2M>
}

export interface LawnExclusion {
  readonly id: string
  readonly kind?: string
  readonly polygon: PolygonRing
}

export interface LawnRegion {
  readonly id: string
  readonly boundary: PolygonRing
  readonly exclusions?: ReadonlyArray<LawnExclusion>
}

export interface LawnGeometryInput {
  readonly schemaVersion: 1
  readonly coordinateSystem: 'local_cartesian_m'
  readonly status?: 'draft' | 'needs_scale' | 'needs_confirmation' | 'confirmed'
  readonly regions: ReadonlyArray<LawnRegion>
  readonly reportedAreaM2?: number
}

export type LawnGeometryStatus =
  | 'accepted'
  | 'needs_scale'
  | 'needs_confirmation'
  | 'unsupported'
  | 'invalid'

export interface LawnGeometryIssue {
  readonly code: string
  readonly path: string
}

export interface LawnRegionSummary {
  readonly id: string
  readonly shape: 'rectangle' | 'l-shape' | 'unsupported'
  readonly grossAreaM2: number
  readonly excludedAreaM2: number
  readonly netAreaM2: number
  readonly outerPerimeterM: number
  readonly exclusionPerimeterM: number
}

export interface LawnGeometryValidation {
  readonly validatorVersion: string
  readonly valid: boolean
  readonly supported: boolean
  readonly status: LawnGeometryStatus
  readonly regions: ReadonlyArray<LawnRegionSummary>
  readonly computedAreaM2?: number
  readonly computedPerimeterM?: number
  readonly errors: ReadonlyArray<LawnGeometryIssue>
  readonly warnings: ReadonlyArray<LawnGeometryIssue>
  readonly normalizedGeometry?: LawnGeometryInput
  readonly reportedAreaComparison?: Readonly<{
    reportedAreaM2: number
    computedAreaM2: number
    differenceM2: number
    absoluteDifferenceM2: number
    differencePercent: number | null
    toleranceApplied: false
  }>
}

/**
 * Validates local Cartesian metric lawn geometry. This is not a sprinkler
 * layout, coverage, or hydraulic-feasibility solver.
 */
export function validateLawnGeometry(
  input: LawnGeometryInput,
  options?: Readonly<Record<string, never>>,
): LawnGeometryValidation
