export interface RainBird3504LayoutResult {
  readonly engineVersion: string
  readonly status: string
  readonly family?: '3500'
  readonly model?: '3504-PC'
  readonly planningRadiusM?: number | null
  readonly supplementalRadiusM?: number | null
  readonly layoutStrategy?: 'four-corners-first' | 'corner-first-shared-cell-grid'
  readonly grid?: Readonly<{
    columns: number
    rows: number
    cells: number
    cornerPositionsPerCell: 4
    uniqueCornerPositions: number
  }>
  readonly sprinklers: ReadonlyArray<Readonly<{
    id: string
    position: Readonly<{ x: number; y: number }>
    arcDeg: 90 | 180 | 360
    directionDeg: number | null
    source: 'vertex' | 'edge' | 'interior'
    radiusM: number
    pressureBar: null
    flowLpm: null
    precipitationSquareMmH: null
    precipitationTriangularMmH: null
    performanceModel: '3504-PC'
    pattern: 'rotor'
    planningRadiusSource: 'owner-approved-florial-3504pc-corner-first-grid'
  }>>
  readonly coverage?: Readonly<{
    sampledPoints: number
    coveredPoints: number
    uncoveredPoints: number
    coveragePercent: number
    uncoveredSamples: ReadonlyArray<Readonly<{ x: number; y: number }>>
  }>
  readonly headToHead?: Readonly<{ passed: boolean; applicable: boolean; checks: ReadonlyArray<Readonly<Record<string, unknown>>> }>
  readonly candidateStats?: Readonly<{ candidatePositions: number; selectedRotors: number }>
  readonly warnings: ReadonlyArray<Readonly<{ code: string; path: string }>>
}
export function generateRainBird3504Layout(
  geometry: Readonly<Record<string, any>>,
  options?: {
    sampleStepM?: number
    initialSprinklers?: ReadonlyArray<Readonly<Record<string, any>>>
  },
): RainBird3504LayoutResult
