export interface LocaleMessages {
  translations: Record<string, string>
  knownContentTranslations: Record<string, string>
  knownCategoryTranslations: Record<string, { name: string; description: string }>
}
