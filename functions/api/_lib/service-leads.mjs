export const cleanLeadText = (value, maxLength = 1000) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

export const isValidLeadEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isValidLeadPhone = (value) =>
  typeof value === 'string' && value.length >= 5 && value.length <= 50 &&
  /^[+0-9(). -]+$/.test(value) && value.replace(/\D/g, '').length >= 5

export const normalizeLeadFields = (configuredFields, suppliedFields) => {
  if (!Array.isArray(configuredFields) || !configuredFields.length ||
      !suppliedFields || typeof suppliedFields !== 'object' || Array.isArray(suppliedFields)) {
    return { values: null, error: 'invalid_form_configuration' }
  }
  const values = {}
  for (const field of configuredFields) {
    const name = typeof field?.name === 'string' ? field.name.trim() : ''
    if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name)) {
      return { values: null, error: 'invalid_form_configuration' }
    }
    const value = cleanLeadText(suppliedFields[name], name === 'details' || name === 'comment' ? 3000 : 1000)
    if (field.required && !value) return { values: null, error: 'required_field_missing', field: name }
    if (field.type === 'email' && value && !isValidLeadEmail(value)) {
      return { values: null, error: 'invalid_email', field: name }
    }
    if (field.type === 'tel' && value && !isValidLeadPhone(value)) {
      return { values: null, error: 'invalid_phone', field: name }
    }
    values[name] = value
  }
  return { values, error: null }
}
