export interface ServicesRssItem {
  name?: string
  slug?: string
  shortDescription?: string
  seoDescription?: string
  updatedAt?: string
}

export function escapeXml(value: unknown): string
export function buildServicesRssXml(options: {
  items: ServicesRssItem[]
  feedUrl: string
  now?: Date
}): string
