import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { renderContactsHtml } from '../functions/_lib/contactsHtml.mjs'

const images = {
  nesebr: 'https://cdn.sanity.io/images/bxvcy0qs/production/nesebr-1200x800.jpg',
  ravda: 'https://cdn.sanity.io/images/bxvcy0qs/production/ravda-1200x800.jpg',
}

test('renders both garden-centre cards, maps, photos and confirmed daily hours in Bulgarian', () => {
  const html = renderContactsHtml('bg', images)
  assert.match(html, /data-florial-ssr="contacts"/)
  assert.match(html, /Градински център Несебър/)
  assert.match(html, /Градински център Равда/)
  assert.match(html, /ул\. „Хан Крум“/)
  assert.match(html, /с\. Равда, България/)
  assert.match(html, /pK8qGHh9b1xoCc4P9/)
  assert.match(html, /3fiLaRgwSLDTH77U6/)
  assert.match(html, /nesebr-1200x800\.jpg/)
  assert.match(html, /ravda-1200x800\.jpg/)
  assert.equal((html.match(/09:00 – 17:00/g) || []).length, 7)
  assert.match(html, /Неделя/)
  assert.doesNotMatch(html, /18:00|Почивен ден/)
})

test('renders localized Russian and English contacts, including localized map controls and alt text', () => {
  const ru = renderContactsHtml('ru', images)
  assert.match(ru, /Садовый центр Несебр/)
  assert.match(ru, /Садовый центр Равда/)
  assert.match(ru, /Посмотреть на Google Картах/)
  assert.match(ru, /Понедельник/)
  assert.match(ru, /Воскресенье/)
  assert.equal((ru.match(/09:00 – 17:00/g) || []).length, 7)

  const en = renderContactsHtml('en', images)
  assert.match(en, /Garden Centre Nessebar/)
  assert.match(en, /Garden Centre Ravda/)
  assert.match(en, /View on Google Maps/)
  assert.match(en, /Monday/)
  assert.match(en, /Sunday/)
  assert.equal((en.match(/09:00 – 17:00/g) || []).length, 7)
})

test('uses a safe image fallback and does not change existing phone assignments', () => {
  const html = renderContactsHtml('bg', { nesebr: 'javascript:alert(1)', ravda: 'https://example.com/image.jpg' })
  assert.match(html, /Няма изображение/)
  assert.doesNotMatch(html, /javascript:|example\.com/)
  assert.match(html, /tel:\+359876777902/)
  assert.match(html, /tel:\+359885834860/)
  assert.doesNotMatch(html, /tel:\+359877055605/)
})

test('contacts middleware fetches only the two published location photos and emits localized SSR', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /async function fetchContactsHtml\(language: string\)/)
  assert.match(middleware, /sanity\/production\/contacts-location-photos-v1/)
  assert.match(middleware, /renderContactsHtml\(language, images\)/)
  assert.match(middleware, /body = contacts\.html/)
  assert.match(middleware, /path === '\/contacts'/)
  assert.match(middleware, /'https:\/\/schema\.org\/Sunday'/)
})

test('client contacts view stays aligned with SSR daily hours for all seven days', async () => {
  const page = await readFile(new URL('../src/pages/ContactsPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /'Понеделник'.*'Вторник'.*'Сряда'.*'Четвъртък'.*'Петък'.*'Събота'.*'Неделя'/s)
  assert.match(page, /<span>09:00 – 17:00<\/span>/)
  assert.doesNotMatch(page, /18\.00|Почивен ден/)
})
