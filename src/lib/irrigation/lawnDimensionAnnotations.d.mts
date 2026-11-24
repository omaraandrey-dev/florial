export interface LawnDimensionAnnotation {
  readonly id: string
  readonly ringId: string
  readonly lengthM: number
  readonly lineStart: Readonly<{ x: number; y: number }>
  readonly lineEnd: Readonly<{ x: number; y: number }>
  readonly labelPosition: Readonly<{ x: number; y: number }>
  readonly angleDeg: number
}
export function buildLawnDimensionAnnotations(
  boundaryVertices?: ReadonlyArray<Readonly<{ x: number; y: number }>>,
  exclusions?: ReadonlyArray<Readonly<Record<string, any>>>,
): ReadonlyArray<LawnDimensionAnnotation>
