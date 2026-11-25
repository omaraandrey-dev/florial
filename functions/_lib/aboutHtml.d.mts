export type AboutLanguage = 'bg' | 'ru' | 'en'
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
  team?: AboutTeamMember[]
  centres?: AboutCentre[]
}
export function renderAboutHtml(copy: Record<string, any>, data?: AboutRenderData, language?: AboutLanguage): string
