import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeContractWithdrawal,
  buildWithdrawalDeclaration,
  isWithdrawalStatus,
  escapeWithdrawalHtml,
  withdrawalStatusLabel,
} from '../functions/api/_lib/contract-withdrawals.mjs'

test('normalizes a valid Bulgarian withdrawal declaration', () => {
  const result = normalizeContractWithdrawal({
    customerName: '  Иван Петров  ',
    contractReference: ' FL-2026-001 ',
    email: ' CUSTOMER@EXAMPLE.COM ',
    locale: 'bg',
    comment: ' Моля, потвърдете получаването. ',
  })
  assert.equal(result.error, undefined)
  assert.deepEqual(result.value, {
    customerName: 'Иван Петров',
    contractReference: 'FL-2026-001',
    customerEmail: 'customer@example.com',
    locale: 'bg',
    customerComment: 'Моля, потвърдете получаването.',
  })
})

test('requires name, contract reference and valid confirmation email', () => {
  assert.equal(normalizeContractWithdrawal({ contractReference: 'A', email: 'a@b.com' }).error, 'NAME_REQUIRED')
  assert.equal(normalizeContractWithdrawal({ customerName: 'A', email: 'a@b.com' }).error, 'REFERENCE_REQUIRED')
  assert.equal(normalizeContractWithdrawal({ customerName: 'A', contractReference: 'A', email: 'not-an-email' }).error, 'EMAIL_INVALID')
  assert.equal(normalizeContractWithdrawal(null).error, 'INVALID_BODY')
})

test('does not require a reason for withdrawal', () => {
  const result = normalizeContractWithdrawal({ customerName: 'Иван', contractReference: 'A-1', email: 'i@example.com' })
  assert.equal(result.error, undefined)
  assert.equal(result.value.customerComment, '')
  assert.match(buildWithdrawalDeclaration({ ...result.value }), /недвусмислено/)
})

test('limits user-controlled text and accepts only supported locales', () => {
  const result = normalizeContractWithdrawal({
    customerName: 'И'.repeat(200),
    contractReference: 'X'.repeat(150),
    email: 'a@example.com',
    locale: 'de',
    comment: 'C'.repeat(1500),
  })
  assert.equal(result.value.customerName.length, 160)
  assert.equal(result.value.contractReference.length, 100)
  assert.equal(result.value.customerComment.length, 1000)
  assert.equal(result.value.locale, 'bg')
})

test('accepts only known Manager workflow statuses', () => {
  assert.equal(isWithdrawalStatus('received'), true)
  assert.equal(isWithdrawalStatus('completed'), true)
  assert.equal(isWithdrawalStatus('rejected'), false)
  assert.equal(isWithdrawalStatus('unknown'), false)
})

test('escapes declaration content before including it in email HTML', () => {
  assert.equal(escapeWithdrawalHtml('<script>"&</script>'), '&lt;script&gt;&quot;&amp;&lt;/script&gt;')
})

test('localizes withdrawal statuses', () => {
  assert.equal(withdrawalStatusLabel('awaiting_return', 'bg'), 'Очаква се връщане')
  assert.equal(withdrawalStatusLabel('awaiting_return', 'ru'), 'Ожидается возврат товара')
  assert.equal(withdrawalStatusLabel('awaiting_return', 'en'), 'Awaiting return')
})
