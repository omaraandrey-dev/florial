import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const orders=readFileSync(new URL('../src/manager/OrdersManager.tsx',import.meta.url),'utf8')
const api=readFileSync(new URL('../functions/api/manager/orders.ts',import.meta.url),'utf8')
const manager=readFileSync(new URL('../src/manager/ManagerApp.tsx',import.meta.url),'utf8')
const docs=readFileSync(new URL('../functions/api/manager/order-documents.ts',import.meta.url),'utf8')
const helper=readFileSync(new URL('../functions/api/_lib/order-documents.ts',import.meta.url),'utf8')
test('orders workspace starts with collapsed filters and shows a compact four-stage summary',()=>{assert.match(orders,/\[filtersOpen,setFiltersOpen\]=useState\(false\)/);for(const text of ['Нови поръчки','В обработка','Подготвят се','Готови за предаване','Приложи филтъра'])assert.ok(orders.includes(text))})
test('order details expand directly below their own order and close with OK',()=>{assert.match(orders,/selected\?\.id===o\.id&&/);assert.match(orders,/>OK<\/button>/);assert.doesNotMatch(orders,/xl:grid-cols-\[minmax\(0,0\.9fr\)_minmax\(0,1\.1fr\)\]/)})
test('new real orders are counted for the red Manager navigation badge',()=>{assert.match(api,/WHERE is_test=0 AND status IN \('new','processing','preparing','ready'\)/);assert.match(api,/summary\}/);assert.match(manager,/newOrdersCount > 0/);assert.match(orders,/OrdersManager\(\{canEdit,canDeleteTestOrders,isOwner,onNewCountChange\}:Props\)/);assert.match(manager,/onNewCountChange=\{setNewOrdersCount\}/)})
test('order lifecycle badges use distinct colors and only completed plus paid is green',()=>{assert.match(orders,/o\.status==='new'.*bg-red-100/);assert.match(orders,/o\.status==='completed'.*o\.payment_status==='paid'\?'bg-green-100/)})


test('order summary uses two columns and omits the redundant client-list subtitle',()=>{assert.match(orders,/grid grid-cols-2 gap-2 rounded-2xl border/);assert.doesNotMatch(orders,/Работен списък на клиентските поръчки/);assert.doesNotMatch(orders,/Статусът е променен\./)})
test('archive and event history are Owner-only in both UI and API',()=>{assert.match(orders,/isOwner&&<button disabled=\{busy\|\|!\['completed','cancelled'\]\.includes\(selected\.status\)\}/);assert.match(orders,/\{isOwner&&<div className="border-t pt-3"><b>История<\/b>/);assert.ok(api.includes("a.user.role==='owner'?await db.prepare("));assert.match(api,/if\(a\.user\.role!=='owner'\)return json\(\{error:'Само собственикът може да архивира поръчки\.'/);assert.match(manager,/isOwner=\{profile\.role === 'owner'\}/)})
test('editing keeps save/cancel beside edit action and closes the card after cancellation',()=>{assert.match(orders,/edit&&<button type="button" disabled=\{busy\} onClick=\{\(\)=>\{setEdit\(null\);setSelected\(null\);setEvents\(\[\]\);setNote\(''\)\}\}/);assert.doesNotMatch(orders,/Запази редакцията/);assert.match(orders,/grid gap-2 sm:grid-cols-2"><label className=\{field\}>Статус/);})
test('sending a customer proforma attaches the generated PDF and records an event',()=>{assert.match(orders,/documentAction\('email_proforma'\)/);assert.match(docs,/action==='email_proforma'/);assert.match(docs,/filename:'Florial-Proforma-'/);assert.match(docs,/type:'application\/pdf'/);assert.match(docs,/proforma_email_sent/);})

test('proforma email sends the same PDF to customer and owner and returns it for immediate download',()=>{assert.match(docs,/const ownerEmail=\(env\.ORDER_NOTIFICATION_EMAIL\|\|''\)\.trim\(\)/);assert.match(docs,/recipients:\['customer','owner'\]/);assert.match(docs,/return new Response\(pdfBody\.buffer/);assert.match(docs,/X-Florial-Proforma-Delivered/);assert.match(helper,/bcc\?: string\[\]/);assert.match(helper,/\.\.\.\(bcc\?\.length \? \{ bcc \} : \{\}\)/)})
test('order card improves customer contacts, item rows, total hierarchy and combined proforma action',()=>{for(const text of ['Клиент','Поръчани артикули','Общо','mailto:','tel:','Изпрати проформа + свали PDF','loading="lazy"'])assert.ok(orders.includes(text),text)})
