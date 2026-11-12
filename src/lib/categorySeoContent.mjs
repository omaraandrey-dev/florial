/**
 * Select localized long-form category SEO content.
 * BG uses the category root field; RU/EN use their own translation only.
 */
export function selectCategorySeoContent(category, language) {
  if (!category || typeof category !== 'object') return null

  const content = language === 'bg'
    ? category.seoContent
    : language === 'ru' || language === 'en'
      ? category.translations?.[language]?.seoContent
      : null

  if (!Array.isArray(content)) return null

  const hasRenderableBlock = content.some(block =>
    block?._type === 'block' &&
    Array.isArray(block.children) &&
    block.children.some(child => typeof child?.text === 'string' && child.text.length > 0)
  )

  return hasRenderableBlock ? content : null
}
