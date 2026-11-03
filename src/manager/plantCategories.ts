import { plantsClient } from '../lib/sanity'

export type PlantCategory = {
  _id: string
  name: string
  sortOrder?: number
  parent?: { _id: string; name: string; parent?: { _id: string; name: string } | null } | null
  translations?: { ru?: { name?: string }; en?: { name?: string } }
}

export async function getPlantCategories(): Promise<PlantCategory[]> {
  return plantsClient.fetch<PlantCategory[]>(
    '*[_type == "category" && _id != "plants-root"] | order(sortOrder asc, name asc) { _id, name, sortOrder, parent->{_id, name, parent->{_id, name}}, translations{ru{name}, en{name}} }',
  )
}
