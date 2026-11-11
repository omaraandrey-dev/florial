export const normalizeContractWithdrawal = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'INVALID_BODY' }
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 160) : ''
  const contractReference = typeof body.contractReference === 'string' ? body.contractReference.trim().slice(0, 100) : ''
  const customerEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
  const locale = body.locale === 'ru' || body.locale === 'en' ? body.locale : 'bg'
  const customerComment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : ''
  if (!customerName) return { error: 'NAME_REQUIRED' }
  if (!contractReference) return { error: 'REFERENCE_REQUIRED' }
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return { error: 'EMAIL_INVALID' }
  return { value: { customerName, contractReference, customerEmail, locale, customerComment } }
}

export const buildWithdrawalDeclaration = ({ customerName, contractReference, customerComment, locale = 'bg' }) => {
  const text = locale === 'ru'
    ? 'Настоящим однозначно заявляю о желании отказаться от договора, идентифицированного следующим образом: '
    : locale === 'en'
      ? 'I hereby unequivocally declare that I wish to withdraw from the contract identified as: '
      : 'С настоящото заявявам недвусмислено, че желая да се откажа от договор, идентифициран с: '
  const name = locale === 'ru' ? '. Имя потребителя: ' : locale === 'en' ? '. Consumer name: ' : '. Име на потребителя: '
  const extra = locale === 'ru' ? ' Дополнительная информация: ' : locale === 'en' ? ' Additional information: ' : ' Допълнителна информация: '
  const base = text + contractReference + name + customerName + '.'
  return customerComment ? base + extra + customerComment : base
}

export const isWithdrawalStatus = (value) =>
  ['received', 'review_required', 'awaiting_return', 'refund_in_progress', 'completed'].includes(value)

export const escapeWithdrawalHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character)

export const withdrawalStatusLabel = (status, locale = 'bg') => {
  const labels = {
    received: ['Получено', 'Получено', 'Received'],
    review_required: ['Нужна е проверка', 'Требуется проверка', 'Review required'],
    awaiting_return: ['Очаква се връщане', 'Ожидается возврат товара', 'Awaiting return'],
    refund_in_progress: ['Възстановяване в процес', 'Возврат средств в обработке', 'Refund in progress'],
    completed: ['Приключено', 'Завершено', 'Completed'],
  }
  const index = locale === 'ru' ? 1 : locale === 'en' ? 2 : 0
  return labels[status]?.[index] || status
}
