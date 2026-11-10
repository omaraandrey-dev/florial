const jsonString = (value: string) => JSON.stringify(value)
const duplicateFields = ['name', 'translations.bg.name', 'translations.ru.name', 'translations.en.name', 'scientificName']

export const buildPlantDuplicateQuery = (name: string, scientificNames: string[]) => {
  const terms = Array.from(new Set([name, ...scientificNames].map(value => value.trim()).filter(Boolean).map(value => value.toLocaleLowerCase('en-US')))).slice(0, 4)
  if (!terms.length) throw new Error('PLANT_DUPLICATE_QUERY_EMPTY')
  const matches = terms.flatMap(term => duplicateFields.map(field => 'lower(' + field + ')==lower(' + jsonString(term) + ')'))
  return '*[_type=="product" && !(_id in path("drafts.**")) && (' + matches.join(' || ') + ')]|order(name asc)[0...12]{_id,_rev,name,scientificName,slug,"categoryName":category->name,"thumbnail":coalesce(mainImage.asset->url,gallery[0].asset->url),"variants":saleVariants[]{_key,name,priceEUR,saleHeightCm,containerVolumeL}}'
}

export const appendPlantSaleVariant = (
  existing: unknown[],
  variant: { key: string; name: string; priceEUR: number },
) => {
  if (existing.length >= 30) throw new Error('PLANT_VARIANT_LIMIT')
  return [...existing, {
    _type: 'plantSaleVariant',
    _key: variant.key,
    name: variant.name,
    priceEUR: variant.priceEUR,
    stockStatus: 'onRequest',
    stockQuantity: null,
  }]
}

export const appendPlantGalleryImage = (
  mainAssetId: string,
  existing: any[],
  image: { assetId: string; alt?: string; altEn?: string; altRu?: string; key: string },
) => {
  const alreadyPresent = mainAssetId === image.assetId || existing.some(item => (item?.asset?._ref || item?.asset?._id) === image.assetId)
  if (alreadyPresent) return { gallery: existing, imageAdded: false, imageAlreadyPresent: true, galleryFull: false }
  if (existing.length + (mainAssetId ? 1 : 0) >= 10) return { gallery: existing, imageAdded: false, imageAlreadyPresent: false, galleryFull: true }
  return {
    gallery: [...existing, {
      _type: 'image',
      _key: image.key,
      asset: { _type: 'reference', _ref: image.assetId },
      alt: (image.alt || '').trim().slice(0, 240),
      altEn: (image.altEn || '').trim().slice(0, 240),
      altRu: (image.altRu || '').trim().slice(0, 240),
    }],
    imageAdded: true,
    imageAlreadyPresent: false,
    galleryFull: false,
  }
}
