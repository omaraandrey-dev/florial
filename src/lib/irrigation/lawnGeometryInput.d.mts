export type LawnInputShape = 'rectangle' | 'l-shape'
export type LawnCutoutCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface BuildLawnBoundaryInput {
  readonly shape: LawnInputShape
  readonly length: number
  readonly width: number
  readonly cutoutWidth?: number
  readonly cutoutDepth?: number
  readonly cutoutCorner?: LawnCutoutCorner
}

/** Returns metric polygon vertices, or null when dimensions are incomplete or invalid. */
export function buildLawnBoundary(
  input: BuildLawnBoundaryInput,
): ReadonlyArray<{ readonly x: number; readonly y: number }> | null
