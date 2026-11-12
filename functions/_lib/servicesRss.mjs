const SITE_URL = 'https://florial-bg.com'

export function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character])
}

function validDate(value, fallback) {
  const parsed = value ? new Date(value) : null
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback
}

export function buildServicesRssXml({ items, feedUrl, now = new Date() }) {
  const fallbackDate = validDate(now, new Date())
  const entries = (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item.name === 'string' && item.name.trim() && typeof item.slug === 'string' && item.slug.trim())
    .map((item) => ({
      ...item,
      updated: validDate(item.updatedAt, fallbackDate),
      url: SITE_URL + '/services/' + encodeURIComponent(item.slug.trim()),
      description: item.shortDescription || item.seoDescription || '',
    }))
    .sort((left, right) => right.updated.getTime() - left.updated.getTime())

  const latestUpdate = entries[0]?.updated || fallbackDate
  const itemXml = entries.map((item) => [
    '    <item>',
    '      <title>' + escapeXml(item.name.trim()) + '</title>',
    '      <link>' + escapeXml(item.url) + '</link>',
    '      <guid isPermaLink="true">' + escapeXml(item.url) + '</guid>',
    '      <description>' + escapeXml(item.description) + '</description>',
    '      <pubDate>' + item.updated.toUTCString() + '</pubDate>',
    '    </item>',
  ].join('\n'))

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Услуги Florial — градински център</title>',
    '    <link>' + SITE_URL + '/services</link>',
    '    <description>Професионални услуги на Florial: ландшафтен дизайн, озеленяване, засаждане и автоматично напояване в България.</description>',
    '    <language>bg-BG</language>',
    '    <lastBuildDate>' + latestUpdate.toUTCString() + '</lastBuildDate>',
    '    <generator>Florial RSS</generator>',
    '    <ttl>5</ttl>',
    '    <atom:link href="' + escapeXml(feedUrl) + '" rel="self" type="application/rss+xml" />',
    ...itemXml,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
