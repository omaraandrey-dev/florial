import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = JSON.parse(await readFile('public/_routes.json', 'utf8'))
const built = JSON.parse(await readFile('dist/_routes.json', 'utf8'))

assert.deepEqual(built, source, 'Vite build must copy the Pages Functions route manifest unchanged')
assert.equal(built.version, 1)
assert.ok(built.include.includes('/*'))
assert.ok(built.exclude.includes('/assets/*'))
assert.ok(built.exclude.includes('/*.js'))
assert.ok(built.exclude.includes('/*.css'))
assert.ok(!built.exclude.includes('/*.xml'), 'sitemap and RSS function routes must remain included')
assert.ok(!built.exclude.includes('/*.html'), 'SSR HTML routes must remain included')
assert.ok(built.include.length + built.exclude.length <= 100)

console.log('PASS Pages Functions route manifest is present in dist and excludes static assets only')
