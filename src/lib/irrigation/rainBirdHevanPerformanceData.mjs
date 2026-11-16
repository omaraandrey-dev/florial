const SOURCE_URL = 'https://www.rainbird.com/media/4172'
const pressures = Object.freeze([1.03, 1.38, 1.72, 2.07])

function pointsFor(model, arcDeg, radiusM, flowM3h, flowLpm, square, triangular) {
  return pressures.map((pressureBar, index) => Object.freeze({
    model,
    pattern: 'circular',
    arcDeg,
    pressureBar,
    radiusM: radiusM[index],
    flowM3h: flowM3h[index],
    flowLpm: flowLpm[index],
    precipitationSquareMmH: square[index],
    precipitationTriangularMmH: triangular[index],
  }))
}

function familyPoints(model, radiusM, flowM3h, flowLpm, square, triangular) {
  return [
    ...pointsFor(model, 360, radiusM, flowM3h, flowLpm, square, triangular),
    ...pointsFor(model, 270, radiusM, flowM3h.map((v) => v * 0.75), flowLpm.map((v) => v * 0.75), square, triangular),
    ...pointsFor(model, 180, radiusM, flowM3h.map((v) => v * 0.5), flowLpm.map((v) => v * 0.5), square, triangular),
    ...pointsFor(model, 90, radiusM, flowM3h.map((v) => v * 0.25), flowLpm.map((v) => v * 0.25), square, triangular),
  ]
}

/*
 * Arc flow values below are transcribed from the manufacturer tables, not
 * calculated from the full-circle flow. The explicit arrays avoid derived
 * operating values even where the table values appear proportional.
 */
const performancePoints = Object.freeze([
  ...pointsFor('HE-VAN-8', 360, [1.52, 1.83, 2.13, 2.44], [0.19, 0.22, 0.25, 0.27], [3.14, 3.62, 4.05, 4.43], [82, 66, 54, 45], [95, 76, 62, 52]),
  ...pointsFor('HE-VAN-8', 270, [1.52, 1.83, 2.13, 2.44], [0.14, 0.16, 0.18, 0.20], [2.35, 2.72, 3.04, 3.33], [82, 66, 54, 45], [95, 76, 62, 52]),
  ...pointsFor('HE-VAN-8', 180, [1.52, 1.83, 2.13, 2.44], [0.10, 0.11, 0.12, 0.13], [1.57, 1.81, 2.02, 2.22], [82, 66, 54, 45], [95, 76, 62, 52]),
  ...pointsFor('HE-VAN-8', 90, [1.52, 1.83, 2.13, 2.44], [0.05, 0.05, 0.06, 0.07], [0.78, 0.91, 1.01, 1.11], [82, 66, 54, 45], [95, 76, 62, 52]),

  ...pointsFor('HE-VAN-10', 360, [2.13, 2.44, 2.74, 3.05], [0.29, 0.34, 0.37, 0.41], [4.78, 5.52, 6.17, 6.76], [64, 56, 50, 44], [74, 65, 57, 51]),
  ...pointsFor('HE-VAN-10', 270, [2.13, 2.44, 2.74, 3.05], [0.22, 0.25, 0.28, 0.31], [3.59, 4.14, 4.63, 5.07], [64, 56, 50, 44], [74, 65, 57, 51]),
  ...pointsFor('HE-VAN-10', 180, [2.13, 2.44, 2.74, 3.05], [0.15, 0.17, 0.19, 0.21], [2.39, 2.76, 3.09, 3.38], [64, 56, 50, 44], [74, 65, 57, 51]),
  ...pointsFor('HE-VAN-10', 90, [2.13, 2.44, 2.74, 3.05], [0.07, 0.08, 0.09, 0.10], [1.20, 1.38, 1.54, 1.69], [64, 56, 50, 44], [74, 65, 57, 51]),

  ...pointsFor('HE-VAN-12', 360, [2.7, 3.0, 3.4, 3.7], [0.38, 0.44, 0.49, 0.54], [6.33, 7.31, 8.18, 8.96], [50.5, 47.3, 43.7, 40.2], [58.3, 54.6, 50.4, 46.4]),
  ...pointsFor('HE-VAN-12', 270, [2.7, 3.0, 3.4, 3.7], [0.28, 0.33, 0.37, 0.40], [4.75, 5.48, 6.16, 6.72], [50.5, 47.3, 43.7, 40.2], [58.3, 54.6, 50.4, 46.4]),
  ...pointsFor('HE-VAN-12', 180, [2.7, 3.0, 3.4, 3.7], [0.19, 0.22, 0.25, 0.27], [3.17, 3.66, 4.09, 4.48], [50.5, 47.3, 43.7, 40.2], [58.3, 54.6, 50.4, 46.4]),
  ...pointsFor('HE-VAN-12', 90, [2.7, 3.0, 3.4, 3.7], [0.09, 0.11, 0.12, 0.13], [1.58, 1.83, 2.04, 2.24], [50.5, 47.3, 43.7, 40.2], [58.3, 54.6, 50.4, 46.4]),

  ...pointsFor('HE-VAN-15', 360, [3.4, 3.7, 4.3, 4.6], [0.59, 0.69, 0.77, 0.84], [9.91, 11.44, 12.79, 14.01], [52.9, 51.3, 42.2, 40.2], [61.1, 59.3, 48.7, 46.5]),
  ...pointsFor('HE-VAN-15', 270, [3.4, 3.7, 4.3, 4.6], [0.45, 0.51, 0.58, 0.63], [7.43, 8.58, 9.59, 10.51], [52.9, 51.3, 42.2, 40.2], [61.1, 59.3, 48.7, 46.5]),
  ...pointsFor('HE-VAN-15', 180, [3.4, 3.7, 4.3, 4.6], [0.30, 0.34, 0.38, 0.42], [4.95, 5.72, 6.39, 7.00], [52.9, 51.3, 42.2, 40.2], [61.1, 59.3, 48.7, 46.5]),
  ...pointsFor('HE-VAN-15', 90, [3.4, 3.7, 4.3, 4.6], [0.15, 0.17, 0.19, 0.21], [2.48, 2.86, 3.20, 3.50], [52.9, 51.3, 42.2, 40.2], [61.1, 59.3, 48.7, 46.5]),
])

const models = Object.freeze([
  { model: 'HE-VAN-8', sku: 'HE0801', sanityProductId: '21e4bb32-7fd8-4b8d-b761-1d86569a12ae', trajectoryDeg: 24 },
  { model: 'HE-VAN-10', sku: 'HE1001', sanityProductId: 'e25925d0-b54f-45fa-844e-ad4fde8e6440', trajectoryDeg: 27 },
  { model: 'HE-VAN-12', sku: 'HE1201', sanityProductId: 'de88e310-c33d-4111-9ad6-c638b49a2ed8', trajectoryDeg: 23 },
  { model: 'HE-VAN-15', sku: 'HE1501', sanityProductId: '63289ec9-c0dd-4f13-ae4d-1f7f00a442c6', trajectoryDeg: 25 },
].map((entry) => Object.freeze(entry)))

export const RAIN_BIRD_HEVAN_DATASET = Object.freeze({
  manufacturer: 'Rain Bird',
  family: 'HE-VAN',
  source: Object.freeze({
    title: 'Rain Bird HE-VAN Series Nozzles Performance Charts',
    documentCode: '2023 International Turf Catalog, pages 39–41',
    url: SOURCE_URL,
    testConditions: 'Zero wind',
    spacingBasis: '50% of throw diameter',
    note: 'For arcs below maximum, the radius reduction screw may need adjustment to achieve the tabulated radius and flow.',
  }),
  units: Object.freeze({
    pressure: 'bar',
    radius: 'm',
    flow: 'L/min',
    flowVolume: 'm3/h',
    precipitation: 'mm/h',
  }),
  models,
  pressurePointsBar: pressures,
  performancePoints,
})

export function findRainBirdHevanPerformancePoint(model, pressureBar, arcDeg) {
  if (typeof model !== 'string' || !Number.isFinite(pressureBar) || !Number.isFinite(arcDeg)) return null
  return performancePoints.find((point) =>
    point.model === model &&
    Math.abs(point.pressureBar - pressureBar) < 1e-9 &&
    point.arcDeg === arcDeg,
  ) ?? null
}
