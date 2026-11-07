import type { D1Database } from '../manager/_lib'

type RateLimitOptions = { scope: string; limit: number; periodSeconds: 10 | 60 | 900 }
const ALLOWED_HOSTS = new Set(['florial-bg.com', 'www.florial-bg.com', 'localhost', '127.0.0.1'])

const jsonError = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })

export const checkSameOriginPublicPost = (request: Request): Response | null => {
  if (request.method !== 'POST') return jsonError(405, 'Method not allowed.')
  const target = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (!ALLOWED_HOSTS.has(target.hostname) || !origin) return jsonError(403, 'Request origin is not allowed.')
  try {
    if (new URL(origin).origin !== target.origin) return jsonError(403, 'Request origin is not allowed.')
  } catch {
    return jsonError(403, 'Request origin is not allowed.')
  }
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return jsonError(403, 'Cross-site requests are not allowed.')
  const contentType = request.headers.get('Content-Type') || ''
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return jsonError(415, 'Content-Type must be application/json.')
  return null
}

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const enforcePublicRateLimit = async (
  request: Request, db: D1Database | undefined, options: RateLimitOptions,
): Promise<Response | null> => {
  if (!db) return jsonError(503, 'Request protection is temporarily unavailable.')
  const clientIp = request.headers.get('CF-Connecting-IP')
  if (!clientIp) return jsonError(503, 'Request protection is temporarily unavailable.')
  const now = Math.floor(Date.now() / 1000)
  const day = new Date(now * 1000).toISOString().slice(0, 10)
  const ipDigest = await sha256Hex(day + ':' + clientIp)
  const bucketKey = options.scope + ':' + day + ':' + ipDigest
  const windowStart = Math.floor(now / options.periodSeconds) * options.periodSeconds
  const expiresAt = now + 48 * 60 * 60
  const sql = 'INSERT INTO api_rate_limits (bucket_key, window_start, request_count, expires_at) ' +
    'VALUES (?, ?, 1, ?) ON CONFLICT(bucket_key) DO UPDATE SET window_start = excluded.window_start, ' +
    'request_count = CASE WHEN api_rate_limits.window_start = excluded.window_start ' +
    'THEN api_rate_limits.request_count + 1 ELSE 1 END, expires_at = excluded.expires_at RETURNING request_count'
  try {
    const row = await db.prepare(sql).bind(bucketKey, windowStart, expiresAt).first<{ request_count: number }>()
    if (!row) return jsonError(503, 'Request protection is temporarily unavailable.')
    if (Math.random() < 0.01) await db.prepare('DELETE FROM api_rate_limits WHERE expires_at < ?').bind(now).run()
    if (row.request_count > options.limit) {
      const retryAfter = Math.max(1, windowStart + options.periodSeconds - now)
      return jsonError(429, 'Too many requests. Please try again later.', { 'Retry-After': String(retryAfter) })
    }
    return null
  } catch {
    return jsonError(503, 'Request protection is temporarily unavailable.')
  }
}

export const readBoundedRequestBody = async (request: Request, maxBytes: number) => {
  const contentLength = request.headers.get('content-length')
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
    return { text: '', response: jsonError(413, 'Request body is too large.') }
  }
  const reader = request.body?.getReader()
  if (!reader) return { text: '', response: jsonError(400, 'Request body is missing.') }
  const decoder = new TextDecoder()
  let text = ''
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel()
        return { text: '', response: jsonError(413, 'Request body is too large.') }
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    return { text, response: null }
  } catch {
    return { text: '', response: jsonError(400, 'Request body could not be read.') }
  }
}
