import { hasPermission, json, requireUser, type ManagerEnv } from './_lib'
import { buildPostHogAnalytics, buildPostHogQueries, POSTHOG_PROJECT_ID, rowsFromPostHogResponse, type PostHogDays } from './posthog-analytics-lib'

type QueryKey = 'events' | 'pages' | 'languages' | 'countries' | 'daily'
const cache = new Map<string, { expiresAt: number; data: ReturnType<typeof buildPostHogAnalytics> }>()
const CACHE_TTL_MS = 5 * 60 * 1000

const runQuery = async (apiKey: string, query: string): Promise<unknown[][]> => {
  const response = await fetch(`https://eu.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`PostHog query failed with status ${response.status}`)
  return rowsFromPostHogResponse(await response.json())
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!hasPermission(auth.user, 'canViewAnalytics')) return json({ error: 'Нямате право да преглеждате аналитиката.' }, 403)
  if (!env.POSTHOG_PERSONAL_API_KEY) {
    return json({ error: 'PostHog API ключът за четене не е конфигуриран. Необходим е POSTHOG_PERSONAL_API_KEY в Cloudflare Pages Secrets.' }, 503)
  }

  const daysRaw = Number(new URL(request.url).searchParams.get('days') || 30)
  const days: PostHogDays = daysRaw === 7 || daysRaw === 90 ? daysRaw : 30
  const cacheKey = String(days)
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return json({ ...cached.data, cached: true })

  try {
    const queries = buildPostHogQueries(days)
    const keys: QueryKey[] = ['events', 'pages', 'languages', 'countries', 'daily']
    const results = await Promise.all(keys.map((key) => runQuery(env.POSTHOG_PERSONAL_API_KEY!, queries[key])))
    const data = buildPostHogAnalytics(days, Object.fromEntries(keys.map((key, index) => [key, results[index]])) as Record<QueryKey, unknown[][]>)
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data })
    return json({ ...data, cached: false })
  } catch {
    return json({ error: 'PostHog не успя да върне аналитичните данни. Опитайте отново след малко.' }, 502)
  }
}
