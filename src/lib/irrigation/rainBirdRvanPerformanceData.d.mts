export interface RainBirdRvanPerformancePoint {
  readonly model: string
  readonly pattern: 'circular' | 'strip'
  readonly arcDeg: number | null
  readonly pressureBar: number
  readonly radiusM: number | null
  readonly dimensionsM?: Readonly<[number, number]>
  readonly flowLpm: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
}

export interface RainBirdRvanDataset {
  readonly manufacturer: 'Rain Bird'
  readonly family: 'R-VAN'
  readonly source: Readonly<{
    title: string
    documentCode: string
    copyrightYear: number
    revision: string
    url: string
    testStandard: string
    testConditions: string
    testedBodyPopUpCm: number
    recommendedOperatingPressureBar: number
    pressureRangeBar: readonly [number, number]
    spacingBasis: string
    notes: readonly string[]
  }>
  readonly units: Readonly<{
    pressure: 'bar'
    radius: 'm'
    flow: 'L/min'
    precipitation: 'mm/h'
    dimensions: 'm'
  }>
  readonly models: ReadonlyArray<Readonly<{
    model: string
    sku: string
    sanityProductId: string
  }>>
  readonly pressurePointsBar: readonly number[]
  readonly performancePoints: readonly RainBirdRvanPerformancePoint[]
}

export const RAIN_BIRD_RVAN_DATASET: RainBirdRvanDataset

export function findRainBirdRvanPerformancePoint(
  model: string,
  pressureBar: number,
  arcDeg?: number | null,
): RainBirdRvanPerformancePoint | null
