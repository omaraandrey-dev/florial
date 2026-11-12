import test from 'node:test'
import assert from 'node:assert/strict'
import { buildServicesRssXml, escapeXml } from '../functions/_lib/servicesRss.mjs'

test('escapes XML special characters', () => {
  assert.equal(escapeXml(`A & B <garden> "Florial" 'service'`), 'A &amp; B &lt;garden&gt; &quot;Florial&quot; &apos;service&apos;')
})

test('builds a Bulgarian RSS 2.0 feed with absolute service links and Atom autodiscovery metadata', () => {
  const xml = buildServicesRssXml({
    feedUrl: 'https://florial-bg.com/feeds/services-bg.xml',
    now: new Date('2026-11-12T08:00:00Z'),
    items: [{
      name: 'Монтаж & настройка',
      slug: 'montazh-poliv',
      shortDescription: 'Услуга <професионална>',
      updatedAt: '2026-11-12T07:00:00Z',
    }],
  })

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<rss version="2\.0"/)
  assert.match(xml, /<language>bg-BG<\/language>/)
  assert.match(xml, /<atom:link href="https:\/\/florial-bg\.com\/feeds\/services-bg\.xml" rel="self" type="application\/rss\+xml" \/>/)
  assert.match(xml, /<title>Монтаж &amp; настройка<\/title>/)
  assert.match(xml, /<link>https:\/\/florial-bg\.com\/services\/montazh-poliv<\/link>/)
  assert.match(xml, /Услуга &lt;професионална&gt;/)
  assert.match(xml, /<pubDate>Thu, 12 Nov 2026 07:00:00 GMT<\/pubDate>/)
})

test('omits incomplete entries and orders valid entries by update date', () => {
  const xml = buildServicesRssXml({
    feedUrl: 'https://florial-bg.com/feeds/services-bg.xml',
    now: new Date('2026-11-12T08:00:00Z'),
    items: [
      { name: 'Older service', slug: 'older', updatedAt: '2026-11-10T08:00:00Z' },
      { name: 'Missing slug' },
      { name: 'Newer service', slug: 'newer', updatedAt: '2026-11-11T08:00:00Z' },
    ],
  })

  assert.ok(xml.indexOf('<title>Newer service</title>') < xml.indexOf('<title>Older service</title>'))
  assert.doesNotMatch(xml, /Missing slug/)
})
