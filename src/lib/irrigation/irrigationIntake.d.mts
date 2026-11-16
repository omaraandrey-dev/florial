export type IrrigationPressureType = 'static' | 'dynamic' | 'unknown'
export type IrrigationFlowMethod = 'bucket' | 'flow_meter' | 'other_verified' | 'unknown'
export interface IrrigationIntakeInput {
  language?: 'bg' | 'ru' | 'en'
  shape?: 'rectangle' | 'l-shape'
  length?: string | number
  width?: string | number
  cutoutWidth?: string | number
  cutoutDepth?: string | number
  cutoutCorner?: string
  geometryValidation?: Record<string, any> | null
  waterSource?: 'mains' | 'well' | 'tank' | 'unknown'
  pressureType?: IrrigationPressureType
  pressureBar?: string | number
  pressureMeasuredWhileFlowing?: boolean
  pressureTestPoint?: 'source' | 'tap' | 'lawn_entry' | 'unknown'
  flowRate?: string | number
  flowMeasurementMethod?: IrrigationFlowMethod
  pipeNetworkCaptured?: boolean
  elevationProfileCaptured?: boolean
  restrictionsCaptured?: boolean
  notes?: string
}
export interface IrrigationIntakeReadiness {
  status: 'geometry_ready_for_preliminary_layout' | 'intake_incomplete'
  geometryReady: boolean
  dynamicPressureReady: boolean
  flowReady: boolean
  hydraulicFeasibility: 'not_evaluated'
  hydraulicReady: false
  missing: ReadonlyArray<string>
}
export function evaluateIrrigationIntake(input: IrrigationIntakeInput): IrrigationIntakeReadiness
export function buildIrrigationIntakeSnapshot(input: IrrigationIntakeInput): Readonly<Record<string, any>>
