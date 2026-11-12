import assert from 'node:assert/strict'
import test from 'node:test'
import { getBlogServiceRedirectPath } from '../src/lib/blogServiceRedirects.mjs'

const migratedSlugs = [
  'montazh-podmyana-remont-razpruskvachi-nesebar',
  'montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane',
  'montazh-remont-elektromagnitni-klapani',
  'remont-modernizatsiya-polivni-sistemi',
  'godishna-poddruzhka-avtomatichni-sistemi',
  'izgrazhdane-tsvetni-lehi',
  'topiarna-rezitba-rasteniya',
  'podmyana-stara-travna-plosht',
]

for (const slug of migratedSlugs) {
  test(`redirects legacy blog path for ${slug}`, () => {
    assert.equal(getBlogServiceRedirectPath(`/blog/${slug}`), `/services/${slug}`)
  })
}

test('keeps the blog index, landscape project case study and unrelated articles unchanged', () => {
  assert.equal(getBlogServiceRedirectPath('/blog'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/landshaften-dizain-proekt-zasazhdenie'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/unrelated-article'), null)
})

test('normalizes trailing slashes and safely decodes a single path segment', () => {
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi/'), '/services/izgrazhdane-tsvetni-lehi')
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi%2Fextra'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/%E0%A4%A'), null)
})
