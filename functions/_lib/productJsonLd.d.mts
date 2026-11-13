export type ProductJsonLdInput = {
  _dataset?: string
  priceEUR?: number
  stockStatus?: string
  saleVariants?: Array<{ priceEUR?: number; stockStatus?: string }>
}

export function getServerProductPrice(product: ProductJsonLdInput): number | null
export function buildProductOffer(product: ProductJsonLdInput, url: string): Record<string, unknown> | null
