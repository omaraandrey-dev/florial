import { json, requireUser, type ManagerEnv } from './_lib'
import { PLANTS_DATASET, requirePlantRole } from './plant-direct-lib'

type SanityAsset = {
  _id?: unknown
  url?: unknown
  originalFilename?: unknown
  title?: unknown
  _createdAt?: unknown
  mimeType?: unknown
  size?: unknown
  width?: unknown
  height?: unknown
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.SANITY_API_TOKEN) return json({ error: 'Image library is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Нямате право да преглеждате библиотеката със снимки.' }, 403)

  const project = env.SANITY_PROJECT_ID || 'bxvcy0qs'
  const dataset = PLANTS_DATASET
  const requestedOffset = Number(new URL(request.url).searchParams.get('offset') || 0)
  const offset = Number.isInteger(requestedOffset) ? Math.min(100000, Math.max(0, requestedOffset)) : 0
  const pageSize = 100
  const query = '*[_type == "sanity.imageAsset"] | order(_createdAt desc)[' + offset + '...' + (offset + pageSize) + ']{_id, originalFilename, title, _createdAt, url, mimeType, size, "width": metadata.dimensions.width, "height": metadata.dimensions.height}'
  const endpoint = 'https://' + project + '.api.sanity.io/v2024-01-01/data/query/' + encodeURIComponent(dataset) + '?query=' + encodeURIComponent(query)

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: 'Bearer ' + env.SANITY_API_TOKEN, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return json({ error: 'Не успяхме да получим библиотеката със снимки от Sanity.' }, 502)
    const body = await response.json() as { result?: SanityAsset[] }
    const rawAssets = Array.isArray(body.result) ? body.result : []
    const data = rawAssets.flatMap((asset) => {
      const assetId = typeof asset._id === 'string' ? asset._id : ''
      const url = typeof asset.url === 'string' ? asset.url : ''
      if (!/^image-[A-Za-z0-9-]+$/.test(assetId) || !url.startsWith('https://cdn.sanity.io/images/' + project + '/' + dataset + '/')) return []
      const name = typeof asset.originalFilename === 'string' && asset.originalFilename
        ? asset.originalFilename
        : typeof asset.title === 'string' && asset.title ? asset.title : assetId
      return [{
        assetId,
        url,
        name: name.slice(0, 255),
        size: typeof asset.size === 'number' && Number.isFinite(asset.size) ? asset.size : 0,
        type: typeof asset.mimeType === 'string' ? asset.mimeType : 'image/jpeg',
        createdAt: typeof asset._createdAt === 'string' ? asset._createdAt : '',
        width: typeof asset.width === 'number' ? asset.width : undefined,
        height: typeof asset.height === 'number' ? asset.height : undefined,
      }]
    })
    return json({ data, error: null, hasMore: rawAssets.length === pageSize, nextOffset: offset + rawAssets.length })
  } catch {
    return json({ error: 'Не успяхме да се свържем с библиотеката със снимки в Sanity.' }, 502)
  }
}
