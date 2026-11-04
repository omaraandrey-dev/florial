import test from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyRichTextHref,
  convertStringToPortableText,
  getKitComponentDisplayRows,
  hasKitComponents,
  isKitComponentLinkable,
  isSafeRichTextHref,
  toPlainText,
} from '../src/lib/richTextUtils.mjs'

test('string descriptions become paragraphs, headings and bullet list items', () => {
  const blocks = convertStringToPortableText('Първи абзац.\n\nСъстав на комплекта:\n• Контролер — 1 бр.\n- Клапан — 2 бр.\n\nПоследен абзац.')
  assert.equal(blocks[0].style, 'normal')
  assert.equal(blocks[1].style, 'h2')
  assert.equal(blocks[2].listItem, 'bullet')
  assert.equal(blocks[2].children[0].text, 'Контролер — 1 бр.')
  assert.equal(blocks[3].listItem, 'bullet')
  assert.equal(blocks[3].children[0].text, 'Клапан — 2 бр.')
  assert.equal(blocks[4].style, 'normal')
})

test('plain text extraction strips Portable Text marks and joins blocks', () => {
  const text = toPlainText([
    {_type: 'block', children: [{text: 'Bold'}, {text: ' text'}]},
    {_type: 'block', children: [{text: 'Second paragraph'}]},
  ])
  assert.equal(text, 'Bold text\nSecond paragraph')
})

test('unsafe javascript links are rejected', () => {
  assert.equal(isSafeRichTextHref('javascript:alert(1)'), false)
  assert.equal(classifyRichTextHref('javascript:alert(1)'), 'unsafe')
  assert.equal(isSafeRichTextHref('https://example.com/path'), true)
  assert.equal(isSafeRichTextHref('/product/test-item'), true)
  assert.equal(classifyRichTextHref('https://florial-bg.com/product/test-item'), 'internal')
})

test('fractional kit quantities keep decimal precision and local separators', () => {
  assert.equal(formatKitQuantity(0.56, 'bg'), '0,56')
  assert.equal(formatKitQuantity(0.56, 'ru'), '0,56')
  assert.equal(formatKitQuantity(0.56, 'en'), '0.56')
  assert.equal(formatKitQuantity(1, 'bg'), '1')
})

test('kit block renders only for a non-empty array', () => {
  assert.equal(hasKitComponents(undefined), false)
  assert.equal(hasKitComponents(null), false)
  assert.equal(hasKitComponents([]), false)
  assert.equal(hasKitComponents([{quantity: 1}]), true)
})

test('broken references are skipped safely and inactive products are not linkable', () => {
  const rows = getKitComponentDisplayRows([
    {product: null, quantity: 1},
    {product: {_id: 'active', name: 'Контролер', slug: {current: 'controller'}, isActive: true}, quantity: 1},
    {product: {_id: 'inactive', name: 'Клапан', slug: {current: 'valve'}, isActive: false}, quantity: 2},
  ])
  assert.equal(rows.length, 2)
  assert.equal(isKitComponentLinkable(rows[0]), true)
  assert.equal(isKitComponentLinkable(rows[1]), false)
  assert.equal(isKitComponentLinkable({product: null}), false)
})
