export interface EquipmentCategoryNode {
  _id: string
  parentId?: string
  slugValue?: string
  name?: string
  sortOrder?: number
  productCount?: number
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  imageTitle?: string
  imageTitleEn?: string
  imageTitleRu?: string
  translations?: Record<string, { name?: string } | undefined>
}

export function renderEquipmentCategoryNavigation(
  categories: EquipmentCategoryNode[],
  currentCategoryId: string,
  language?: 'bg' | 'ru' | 'en',
  siteUrl?: string,
  options?: { rootCatalog?: boolean },
): string

export function renderEquipmentCategorySeoContent(
  category: { seoContent?: unknown[]; translations?: Record<string, Record<string, any>> },
  language?: 'bg' | 'ru' | 'en',
  siteUrl?: string,
): string

export function renderEquipmentCategoryHelpBlock(
  category: { helpBlock?: Record<string, any> },
  language?: 'bg' | 'ru' | 'en',
  siteUrl?: string,
): string
