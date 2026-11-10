export type PlantDuplicateVariant = { _key?: string; name?: string; priceEUR?: number; saleHeightCm?: number | null; containerVolumeL?: number | null }
export type PlantDuplicateImageInput = { assetId: string; alt?: string; altEn?: string; altRu?: string; key: string }
export type PlantGalleryAppendResult = { gallery: any[]; imageAdded: boolean; imageAlreadyPresent: boolean; galleryFull: boolean }
export declare function buildPlantDuplicateQuery(name: string, scientificNames: string[]): string
export declare function appendPlantSaleVariant(existing: unknown[], variant: { key: string; name: string; priceEUR: number }): Array<Record<string, unknown>>
export declare function appendPlantGalleryImage(mainAssetId: string, existing: any[], image: PlantDuplicateImageInput): PlantGalleryAppendResult
