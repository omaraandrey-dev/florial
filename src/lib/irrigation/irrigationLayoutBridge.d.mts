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
  readonly overspray: 'not_evaluated'
  readonly reason?: string
  readonly shortSideM?: number
  readonly supportedNextFamilies?: ReadonlyArray<string>
  readonly engine?: Readonly<{ name: string; version: string; algorithm: string | null }>
  readonly operatingScenario?: Readonly<{
    manufacturer: string
    family: 'R-VAN'
    model: string
    pressureBar: number
    pressureBasis: string
    modelSelectionBasis: string
    sourceUrl: string
    actualNozzlePressureVerified: false
    customerSourceMeasurementsUsedAsNozzlePressure: false
  }>
  readonly geometry?: Readonly<{ shape: string | null; areaM2: number | null; shortSideM: number }>
  readonly layout?: Readonly<Record<string, any>>
  readonly warnings?: ReadonlyArray<Readonly<{ code: string; path: string }>>
}
export function buildPreliminaryLawnLayout(
  snapshot: Readonly<Record<string, any>>,
  options?: { sampleStepM?: number },
): PreliminaryLawnLayoutResult
