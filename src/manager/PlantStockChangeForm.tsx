import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { PlantCategory } from './plantCategories'

type Variant = {
  _key: string
  name?: string
  saleHeightCm?: number
  containerVolumeL?: number
  stockQuantity?: number | null
}
type Plant = {
  _id: string
  _rev: string
  name: string
  scientificName?: string
  sku?: string
  categoryId?: string
  stockQuantity?: number | null
  saleVariants?: Variant[]
}
type StockRow = {
  id: string
  plant: Plant
  variantKey: string
  label: string
  quantity: number | null
}
type Props = { accessToken: string; categories: PlantCategory[]; onBack: () => void }
const field = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const labelClass = 'block text-sm font-semibold text-stone-700'

const variantLabel = (variant: Variant) => variant.name || [
  typeof variant.saleHeightCm === 'number' ? variant.saleHeightCm + ' см' : '',
  typeof variant.containerVolumeL === 'number' ? 'C' + variant.containerVolumeL : '',
].filter(Boolean).join(' · ') || 'Вариант без названия'

export default function PlantStockChangeForm({ accessToken, categories, onBack }: Props) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [newQuantity, setNewQuantity] = useState('')

  const loadCatalog = async () => {
    const response = await fetch('/api/manager/plant-catalog', {
      headers: { Authorization: 'Bearer ' + accessToken },
      cache: 'no-store',
    })
    const result = await response.json() as { plants?: Plant[]; error?: string }
    if (!response.ok || !Array.isArray(result.plants)) throw new Error(result.error || 'Каталогът не може да бъде зареден.')
    setPlants(result.plants)
  }

  useEffect(() => {
    let active = true
    fetch('/api/manager/plant-catalog', {
      headers: { Authorization: 'Bearer ' + accessToken },
      cache: 'no-store',
    })
      .then(async (response) => {
        const result = await response.json() as { plants?: Plant[]; error?: string }
        if (!response.ok || !Array.isArray(result.plants)) throw new Error(result.error || 'Каталогът не може да бъде зареден.')
        if (active) setPlants(result.plants)
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Възникна грешка при зареждането на каталога.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [accessToken])

  const categoryChildren = useMemo(() => {
    const result = new Map<string, PlantCategory[]>()
    categories.forEach((item) => {
      const parentId = item.parent?._id || ''
      result.set(parentId, [...(result.get(parentId) || []), item])
    })
    return result
  }, [categories])

  const categoryOptions = useMemo(() => {
    const output: Array<{ id: string; label: string }> = []
    const visit = (items: PlantCategory[], depth: number) => items.forEach((item) => {
      output.push({ id: item._id, label: '— '.repeat(depth) + item.name })
      visit(categoryChildren.get(item._id) || [], depth + 1)
    })
    visit(categories.filter((item) => !item.parent?._id || item.parent._id === 'plants-root'), 0)
    return output
  }, [categories, categoryChildren])

  const allowedCategoryIds = useMemo(() => {
    if (!activeCategory) return null
    const collect = (id: string): string[] => [id, ...(categoryChildren.get(id) || []).flatMap((item) => collect(item._id))]
    return new Set(collect(activeCategory))
  }, [activeCategory, categoryChildren])

  const rows = useMemo<StockRow[]>(() => plants.flatMap((plant) => {
    if (plant.saleVariants?.length) return plant.saleVariants.map((variant) => ({
      id: plant._id + '::' + variant._key,
      plant,
      variantKey: variant._key,
      label: variantLabel(variant),
      quantity: typeof variant.stockQuantity === 'number' ? variant.stockQuantity : null,
    }))
    return [{
      id: plant._id + '::legacy',
      plant,
      variantKey: '',
      label: 'Стандартен размер',
      quantity: typeof plant.stockQuantity === 'number' ? plant.stockQuantity : null,
    }]
  }).filter((row) => {
    const term = search.trim().toLocaleLowerCase()
    const matchesSearch = !term || [row.plant.name, row.plant.scientificName, row.plant.sku, row.label]
      .some((value) => value?.toLocaleLowerCase().includes(term))
    const matchesCategory = !allowedCategoryIds || (!!row.plant.categoryId && allowedCategoryIds.has(row.plant.categoryId))
    return matchesSearch && matchesCategory
  }), [plants, search, allowedCategoryIds])

  const selected = rows.find((row) => row.id === selectedId)

  const chooseRow = (row: StockRow) => {
    setSelectedId(row.id)
    setNewQuantity(String(row.quantity ?? 0))
    setError('')
    setNotice('')
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    const quantity = Number(newQuantity)
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setError('Количеството трябва да бъде цяло неотрицателно число.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/manager/plant-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
        body: JSON.stringify({
          action: 'updateStock',
          targetDocumentId: selected.plant._id,
          targetRevision: selected.plant._rev,
          variantKey: selected.variantKey || undefined,
          stockQuantity: quantity,
        }),
      })
      const result = await response.json() as { error?: string; stockQuantity?: number }
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Количеството не беше променено.')
      setNewQuantity(String(quantity))
      try {
        await loadCatalog()
        setNotice('Количеството е обновено директно в каталога.')
      } catch {
        setNotice('Количеството е записано. Обновете каталога, за да видите актуалната версия.')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не успяхме да запазим количеството.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Промяна на количеството на растенията</h2>
        <p className="mt-1 text-sm text-stone-600">Изберете растение или конкретен вариант. Новото количество се записва директно в каталога без одобрение.</p>
      </div>
      <button type="button" onClick={onBack} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Назад</button>
    </div>

    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 rounded-lg bg-lime-50 p-3 text-sm text-lime-900">{notice}</p>}

    {loading ? <p className="mt-5 text-sm text-stone-500">Зареждане на каталога…</p> : !selected ? <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>Търсене по име, латинско име или SKU
          <input className={field} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Въведете име или артикулен код…" />
        </label>
        <label className={labelClass}>Категория / подкатегория
          <select className={field} value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
            <option value="">Всички категории</option>
            {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Наличности в каталога</h3>
        <span className="text-xs text-stone-500">{rows.length} позиции</span>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-stone-200">
        {rows.length ? <div className="max-h-[560px] divide-y divide-stone-100 overflow-y-auto">
          {rows.map((row) => <button key={row.id} type="button" onClick={() => chooseRow(row)} className="flex w-full items-center gap-4 px-3 py-3 text-left transition hover:bg-lime-50 sm:px-4">
            <span className="w-12 shrink-0 text-center text-lg font-semibold tabular-nums text-stone-900">{row.quantity ?? '—'}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-stone-900">{row.plant.name}</span>
              <span className="mt-0.5 block truncate text-sm text-stone-600">{row.plant.saleVariants?.length ? row.label : row.label}{row.plant.sku ? ' · SKU ' + row.plant.sku : ''}</span>
              {row.plant.scientificName && <span className="mt-0.5 block truncate text-xs italic text-stone-500">{row.plant.scientificName}</span>}
            </span>
            <span className="shrink-0 text-sm font-semibold text-lime-800">Избери</span>
          </button>)}
        </div> : <p className="p-8 text-center text-sm text-stone-500">Няма растения за избраното търсене и категория.</p>}
      </div>
    </> : <form onSubmit={save} className="mt-5 rounded-xl border border-lime-200 bg-lime-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">Избрана позиция</p>
          <h3 className="mt-1 text-lg font-semibold">{selected.plant.name}</h3>
          <p className="mt-1 text-sm text-stone-700">{selected.label}</p>
          {selected.plant.scientificName && <p className="text-sm italic text-stone-500">{selected.plant.scientificName}</p>}
          {selected.plant.sku && <p className="mt-1 text-xs text-stone-500">SKU: {selected.plant.sku}</p>}
        </div>
        <button type="button" onClick={() => { setSelectedId(''); setError(''); setNotice('') }} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold">Назад к каталогу</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <span className="block text-xs text-stone-500">Текущо количество</span>
          <strong className="mt-1 block text-2xl tabular-nums">{selected.quantity ?? 'Не е зададено'}</strong>
        </div>
        <label className={labelClass}>Ново количество
          <input className={field} type="number" inputMode="numeric" min="0" step="1" value={newQuantity} onChange={(event) => setNewQuantity(event.target.value)} required />
          <span className="mt-1 block text-xs font-normal text-stone-500">Въведете цяло число 0 или повече. Стойността заменя текущия остатък.</span>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-lime-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : 'Запази количеството'}</button>
      </div>
    </form>}
  </section>
}
