import test from 'node:test'
import assert from 'node:assert/strict'
import { containsEmailAddress, decodeCloudflareEmail } from '../scripts/lib/cloudflare-email.mjs'

function encodeCloudflareEmail(email, key = 0x42) {
  return key.toString(16).padStart(2, '0') + [...Buffer.from(email)].map((byte) => (byte ^ key).toString(16).padStart(2, '0')).join('')
}

test('accepts a literal email address in the first HTML response', () => {
  assert.equal(containsEmailAddress('<a href="mailto:owner@example.com">owner@example.com</a>', 'owner@example.com'), true)
})

test('decodes Cloudflare data-cfemail markup and verifies the actual address', () => {
  const encoded = encodeCloudflareEmail('owner@example.com')
  assert.equal(decodeCloudflareEmail(encoded), 'owner@example.com')
  assert.equal(containsEmailAddress('<span class="__cf_email__" data-cfemail="' + encoded + '">[email protected]</span>', 'owner@example.com'), true)
})

test('decodes Cloudflare email-protection href markup', () => {
  const encoded = encodeCloudflareEmail('owner@example.com')
  assert.equal(containsEmailAddress('<a href="/cdn-cgi/l/email-protection#' + encoded + '">protected email</a>', 'owner@example.com'), true)
})

test('does not accept an unrelated or malformed protected address', () => {
  const encoded = encodeCloudflareEmail('other@example.com')
  assert.equal(containsEmailAddress('<span data-cfemail="' + encoded + '"></span>', 'owner@example.com'), false)
  assert.equal(containsEmailAddress('<span data-cfemail="xyz"></span>', 'owner@example.com'), false)
})
