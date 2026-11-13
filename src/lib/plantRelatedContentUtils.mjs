export function parseCategoryRelatedContentPath(value) {
  if (typeof value !== 'string') return null

  const path = value.trim()
  const match = path.match(/^\/(services|blog)\/([^/]+)$/)
  if (!match) return null

  return {
    type: match[1] === 'services' ? 'service' : 'blogPost',
    slug: match[2],
  }
}

export function mergeCategoryRelatedContent(categoryItem, individualItems = []) {
  const seen = new Set()

  return [categoryItem, ...individualItems].filter((item) => {
    if (!item?.slug?.current) return false
    if (item._type === 'service' && item.isActive === false) return false
    if (item._type === 'blogPost' && item.isPublished !== true) return false

    const identity = item._id || `${item._type}:${item.slug.current}`
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

// Keep the established plant helper name for existing callers.
export const mergePlantRelatedContent = mergeCategoryRelatedContent
