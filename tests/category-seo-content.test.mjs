import test from 'node:test'
import assert from 'node:assert/strict'
import { selectCategorySeoContent } from '../src/lib/categorySeoContent.mjs'

const bg = [{_type: 'block', style: 'normal', children: [{_type: 'span', text: 'Български текст'}]}]
const ru = [{_type: 'block', style: 'h2', children: [{_type: 'span', text: 'Русский текст'}]}]
const en = [{_type: 'block', style: 'h3', children: [{_type: 'span', text: 'English text'}]}]

test('BG reads the root seoContent field', () => {
  assert.equal(selectCategorySeoContent({seoContent: bg}, 'bg'), bg)
})

test('RU and EN read only their own translated seoContent', () => {
  const category = {seoContent: bg, translations: {ru: {seoContent: ru}, en: {seoContent: en}}}
  assert.equal(selectCategorySeoContent(category, 'ru'), ru)
  assert.equal(selectCategorySeoContent(category, 'en'), en)
})

test('RU/EN do not fall back to Bulgarian content', () => {
  const category = {seoContent: bg, translations: {ru: {}, en: null}}
  assert.equal(selectCategorySeoContent(category, 'ru'), null)
  assert.equal(selectCategorySeoContent(category, 'en'), null)
})

test('missing and empty content return null', () => {
  assert.equal(selectCategorySeoContent({}, 'bg'), null)
  assert.equal(selectCategorySeoContent({seoContent: ''}, 'bg'), null)
  assert.equal(selectCategorySeoContent({seoContent: []}, 'bg'), null)
})

test('missing translations and unsupported locales return null', () => {
  assert.equal(selectCategorySeoContent({seoContent: bg}, 'ru'), null)
  assert.equal(selectCategorySeoContent({translations: null}, 'en'), null)
  assert.equal(selectCategorySeoContent({seoContent: bg}, 'fr'), null)
})

test('arrays without renderable Portable Text blocks return null', () => {
  assert.equal(selectCategorySeoContent({seoContent: [null, {_type: 'image'}]}, 'bg'), null)
  assert.equal(selectCategorySeoContent({seoContent: [{_type: 'block', children: []}]}, 'bg'), null)
})
