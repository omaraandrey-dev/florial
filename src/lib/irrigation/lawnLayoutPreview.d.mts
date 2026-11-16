import type { IrrigationIntakeSnapshot } from './irrigationIntake.mjs'
import type { LawnSprinklerLayoutResult } from './lawnSprinklerLayout.mjs'

export type RvanAdjustableModel = 'R-VAN14' | 'R-VAN18' | 'R-VAN24'
export interface PreliminaryRvanLayoutPreviewInput {
  intakeSnapshot: IrrigationIntakeSnapshot
  model?: RvanAdjustableModel
  sampleStepM?: number
}
export interface PreliminaryRvanLayoutPreview {
  readonly schemaVersion: 1
  readonly status: 'preview_available' | 'needs_engineer_review' | 'geometry_not_confirmed' | 'model_not_supported'
  readonly model: string
  readonly designBasis?: Readonly<{
    manufacturer: string
    family: 'R-VAN'
    pressureBar: number
    pressureBasis: 'manufacturer_recommended_operating_pressure'
    sitePressureMeasurement: 'not_used'
    sourceTitle: string
    sourceDocumentCode: string
    sourceUrl: string
  }>
  readonly layout: LawnSprinklerLayoutResult | null
  readonly hydraulicFeasibility: 'not_evaluated'
  readonly precipitationUniformity?: 'not_evaluated'
  readonly bodyCompatibility?: 'not_evaluated'
  readonly overspray?: 'not_evaluated'
  readonly cartEligible: false
  readonly warnings: ReadonlyArray<string>
}
export function buildPreliminaryRvanLayoutPreview(input: PreliminaryRvanLayoutPreviewInput): PreliminaryRvanLayoutPreview
