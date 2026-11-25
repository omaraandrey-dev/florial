export function decodeCloudflareEmail(value) {
  const encoded = String(value || '').trim()
  if (!/^[a-f0-9]+$/i.test(encoded) || encoded.length < 4 || encoded.length % 2 !== 0) return ''
  const key = Number.parseInt(encoded.slice(0, 2), 16)
  if (!Number.isFinite(key)) return ''
  let decoded = ''
  for (let index = 2; index < encoded.length; index += 2) {
    const byte = Number.parseInt(encoded.slice(index, index + 2), 16)
    if (!Number.isFinite(byte)) return ''
    decoded += String.fromCharCode(byte ^ key)
  }
  return decoded
}

export function containsEmailAddress(html, email) {
  const source = String(html || '')
  const expected = String(email || '').trim().toLowerCase()
  if (!expected) return false
  if (source.toLowerCase().includes(expected)) return true

  const encodedValues = [
    ...source.matchAll(/data-cfemail=["']([a-f0-9]+)["']/gi),
    ...source.matchAll(/\/cdn-cgi\/l\/email-protection#([a-f0-9]+)/gi),
  ].map((match) => match[1])

  return encodedValues.some((encoded) => decodeCloudflareEmail(encoded).toLowerCase() === expected)
}
