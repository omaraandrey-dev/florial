/**
 * Read the original asset dimensions encoded in a Sanity CDN image URL.
 * These intrinsic dimensions let the browser reserve the image's aspect ratio
 * before the fallback HTML image finishes downloading.
 */
export function getSanityImageDimensionAttributes(imageUrl?: string): string {
  if (!imageUrl) return ''

  let url: URL
  try {
    url = new URL(imageUrl)
  } catch {
    return ''
  }

  if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/')) {
    return ''
  }

  const match = url.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
  if (!match) return ''

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    return ''
  }

  return ' width="' + width + '" height="' + height + '"'
}
