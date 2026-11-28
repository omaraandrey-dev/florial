import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('legacy cart weight metadata is read through the published Sanity API CDN client', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const weightEffect = app.match(/Older persisted carts[\s\S]*?Refresh missing equipment weights[\s\S]*?\n  \}, \[isCartOpen, cart\]\)/)

  assert.ok(weightEffect, 'cart weight fallback effect should remain present')
  assert.match(weightEffect[0], /sanityClient\.fetch\(/)
  assert.doesNotMatch(weightEffect[0], /sanityLiveClient\.fetch\(|plantsClient\.fetch\(/)
  assert.match(weightEffect[0], /\{_id, weightKg\}/)
})
