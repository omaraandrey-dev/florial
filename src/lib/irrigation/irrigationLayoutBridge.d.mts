export interface IrrigationLayoutBridgeSnapshot {
  readonly schemaVersion: number
  readonly projectType: string
  readonly geometry?: {
    readonly status?: string
    readonly normalized?: {
      readonly status?: string
      readonly regions?: ReadonlyArray<{
        readonly boundary?: { readonly vertices?: ReadonlyArray<Readonly<{ x: number; y: number }>> }
        readonly exclusions?: ReadonlyArray<unknown>
      }>
    }
    readonly areaM2?: number | null
  }
}
export interface PreliminaryLawnLayoutResult {
  readonly status: string
  readonly hydraulicFeasibility: 'not_evaluated'
  readonly precipitationUniformity: 'not_evaluated'
  readonly bodyCompatibility: 'not_evaluated'
  readonly overspray: 'not_evaluated' | 'sampled_inside_boundary' | 'sampled_outside_boundary'
  readonly reason?: string
  readonly shortSideM?: number
  readonly plannedNextFamily?: 'Rain Bird 3500'
  readonly engine?: Readonly<{ name: string; version: string; algorithm: string | null }>
  readonly operatingScenario?: Readonly<{
    manufacturer: string
    family: 'R-VAN' | 'HE-VAN'
    model: string
    pressureBar: number
    pressureBasis: string
    modelSelectionBasis: string
    layoutRadiusM?: number | null
    sourceUrl: string
    actualNozzlePressureVerified: false
    customerSourceMeasurementsUsedAsNozzlePressure: false
  }>
  readonly geometry?: Readonly<{ shape: string | null; areaM2: number | null; shortSideM: number; dimensionsAreApproximate: true }>
  readonly projectStandard?: Readonly<Record<string, any>>
  readonly zones?: ReadonlyArray<Readonly<{
    id: string
    zoneNumber: number
    zoneType: 'perimeter' | 'interior' | 'mixed'
    branchDirection: 'forward' | 'reverse' | 'mixed'
    branchDirections: ReadonlyArray<'forward' | 'reverse'>
    sprinklerIds: ReadonlyArray<string>
    sprinklerCount: number
  }>>
  readonly pipeNetwork?: Readonly<{
    connectionPoint: Readonly<{ x: number; y: number }>
    mainRoute: ReadonlyArray<Readonly<{ x: number; y: number }>>
    mainDiameterMm: 25
    zoneDiameterMm: 25
    branches: ReadonlyArray<Readonly<{
      id: string
      zoneId: string
      zoneNumber: number
      branchDirection: 'forward' | 'reverse'
      sprinklerIds: ReadonlyArray<string>
      points: ReadonlyArray<Readonly<{ x: number; y: number }>>
      lateralConnections: ReadonlyArray<Readonly<{
        sprinklerId: string
        points: ReadonlyArray<Readonly<{ x: number; y: number }>>
      }>>
      diameterMm: 25
    }>>
  }>
  readonly stripNozzleOptions?: ReadonlyArray<Readonly<{ model: string; dimensionsM: ReadonlyArray<number>; pressureBar: number }>>
  readonly layout?: Readonly<Record<string, any>>
  readonly warnings?: ReadonlyArray<Readonly<{ code: string; path: string }>>
}
export function buildPreliminaryLawnLayout(
  snapshot: Readonly<Record<string, any>>,
  options?: { sampleStepM?: number },
): PreliminaryLawnLayoutResult
