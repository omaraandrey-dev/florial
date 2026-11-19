import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const orders=readFileSync(new URL('../src/manager/OrdersManager.tsx',import.meta.url),'utf8')
const api=readFileSync(new URL('../functions/api/manager/orders.ts',import.meta.url),'utf8')
const manager=readFileSync(new URL('../src/manager/ManagerApp.tsx',import.meta.url),'utf8')
test('orders workspace starts with collapsed filters and shows a compact four-stage summary',()=>{assert.match(orders,/\[filtersOpen,setFiltersOpen\]=useState\(false\)/);for(const text of ['Нови поръчки','В обработка','Подготвят се','Готови за предаване','Приложи филтъра'])assert.ok(orders.includes(text))})
test('order details expand directly below their own order and close with OK',()=>{assert.match(orders,/selected\?\.id===o\.id&&/);assert.match(orders,/>OK<\/button>/);assert.doesNotMatch(orders,/xl:grid-cols-\[minmax\(0,0\.9fr\)_minmax\(0,1\.1fr\)\]/)})
test('new real orders are counted for the red Manager navigation badge',()=>{assert.match(api,/WHERE is_test=0 AND status IN \('new','processing','preparing','ready'\)/);assert.match(api,/summary\}/);assert.match(manager,/newOrdersCount > 0/);assert.match(orders,/OrdersManager\(\{canEdit,canDeleteTestOrders,onNewCountChange\}:Props\)/);assert.match(manager,/onNewCountChange=\{setNewOrdersCount\}/)})
test('order lifecycle badges use distinct colors and only completed plus paid is green',()=>{assert.match(orders,/o\.status==='new'.*bg-red-100/);assert.match(orders,/o\.status==='completed'.*o\.payment_status==='paid'\?'bg-green-100/)})
