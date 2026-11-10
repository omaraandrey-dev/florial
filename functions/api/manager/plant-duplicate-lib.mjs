const jsonString = value => JSON.stringify(value)
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}$/i
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export const validatePlantAddVariantRequest = body => {
  if (!isRecord(body)) return ['body']
  const missing = []
  if (!uuidPattern.test(String(body.idempotencyKey || ''))) missing.push('idempotencyKey')
  if (typeof body.expectedRevision !== 'string' || !body.expectedRevision.trim()) missing.push('expectedRevision')
  if (!isRecord(body.variant)) missing.push('variant')
  if (!isRecord(body.image)) missing.push('image')
  return missing
}
const duplicateFields = ['name', 'translations.bg.name', 'translations.ru.name', 'translations.en.name', 'scientificName', 'plantDetails.scientificName']

export const buildPlantDuplicateQuery = (name, scientificNames) => {
  const terms = Array.from(new Set([name, ...scientificNames].map(value => value.trim()).filter(Boolean).map(value => value.toLocaleLowerCase('en-US')))).slice(0, 4)
  if (!terms.length) throw new Error('PLANT_DUPLICATE_QUERY_EMPTY')
  const matches = terms.flatMap(term => duplicateFields.map(field => 'lower(' + field + ')==lower(' + jsonString(term) + ')'))
  return '*[_type=="product" && !(_id in path("drafts.**")) && (' + matches.join(' || ') + ')]|order(name asc)[0...12]{_id,_rev,name,scientificName,slug,"categoryName":category->name,"thumbnail":coalesce(mainImage.asset->url,gallery[0].asset->url),"variants":saleVariants[]{_key,name,priceEUR,saleHeightCm,containerVolumeL}}'
}

export const appendPlantSaleVariant = (existing, variant) => {
  if (existing.length >= 30) throw new Error('PLANT_VARIANT_LIMIT')
  if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 1) throw new Error('PLANT_VARIANT_QUANTITY_REQUIRED')
  return [...existing, {
    _type: 'plantSaleVariant',
    _key: variant.key,
    name: variant.name,
    priceEUR: variant.priceEUR,
    stockStatus: 'inStock',
    stockQuantity: variant.stockQuantity,
  }]
}

export const appendPlantGalleryImage = (mainAssetId, existing, image) => {
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
