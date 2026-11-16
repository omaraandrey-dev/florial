export interface RainBird5000MprPerformancePoint {
  readonly radiusClassFt: 25 | 30 | 35
  readonly arcDeg: 90 | 120 | 180 | 360
  readonly pressureBar: 1.7 | 2.4 | 3.1 | 3.8 | 4.5
  readonly radiusM: number
  readonly flowM3h: number
  readonly flowLpm: number
  readonly precipitationSquareMmH: number
  readonly precipitationTriangularMmH: number
}

export interface RainBird5000MprLookupInput {
  readonly radiusClassFt: 25 | 30 | 35
  readonly arcDeg: 90 | 120 | 180 | 360
  readonly pressureBar: number
}

export const RAIN_BIRD_5000_MPR_DATASET: Readonly<{
  manufacturer: 'Rain Bird'
  family: '5000-MPR'
  compatibleRotorSeries: readonly ['5000', '5000+']
  source: Readonly<{
    title: string
    url: string
    productUrl: string
    testStandard: 'ASABE S398.1'
    testConditions: 'Zero wind'
    spacingBasis: Readonly<{
      square: string
      triangular: string
    }>
    precipitationMode: string
  }>
  units: Readonly<{
    pressure: 'bar'
    radius: 'm'
    flow: 'L/min'
    flowVolume: 'm3/h'
    precipitation: 'mm/h'
  }>
  nozzlePack: Readonly<{
    manufacturerModel: '5000MPRMPK'
    radiusClassesFt: readonly [25, 30, 35]
    arcPatterns: readonly [
      Readonly<{ arcDeg: 90; pattern: 'Quarter' }>,
      Readonly<{ arcDeg: 120; pattern: 'Third' }>,
      Readonly<{ arcDeg: 180; pattern: 'Half' }>,
      Readonly<{ arcDeg: 360; pattern: 'Full' }>
    ]
    florialSanityProductMapping: 'not_verified'
  }>
  pressurePointsBar: readonly [1.7, 2.4, 3.1, 3.8, 4.5]
  performancePoints: readonly RainBird5000MprPerformancePoint[]
}>

export function findRainBird5000MprPerformancePoint(
  input?: RainBird5000MprLookupInput,
): RainBird5000MprPerformancePoint | null
