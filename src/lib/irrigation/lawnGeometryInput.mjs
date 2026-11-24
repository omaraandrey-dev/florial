const CORNERS = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right'])

function positiveFinite(value) {
  return Number.isFinite(value) && value > 0
}

/**
 * Build a metric polygon from customer-entered dimensions.
 * The L-shaped outline is a rectangle with one rectangular corner cut-out.
 */
export function buildLawnBoundary({
  shape,
  length,
  width,
  cutoutWidth,
  cutoutDepth,
  cutoutCorner = 'top-right',
}) {
  if (!positiveFinite(length) || !positiveFinite(width)) return null

  if (shape === 'rectangle') {
    return [
      { x: 0, y: 0 },
      { x: length, y: 0 },
      { x: length, y: width },
      { x: 0, y: width },
    ]
  }

  if (shape !== 'l-shape' ||
      !positiveFinite(cutoutWidth) ||
      !positiveFinite(cutoutDepth) ||
      cutoutWidth >= length ||
      cutoutDepth >= width ||
      !CORNERS.has(cutoutCorner)) {
    return null
  }

  const vertices = [
    { x: 0, y: 0 },
    { x: length - cutoutWidth, y: 0 },
    { x: length - cutoutWidth, y: cutoutDepth },
    { x: length, y: cutoutDepth },
    { x: length, y: width },
    { x: 0, y: width },
  ]

  // Geometry uses a Cartesian Y-up axis: y=0 is the bottom edge and
  // y=width is the top edge. This matches the solver's top-right connection
  // convention at (maxX, maxY); SVG rendering applies the same Y reflection
  // in both the preview and calculated diagram.
  return vertices.map(({ x, y }) => ({
    x: cutoutCorner.endsWith('left') ? length - x : x,
    y: width - (cutoutCorner.startsWith('bottom') ? width - y : y),
  }))
}
