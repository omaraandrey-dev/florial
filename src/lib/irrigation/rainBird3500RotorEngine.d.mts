import type { LawnGeometryInput } from './lawnGeometry.mjs'
import type { IrrigationSiteContextInput } from './irrigationSiteContext.mjs'

export interface RainBird3500RotorInput {
  readonly id: string
  readonly position: Readonly<{ x: number; y: number }>
  readonly directionDeg: number
  readonly arcDeg: 180
}

export interface RainBird3500RotorEvaluationInput {
  readonly geometry: LawnGeometryInput
  /** Exact D42378 pressure at the nozzle in bar; source pressure is not accepted. */
  readonly nozzlePressureBar: number
  /** Exact D42378 nozzle-tree size: 0.75, 1, 1.5, 2, 3 or 4. */
  readonly nozzle: number
  readonly sprinklers: ReadonlyArray<RainBird3500RotorInput>
  readonly sampleStepM?: number
  readonly siteContext?: IrrigationSiteContextInput
}

export interface RainBird3500RotorEvaluationResult {
  readonly engineVersion: string
  readonly family: '3500'
  readonly status: string
  readonly coverageScope?: 'sampled_geometry_only'
  readonly siteContext?: Readonly<{ status: 'confirmed' | 'not_provided'; oversprayPolicy: 'whole_site_context' | 'conservative_lawn_boundary' }>
  readonly operatingPoint?: Readonly<{
    nozzlePressureBar: number
    nozzle: number
    arcDeg: 180
    radiusM: number
    flowLpm: number
    precipitationSquareMmH: number
    precipitationTriangularMmH: number
    source: 'Rain Bird D42378'
    precipitationBasis: 'Half-circle operation'
  }>
  readonly coverage?: Readonly<{
    sampledPoints: number
    coveredPoints: number
    uncoveredPoints: number
    coveragePercent: number
    uncoveredSamples: ReadonlyArray<Readonly<{ x: number; y: number }>>
  }>
  readonly sprinklers: ReadonlyArray<Readonly<{
    id: string
    position: Readonly<{ x: number; y: number }>
    arcDeg: 180
    directionDeg: number
    nozzle: number
    nozzlePressureBar: number
    radiusM: number
    flowLpm: number
    precipitationSquareMmH: number
    precipitationTriangularMmH: number
    performanceSource: 'Rain Bird D42378'
  }>>
  readonly headToHead?: Readonly<{
    passed: boolean
    checks: ReadonlyArray<Readonly<{
      sprinklerId: string
      neighbourId: string | null
      separationM: number | null
      requiredMaximumM: number | null
      passed: boolean
    }>>
  }>
  readonly overspray?: Readonly<{
    status: string
    scope?: 'site_boundary_and_spray_policy' | 'lawn_boundary_only'
    checks: ReadonlyArray<Readonly<{
      sprinklerId: string
      sampledSectorPoints: number
      sampledOutsidePoints: number
      sampledOutsidePercent: number
      sampledForbiddenPoints: number
      sampledForbiddenPercent: number
      sampledPermittedAdjacentPoints: number
      sampledNoSprayPoints: number
      sampledOutsideSitePoints: number
      sampledUnapprovedOnSitePoints: number
    }>>
  }>
  readonly totalFlowLpm?: number
  readonly hydraulicFeasibility?: 'not_evaluated'
  readonly precipitationUniformity?: 'not_evaluated'
  readonly bodyCompatibility?: 'not_evaluated'
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
  readonly errors: ReadonlyArray<Readonly<{ code: string; path: string }>>
}

export function evaluateRainBird3500RotorLayout(
  input: RainBird3500RotorEvaluationInput,
): RainBird3500RotorEvaluationResult
