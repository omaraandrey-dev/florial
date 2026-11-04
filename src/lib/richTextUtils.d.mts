export type RichTextLinkKind = 'internal' | 'external' | 'contact' | 'anchor' | 'unsafe'
export interface PortableTextSpan {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}
export interface PortableTextBlock {
  _type?: string
  _key?: string
  style?: string
  listItem?: 'bullet' | 'number'
  level?: number
  children?: PortableTextSpan[]
  markDefs?: Array<{_key?: string; _type?: string; href?: string}>
}
export function convertStringToPortableText(value: string, headingStyle?: 'h2' | 'h3'): PortableTextBlock[]
export function toPlainText(value: unknown): string
export function classifyRichTextHref(href: unknown): RichTextLinkKind
export function isSafeRichTextHref(href: unknown): boolean
export function formatKitQuantity(quantity: unknown, language?: 'bg' | 'ru' | 'en'): string
export function hasKitComponents(value: unknown): boolean
export function getKitComponentDisplayRows<T = any>(value: unknown): T[]
export function isKitComponentLinkable(value: any): boolean
