import type { CategoryItem } from '../types'

export type CategoryImageTextKind = 'alt' | 'title'

/** Return category image metadata in the active language without keyword stuffing. */
export function getCategoryImageText(category: CategoryItem, language: string, kind: CategoryImageTextKind): string | undefined {
  const locale = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const localizedName = String(locale === 'bg' ? category.name : category.translations?.[locale]?.name || category.name).trim()
  const localizedValue = kind === 'alt'
    ? locale === 'ru' ? category.imageAltRu : locale === 'en' ? category.imageAltEn : category.imageAlt
    : locale === 'ru' ? category.imageTitleRu : locale === 'en' ? category.imageTitleEn : category.imageTitle
  const value = typeof localizedValue === 'string' ? localizedValue.trim() : ''
  if (value) return value
  return kind === 'alt' ? localizedName || undefined : undefined
}
