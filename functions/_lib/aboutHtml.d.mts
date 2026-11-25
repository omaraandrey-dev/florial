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
export interface AboutRenderData {
  photos?: AboutPhoto[]
  categories?: AboutCategory[]
}
export function renderAboutHtml(copy: Record<string, any>, data?: AboutRenderData, language?: AboutLanguage): string
