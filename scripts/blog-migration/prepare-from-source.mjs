import {createClient} from '@sanity/client'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourceDir = path.join(root, 'scripts/blog-migration/source')
const inventory = JSON.parse(await fs.readFile(path.join(root, 'scripts/blog-migration/source-inventory.json'), 'utf8'))
const manifest = JSON.parse(await fs.readFile(path.join(root, 'scripts/blog-migration/image-manifest.json'), 'utf8'))
const projectId = process.env.SANITY_PROJECT_ID || 'bxvcy0qs'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN
if (!token) throw new Error('SANITY_API_TOKEN is required. Do not put it in a VITE_* variable or commit it.')
if (dataset !== 'production' && dataset !== 'plants') throw new Error('Unexpected Sanity dataset: ' + dataset)

const client = createClient({projectId, dataset, apiVersion: '2025-01-01', token, useCdn: false})
const sourceFiles = await fs.readdir(sourceDir)
const sourceByUrl = new Map()
for (const file of sourceFiles.filter(name => name.endsWith('.md'))) {
  const text = await fs.readFile(path.join(sourceDir, file), 'utf8')
  const url = text.match(/<!-- Source URL: ([^\n]+)/)?.[1]?.trim()
  if (url) sourceByUrl.set(normalizeUrl(url), {file, text})
}
function normalizeUrl(value) {
  try { return decodeURIComponent(value).replace(/\/$/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^bg\./, '') } catch { return value }
}
function wixId(url) {
  return url.match(/static\.wixstatic\.com\/media\/([^/~]+)/)?.[1] || null
}
function cleanLocality(value) {
  return value
    .replace(/\bОдесса\b/gi, 'Бургас')
    .replace(/\bОдеса\b/gi, 'Бургас')
    .replace(/\bOdesa\b/gi, 'Burgas')
    .replace(/\bOdessa\b/gi, 'Burgas')
    .replace(/\bУкраина\b/gi, 'България')
    .replace(/\bУкраїна\b/gi, 'България')
    .replace(/\bUkraine\b/gi, 'Bulgaria')
}
function cleanMarkdown(source, post) {
  let text = source.replace(/^<!--[\s\S]*?-->\s*/m, '')
  text = text.replace(/^\s*(top of page|bottom of page|Търсене)\s*$/gim, '')
  text = text.replace(/\+380\s*\d[\d\s-]{7,}/g, '+359 876 777 902')
  text = text.replace(new RegExp('https?:[/][/](?:www[.])?drop[.]od[.]ua[^) ]*', 'gi'), '/')
  text = cleanLocality(text)
  if (post.slug === 'rozi-sympathy') text = text.replace(/25\s*(?:лв\.?|лева|левов)/gi, '12,50 €')
  // Article references to old Drop pages are replaced by Florial routes when the link text identifies another migrated post.
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (whole, label, href) => {
    if (!/drop\.od\.ua/i.test(href)) return whole
    const target = inventory.posts.find(p => Object.values(p.title || {}).some(title => title && title.trim().toLocaleLowerCase() === label.trim().toLocaleLowerCase()))
    if (target) return '[' + label + '](/blog/' + target.slug + ')'
    if (/grass|gaz(on|on)|rulonn/i.test(href + ' ' + label)) return '[' + label + '](/services/rulonna-treva)'
    if (/contact/i.test(href + ' ' + label)) return '[' + label + '](/contacts)'
    return '[' + label + '](/)'
  })
  text = text.replace(/https?:\\/\\/(?:www\\.)?drop\\.od\\.ua[^)\\s]*/gi, '/')
  return text.trim()
}
function inlineChildren(text, post) {
  const children = []
  const markDefs = []
  const decorators = []
  const add = (value, marks = []) => {
    if (value) children.push({_type: 'span', _key: key(), text: value, marks})
  }
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const token = match[0], index = match.index ?? 0
    add(text.slice(cursor, index))
    if (token.startsWith('**')) add(token.slice(2, -2), ['strong'])
    else if (token.startsWith('*')) add(token.slice(1, -1), ['em'])
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const href = link[2]
        const defKey = key()
        markDefs.push({_key: defKey, _type: 'link', href, blank: /^https?:/i.test(href)})
        add(link[1], [defKey])
      }
    }
    cursor = index + token.length
  }
  add(text.slice(cursor))
  return {children: children.length ? children : [{_type: 'span', _key: key(), text, marks: []}], markDefs}
}
let keyCounter = 0
function key() { return 'b' + (++keyCounter).toString(36) }
function parseMarkdown(markdown, post, assetMap) {
  const lines = markdown.split(/\r?\n/)
  const blocks = []
  let paragraph = []
  let listType = null
  let listLines = []
  const flushParagraph = () => {
    const value = paragraph.join(' ').trim()
    paragraph = []
    if (!value) return
    const {children, markDefs} = inlineChildren(value, post)
    blocks.push({_type: 'block', _key: key(), style: 'normal', markDefs, children})
  }
  const flushList = () => {
    if (!listLines.length) return
    for (const item of listLines) {
      const {children, markDefs} = inlineChildren(item, post)
      blocks.push({_type: 'block', _key: key(), style: 'normal', listItem: listType, level: 1, markDefs, children})
    }
    listLines = []; listType = null
  }
  for (let raw of lines) {
    const line = raw.trim()
    if (!line) { flushParagraph(); flushList(); continue }
    const imageMatch = line.match(/^(?:[-*+]\s*)?!\[([^\]]*)\]\((https?:\/\/[^)]+)\)(.*)$/)
    if (imageMatch) {
      flushParagraph(); flushList()
      const [, rawAlt, url, trailing] = imageMatch
      const ref = assetMap.get(wixId(url))
      const alt = cleanLocality(rawAlt || manifestAlt(url) || post.title.bg)
      if (ref) blocks.push({_type: 'image', _key: key(), asset: {_type: 'reference', _ref: ref}, alt, ...(trailing.trim() ? {caption: cleanLocality(trailing.trim())} : {})})
      continue
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushParagraph(); flushList()
      const {children, markDefs} = inlineChildren(heading[2], post)
      blocks.push({_type: 'block', _key: key(), style: 'h' + Math.min(4, heading[1].length + 1), markDefs, children})
      continue
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/)
    const numbered = line.match(/^\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      flushParagraph()
      const nextType = bullet ? 'bullet' : 'number'
      if (listType && listType !== nextType) flushList()
      listType = nextType
      listLines.push((bullet || numbered)[1])
      continue
    }
    if (line.startsWith('> ')) {
      flushParagraph(); flushList()
      const {children, markDefs} = inlineChildren(line.slice(2), post)
      blocks.push({_type: 'block', _key: key(), style: 'blockquote', markDefs, children})
      continue
    }
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)/i.test(line)) {
      flushParagraph(); flushList()
      blocks.push({_type: 'youtubeEmbed', _key: key(), url: line, title: post.title.bg})
      continue
    }
    flushList()
    paragraph.push(line)
  }
  flushParagraph(); flushList()
  return blocks.filter(block => block._type !== 'block' || block.children?.some(child => child.text?.trim()))
}
function manifestAlt(url) {
  const id = wixId(url)
  for (const article of manifest.articles || []) {
    const image = (article.images || []).find(item => item.assetId === id || wixId(item.url) === id)
    if (image) return image.suggestedAlt || image.alt
  }
  return ''
}
function tagsFor(post) {
  const text = post.title.bg.toLocaleLowerCase()
  const tags = []
  if (/полив|rain bird|мъглуван/.test(text)) tags.push('Автоматично напояване')
  if (/трев|газон/.test(text)) tags.push('Тревни площи')
  if (/роз|палм|маслин|кипарис|растени/.test(text)) tags.push('Растения')
  if (/ландшафт|цветн|топиар/.test(text)) tags.push('Озеленяване')
  return [...new Set(tags.length ? tags : ['Florial'])]
}
const imageUrls = new Map()
for (const post of inventory.posts) {
  if (post.coverUrl && wixId(post.coverUrl)) imageUrls.set(wixId(post.coverUrl), post.coverUrl)
  for (const image of post.images || []) if (image.url && wixId(image.url)) imageUrls.set(wixId(image.url), image.url)
}
for (const article of manifest.articles || []) for (const image of article.images || []) {
  if (image.kind !== 'youtube-thumbnail' && image.url && wixId(image.url)) imageUrls.set(wixId(image.url), image.url)
}
const assetMap = new Map()
const knownCovers = JSON.parse(await fs.readFile(path.join(root, 'scripts/blog-migration/known-cover-refs.json'), 'utf8')).covers
for (const post of inventory.posts) {
  const ref = knownCovers[post.slug]
  const id = wixId(post.coverUrl)
  if (ref && id) assetMap.set(id, ref)
}
const failures = []
const entries = [...imageUrls.entries()]
let next = 0
async function uploadWorker() {
  while (next < entries.length) {
    const index = next++
    const [id, url] = entries[index]
    if (assetMap.has(id)) {
      console.log('Using verified existing cover asset ' + id)
      continue
    }
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('HTTP ' + response.status)
      const buffer = Buffer.from(await response.arrayBuffer())
      if (!buffer.length) throw new Error('empty image')
      const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('avif') ? 'avif' : contentType.includes('gif') ? 'gif' : 'jpg'
      const asset = await client.assets.upload('image', buffer, {filename: id + '.' + ext, contentType})
      assetMap.set(id, asset._id)
      console.log('Uploaded image ' + (index + 1) + '/' + entries.length + ': ' + id)
    } catch (error) {
      failures.push({id, url, error: String(error)})
      console.warn('Image upload skipped: ' + id + ' — ' + String(error))
    }
  }
}
await Promise.all(Array.from({length: 4}, () => uploadWorker()))

const prepared = []
for (const post of inventory.posts) {
  const source = sourceByUrl.get(normalizeUrl(post.sourceUrl))
  if (!source) throw new Error('Could not match original Markdown source for ' + post.slug + ' (' + post.sourceUrl + ')')
  const markdown = cleanMarkdown(source.text, post)
  const body = parseMarkdown(markdown, post, assetMap)
  const coverId = wixId(post.coverUrl)
  const coverAsset = assetMap.get(coverId)
  if (!coverAsset) throw new Error('Cover upload failed for ' + post.slug + '; refusing to publish an article without its cover.')
  const translations = {}
  for (const language of ['bg', 'ru', 'en']) {
    const title = post.title[language] || post.title.bg
    const summary = language === 'bg'
      ? 'Полезна информация от Florial: ' + title + '. Практически решения за градината, озеленяването и автоматичното напояване в България.'
      : language === 'ru'
        ? 'Полезная информация от Florial: ' + title + '. Практические решения для сада, озеленения и автоматического полива в Болгарии.'
        : 'Useful advice from Florial: ' + title + '. Practical solutions for gardens, landscaping and automatic irrigation in Bulgaria.'
    translations[language] = {
      title,
      shortDescription: summary,
      body: language === 'bg' ? body : [],
      coverAlt: language === 'bg' ? cleanLocality(post.coverAlt || title) : title,
      seoTitle: title + ' | Florial',
      seoDescription: summary,
    }
  }
  prepared.push({
    slug: post.slug,
    publishedAt: post.publishedAt,
    sourceUrl: post.sourceUrl,
    tags: tagsFor(post),
    cover: {_type: 'image', asset: {_type: 'reference', _ref: coverAsset}, alt: cleanLocality(post.coverAlt || post.title.bg)},
    gallery: [],
    translations,
  })
}
await fs.writeFile(path.join(root, 'scripts/blog-migration/prepared-posts.json'), JSON.stringify(prepared, null, 2) + '\n')
await fs.writeFile(path.join(root, 'scripts/blog-migration/asset-upload-report.json'), JSON.stringify({
  createdAt: new Date().toISOString(),
  uniqueSourceImages: entries.length,
  uploadedImages: assetMap.size,
  failedImages: failures,
  articlesPrepared: prepared.length,
  articles: prepared.map(post => ({slug: post.slug, blocks: post.translations.bg.body.length, cover: post.cover.asset._ref})),
}, null, 2) + '\n')
console.log('Prepared ' + prepared.length + ' articles; uploaded ' + assetMap.size + '/' + entries.length + ' unique images.')
