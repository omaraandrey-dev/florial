const jsonString = (value: string) => JSON.stringify(value)
const duplicateFields = ['name', 'translations.bg.name', 'translations.ru.name', 'translations.en.name', 'scientificName']

export const buildPlantDuplicateQuery = (name: string, scientificNames: string[]) => {
  const terms = Array.from(new Set([name, ...scientificNames].map(value => value.trim()).filter(Boolean).map(value => value.toLocaleLowerCase('en-US')))).slice(0, 4)
  if (!terms.length) throw new Error('PLANT_DUPLICATE_QUERY_EMPTY')
  const matches = terms.flatMap(term => duplicateFields.map(field => 'lower(' + field + ')==lower(' + jsonString(term) + ')'))
  return '*[_type=="product" && !(_id in path("drafts.**")) && (' + matches.join(' || ') + ')]|order(name asc)[0...12]{_id,_rev,name,scientificName,slug,"categoryName":category->name,"thumbnail":coalesce(mainImage.asset->url,gallery[0].asset->url),"variants":saleVariants[]{_key,name,priceEUR,saleHeightCm,containerVolumeL}}'
}
