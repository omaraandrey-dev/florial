export interface RainBird3500PerformancePoint {
  readonly pressureBar: number
  readonly nozzle: number
  readonly radiusM: number
  readonly flowM3h: number
  readonly flowLpm: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
}

export interface RainBird3500Dataset {
  readonly manufacturer: 'Rain Bird'
  readonly family: '3500'
  readonly source: Readonly<{
    title: string
    documentCode: string
    copyrightYear: number
    section: string
    url: string
    testStandard: string
    testConditions: string
    precipitationBasis: string
    spacingBasis: Readonly<{ square: string; triangular: string }>
  }>
  readonly units: Readonly<{
    pressure: 'bar'
    radius: 'm'
    flow: 'L/min'
    flowVolume: 'm3/h'
    precipitation: 'mm/h'
  }>
  readonly supportedModels: ReadonlyArray<Readonly<{
    sanityProductId: string
    sku: string
    model: string
    sam: boolean
  }>>
  readonly nozzleTree: ReadonlyArray<number>
  readonly pressurePointsBar: ReadonlyArray<number>
  readonly performancePoints: ReadonlyArray<RainBird3500PerformancePoint>
}

export const RAIN_BIRD_3500_DATASET: RainBird3500Dataset

export function findRainBird3500PerformancePoint(
  pressureBar: number,
  nozzle: number,
): RainBird3500PerformancePoint | null
