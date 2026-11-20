import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ui = readFileSync(new URL('../src/manager/ServiceLeadsManager.tsx', import.meta.url), 'utf8')

test('service leads workspace starts with collapsed filters and applies draft filters explicitly', () => {
  assert.match(ui, /\[filtersOpen, setFiltersOpen\] = useState\(false\)/)
  for (const text of ['Филтър', 'Приложи филтъра', 'Изчисти', 'draftQuery', 'draftStatus', 'draftService']) assert.ok(ui.includes(text), text)
})

test('service leads use a single vertical accordion instead of a separate details column', () => {
  assert.match(ui, /aria-expanded=\{isOpen\}/)
  assert.match(ui, /\{isOpen && <div className="border-t/)
  assert.match(ui, />OK<\/button>/)
  assert.doesNotMatch(ui, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(320px,0\.95fr\)\]/)
})

test('service lifecycle statuses have distinct semantic colors', () => {
  for (const [status, color] of [
    ['new', 'bg-red-100'], ['processing', 'bg-orange-100'], ['contacted', 'bg-blue-100'],
    ['proposal_preparing', 'bg-amber-100'], ['proposal_sent', 'bg-orange-100'],
    ['waiting_customer', 'bg-violet-100'], ['approved', 'bg-emerald-100'],
    ['completed', 'bg-green-100'], ['rejected', 'bg-rose-100'],
  ]) {
    assert.ok(ui.includes("value === '" + status + "'") || ui.includes("value === '" + status + "'"), status)
    assert.ok(ui.includes(color), color)
  }
})

test('summary groups reflect service lead workflow stages and clarify that counts are current results', () => {
  for (const text of ['Нови', 'В работа', 'Оферти и отговор', 'С решение', 'заявки в резултатите', 'countFor']) assert.ok(ui.includes(text), text)
})

test('expanded service request preserves customer contacts, assignment, history and internal comments', () => {
  for (const text of ['Клиент', 'Услуга и обект', 'Описание на клиента', 'tel:', 'mailto:', 'Обработка на заявката', 'Отговорник', 'История на заявката', 'Вътрешен коментар', 'Запази коментар']) assert.ok(ui.includes(text), text)
})

test('service lead UI keeps API actions and does not introduce customer file uploads or destructive actions', () => {
  assert.ok(ui.includes("action: 'status'"))
  assert.ok(ui.includes("action: 'assign'"))
  assert.ok(ui.includes("action: 'comment'"))
  assert.doesNotMatch(ui, /type="file"/)
  assert.doesNotMatch(ui, /action: 'delete'/)
})
