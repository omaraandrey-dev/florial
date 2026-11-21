import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('About page presents localized company and bank details before the process section', async () => {
  const source = await readFile(new URL('../src/pages/AboutPage.tsx', import.meta.url), 'utf8')
  const companySection = source.indexOf('aria-labelledby="about-company-details-heading"')
  const processSection = source.indexOf('{copy.approachTitle}')

  assert.notEqual(companySection, -1, 'company details section exists')
  assert.notEqual(processSection, -1, 'process section exists')
  assert.ok(companySection < processSection, 'company details appear before From idea to care')
  for (const value of [
    '206978288',
    'BG206978288',
    'Десислав Бараков',
    'BG88STSA93000029605234',
    'STSABGSF',
    '+359 876 777 902',
    'barakov1971@abv.bg',
    'Черно море',
    'Хан Крум',
  ]) {
    assert.ok(source.includes(value), `company detail is present: ${value}`)
  }

  assert.match(source, /navigator\.clipboard\.writeText\('BG88STSA93000029605234'\)/)
  assert.match(source, /Копирай IBAN/)
  assert.match(source, /Copy IBAN/)
  assert.match(source, /Копировать IBAN/)
  assert.match(source, /Company and bank details/)
  assert.match(source, /Юридические и банковские реквизиты/)
})
