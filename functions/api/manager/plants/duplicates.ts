import { json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, requirePlantRole, sanityQuery } from '../plant-direct-lib'

const jsonString = (value: string) => JSON.stringify(value)
const duplicateFields = ['name', 'translations.bg.name', 'translations.ru.name', 'translations.en.name', 'scientificName']

export const buildPlantDuplicateQuery = (name: string, scientificNames: string[]) => {
  const terms = Array.from(new Set([name, ...scientificNames].map(value => value.trim()).filter(Boolean).map(value => value.toLocaleLowerCase('en-US')))).slice(0, 4)
  if (!terms.length) throw new Error('PLANT_DUPLICATE_QUERY_EMPTY')
  const matches = terms.flatMap(term => duplicateFields.map(field => 'lower(' + field + ')==lower(' + jsonString(term) + ')'))
  return '*[_type=="product" && !(_id in path("drafts.**")) && (' + matches.join(' || ') + ')]|order(name asc)[0...12]{_id,_rev,name,scientificName,slug,"categoryName":category->name,"thumbnail":coalesce(mainImage.asset->url,gallery[0].asset->url),"variants":saleVariants[]{_key,name,priceEUR,saleHeightCm,containerVolumeL}}'
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)
  const url = new URL(request.url)
  const name = cleanText(url.searchParams.get('name'), 160)
  const scientificNames = url.searchParams.getAll('scientificName').slice(0, 3).map(value => cleanText(value, 160)).filter(Boolean)
  if (!name && !scientificNames.length) return json({ items: [] })
  try {
    const items = await sanityQuery<Array<Record<string, any>>>(env, buildPlantDuplicateQuery(name, scientificNames))
    return json({ items: Array.isArray(items) ? items : [] })
  } catch {
    console.error('[manager-plant-duplicates]', { code: 'sanity_query_failed' })
    return json({ error: 'Не успяхме да проверим съществуващите растения в каталога.' }, 502)
  }
}
