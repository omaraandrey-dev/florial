import type { CategoryItem, Product } from '../types'

export interface PlantCategoryBreadcrumbs {
  catalogRoot?: CategoryItem
  primaryTrail: CategoryItem[]
  additionalCategories: CategoryItem[]
}

/**
 * Builds the canonical category path and the product's extra category memberships.
 * Sanity's singular `category` reference (categoryId in the product projection)
 * is primary; `categories[]` contains additional assignments.
 */
export function buildPlantCategoryBreadcrumbs(
  product: Pick<Product, 'categoryId' | 'categories'>,
  allCategories: CategoryItem[],
): PlantCategoryBreadcrumbs {
  const catalogRoot = allCategories.find(
    (category) => category.slug?.current === 'rastenia' || category._id === 'plants-root',
  )
  const categoriesById = new Map(allCategories.map((category) => [category._id, category]))
  const assignedCategories: CategoryItem[] = []
  const assignedIds = new Set<string>()

  for (const reference of product.categories || []) {
    const category = categoriesById.get(reference._id)
    if (!category || assignedIds.has(category._id)) continue
    if (category._id === catalogRoot?._id || category.slug?.current === 'rastenia') continue
    assignedIds.add(category._id)
    assignedCategories.push(category)
  }

  const getDepth = (category: CategoryItem): number => {
    let current: CategoryItem | undefined = category
    let depth = 0
    const seen = new Set<string>()

    while (current?.parentId && !seen.has(current._id)) {
      seen.add(current._id)
      current = categoriesById.get(current.parentId)
      if (current) depth += 1
    }

    return depth
  }

  const explicitPrimary = product.categoryId ? categoriesById.get(product.categoryId) : undefined
  const primary = explicitPrimary && explicitPrimary._id !== catalogRoot?._id
    ? explicitPrimary
    : assignedCategories.slice().sort((a, b) => getDepth(b) - getDepth(a))[0]

  const primaryTrail: CategoryItem[] = []
  const primaryIds = new Set<string>()
  let current: CategoryItem | undefined = primary

  while (current && !primaryIds.has(current._id)) {
    primaryIds.add(current._id)
    if (current._id !== catalogRoot?._id && current.slug?.current !== 'rastenia') {
      primaryTrail.unshift(current)
    }
    current = current.parentId ? categoriesById.get(current.parentId) : undefined
  }

  const additionalCategories = assignedCategories.filter((category) => !primaryIds.has(category._id))

  return { catalogRoot, primaryTrail, additionalCategories }
}
