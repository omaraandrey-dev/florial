export interface RainBird3504LayoutResult {
  readonly status: string
  readonly family?: '3500'
  readonly model?: '3504-PC'
  readonly planningRadiusM?: 8 | 9 | 10 | null
  readonly sprinklers: ReadonlyArray<Readonly<{
    id: string
    position: Readonly<{ x: number; y: number }>
    arcDeg: 90 | 180 | 270 | 360
    directionDeg: number | null
    source: 'edge' | 'interior'
    radiusM: 8 | 9 | 10
    pressureBar: null
    flowLpm: null
    precipitationSquareMmH: null
    precipitationTriangularMmH: null
    performanceModel: '3504-PC'
    pattern: 'circular'
    planningRadiusSource: 'owner-approved-florial-3504pc-rule'
  }>>
  readonly coverage?: Readonly<{
    sampledPoints: number
    coveredPoints: number
    uncoveredPoints: number
    coveragePercent: number
    uncoveredSamples: ReadonlyArray<Readonly<{ x: number; y: number }>>
  }>
  readonly candidateStats?: Readonly<{ candidatePositions: number; candidates: number; selectedRotors: number; offsetCandidatePositions?: number }>
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
}
export function generateRainBird3504Layout(
  geometry: Readonly<Record<string, any>>,
  options?: {
    sampleStepM?: number
    candidatePositionOffsets?: ReadonlyArray<Readonly<{ from: Readonly<{ x: number; y: number }>; dx: number; dy: number }>>
  },
): RainBird3504LayoutResult
