export type AboutLanguage = 'bg' | 'ru' | 'en'
export interface AboutPageCopy {
  readonly eyebrow: string
  readonly title: string
  readonly subtitle: string
  readonly intro: string
  readonly plantSalesTitle: string
  readonly irrigationEquipmentTitle: string
  readonly approachTitle: string
  readonly steps: readonly string[]
  readonly areasTitle: string
  readonly areas: string
  readonly cta: string
  readonly ctaText: string
}
export interface AboutPhoto {
  slugValue?: string
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
}
export interface AboutCategory {
  slugValue?: string
  imageUrl?: string
}
export interface AboutTeamMember {
  slug: string
  href: string
  title: Record<AboutLanguage, string>
  text: Record<AboutLanguage, string>
}
export interface AboutCentre {
  key: string
  name: Record<AboutLanguage, string>
  address: Record<AboutLanguage, string>
  map: string
}
export interface AboutRenderData {
  photos?: AboutPhoto[]
  categories?: AboutCategory[]
  team?: readonly AboutTeamMember[]
  centres?: readonly AboutCentre[]
}
export function renderAboutHtml(copy: AboutPageCopy, data?: AboutRenderData, language?: AboutLanguage): string
