import { generateRainBird3500RotorLayout } from '../../src/lib/irrigation/rainBird3500LayoutGenerator.mjs'

const operatingPoint = Object.freeze({
  nozzlePressureBar: 2.5,
  nozzle: 4,
})

const geometries = Object.freeze([
  Object.freeze({
    id: 'synthetic-rectangle-12x8',
    geometry: Object.freeze({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: 'confirmed',
      regions: Object.freeze([Object.freeze({
        id: 'rectangle-12x8',
        boundary: Object.freeze({ vertices: Object.freeze([
          { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 },
        ]) }),
      })]),
    }),
  }),
  Object.freeze({
    id: 'synthetic-l-shape-8x7',
    geometry: Object.freeze({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: 'confirmed',
      regions: Object.freeze([Object.freeze({
        id: 'l-shape-8x7',
        boundary: Object.freeze({ vertices: Object.freeze([
          { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 3 },
          { x: 4, y: 3 }, { x: 4, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 },
        ]) }),
      })]),
    }),
  }),
])

const searchPresets = Object.freeze([
  ...[0.25, 0.5, 1].flatMap((candidatePositionStepFactor) =>
    [15, 30, 45].map((candidateDirectionStepDeg) => ({
      sampleStepM: 0.5,
      candidatePositionStepFactor,
      candidateDirectionStepDeg,
    }))),
  { sampleStepM: 0.25, candidatePositionStepFactor: 0.5, candidateDirectionStepDeg: 45 },
  { sampleStepM: 0.125, candidatePositionStepFactor: 0.5, candidateDirectionStepDeg: 45 },
])

function summarize(shapeId, preset, result) {
  return Object.freeze({
    shapeId,
    operatingPoint,
    search: preset,
    status: result.status,
    candidateStrategy: result.candidateStrategy,
    candidateStats: result.candidateStats ?? null,
    searchCoverage: result.searchCoverage ?? null,
    selectedRotors: result.sprinklers.map((rotor) => ({
      id: rotor.id,
      x: rotor.position.x,
      y: rotor.position.y,
      directionDeg: rotor.directionDeg,
      arcDeg: rotor.arcDeg,
    })),
    headToHead: result.headToHead ?? null,
    overspray: result.overspray ?? null,
    totalFlowLpm: result.totalFlowLpm ?? null,
    hydraulicFeasibility: result.hydraulicFeasibility ?? 'not_evaluated',
    precipitationUniformity: result.precipitationUniformity ?? 'not_evaluated',
    warningCodes: result.warnings.map((warning) => warning.code),
    errorCodes: result.errors.map((error) => error.code),
  })
}

const results = []
for (const entry of geometries) {
  for (const preset of searchPresets) {
    const result = generateRainBird3500RotorLayout({
      geometry: entry.geometry,
      ...operatingPoint,
      ...preset,
    })
    results.push(summarize(entry.id, preset, result))
  }
}

process.stdout.write(JSON.stringify({
  benchmarkVersion: 'rain-bird-3500-search-sensitivity-0.1.0',
  evidence: {
    source: 'Rain Bird D42378',
    operatingPointBasis: 'exact published nozzle pressure and nozzle row',
    arcDeg: 180,
    geometryStatus: 'synthetic regression geometry, not a field survey',
  },
  interpretation: 'Numerical sensitivity report only; not a design approval, hydraulic calculation, DU/SC proof or field validation.',
  scenarioCount: results.length,
  results,
}, null, 2) + '\n')
