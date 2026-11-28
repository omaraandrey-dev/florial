import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const baseUrl = String(process.env.BASE_URL || process.env.PREVIEW_URL || '').replace(/\/+$/, '')
if (!baseUrl) throw new Error('BASE_URL or PREVIEW_URL must point to the exact Florial Preview or Production deployment')

const scripts = [
  'scripts/smoke-homepage-ssr.mjs',
  'scripts/smoke-services-directory-ssr.mjs',
  'scripts/smoke-service-details-ssr.mjs',
  'scripts/smoke-blog-index-ssr.mjs',
  'scripts/smoke-blog-articles-ssr.mjs',
  'scripts/smoke-plant-ssr.mjs',
  'scripts/smoke-equipment-catalog-ssr.mjs',
  'scripts/smoke-equipment-product-ssr.mjs',
  'scripts/smoke-contacts-ssr.mjs',
  'scripts/smoke-header-ssr-seed.mjs',
  'scripts/smoke-about-ssr.mjs',
  'scripts/smoke-seo-surface-ssr.mjs',
]

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const childEnv = { ...process.env, BASE_URL: baseUrl, PREVIEW_URL: baseUrl }

console.log('Florial SSR/SEO regression target: ' + baseUrl)
console.log('Coverage: homepage, services, service details, blog index/articles, plant products/categories, equipment categories/products, contacts and About; BG/RU/EN.')
for (const script of scripts) {
  console.log('\n===== RUN ' + script + ' =====')
  const code = await new Promise((resolveCode, reject) => {
    const child = spawn(process.execPath, [resolve(root, script)], { cwd: root, env: childEnv, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (status, signal) => resolveCode(status === null ? (signal ? 1 : 0) : status))
  })
  if (code !== 0) {
    console.error('FAILED ' + script + ' (exit ' + code + ')')
    process.exit(code || 1)
  }
}
console.log('\nPASS complete Florial SSR/SEO regression — all route groups and locales')
