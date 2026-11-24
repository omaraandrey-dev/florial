export type HomepageServiceEntry =
  | { kind: 'delivery' }
  | { kind: 'service'; service: Record<string, unknown> }

export interface HomepageRenderData {
  equipmentCategories?: Array<Record<string, unknown>>
  plantCategories?: Array<Record<string, unknown>>
  featuredPlants?: Array<Record<string, unknown>>
  featuredEquipment?: Array<Record<string, unknown>>
  serviceEntries?: HomepageServiceEntry[]
  heroImageUrl?: string | null
  pinnedPosts?: Array<Record<string, unknown>>
  latestPosts?: Array<Record<string, unknown>>
}

export function renderHomepageHtml(data: HomepageRenderData, language?: 'bg' | 'ru' | 'en'): string
export function homepageSelectionForTest(data: HomepageRenderData): {
  plantCategories: string[]
  equipmentCategories: Array<string | undefined>
  plants: Array<string | undefined>
  equipment: Array<string | undefined>
}
