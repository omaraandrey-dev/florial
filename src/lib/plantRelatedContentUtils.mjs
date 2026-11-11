export function mergePlantRelatedContent(categoryItem, individualItems = []) {
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
