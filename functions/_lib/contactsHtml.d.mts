export type ContactsLanguage = 'bg' | 'ru' | 'en'
export type ContactsImages = { nesebr?: string; ravda?: string }
export function renderContactsHtml(language?: ContactsLanguage, images?: ContactsImages): string
