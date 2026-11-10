const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export const validatePlantUpdateRequest = body => {
  if (!isRecord(body)) return ['body']
  const invalidFields = []
  if (!uuidPattern.test(String(body.idempotencyKey || ''))) invalidFields.push('idempotencyKey')
  if (!isRecord(body.product)) invalidFields.push('product')
  if (typeof body.expectedRevision !== 'string' || !body.expectedRevision.trim()) invalidFields.push('expectedRevision')
  return invalidFields
}
