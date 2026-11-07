import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { generateCategorySeo } from '../src/lib/categorySeo.ts'

const slug = 'nipel-reduktiven-plastmasov-vanshna-rezba'
const category = {
  _id: 'category-test',
  name: 'Пластмасови редуктивни нипели с външна резба',
  slug,
  catalog: 'irrigation',
  translations: {
    ru: { name: 'Пластиковые редукционные ниппели с наружной резьбой' },
    en: { name: 'Plastic Reducing Nipples with Male Thread' },
  },
}

test('category SEO resolves the retained fitting term in Bulgarian, Russian and English', () => {
  const expected = {
    bg: 'Пластмасови редуктивни нипели с външна резба',
    ru: 'Пластиковые редукционные ниппели с наружной резьбой',
    en: 'Plastic Reducing Nipples with Male Thread',
  }

  for (const locale of ['bg', 'ru', 'en']) {
    const result = generateCategorySeo(category, locale)
    assert.ok(result.h1.includes(expected[locale]))
    assert.ok(result.metaTitle.includes(expected[locale]))
    assert.ok(result.metaDescription.includes(expected[locale]))
    assert.ok(result.metaTitle.includes('Florial') || result.metaTitle.includes('Флориал'))
  }
})

test('category SEO source declares the fitting slug only once', async () => {
  const source = await readFile(new URL('../src/lib/categorySeo.ts', import.meta.url), 'utf8')
  const occurrences = source.match(new RegExp(`'${slug}'\\s*:`, 'g')) ?? []
  assert.equal(occurrences.length, 1)
})
