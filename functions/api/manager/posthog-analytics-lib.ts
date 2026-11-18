export const POSTHOG_PROJECT_ID = '349453'
export const POSTHOG_EVENTS = [
  'florial_page_view',
  'florial_category_view',
  'florial_product_view',
  'florial_cart_view',
  'florial_add_to_cart',
] as const

export const POSTHOG_EVENT_LABELS: Record<(typeof POSTHOG_EVENTS)[number], string> = {
  florial_page_view: 'Прегледи на страници',
  florial_category_view: 'Прегледи на категории',
  florial_product_view: 'Прегледи на продукти',
  florial_cart_view: 'Отваряния на количката',
  florial_add_to_cart: 'Добавяния в количката',
}

export type PostHogDays = 7 | 30 | 90
export type PostHogAnalytics = {
  period_days: PostHogDays
  totals: { page_views: number; category_views: number; product_views: number; cart_views: number; add_to_cart: number; total_events: number }
  daily: Array<{ event_day: string; page_views: number }>
  top_pages: Array<{ page_path: string; page_views: number }>
  by_language: Array<{ language: string; event_count: number }>
  by_country: Array<{ country_code: string; event_count: number }>
  updated_at: string
}

const eventList = POSTHOG_EVENTS.map((event) => "'" + event + "'").join(', ')

export function buildPostHogQueries(days: PostHogDays): Record<'events' | 'pages' | 'languages' | 'countries' | 'daily', string> {
  const since = `now() - INTERVAL ${days} DAY`
  return {
    events: `SELECT event, count() AS event_count FROM events WHERE timestamp >= ${since} AND event IN (${eventList}) GROUP BY event ORDER BY event_count DESC`,
    pages: `SELECT properties.page_path AS page_path, count() AS page_views FROM events WHERE timestamp >= ${since} AND event = 'florial_page_view' AND properties.page_path IS NOT NULL AND properties.page_path != '' GROUP BY page_path ORDER BY page_views DESC LIMIT 10`,
    languages: `SELECT properties.language AS language, count() AS event_count FROM events WHERE timestamp >= ${since} AND event = 'florial_page_view' AND properties.language IS NOT NULL GROUP BY language ORDER BY event_count DESC`,
    countries: `SELECT properties.$geoip_country_code AS country_code, count() AS event_count FROM events WHERE timestamp >= ${since} AND event = 'florial_page_view' AND properties.$geoip_country_code IS NOT NULL AND properties.$geoip_country_code != '' GROUP BY country_code ORDER BY event_count DESC LIMIT 10`,
    daily: `SELECT toDate(timestamp) AS event_day, count() AS page_views FROM events WHERE timestamp >= ${since} AND event = 'florial_page_view' GROUP BY event_day ORDER BY event_day ASC`,
  }
}

export function rowsFromPostHogResponse(value: unknown): unknown[][] {
  if (!value || typeof value !== 'object') return []
  const results = (value as { results?: unknown }).results
  return Array.isArray(results) ? results.filter((row): row is unknown[] => Array.isArray(row)) : []
}

const count = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0
}

const text = (value: unknown): string => typeof value === 'string' ? value.slice(0, 200) : ''

export function buildPostHogAnalytics(
  days: PostHogDays,
  rows: Record<'events' | 'pages' | 'languages' | 'countries' | 'daily', unknown[][]>,
  updatedAt = new Date().toISOString(),
): PostHogAnalytics {
  const eventCounts = new Map<string, number>()
  for (const row of rows.events) eventCounts.set(String(row[0] || ''), count(row[1]))
  const totals = {
    page_views: eventCounts.get('florial_page_view') || 0,
    category_views: eventCounts.get('florial_category_view') || 0,
    product_views: eventCounts.get('florial_product_view') || 0,
    cart_views: eventCounts.get('florial_cart_view') || 0,
    add_to_cart: eventCounts.get('florial_add_to_cart') || 0,
    total_events: [...eventCounts.values()].reduce((sum, value) => sum + value, 0),
  }
  return {
    period_days: days,
    totals,
    daily: rows.daily.map((row) => ({ event_day: text(row[0]), page_views: count(row[1]) })).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.event_day)),
    top_pages: rows.pages.map((row) => ({ page_path: text(row[0]), page_views: count(row[1]) })).filter((row) => row.page_path.startsWith('/')).slice(0, 10),
    by_language: rows.languages.map((row) => ({ language: text(row[0]).toLowerCase(), event_count: count(row[1]) })).filter((row) => ['bg', 'ru', 'en'].includes(row.language)),
    by_country: rows.countries.map((row) => ({ country_code: text(row[0]).toUpperCase(), event_count: count(row[1]) })).filter((row) => /^[A-Z]{2}$/.test(row.country_code)).slice(0, 10),
    updated_at: updatedAt,
  }
}
