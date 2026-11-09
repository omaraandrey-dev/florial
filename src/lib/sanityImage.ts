/**
 * Build responsive, format-negotiated URLs for Florial's Sanity image assets.
 * Non-Sanity and non-image URLs are returned unchanged.
 */
export function getSanityImageProps(imageUrl: string, sizes: string, preferredWidth = 640) {
  const fallback = { src: imageUrl }

  try {
    const source = new URL(imageUrl)
    if (
      source.protocol !== 'https:' ||
      source.hostname !== 'cdn.sanity.io' ||
      !/^\/images\/[^/]+\/[^/]+\//.test(source.pathname)
    ) {
      return fallback
    }

    const dimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    const sourceWidth = dimensions ? Number(dimensions[1]) : undefined
    const sourceHeight = dimensions ? Number(dimensions[2]) : undefined
    const buildUrl = (width: number) => {
      const image = new URL(source)
      image.searchParams.set('w', String(sourceWidth ? Math.min(width, sourceWidth) : width))
      image.searchParams.set('fit', 'max')
      image.searchParams.set('auto', 'format')
      image.searchParams.set('q', '75')
      return image.toString()
    }

    const candidates = [320, 480, 640, 800, 960, 1200, 1600]
      .map((width) => sourceWidth ? Math.min(width, sourceWidth) : width)
      .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
      .sort((a, b) => a - b)
    const fallbackWidth = sourceWidth ? Math.min(preferredWidth, sourceWidth) : preferredWidth

    return {
      src: buildUrl(fallbackWidth),
      srcSet: candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', '),
      sizes,
      ...(sourceWidth && sourceHeight ? { width: sourceWidth, height: sourceHeight } : {}),
    }
  } catch {
    return fallback
  }
}
