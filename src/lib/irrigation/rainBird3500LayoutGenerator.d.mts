import type { LawnGeometryInput } from './lawnGeometry.mjs'
import type { RainBird3500RotorEvaluationResult } from './rainBird3500RotorEngine.mjs'

export interface RainBird3500LayoutGeneratorInput {
  readonly geometry: LawnGeometryInput
  /** Exact D42378 pressure measured/verified at the nozzle, in bar. */
  readonly nozzlePressureBar: number
  /** Exact D42378 nozzle-tree size: 0.75, 1, 1.5, 2, 3 or 4. */
  readonly nozzle: number
  readonly sampleStepM?: number
}

export interface RainBird3500GeneratedLayoutResult extends RainBird3500RotorEvaluationResult {
  readonly candidateStrategy?: '180-degree-sector-grid-greedy-v1'
  readonly candidateStats?: Readonly<{
    testedPositions: number
    testedCandidates: number
    selectedRotors: number
    candidateDirectionStepDeg: 45
    candidatePositionStepM: number
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
