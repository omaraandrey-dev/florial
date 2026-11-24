export interface RainBird3504LayoutResult {
  readonly status: string
  readonly family?: '3500'
  readonly model?: '3504-PC'
  readonly planningRadiusM?: 8 | 9 | 10 | 7 | 6 | 5 | null
  readonly sprinklers: ReadonlyArray<Readonly<{
    id: string
    position: Readonly<{ x: number; y: number }>
    arcDeg: 90 | 180 | 270 | 360
    directionDeg: number | null
    source: 'vertex' | 'edge' | 'interior'
    radiusM: number
    pressureBar: null
    flowLpm: null
    performanceModel: '3504-PC'
    family: '3500'
    pattern: 'rotor'
    planningRadiusSource: 'owner-approved-florial-3504pc-rule'
  }>>
  readonly cells?: ReadonlyArray<Readonly<{ id: string; cornerHeadIds: ReadonlyArray<string> }>>
  readonly grid?: Readonly<{ pitchM: number; columns: number; rows: number }>
  readonly coverage?: Readonly<{
    sampledPoints: number
    coveredPoints: number
    uncoveredPoints: number
    coveragePercent: number
    uncoveredSamples: ReadonlyArray<Readonly<{ x: number; y: number }>>
  }>
  readonly headToHead?: Readonly<{ passed: boolean; applicable: boolean; checks: ReadonlyArray<Readonly<Record<string, any>>> }>
  readonly candidateStats?: Readonly<{
    requiredCornerPositions: number
    cellCount: number
    sharedCellCornersDeduplicated: number
    selectedRotors: number
  }>
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
}
export function generateRainBird3504Layout(
  geometry: Readonly<Record<string, any>>,
  options?: { sampleStepM?: number },
): Readonly<RainBird3504LayoutResult>
