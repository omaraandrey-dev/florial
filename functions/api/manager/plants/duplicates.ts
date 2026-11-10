import { json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, requirePlantRole, sanityQuery } from '../plant-direct-lib'

import { buildPlantDuplicateQuery } from '../plant-duplicate-lib'

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
