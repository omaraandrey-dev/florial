export type StockVariant = { _key: string; stockStatus: string; stockQuantity?: number | null }
export function validatePlantVariantStock<T extends StockVariant>(
  variants: T[],
  existingVariants?: Array<Partial<StockVariant>>,
  isCreate?: boolean,
): T[]
