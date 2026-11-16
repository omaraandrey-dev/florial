const SOURCE_URL = 'https://www.rainbird.com/sites/default/files/media/documents/2025-10/026549_rb_rvantechspecsheet_metric_f.pdf'

const pressures = Object.freeze([2.1, 2.4, 2.8, 3.1, 3.4, 3.8])

function arcPoints(model, arcDeg, radiusM, flowLpm, square, triangular) {
  return pressures.map((pressureBar, index) => Object.freeze({
    model,
    pattern: 'circular',
    arcDeg,
    pressureBar,
    radiusM: radiusM[index],
    flowLpm: flowLpm[index],
    precipitationSquareMmH: square[index],
    precipitationTriangularMmH: triangular[index],
  }))
}

function fullCirclePoints(model, radiusM, flowLpm, square, triangular) {
  return arcPoints(model, 360, radiusM, flowLpm, square, triangular)
}

function stripPoints(model, dimensions, flowLpm, square, triangular) {
  return pressures.map((pressureBar, index) => Object.freeze({
    model,
    pattern: 'strip',
    arcDeg: null,
    pressureBar,
    radiusM: null,
    dimensionsM: Object.freeze(dimensions[index]),
    flowLpm: flowLpm[index],
    precipitationSquareMmH: square[index],
    precipitationTriangularMmH: triangular[index],
  }))
}

const performancePoints = Object.freeze([
  ...arcPoints('R-VAN24', 270, [5.8, 6.1, 6.7, 7.0, 7.3, 7.3], [6.81, 7.38, 8.74, 9.54, 10.67, 10.90], [16, 16, 16, 16, 16, 16], [19, 18, 18, 18, 18, 19]),
  ...arcPoints('R-VAN24', 210, [5.8, 6.1, 6.7, 7.0, 7.3, 7.3], [5.30, 5.75, 6.81, 7.42, 8.29, 8.48], [16, 16, 16, 16, 16, 16], [19, 18, 18, 18, 18, 19]),
  ...arcPoints('R-VAN24', 180, [5.8, 6.1, 6.7, 7.0, 7.3, 7.3], [4.54, 4.92, 5.83, 6.36, 7.12, 7.27], [16, 16, 16, 16, 16, 16], [19, 18, 18, 18, 18, 19]),
  ...arcPoints('R-VAN24', 90, [5.8, 6.1, 6.7, 7.0, 7.3, 7.3], [2.27, 2.46, 2.91, 3.18, 3.56, 3.63], [16, 16, 16, 16, 16, 16], [19, 18, 18, 18, 18, 19]),

  ...arcPoints('R-VAN18', 270, [4.9, 4.9, 5.2, 5.2, 5.5, 5.5], [4.77, 5.11, 5.38, 5.72, 5.94, 6.13], [17, 16, 16, 16, 15, 15], [19, 19, 19, 19, 18, 18]),
  ...arcPoints('R-VAN18', 210, [4.9, 4.9, 5.2, 5.2, 5.5, 5.5], [3.71, 3.97, 4.16, 4.43, 4.62, 4.77], [16, 17, 16, 16, 16, 16], [19, 20, 19, 20, 18, 19]),
  ...arcPoints('R-VAN18', 180, [4.9, 4.9, 5.2, 5.2, 5.5, 5.5], [3.22, 3.44, 3.71, 3.82, 4.05, 4.13], [17, 16, 16, 16, 15, 15], [19, 19, 19, 19, 18, 18]),
  ...arcPoints('R-VAN18', 90, [4.9, 4.9, 5.2, 5.2, 5.5, 5.5], [1.59, 1.78, 1.89, 1.89, 2.04, 2.20], [17, 16, 16, 16, 15, 15], [19, 19, 19, 19, 18, 18]),

  ...arcPoints('R-VAN14', 270, [4.0, 4.0, 4.3, 4.3, 4.6, 4.6], [3.18, 3.29, 3.48, 3.56, 4.20, 4.43], [16, 17, 15, 16, 16, 17], [19, 19, 18, 18, 19, 20]),
  ...arcPoints('R-VAN14', 210, [4.0, 4.0, 4.3, 4.3, 4.6, 4.6], [2.46, 2.57, 2.73, 2.76, 3.26, 3.44], [16, 17, 15, 16, 16, 17], [19, 19, 18, 18, 19, 20]),
  ...arcPoints('R-VAN14', 180, [4.0, 4.0, 4.3, 4.3, 4.6, 4.6], [2.12, 2.20, 2.31, 2.38, 2.80, 2.95], [16, 17, 15, 16, 16, 17], [19, 19, 18, 18, 19, 20]),
  ...arcPoints('R-VAN14', 90, [4.0, 4.0, 4.3, 4.3, 4.6, 4.6], [1.06, 1.10, 1.17, 1.21, 1.40, 1.48], [16, 17, 16, 15, 16, 17], [19, 19, 18, 18, 19, 20]),

  ...fullCirclePoints('R-VAN14-360', [4.0, 4.0, 4.3, 4.3, 4.6, 4.6], [4.16, 4.24, 4.62, 4.81, 5.34, 5.49], [16, 16, 15, 16, 15, 16], [18, 19, 18, 18, 18, 18]),
  ...fullCirclePoints('R-VAN18-360', [4.9, 4.9, 5.2, 5.2, 5.5, 5.5], [6.25, 6.32, 6.81, 7.00, 7.76, 7.99], [16, 16, 15, 16, 15, 16], [18, 19, 18, 18, 18, 18]),
  ...fullCirclePoints('R-VAN24-360', [5.8, 6.1, 6.7, 7.0, 7.3, 7.3], [8.90, 9.54, 11.85, 13.17, 13.67, 14.16], [16, 15, 16, 16, 15, 16], [18, 18, 18, 19, 18, 18]),

  ...stripPoints('R-VAN-LCS', [[1.2, 4.3], [1.5, 4.6], [1.5, 4.6], [1.5, 4.6], [1.5, 4.6], [1.8, 4.9]], [0.68, 0.83, 0.87, 0.91, 0.95, 1.06], [16, 14, 15, 16, 16, 14], [16, 14, 15, 16, 16, 14]),
  ...stripPoints('R-VAN-RCS', [[1.2, 4.3], [1.5, 4.6], [1.5, 4.6], [1.5, 4.6], [1.5, 4.6], [1.8, 4.9]], [0.68, 0.83, 0.87, 0.91, 0.95, 1.06], [16, 14, 15, 16, 16, 14], [16, 14, 15, 16, 16, 14]),
  ...stripPoints('R-VAN-SST', [[1.2, 8.5], [1.5, 9.1], [1.5, 9.1], [1.5, 9.1], [1.5, 9.1], [1.8, 9.8]], [1.36, 1.67, 1.74, 1.82, 1.89, 2.12], [16, 14, 15, 16, 16, 14], [16, 14, 15, 16, 16, 14]),
])

const modelBindings = Object.freeze([
  { model: 'R-VAN14', sku: 'A84659', sanityProductId: '3e435ac6-f184-4637-bf06-c34822cc93dc' },
  { model: 'R-VAN14-360', sku: 'A84664', sanityProductId: '96daa552-e9b6-4d1f-b858-c8bb24dc1cc2' },
  { model: 'R-VAN18', sku: 'A84660', sanityProductId: '678c8039-dda2-4873-a7cb-98083c4ef971' },
  { model: 'R-VAN18-360', sku: 'A84665', sanityProductId: '816a0665-1e3e-484c-b08f-fdcf8a68e9d2' },
  { model: 'R-VAN24', sku: 'A84661', sanityProductId: '20fce09d-ffd6-49f5-b5ca-f4945136014a' },
  { model: 'R-VAN24-360', sku: 'A84666', sanityProductId: '6eac9b54-c3e7-41b1-aa6c-560e64012ef4' },
  { model: 'R-VAN-LCS', sku: 'A84667', sanityProductId: 'fce79548-830a-4bcd-9ff5-8e9a85f39ab5' },
  { model: 'R-VAN-RCS', sku: 'A84668', sanityProductId: '42f54182-8fc4-41ee-9b8c-2c50b504907d' },
  { model: 'R-VAN-SST', sku: 'A84669', sanityProductId: '4f4a7e6b-7df5-4ee4-94f1-346b68fc75a9' },
].map((entry) => Object.freeze(entry)))

export const RAIN_BIRD_RVAN_DATASET = Object.freeze({
  manufacturer: 'Rain Bird',
  family: 'R-VAN',
  source: Object.freeze({
    title: 'R-VAN Rotary Nozzles Technical Specifications',
    documentCode: 'D41159B',
    copyrightYear: 2024,
    revision: 'D41159B',
    url: SOURCE_URL,
    testStandard: 'ASAE S398.1; ASABE/ICC 802-2014',
    testConditions: 'Zero wind',
    testedBodyPopUpCm: 10.2,
    recommendedOperatingPressureBar: 3.1,
    pressureRangeBar: Object.freeze([2.1, 3.8]),
    spacingBasis: '50% of throw diameter',
    notes: Object.freeze([
      'Manufacturer radius refers to recommended head-to-head spacing for optimal precipitation and distribution uniformity.',
      'Do not reduce R-VAN14 radius below 2.4m, R-VAN18 below 4.0m, or R-VAN24 below 5.2m.',
      'Single-row applications are not recommended.',
      'Performance data was tested on 10.2cm pop-up bodies in zero wind.',
      'Manufacturer recommends 1800 or RD1800 spray bodies with 3.1bar pressure regulation for optimum performance.',
    ]),
  }),
  units: Object.freeze({
    pressure: 'bar',
    radius: 'm',
    flow: 'L/min',
    precipitation: 'mm/h',
    dimensions: 'm',
  }),
  models: modelBindings,
  pressurePointsBar: pressures,
  performancePoints,
})

/**
 * Exact lookup only. The model, pressure and arc must match a published row.
 * Strip nozzles have no circular arc and are queried with arcDeg=null.
 */
export function findRainBirdRvanPerformancePoint(model, pressureBar, arcDeg = null) {
  if (typeof model !== 'string' || !Number.isFinite(pressureBar)) return null
  if (arcDeg !== null && !Number.isFinite(arcDeg)) return null
  return performancePoints.find((point) =>
    point.model === model &&
    Math.abs(point.pressureBar - pressureBar) < 1e-9 &&
    point.arcDeg === arcDeg,
  ) ?? null
}
