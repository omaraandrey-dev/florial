export type ProductImageTextKind = 'title' | 'alt'

const IMAGE_LOCATIONS = [
  { bg: 'Несебър', ru: 'Несебре', en: 'Nessebar' },
  { bg: 'Равда', ru: 'Равде', en: 'Ravda' },
  { bg: 'Слънчев бряг', ru: 'Солнечном Берегу', en: 'Sunny Beach' },
  { bg: 'Свети Влас', ru: 'Свети-Власе', en: 'Sveti Vlas' },
  { bg: 'Поморие', ru: 'Поморие', en: 'Pomorie' },
] as const

/** Generate localized product image title/alt without relying on Sanity fields. */
export function getProductImageText(productName: string, language: string, imageIndex: number, kind: ProductImageTextKind): string {
  const locale = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const location = IMAGE_LOCATIONS[Math.max(0, imageIndex) % IMAGE_LOCATIONS.length][locale]
  const name = productName.trim()
  if (locale === 'ru') return kind === 'title' ? `Продажа ${name} в ${location}` : `Купить ${name} в ${location}`
  if (locale === 'en') return kind === 'title' ? `${name} for sale in ${location}` : `Buy ${name} in ${location}`
  return kind === 'title' ? `Продажба на ${name} в ${location}` : `Купете ${name} в ${location}`
}