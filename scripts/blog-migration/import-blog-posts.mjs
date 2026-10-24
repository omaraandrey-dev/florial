import {createClient} from '@sanity/client'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const inputPath = path.join(here, 'prepared-posts.json')
const dataset = process.env.SANITY_DATASET || 'production'
const projectId = process.env.SANITY_PROJECT_ID || 'bxvcy0qs'
const args = new Set(process.argv.slice(2))
const write = args.has('--write')
const confirmProduction = args.has('--confirm-production-write')
const overwriteExisting = args.has('--overwrite-existing')

const posts = JSON.parse(await fs.readFile(inputPath, 'utf8'))
if (!Array.isArray(posts)) throw new Error('prepared-posts.json must contain an array.')

const requiredLanguages = ['bg', 'ru', 'en']
for (const [index, post] of posts.entries()) {
  if (!post.slug || !post.publishedAt || !post.translations) throw new Error('Post #' + (index + 1) + ' is incomplete: slug, publishedAt and translations are required.')
  for (const language of requiredLanguages) {
    const translation = post.translations[language]
    if (!translation?.title || !translation?.shortDescription || !translation?.seoTitle || !translation?.seoDescription || !Array.isArray(translation.body) || translation.body.length === 0) {
      throw new Error('Post "' + post.slug + '" has incomplete ' + language + ' translation. No writes were performed.')
    }
  }
  if (!post.cover?._type || post.cover._type !== 'image') throw new Error('Post "' + post.slug + '" is missing its Sanity cover asset reference.')
}

console.log('Validated ' + posts.length + ' complete multilingual blog posts for dataset "' + dataset + '".')
if (!write) {
  console.log('DRY RUN only. No Sanity API write was performed. Use --write to request import.')
  process.exit(0)
}
if (dataset === 'production' && !confirmProduction) {
  throw new Error('Production writes are blocked. Re-run only after explicit approval with --confirm-production-write.')
}
const token = process.env.SANITY_API_TOKEN
if (!token) throw new Error('SANITY_API_TOKEN is required at runtime; never use a VITE_* token.')
const client = createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})

for (const post of posts) {
  const document = {
    _id: 'blogPost-' + post.slug,
    _type: 'blogPost',
    title: post.translations.bg.title,
    slug: {_type: 'slug', current: post.slug},
    publishedAt: post.publishedAt,
    isPublished: false,
    sourceUrl: post.sourceUrl,
    cover: post.cover,
    gallery: post.gallery || [],
    tags: post.tags || [],
    translations: post.translations,
  }
  const existing = await client.getDocument(document._id)
  if (existing && !overwriteExisting) {
    console.log('SKIP existing document (idempotent; no overwrite): ' + document._id)
    continue
  }
  if (existing && overwriteExisting && dataset === 'production' && !confirmProduction) {
    throw new Error('Overwriting production documents requires --confirm-production-write.')
  }
  if (existing) await client.createOrReplace(document)
  else await client.createIfNotExists(document)
  console.log((existing ? 'UPDATED ' : 'CREATED ') + document._id + ' (left unpublished)')
}
console.log('Import complete. Documents remain unpublished; publishing is a separate manual action.')
