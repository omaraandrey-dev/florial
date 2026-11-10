export const validatePlantVariantStock = (variants, existingVariants = [], isCreate = false) => {
  const previousVariants = new Map(existingVariants.map(item => [item?._key, item]))
  for (const variant of variants) {
    if (variant.stockStatus !== 'inStock') continue
    const previous = previousVariants.get(variant._key)
    const newlyMarkedInStock = isCreate || !previous || previous.stockStatus !== 'inStock'
    if (newlyMarkedInStock && (variant.stockQuantity == null || !Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 1)) {
      throw new Error('За вариант със статус „В наличност“ въведете реално количество (цяло число над 0).')
    }
  }
  return variants
}
