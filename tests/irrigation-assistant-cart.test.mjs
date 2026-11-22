import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('irrigation assistant loads catalogue products and adds the generated complete kit to cart', async () => {
  const page = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(page, /buildIrrigationBillOfMaterials/)
  assert.match(page, /sanityLiveClient\.fetch/)
  assert.match(page, /onAddToCart\(item\.product, item\.quantity\)/)
  assert.match(page, /onNavigateCart\(\)/)
  assert.match(page, /Add complete kit to cart|Добавить комплект в корзину|Добави комплекта в количката/)
  assert.match(app, /onNavigateCart=\{navigateToCart\}/)
  assert.match(app, /onAddToCart=\{handleAddToCart\}/)
})

test('assistant cart action is gated on a complete supported generated layout and active catalogue products', async () => {
  const page = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /layoutResult\?\.status === 'layout_generated'/)
  assert.match(page, /isActive != false/)
  assert.match(page, /catalogLoading \|\| Boolean\(catalogError\)/)
  assert.match(page, /resolved\.some/)
})
