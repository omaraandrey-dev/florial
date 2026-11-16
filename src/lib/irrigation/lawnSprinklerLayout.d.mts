import type { LawnGeometryInput } from './lawnGeometry.mjs'

export interface LawnSprinklerLayoutInput {
  readonly geometry: LawnGeometryInput
  readonly family: 'R-VAN' | 'HE-VAN'
  /** Adjustable R-VAN model (R-VAN14/18/24) or HE-VAN model (HE-VAN-8/10/12/15). */
  readonly model: string
  /** Exact manufacturer pressure point in bar. */
  readonly pressureBar: number
  /** Sampling interval in metres; defaults to 0.25m. */
  readonly sampleStepM?: number
}

export interface LawnSprinklerCandidate {
  readonly id: string
  readonly position: Readonly<{ x: number; y: number }>
  readonly arcDeg: 90 | 180 | 270 | 360
  /** Sector centre, degrees counter-clockwise from +X; null for full circle. */
  readonly directionDeg: number | null
  readonly source: 'vertex' | 'edge' | 'interior'
  readonly radiusM: number
  readonly flowLpm: number
  readonly pressureBar: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
  readonly performanceModel: string
}

export interface LawnSprinklerLayoutResult {
  readonly engineVersion: string
  readonly algorithm?: string
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
    passed: boolean
    checks: ReadonlyArray<Readonly<{
      sprinklerId: string
      nearestSprinklerId: string | null
      separationM: number | null
      requiredMaximumM: number | null
      passed: boolean
    }>>
  }>
  readonly totalFlowLpm?: number
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
  readonly hydraulicFeasibility?: 'not_evaluated'
  readonly precipitationUniformity?: 'not_evaluated'
  readonly bodyCompatibility?: 'not_evaluated'
  readonly overspray?: 'not_evaluated'
  readonly errors?: ReadonlyArray<Readonly<{ code: string; path: string }>>
}

export function generateLawnSprinklerLayout(
  input: LawnSprinklerLayoutInput,
): LawnSprinklerLayoutResult
