function makeKey(prefix, index, text) {
  let hash = 2166136261
  const input = String(index) + ':' + String(text)
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619)
  }
  return prefix + '-' + index + '-' + (hash >>> 0).toString(36)
}

export function convertStringToPortableText(value, headingStyle = 'h2') {
  if (typeof value !== 'string' || !value.trim()) return []

  const paragraphs = value.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/)
  const blocks = []
  let blockIndex = 0

  const addBlock = (text, style = 'normal', listItem) => {
    const cleanText = String(text || '').trim()
    if (!cleanText) return
    const block = {
      _type: 'block',
      _key: makeKey('block', blockIndex, cleanText),
      style,
      markDefs: [],
      children: [{
        _type: 'span',
        _key: makeKey('span', blockIndex, cleanText),
        marks: [],
        text: cleanText,
      }],
    }
    if (listItem) {
      block.listItem = listItem
      block.level = 1
    }
    blocks.push(block)
    blockIndex += 1
  }

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map(line => line.trim()).filter(Boolean)
    let normalLines = []
    const flushNormal = () => {
      if (normalLines.length) addBlock(normalLines.join(' '), 'normal')
      normalLines = []
    }

    for (const line of lines) {
      const bullet = line.match(/^(?:•|-)\s*(.+)$/)
      if (bullet) {
        flushNormal()
        addBlock(bullet[1], 'normal', 'bullet')
        continue
      }

      if (line.length <= 80 && /:\s*$/.test(line)) {
        flushNormal()
        addBlock(line, headingStyle)
        continue
      }

      normalLines.push(line)
    }

    flushNormal()
  }

  return blocks
}

export function preferFormattedDescription(formattedDescription, legacyDescription) {
  return Array.isArray(formattedDescription) && formattedDescription.length > 0
    ? formattedDescription
    : legacyDescription
}

export function toPlainText(value) {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value
    .map(block => Array.isArray(block?.children)
      ? block.children.map(child => typeof child?.text === 'string' ? child.text : '').join('')
      : '')
    .filter(Boolean)
    .join('\n')
}

export function classifyRichTextHref(href) {
  if (typeof href !== 'string') return 'unsafe'
  const value = href.trim()
  if (!value || value.startsWith('//')) return 'unsafe'
  if (value.startsWith('/')) return 'internal'
  if (value.startsWith('#') || value.startsWith('?')) return 'anchor'

  let url
  try {
    url = new URL(value, 'https://florial-bg.com')
  } catch {
    return 'unsafe'
  }

  if (url.username || url.password) return 'unsafe'
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') return 'contact'
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'unsafe'

  const hostname = url.hostname.toLowerCase()
  if (hostname === 'florial-bg.com' || hostname === 'www.florial-bg.com') return 'internal'
  return 'external'
}

export function isSafeRichTextHref(href) {
  return classifyRichTextHref(href) !== 'unsafe'
}

export function formatKitQuantity(quantity, language = 'bg') {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) return ''
  const locale = language === 'en' ? 'en-GB' : language === 'ru' ? 'ru-RU' : 'bg-BG'
  return new Intl.NumberFormat(locale, {maximumFractionDigits: 6}).format(quantity)
}

export function hasKitComponents(value) {
  return Array.isArray(value) && value.length > 0
}

export function getKitComponentDisplayRows(value) {
  if (!Array.isArray(value)) return []
  return value.filter(item =>
    item &&
    item.product &&
    typeof item.product.name === 'string' &&
    item.product.name.trim().length > 0
  )
}

export function isKitComponentLinkable(item) {
  const product = item?.product
  const slug = typeof product?.slug === 'string' ? product.slug : product?.slug?.current
  return Boolean(product && product.isActive !== false && typeof slug === 'string' && slug.trim())
}
