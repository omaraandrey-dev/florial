export type OrderedServiceEntry<T> =
  | { kind: 'service'; service: T; order: number }
  | { kind: 'delivery'; order: number }

type ServiceLike = {
  _id: string
  name: string
  slug?: { current?: string } | string
}

const prioritySlugs = [
  'landshaften-dizain',
  'zasazhdane-na-rasteniya',
  'avtomatichno-napoyavane',
  'rulonna-treva',
  'ozelenyavane',
  'avtomatizirano-kapkovo-napoyavane',
  'remont-i-poddrazhka',
  'montaj-avtomatichni-polivni-sistemi-nesebar',
] as const

const priorityBySlug = new Map<string, number>(
  prioritySlugs.map((slug, index) => [slug, index + 1])
)

function getSlug(service: ServiceLike): string {
  return typeof service.slug === 'string' ? service.slug : service.slug?.current || ''
}

/**
 * One shared order for service cards and navigation.
 * The custom delivery/engineer page is entry 9; future services follow it.
 */
export function getOrderedServiceEntries<T extends ServiceLike>(
  services: readonly T[]
): OrderedServiceEntry<T>[] {
  const entries: OrderedServiceEntry<T>[] = services.map((service) => {
    const priority = priorityBySlug.get(getSlug(service))
    return { kind: 'service', service, order: priority ?? 10 } as OrderedServiceEntry<T>
  })

  entries.push({ kind: 'delivery', order: 9 })

  return entries.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    if (a.kind === 'delivery' || b.kind === 'delivery') return a.kind === 'delivery' ? -1 : 1
    const aSlug = getSlug(a.service)
    const bSlug = getSlug(b.service)
    return aSlug.localeCompare(bSlug, 'bg')
      || a.service.name.localeCompare(b.service.name, 'bg')
      || a.service._id.localeCompare(b.service._id, 'bg')
  })
}
