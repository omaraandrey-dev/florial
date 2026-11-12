import assert from 'node:assert/strict'
import test from 'node:test'
import { getBlogServiceRedirectPath } from '../src/lib/blogServiceRedirects.mjs'

const migratedSlugs = [
  'montazh-podmyana-remont-razpruskvachi-nesebar',
  'montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane',
  'montazh-remont-elektromagnitni-klapani',
  'remont-modernizatsiya-polivni-sistemi',
  'godishna-poddruzhka-avtomatichni-sistemi',
  'landshaften-dizain-proekt-zasazhdenie',
  'izgrazhdane-tsvetni-lehi',
  'topiarna-rezitba-rasteniya',
  'podmyana-stara-travna-plosht',
]

for (const slug of migratedSlugs) {
  test(`redirects legacy blog path for ${slug}`, () => {
    assert.equal(getBlogServiceRedirectPath(`/blog/${slug}`), `/services/${slug}`)
  })
}

test('keeps the blog index and unrelated blog articles unchanged', () => {
  assert.equal(getBlogServiceRedirectPath('/blog'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/unrelated-article'), null)
})

test('normalizes a trailing slash and safely decodes a path segment', () => {
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi/'), '/services/izgrazhdane-tsvetni-lehi')
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi%2Fextra'), null)
})
