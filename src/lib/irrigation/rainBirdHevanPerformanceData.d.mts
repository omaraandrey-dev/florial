export interface RainBirdHevanPerformancePoint {
  readonly model: string
  readonly pattern: 'circular'
  readonly arcDeg: 90 | 180 | 270 | 360
  readonly pressureBar: number
  readonly radiusM: number
  readonly flowM3h: number
  readonly flowLpm: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
}

export interface RainBirdHevanDataset {
  readonly manufacturer: 'Rain Bird'
  readonly family: 'HE-VAN'
  readonly source: Readonly<{
    title: string
    documentCode: string
    url: string
    testConditions: string
    spacingBasis: string
    note: string
  }>
  readonly units: Readonly<{
    pressure: 'bar'
    radius: 'm'
    flow: 'L/min'
    flowVolume: 'm3/h'
    precipitation: 'mm/h'
  }>
  readonly models: ReadonlyArray<Readonly<{
    model: string
    sku: string
    sanityProductId: string
    trajectoryDeg: number
  }>>
  readonly pressurePointsBar: readonly number[]
  readonly performancePoints: readonly RainBirdHevanPerformancePoint[]
}

export const RAIN_BIRD_HEVAN_DATASET: RainBirdHevanDataset

export function findRainBirdHevanPerformancePoint(
  model: string,
  pressureBar: number,
  arcDeg: number,
): RainBirdHevanPerformancePoint | null
