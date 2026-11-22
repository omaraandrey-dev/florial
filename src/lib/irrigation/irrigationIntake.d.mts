export interface IrrigationIntakeInput {
  language?: 'bg' | 'ru' | 'en'
  shape?: 'rectangle' | 'l-shape'
  length?: string | number
  width?: string | number
  cutoutWidth?: string | number
  cutoutDepth?: string | number
  cutoutCorner?: string
  geometryValidation?: { valid?: boolean; status?: string; supported?: boolean; computedAreaM2?: number; computedPerimeterM?: number; normalizedGeometry?: unknown } | null
  notes?: string
}
export interface IrrigationIntakeReadiness {
  status: 'geometry_ready_for_preliminary_layout' | 'intake_incomplete'
  geometryReady: boolean
  standardWaterAssumptionsApplied: true
  hydraulicFeasibility: 'not_calculated_by_scope'
  hydraulicReady: false
  missing: ReadonlyArray<string>
}
export function evaluateIrrigationIntake(input: IrrigationIntakeInput): IrrigationIntakeReadiness
export function buildIrrigationIntakeSnapshot(input: IrrigationIntakeInput): Readonly<Record<string, any>>
