const SOURCE_URL = 'https://www.rainbird.com/sites/default/files/media/documents/2020-09/5000-series-mpr-nozzle-performance-chart.pdf'
const PRODUCT_URL = 'https://www.rainbird.com/products/5000-series-mpr-nozzles'

const rows = [
  [25, 90, 1.7, 7, 0.17, 3, 13.7, 15.8],
  [25, 90, 2.4, 7.3, 0.2, 3.6, 14.9, 17.3],
  [25, 90, 3.1, 7.6, 0.23, 3.6, 15.6, 18.1],
  [25, 90, 3.8, 7.6, 0.25, 4.2, 17.4, 20.1],
  [25, 90, 4.5, 7.6, 0.27, 4.8, 18.9, 21.9],
  [25, 120, 1.7, 7, 0.23, 3.6, 13.9, 16],
  [25, 120, 2.4, 7.3, 0.27, 4.8, 15.4, 17.8],
  [25, 120, 3.1, 7.6, 0.31, 5.4, 16.2, 18.7],
  [25, 120, 3.8, 7.6, 0.35, 6, 18, 20.7],
  [25, 120, 4.5, 7.6, 0.38, 6.6, 19.6, 22.6],
  [25, 180, 1.7, 7, 0.33, 5.4, 13.3, 15.4],
  [25, 180, 2.4, 7.3, 0.39, 6.6, 14.7, 17],
  [25, 180, 3.1, 7.6, 0.45, 7.2, 15.5, 17.9],
  [25, 180, 3.8, 7.6, 0.5, 8.4, 17.3, 20],
  [25, 180, 4.5, 7.6, 0.55, 9, 18.9, 21.8],
  [25, 360, 1.7, 7, 0.63, 10.8, 12.8, 14.8],
  [25, 360, 2.4, 7.3, 0.76, 12.6, 14.2, 16.4],
  [25, 360, 3.1, 7.6, 0.87, 14.4, 14.9, 17.3],
  [25, 360, 3.8, 7.6, 0.97, 16.2, 16.6, 19.2],
  [25, 360, 4.5, 7.6, 1.05, 17.4, 18.1, 20.9],
  [30, 90, 1.7, 8.8, 0.23, 3.6, 12, 13.8],
  [30, 90, 2.4, 9.1, 0.28, 4.8, 13.4, 15.4],
  [30, 90, 3.1, 9.1, 0.32, 5.4, 15.2, 17.6],
  [30, 90, 3.8, 9.1, 0.35, 6, 17, 19.6],
  [30, 90, 4.5, 9.1, 0.38, 6.6, 18.4, 21.2],
  [30, 120, 1.7, 8.8, 0.3, 4.8, 11.7, 13.5],
  [30, 120, 2.4, 9.1, 0.37, 6, 13.2, 15.2],
  [30, 120, 3.1, 9.1, 0.42, 7.2, 15.1, 17.4],
  [30, 120, 3.8, 9.1, 0.47, 7.8, 16.8, 19.4],
  [30, 120, 4.5, 9.1, 0.51, 8.4, 18.3, 21.1],
  [30, 180, 1.7, 8.8, 0.49, 8.4, 12.5, 14.4],
  [30, 180, 2.4, 9.1, 0.59, 9.6, 14.1, 16.2],
  [30, 180, 3.1, 9.1, 0.67, 11.4, 16.1, 18.6],
  [30, 180, 3.8, 9.1, 0.75, 12.6, 17.9, 20.7],
  [30, 180, 4.5, 9.1, 0.82, 13.8, 19.6, 22.6],
  [30, 360, 1.7, 8.8, 0.96, 16.2, 12.3, 14.2],
  [30, 360, 2.4, 9.1, 1.15, 19.2, 13.8, 15.9],
  [30, 360, 3.1, 9.1, 1.31, 21.6, 15.7, 18.1],
  [30, 360, 3.8, 9.1, 1.45, 24, 17.4, 20],
  [30, 360, 4.5, 9.1, 1.57, 26.4, 18.8, 21.7],
  [35, 90, 1.7, 9.8, 0.32, 5.4, 13.4, 15.4],
  [35, 90, 2.4, 10.4, 0.38, 6.6, 14.1, 16.3],
  [35, 90, 3.1, 10.7, 0.44, 7.2, 15.3, 17.7],
  [35, 90, 3.8, 10.7, 0.48, 7.8, 17, 19.6],
  [35, 90, 4.5, 10.7, 0.52, 9, 18.4, 21.3],
  [35, 120, 1.7, 9.8, 0.4, 6.6, 12.7, 14.6],
  [35, 120, 2.4, 10.4, 0.49, 8.4, 13.6, 15.8],
  [35, 120, 3.1, 10.7, 0.56, 9.6, 14.7, 17],
  [35, 120, 3.8, 10.7, 0.62, 10.2, 16.4, 18.9],
  [35, 120, 4.5, 10.7, 0.68, 11.4, 17.9, 20.7],
  [35, 180, 1.7, 9.8, 0.62, 10.2, 13.1, 15.2],
  [35, 180, 2.4, 10.4, 0.76, 12.6, 14.1, 16.3],
  [35, 180, 3.1, 10.7, 0.87, 14.4, 15.2, 17.6],
  [35, 180, 3.8, 10.7, 0.96, 16.2, 16.9, 19.5],
  [35, 180, 4.5, 10.7, 1.05, 17.4, 18.4, 21.3],
  [35, 360, 1.7, 9.8, 1.22, 20.4, 12.8, 14.8],
  [35, 360, 2.4, 10.4, 1.5, 25.2, 14, 16.2],
  [35, 360, 3.1, 10.7, 1.72, 28.8, 15.1, 17.5],
  [35, 360, 3.8, 10.7, 1.91, 31.8, 16.8, 19.4],
  [35, 360, 4.5, 10.7, 2.09, 34.8, 18.3, 21.2],
]

const performancePoints = Object.freeze(rows.map(([
  radiusClassFt,
  arcDeg,
  pressureBar,
  radiusM,
  flowM3h,
  flowLpm,
  precipitationSquareMmH,
  precipitationTriangularMmH,
]) => Object.freeze({
  radiusClassFt,
  arcDeg,
  pressureBar,
  radiusM,
  flowM3h,
  flowLpm,
  precipitationSquareMmH,
  precipitationTriangularMmH,
})))

export const RAIN_BIRD_5000_MPR_DATASET = Object.freeze({
  manufacturer: 'Rain Bird',
  family: '5000-MPR',
  compatibleRotorSeries: Object.freeze(['5000', '5000+']),
  source: Object.freeze({
    title: '5000 Series MPR Nozzle Performance Charts',
    url: SOURCE_URL,
    productUrl: PRODUCT_URL,
    testStandard: 'ASABE S398.1',
    testConditions: 'Zero wind',
    spacingBasis: Object.freeze({
      square: '50% of throw diameter',
      triangular: '50% of throw diameter',
    }),
    precipitationMode: 'manufacturer matched-precipitation nozzle families; exact arc-specific rows',
  }),
  units: Object.freeze({
    pressure: 'bar',
    radius: 'm',
    flow: 'L/min',
    flowVolume: 'm3/h',
    precipitation: 'mm/h',
  }),
  nozzlePack: Object.freeze({
    manufacturerModel: '5000MPRMPK',
    radiusClassesFt: Object.freeze([25, 30, 35]),
    arcPatterns: Object.freeze([
      Object.freeze({ arcDeg: 90, pattern: 'Quarter' }),
      Object.freeze({ arcDeg: 120, pattern: 'Third' }),
      Object.freeze({ arcDeg: 180, pattern: 'Half' }),
      Object.freeze({ arcDeg: 360, pattern: 'Full' }),
    ]),
    florialSanityProductMapping: 'not_verified',
  }),
  pressurePointsBar: Object.freeze([1.7, 2.4, 3.1, 3.8, 4.5]),
  performancePoints,
})

/**
 * Returns an exact manufacturer-published MPR operating point.
 * Radius class, arc and pressure must all match a published row. No
 * interpolation, extrapolation, nearest-point fallback or inferred 270° row.
 */
export function findRainBird5000MprPerformancePoint({ radiusClassFt, arcDeg, pressureBar } = {}) {
  if (!Number.isFinite(radiusClassFt) || !Number.isFinite(arcDeg) || !Number.isFinite(pressureBar)) {
    return null
  }

  return performancePoints.find((point) =>
    point.radiusClassFt === radiusClassFt &&
    point.arcDeg === arcDeg &&
    Math.abs(point.pressureBar - pressureBar) < 1e-9,
  ) ?? null
}
