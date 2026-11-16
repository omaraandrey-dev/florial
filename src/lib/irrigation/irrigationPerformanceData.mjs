const SOURCE_URL = 'https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf'

const points = [
  [1.7, 0.75, 4.6, 0.12, 2.04, 12, 14],
  [1.7, 1.0, 6.1, 0.17, 2.91, 9, 11],
  [1.7, 1.5, 7.0, 0.24, 4.01, 10, 11],
  [1.7, 2.0, 8.2, 0.32, 5.30, 9, 11],
  [1.7, 3.0, 8.8, 0.49, 8.21, 13, 15],
  [1.7, 4.0, 9.4, 0.67, 11.24, 15, 17],
  [2.0, 0.75, 4.8, 0.13, 2.24, 12, 13],
  [2.0, 1.0, 6.2, 0.19, 3.14, 10, 11],
  [2.0, 1.5, 7.0, 0.26, 4.35, 11, 12],
  [2.0, 2.0, 8.2, 0.34, 5.74, 10, 12],
  [2.0, 3.0, 9.1, 0.53, 8.87, 13, 15],
  [2.0, 4.0, 9.7, 0.73, 12.17, 16, 18],
  [2.5, 0.75, 5.2, 0.16, 2.58, 12, 13],
  [2.5, 1.0, 6.4, 0.21, 3.55, 10, 12],
  [2.5, 1.5, 7.0, 0.30, 4.94, 12, 14],
  [2.5, 2.0, 8.2, 0.39, 6.51, 12, 13],
  [2.5, 3.0, 9.4, 0.60, 10.03, 13, 16],
  [2.5, 4.0, 10.1, 0.83, 13.82, 16, 19],
  [3.0, 0.75, 5.2, 0.17, 2.86, 13, 15],
  [3.0, 1.0, 6.4, 0.24, 3.93, 12, 13],
  [3.0, 1.5, 7.3, 0.33, 5.49, 12, 14],
  [3.0, 2.0, 8.2, 0.43, 7.17, 13, 15],
  [3.0, 3.0, 9.4, 0.67, 11.13, 15, 17],
  [3.0, 4.0, 10.6, 0.92, 15.32, 16, 19],
  [3.5, 0.75, 5.4, 0.19, 3.09, 13, 15],
  [3.5, 1.0, 6.6, 0.26, 4.27, 12, 14],
  [3.5, 1.5, 7.3, 0.36, 5.97, 13, 15],
  [3.5, 2.0, 8.4, 0.47, 7.79, 13, 15],
  [3.5, 3.0, 9.6, 0.71, 11.90, 15, 18],
  [3.5, 4.0, 10.7, 1.00, 16.66, 18, 20],
  [3.8, 0.75, 5.5, 0.19, 3.22, 13, 15],
  [3.8, 1.0, 6.7, 0.27, 4.47, 12, 14],
  [3.8, 1.5, 7.3, 0.37, 6.25, 14, 16],
  [3.8, 2.0, 8.5, 0.49, 8.14, 13, 15],
  [3.8, 3.0, 9.8, 0.74, 12.30, 16, 18],
  [3.8, 4.0, 10.7, 1.04, 17.41, 18, 21],
]

const performancePoints = Object.freeze(points.map(([
  pressureBar,
  nozzle,
  radiusM,
  flowM3h,
  flowLpm,
  precipitationSquareMmH,
  precipitationTriangularMmH,
]) => Object.freeze({
  pressureBar,
  nozzle,
  radiusM,
  flowM3h,
  flowLpm,
  precipitationSquareMmH,
  precipitationTriangularMmH,
})))

export const RAIN_BIRD_3500_DATASET = Object.freeze({
  manufacturer: 'Rain Bird',
  family: '3500',
  source: Object.freeze({
    title: '3500 Series Rotors — Technical Specifications',
    documentCode: 'D42378',
    copyrightYear: 2023,
    section: '3500 Series Nozzle Performance Metric',
    url: SOURCE_URL,
    testStandard: 'ASAE S398.1',
    testConditions: 'Zero wind',
    precipitationBasis: 'Half-circle operation',
    spacingBasis: Object.freeze({
      square: '50% of throw diameter',
      triangular: '50% of throw diameter',
    }),
  }),
  units: Object.freeze({
    pressure: 'bar',
    radius: 'm',
    flow: 'L/min',
    flowVolume: 'm3/h',
    precipitation: 'mm/h',
  }),
  supportedModels: Object.freeze([
    Object.freeze({
      sanityProductId: 'de179416-ef68-48c5-aa70-56a4c528885f',
      sku: 'Y34001',
      model: '3504-PC',
      sam: false,
    }),
    Object.freeze({
      sanityProductId: 'd1a1a13d-31dc-4635-a666-21283e58abbd',
      sku: 'Y34500',
      model: '3504-PC-SAM',
      sam: true,
    }),
  ]),
  nozzleTree: Object.freeze([0.75, 1.0, 1.5, 2.0, 3.0, 4.0]),
  pressurePointsBar: Object.freeze([1.7, 2.0, 2.5, 3.0, 3.5, 3.8]),
  performancePoints,
})

/**
 * Returns a manufacturer-tested operating point only when both pressure and
 * nozzle size exactly match a published table row. No interpolation,
 * extrapolation, or nearest-point substitution is performed.
 */
export function findRainBird3500PerformancePoint(pressureBar, nozzle) {
  if (!Number.isFinite(pressureBar) || !Number.isFinite(nozzle)) return null

  return performancePoints.find((point) =>
    Math.abs(point.pressureBar - pressureBar) < 1e-9 &&
    Math.abs(point.nozzle - nozzle) < 1e-9,
  ) ?? null
}
