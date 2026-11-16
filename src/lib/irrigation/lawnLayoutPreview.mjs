import { generateLawnSprinklerLayout } from './lawnSprinklerLayout.mjs'
import { RAIN_BIRD_RVAN_DATASET } from './rainBirdRvanPerformanceData.mjs'

const SUPPORTED_MODELS = new Set(['R-VAN14', 'R-VAN18', 'R-VAN24'])
const TARGET_PRESSURE_BAR = RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar

/**
 * Produce a sampled geometric preview from a customer-confirmed lawn outline.
 *
 * The nozzle pressure is a manufacturer-recommended design target, not a
 * measured site pressure. This preview never evaluates hydraulics, pipe loss,
 * zones, precipitation uniformity, overspray or body/nozzle compatibility.
 */
export function buildPreliminaryRvanLayoutPreview({
  intakeSnapshot,
  model = 'R-VAN18',
  sampleStepM = 0.25,
}) {
  if (intakeSnapshot?.geometry?.status !== 'customer_confirmed' ||
      !intakeSnapshot.geometry.normalized) {
    return Object.freeze({
      schemaVersion: 1,
      status: 'geometry_not_confirmed',
      model,
      layout: null,
      hydraulicFeasibility: 'not_evaluated',
      cartEligible: false,
      warnings: Object.freeze(['customer_confirmed_supported_geometry_required']),
    })
  }

  if (!SUPPORTED_MODELS.has(model)) {
    return Object.freeze({
      schemaVersion: 1,
      status: 'model_not_supported',
      model,
      layout: null,
      hydraulicFeasibility: 'not_evaluated',
      cartEligible: false,
      warnings: Object.freeze(['rvan_adjustable_models_only_in_this_preview']),
    })
  }

  const layout = generateLawnSprinklerLayout({
    geometry: intakeSnapshot.geometry.normalized,
    family: 'R-VAN',
    model,
    pressureBar: TARGET_PRESSURE_BAR,
    sampleStepM,
  })

  const previewAvailable = layout.status === 'coverage_complete_sampled'
  return Object.freeze({
    schemaVersion: 1,
    status: previewAvailable ? 'preview_available' : 'needs_engineer_review',
    model,
    designBasis: Object.freeze({
      manufacturer: RAIN_BIRD_RVAN_DATASET.manufacturer,
      family: RAIN_BIRD_RVAN_DATASET.family,
      pressureBar: TARGET_PRESSURE_BAR,
      pressureBasis: 'manufacturer_recommended_operating_pressure',
      sitePressureMeasurement: 'not_used',
      sourceTitle: RAIN_BIRD_RVAN_DATASET.source.title,
      sourceDocumentCode: RAIN_BIRD_RVAN_DATASET.source.documentCode,
      sourceUrl: RAIN_BIRD_RVAN_DATASET.source.url,
    }),
    layout,
    hydraulicFeasibility: 'not_evaluated',
    precipitationUniformity: 'not_evaluated',
    bodyCompatibility: 'not_evaluated',
    overspray: 'not_evaluated',
    cartEligible: false,
    warnings: Object.freeze([
      'target_pressure_is_manufacturer_recommended_not_measured_at_site',
      'sampled_geometry_is_not_a_continuous_coverage_proof',
      'hydraulic_feasibility_not_evaluated',
      'precipitation_uniformity_not_evaluated',
      'body_nozzle_compatibility_not_evaluated',
      'overspray_not_evaluated',
      ...layout.warnings.map((warning) => warning.code),
    ]),
  })
}
