export type IrrigationPressureType = 'static' | 'dynamic' | 'unknown'
export type IrrigationPressureMeasurementPoint = 'source' | 'irrigation_point' | 'unknown'
export type IrrigationFlowMeasurementMethod = 'flow_meter' | 'timed_volume' | 'unknown'

export interface IrrigationIntakeSnapshotInput {
  geometryValidation?: {
    valid?: boolean
    status?: string
    computedAreaM2?: number
    computedPerimeterM?: number
  } | null
  shape?: 'rectangle' | 'l-shape'
  lengthM?: number
  widthM?: number
  cutoutWidthM?: number
  cutoutDepthM?: number
  cutoutCorner?: string
  waterSource?: 'mains' | 'well' | 'tank' | 'unknown'
  flowLpm?: number | null
  flowMeasurementMethod?: IrrigationFlowMeasurementMethod
  pressureBar?: number | null
  pressureType?: IrrigationPressureType
  pressureMeasurementPoint?: IrrigationPressureMeasurementPoint
  pressureConditions?: string
  notes?: string
}

export interface IrrigationIntakeSnapshot {
  readonly schemaVersion: number
  readonly workflowStatus: 'intake_only'
  readonly engineeringStatus: 'not_calculated'
  readonly geometry: Readonly<Record<string, unknown>>
  readonly water: Readonly<Record<string, unknown>>
  readonly notes: string
  readonly warnings: readonly string[]
  readonly limitations: readonly string[]
}

export const IRRIGATION_INTAKE_SCHEMA_VERSION: number
export function buildIrrigationIntakeSnapshot(input: IrrigationIntakeSnapshotInput): IrrigationIntakeSnapshot
