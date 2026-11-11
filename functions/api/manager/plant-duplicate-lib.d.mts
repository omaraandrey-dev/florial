export type PlantDuplicateImageInput = { assetId: string; alt?: string; altEn?: string; altRu?: string; key: string }
export type PlantGalleryAppendResult = { gallery: unknown[]; imageAdded: boolean; imageAlreadyPresent: boolean; galleryFull: boolean }
export declare function buildPlantDuplicateQuery(name: string, scientificNames: string[]): string
export declare function verifyPlantSaleVariant(variants: unknown[], expected: { key: string; name: string; priceEUR: number; stockQuantity: number }): 'missing' | 'matched' | 'mismatch'
export declare function appendPlantSaleVariant(existing: unknown[], variant: { key: string; name: string; priceEUR: number; stockQuantity: number }): Array<Record<string, unknown>>
export declare function appendPlantGalleryImage(mainAssetId: string, existing: unknown[], image: PlantDuplicateImageInput): PlantGalleryAppendResult

export declare function validatePlantAddVariantRequest(body: unknown): string[]
