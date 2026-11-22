export const FLORIAL_IRRIGATION_STANDARD: Readonly<{
  connection: Readonly<{ description: string; nominalPressureBar: number; supplyPipeDiameterMm: number; entryCorner: string }>
  pipes: Readonly<{ mainDiameterMm: number; zoneDiameterMm: number; routingPreference: string }>
  lineCapacity: Readonly<{ sectorHeads: number; fullCircleHeads: number }>
}>
export function buildIrrigationZones(sprinklers?: ReadonlyArray<Record<string, any>>): Readonly<Record<string, any>>
export function buildPerimeterPipeNetwork(geometry: Readonly<Record<string, any>>, sprinklers?: ReadonlyArray<Record<string, any>>): Readonly<Record<string, any>>
