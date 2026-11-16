import type { LawnGeometryInput } from './lawnGeometry.mjs'
import type { IrrigationSiteContextInput } from './irrigationSiteContext.mjs'
import type { RainBird3500RotorEvaluationResult } from './rainBird3500RotorEngine.mjs'

export interface RainBird3500LayoutGeneratorInput {
  readonly geometry: LawnGeometryInput
  /** Exact D42378 pressure measured/verified at the nozzle, in bar. */
  readonly nozzlePressureBar: number
  /** Exact D42378 nozzle-tree size: 0.75, 1, 1.5, 2, 3 or 4. */
  readonly nozzle: number
  readonly sampleStepM?: number
  /** Candidate grid step as a fraction of exact D42378 throw radius: 0.25, 0.5 or 1. */
  readonly candidatePositionStepFactor?: 0.25 | 0.5 | 1
  /** Candidate bearing increment in degrees: 15, 30 or 45. */
  readonly candidateDirectionStepDeg?: 15 | 30 | 45
  readonly siteContext?: IrrigationSiteContextInput
}

export interface RainBird3500GeneratedLayoutResult extends RainBird3500RotorEvaluationResult {
  readonly candidateStrategy?: '180-degree-sector-grid-h2h-greedy-v2'
  readonly candidateStats?: Readonly<{
    testedPositions: number
    testedCandidates: number
    selectedRotors: number
    candidateDirectionStepDeg: 15 | 30 | 45
    candidatePositionStepM: number
    candidatePositionStepFactor: 0.25 | 0.5 | 1
  }>
  readonly searchCoverage?: Readonly<{
    sampledTargets: number
    uncoveredTargets: number
    searchCoveragePercent: number
  }>
}

export function generateRainBird3500RotorLayout(
  input: RainBird3500LayoutGeneratorInput,
): RainBird3500GeneratedLayoutResult
