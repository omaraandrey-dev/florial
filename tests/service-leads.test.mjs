import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanLeadText, isValidLeadEmail, isValidLeadPhone, normalizeLeadFields } from '../functions/api/_lib/service-leads.mjs'

test('cleanLeadText trims and bounds submitted text', () => {
  assert.equal(cleanLeadText('  hello  ', 5), 'hello')
  assert.equal(cleanLeadText(42), '')
})

test('lead email and phone validation accepts expected Bulgarian contact formats', () => {
  assert.equal(isValidLeadEmail('client@example.com'), true)
  assert.equal(isValidLeadEmail('not-an-email'), false)
  assert.equal(isValidLeadPhone('+359 888 123 456'), true)
  assert.equal(isValidLeadPhone('abc123'), false)
})

test('normalizeLeadFields keeps only configured fields and validates required values', () => {
  const result = normalizeLeadFields([
    { name: 'name', required: true, type: 'text' },
    { name: 'phone', required: true, type: 'tel' },
    { name: 'email', required: false, type: 'email' },
    { name: 'details', required: false, type: 'textarea' },
  ], {
    name: ' Client ',
    phone: '+359 888 123 456',
    email: 'client@example.com',
    details: 'Garden project',
    injected: 'must not be stored',
  })
  assert.equal(result.error, null)
  assert.deepEqual(result.values, {
    name: 'Client',
    phone: '+359 888 123 456',
    email: 'client@example.com',
    details: 'Garden project',
  })
})

test('normalizeLeadFields rejects missing required fields and malformed contacts', () => {
  assert.equal(normalizeLeadFields([{ name: 'name', required: true }], {}).error, 'required_field_missing')
  assert.equal(normalizeLeadFields([{ name: 'email', type: 'email' }], { email: 'bad' }).error, 'invalid_email')
  assert.equal(normalizeLeadFields([{ name: 'phone', type: 'tel' }], { phone: 'abc' }).error, 'invalid_phone')
})
