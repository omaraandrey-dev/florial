import assert from 'node:assert/strict'
import test from 'node:test'
import { getBlogServiceRedirectPath } from '../src/lib/blogServiceRedirects.mjs'

const migratedRoutes = [
  ['montazh-podmyana-remont-razpruskvachi-nesebar', 'montazh-podmyana-remont-razpruskvachi-nesebar'],
  ['montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane', 'montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane'],
  ['montazh-remont-elektromagnitni-klapani', 'montazh-remont-elektromagnitni-klapani'],
  ['remont-modernizatsiya-polivni-sistemi', 'remont-modernizatsiya-polivni-sistemi'],
  ['godishna-poddruzhka-avtomatichni-sistemi', 'godishna-poddruzhka-avtomatichni-sistemi'],
  ['landshaften-dizain-proekt-zasazhdenie', 'landshaften-dizain'],
  ['izgrazhdane-tsvetni-lehi', 'izgrazhdane-tsvetni-lehi'],
  ['topiarna-rezitba-rasteniya', 'topiarna-rezitba-rasteniya'],
  ['podmyana-stara-travna-plosht', 'podmyana-stara-travna-plosht'],
]

for (const [oldSlug, serviceSlug] of migratedRoutes) {
  test(`redirects legacy blog path for ${oldSlug}`, () => {
    assert.equal(getBlogServiceRedirectPath(`/blog/${oldSlug}`), `/services/${serviceSlug}`)
  })
}

test('keeps the blog index and unrelated articles unchanged', () => {
  assert.equal(getBlogServiceRedirectPath('/blog'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/unrelated-article'), null)
})

test('normalizes trailing slashes and safely decodes a single path segment', () => {
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi/'), '/services/izgrazhdane-tsvetni-lehi')
  assert.equal(getBlogServiceRedirectPath('/blog/izgrazhdane-tsvetni-lehi%2Fextra'), null)
  assert.equal(getBlogServiceRedirectPath('/blog/%E0%A4%A'), null)
})
