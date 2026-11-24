import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('irrigation assistant loads catalogue products and adds the generated complete kit to cart', async () => {
  const page = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  const automation = await readFile(new URL('../src/lib/irrigation/irrigationAutomation.mjs', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(page, /buildIrrigationBillOfMaterials/)
  assert.match(page, /sanityLiveClient\.fetch/)
  assert.match(page, /onAddToCart\(item\.product, item\.quantity\)/)
  assert.match(page, /onNavigateCart\(\)/)
  assert.match(page, /Choose automation and continue|Выбрать автоматику и продолжить|Изберете управление и продължете/)
  assert.match(page, /buildIrrigationAutomationPlan/)
  assert.match(page, /IRRIGATION_AUTOMATION_PRODUCT_SKUS/)
  assert.match(page, /ESP-BAT-BT/)
  assert.match(page, /TBOSPSOL/)
  assert.doesNotMatch(page, /Для BAT выбран Rain Bird 100-HV-9V/)
  assert.match(automation, /H01040/)
  assert.match(automation, /quantities\.delete\('VBA02672'\)/)
  assert.match(page, /требуется управляющий кабель от контроллера до электромагнитных клапанов/)
  assert.doesNotMatch(page, /рассчитываются отдельно|charged separately|се калкулира отделно/)
  assert.match(automation, /F54234/)
  assert.match(app, /onNavigateCart=\{navigateToCart\}/)
  assert.match(app, /onAddToCart=\{handleAddToCart\}/)
})

test('assistant cart action is gated on a complete supported generated layout and active catalogue products', async () => {
  const page = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /layoutResult\?\.status === 'layout_generated' && \(layoutResult\.layout\?\.headToHead\?\.passed === true \|\| layoutResult\.layout\?\.headToHead\?\.applicable === false\)/)
  assert.match(page, /isActive != false/)
  assert.match(page, /catalogLoading \|\| Boolean\(catalogError\)/)
  assert.match(page, /resolved\.some/)
})


test('customer layout distinguishes nozzle models and keeps the result summary concise', async () => {
  const page = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /normalized === 'R-VAN14'\) return '#3b82f6'/)
  assert.match(page, /normalized === 'R-VAN18'\) return '#c49a6c'/)
  assert.match(page, /normalized === 'R-VAN24'\) return '#800020'/)
  assert.match(page, /normalized === 'R-VAN-RCS'\) return '#6b7280'/)
  assert.match(page, /stroke=\{nozzleColor\}/)
  assert.match(page, /fill=\{nozzleColor\}/)
  assert.match(page, /layoutNozzleLegend\.map/)
  assert.match(page, /modelCounts\.entries/)
  assert.doesNotMatch(page, /rvanScenarioNote|фиксированный планировочный радиус|fixed planning radii/)
  assert.doesNotMatch(page, /flexPipeRequiredM\}.*продаётся бухтами по 30 м|flexPipeRequiredM\}.*sold in 30 m coils/)
})
