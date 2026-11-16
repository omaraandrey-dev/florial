/**
 * Versioned, provenance-aware intake snapshot for the Florial lawn assistant.
 *
 * This module deliberately does not perform hydraulic calculations, choose
 * sprinkler models, infer missing measurements or create catalogue proposals.
 */
export const IRRIGATION_INTAKE_SCHEMA_VERSION = 1

const isFinitePositive = (value) => Number.isFinite(value) && value > 0
const optionalPositive = (value) => value === null || value === undefined || value === '' ? null :
  (typeof value === 'number' && isFinitePositive(value) ? value : null)

export function buildIrrigationIntakeSnapshot(input) {
  const geometryValidation = input?.geometryValidation
  const geometryAccepted = Boolean(geometryValidation?.valid && geometryValidation?.status === 'accepted')
  const flowLpm = optionalPositive(input?.flowLpm)
  const pressureBar = optionalPositive(input?.pressureBar)
  const pressureType = ['static', 'dynamic', 'unknown'].includes(input?.pressureType)
    ? input.pressureType
    : 'unknown'
  const pressureMeasurementPoint = ['source', 'irrigation_point', 'unknown'].includes(input?.pressureMeasurementPoint)
    ? input.pressureMeasurementPoint
    : 'unknown'
  const flowMeasurementMethod = ['flow_meter', 'timed_volume', 'unknown'].includes(input?.flowMeasurementMethod)
    ? input.flowMeasurementMethod
    : 'unknown'

  const warnings = []
  if (!geometryAccepted) warnings.push('geometry_not_customer_confirmed_or_validated')
  if (flowLpm === null) warnings.push('flow_measurement_missing')
  if (pressureBar === null) warnings.push('pressure_measurement_missing')
  if (pressureBar !== null && pressureType !== 'dynamic') warnings.push('dynamic_pressure_not_confirmed')
  if (pressureBar !== null && pressureMeasurementPoint !== 'irrigation_point') {
    warnings.push('pressure_at_irrigation_point_not_confirmed')
  }
  if (flowLpm !== null && flowMeasurementMethod === 'unknown') warnings.push('flow_measurement_method_unknown')

  return Object.freeze({
    schemaVersion: IRRIGATION_INTAKE_SCHEMA_VERSION,
    workflowStatus: 'intake_only',
    engineeringStatus: 'not_calculated',
    geometry: Object.freeze({
      shape: input?.shape === 'l-shape' ? 'l-shape' : 'rectangle',
      lengthM: optionalPositive(input?.lengthM),
      widthM: optionalPositive(input?.widthM),
      cutoutWidthM: optionalPositive(input?.cutoutWidthM),
      cutoutDepthM: optionalPositive(input?.cutoutDepthM),
      cutoutCorner: input?.cutoutCorner ?? null,
      areaM2: geometryAccepted ? geometryValidation.computedAreaM2 : null,
      perimeterM: geometryAccepted ? geometryValidation.computedPerimeterM : null,
      customerConfirmed: geometryAccepted,
      provenance: 'customer_entered',
    }),
    water: Object.freeze({
      source: ['mains', 'well', 'tank', 'unknown'].includes(input?.waterSource) ? input.waterSource : 'unknown',
      flowLpm,
      flowMeasurementMethod,
      flowProvenance: flowLpm === null ? 'not_provided' : 'customer_reported',
      pressureBar,
      pressureType,
      pressureMeasurementPoint,
      pressureProvenance: pressureBar === null ? 'not_provided' : 'customer_reported',
      pressureConditions: typeof input?.pressureConditions === 'string'
        ? input.pressureConditions.trim().slice(0, 500)
        : '',
    }),
    notes: typeof input?.notes === 'string' ? input.notes.trim().slice(0, 2000) : '',
    warnings: Object.freeze(warnings),
    limitations: Object.freeze([
      'No hydraulic feasibility calculation has been performed.',
      'No sprinkler layout or equipment compatibility has been approved.',
      'Customer-reported measurements require verification before engineering use.',
    ]),
  })
}
