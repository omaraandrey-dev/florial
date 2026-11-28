const baseUrl = String(process.env.BASE_URL || process.env.PREVIEW_URL || '').replace(/\/+$/, '')
if (!baseUrl) throw new Error('BASE_URL or PREVIEW_URL must point to the exact Florial Preview or Production deployment')

const locales = [
  { code: 'bg', query: '' },
  { code: 'ru', query: '?lang=ru' },
  { code: 'en', query: '?lang=en' },
]

for (const locale of locales) {
  const url = baseUrl + '/contacts' + locale.query
  const response = await fetch(url, { headers: { Accept: 'text/html' } })
  if (!response.ok) throw new Error('Header SSR seed request failed (' + response.status + '): ' + url)
  const html = await response.text()
  const match = html.match(/<script id="florial-header-ssr-data" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) throw new Error('Missing shared Header SSR payload: ' + url)

  let payload
  try {
    payload = JSON.parse(match[1])
  } catch (error) {
    throw new Error('Invalid shared Header SSR JSON for ' + url + ': ' + String(error))
  }

  if (payload.language !== locale.code) throw new Error('Wrong Header SSR locale for ' + url)
  for (const field of ['equipmentCategories', 'plantCategories', 'services', 'headerBlogPosts']) {
    if (!Array.isArray(payload[field])) throw new Error('Header SSR field is not an array: ' + field + ' (' + url + ')')
  }
  if (!payload.siteSettings || typeof payload.siteSettings !== 'object') {
    throw new Error('Header SSR site settings are missing: ' + url)
  }
  if (!html.includes('florial-contacts-ssr-data')) {
    throw new Error('Contacts page SSR payload is missing alongside Header seed: ' + url)
  }

  console.log('PASS ' + locale.code + ' ' + url + ' — shared Header seed contains categories, services, site settings and recent posts')
}
