export type OrderedServiceEntry<T> =
  | { kind: 'service'; service: T; order: number }
  | { kind: 'delivery'; order: number }

type ServiceLike = {
  _id: string
  name: string
  sortOrder?: number
  slug?: { current?: string } | string
}

function getSlug(service: ServiceLike): string {
  return typeof service.slug === 'string' ? service.slug : service.slug?.current || ''
}

/**
 * Service order is managed in Sanity through sortOrder.
 * The delivery/engineer card remains a separate legacy entry until Stage 3.
 */
export function getOrderedServiceEntries<T extends ServiceLike>(
  services: readonly T[]
): OrderedServiceEntry<T>[] {
  const entries: OrderedServiceEntry<T>[] = services.map((service) => ({
    kind: 'service',
    service,
    order: Number.isFinite(service.sortOrder) ? Number(service.sortOrder) : 1000,
  }))

  entries.push({ kind: 'delivery', order: 90 })

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