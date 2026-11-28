import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('services directory combines service cards and role photos in one published dataset query', async () => {
  const source = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const start = source.indexOf("if (path === '/services')")
  const end = source.indexOf("if (path.startsWith('/services/')", start)
  const directory = source.slice(start, end)

  assert.match(directory, /const servicesDirectoryQuery = `\{/)
  assert.match(directory, /"services": \$\{serviceQuery\}/)
  assert.match(directory, /"rolePhotos": \$\{serviceRolePhotosQuery\}/)
  assert.match(directory, /services\/directory-combined-v2/)
  assert.equal((directory.match(/querySanityData</g) || []).length, 1)
})
