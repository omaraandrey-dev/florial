import type { LawnGeometryInput } from './lawnGeometry.mjs'

export interface LawnSprinklerLayoutInput {
  readonly geometry: LawnGeometryInput
  readonly family: 'R-VAN' | 'HE-VAN'
  /** Adjustable R-VAN model (R-VAN14/18/24) or HE-VAN model (HE-VAN-8/10/12/15). */
  readonly model: string
  /** Exact manufacturer pressure point in bar. */
  readonly pressureBar: number
  /** Sampling interval in metres; defaults to 0.5m. */
  readonly sampleStepM?: number
  /** Base interior-grid spacing hint. R-VAN radii are selected per candidate from local reach/spacing and remain independent of arc. */
  readonly radiusM?: number
  /** Candidate coordinates reserved for a connected strip-pattern zone. */
  readonly excludedCandidatePositions?: ReadonlyArray<Readonly<{ x: number; y: number }>>
  /** Move a selected corner candidate a small distance inward from a shared seam. */
  readonly candidatePositionOffsets?: ReadonlyArray<Readonly<{ from: Readonly<{ x: number; y: number }>; dx: number; dy: number }>>
  /** Restrict circular spray sectors to the rectangular solver bounds. */
  readonly preventOverspray?: boolean
}

export interface LawnSprinklerCandidate {
  readonly id: string
  readonly position: Readonly<{ x: number; y: number }>
  readonly arcDeg: 90 | 180 | 270 | 360 | null
  /** Sector centre, degrees counter-clockwise from +X; null for full circle. */
  readonly directionDeg: number | null
  readonly source: 'vertex' | 'edge' | 'interior'
  readonly placementGroup?: 'central_row'
  readonly radiusM: number | null
  readonly flowLpm: number
  readonly pressureBar: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
  readonly performanceModel: string
  readonly pattern?: 'circular' | 'strip'
  readonly stripWidthM?: number
  readonly stripLengthM?: number
  readonly stripDirection?: 'left' | 'right' | 'up' | 'down' | 'both'
  readonly stripAxis?: 'horizontal' | 'vertical'
}

export interface LawnSprinklerLayoutResult {
  readonly engineVersion: string
  readonly algorithm?: string
  readonly placementStrategy?: 'perimeter_first_then_interior_if_required'
  readonly perimeterPass?: Readonly<{ sampledCoverageComplete: boolean; selectedSprinklers: number; uncoveredPointsBeforeInteriorPass: number; uncoveredSamplesBeforeInteriorPass: ReadonlyArray<Readonly<{ x: number; y: number }>> }>
  readonly interiorPass?: Readonly<{ activated: boolean; selectedSprinklers: number; activationReason: string }>
  readonly status: string
  readonly coverageScope?: 'sampled_geometry_only'
  readonly family?: 'R-VAN' | 'HE-VAN'
  readonly model?: string
  readonly pressureBar?: number
  readonly sampleStepM?: number
  readonly geometry?: Readonly<{ regionId: string; shape: string; areaM2: number }>
  readonly coverage?: Readonly<{
    sampledPoints: number
    coveredPoints: number
    uncoveredPoints: number
    coveragePercent: number
    uncoveredSamples: ReadonlyArray<Readonly<{ x: number; y: number }>>
  }>
  readonly sprinklers: ReadonlyArray<LawnSprinklerCandidate>
  readonly headToHead?: Readonly<{
    passed: boolean | null
    applicable?: boolean
    checks: ReadonlyArray<Readonly<{
      sprinklerId: string
      nearestSprinklerId: string | null
      separationM: number | null
      requiredMaximumM: number | null
      headToHeadNeighborId: string | null
      headToHeadSeparationM: number | null
      headToHeadRequiredMaximumM: number | null
      passed: boolean
    }>>
  }>
  readonly totalFlowLpm?: number
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
  readonly hydraulicFeasibility?: 'not_evaluated'
  readonly precipitationUniformity?: 'not_evaluated'
  readonly bodyCompatibility?: 'not_evaluated'
  readonly overspray?: 'not_evaluated' | 'sampled_inside_boundary' | 'sampled_outside_boundary'
  readonly errors?: ReadonlyArray<Readonly<{ code: string; path: string }>>
}

export interface HeadToHeadSpacingCheck {
  readonly sprinklerId: string
  readonly nearestSprinklerId: string | null
  readonly separationM: number | null
  readonly requiredMaximumM: number | null
  readonly headToHeadNeighborId: string | null
  readonly headToHeadSeparationM: number | null
  readonly headToHeadRequiredMaximumM: number | null
  readonly passed: boolean
}

export function evaluateHeadToHeadSpacing(
  sprinklers: readonly LawnSprinklerCandidate[],
): readonly HeadToHeadSpacingCheck[]

export function generateLawnSprinklerLayout(
  input: LawnSprinklerLayoutInput,
): LawnSprinklerLayoutResult
