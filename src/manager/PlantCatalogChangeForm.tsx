import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { PlantCategory } from './plantCategories'

type Variant = { _key: string; name?: string; priceEUR?: number; saleHeightCm?: number; containerVolumeL?: number }
type Plant = { _id: string; _rev: string; name: string; scientificName?: string; sku?: string; categoryId?: string; saleVariants?: Variant[] }
type CategoryNode = PlantCategory & { parent?: { _id: string; name: string; parent?: { _id: string; name: string } | null } | null }
type Props = { accessToken: string; canAddVariant: boolean; canEditPrice: boolean; initialMode: 'variant' | 'price'; categories: PlantCategory[]; onSubmitted: () => void; onBack: () => void }
const field = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const label = 'block text-sm font-semibold text-stone-700'
const categoryId = (item: PlantCategory) => item._id
function collectCategoryIds(id: string, children: Map<string, PlantCategory[]>): string[] {
  return [id, ...(children.get(id) || []).flatMap((item) => collectCategoryIds(item._id, children))]
}
export default function PlantCatalogChangeForm({ accessToken, canAddVariant, canEditPrice, initialMode, categories, onSubmitted, onBack }: Props) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [plantId, setPlantId] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])
  const [variantKey, setVariantKey] = useState('')
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [container, setContainer] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [stockStatus, setStockStatus] = useState('inStock')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const plant = plants.find((item) => item._id === plantId)
  const variants = plant?.saleVariants || []
  const selected = variants.find((item) => item._key === variantKey)
  const categoryChildren = useMemo(() => {
    const result = new Map<string, PlantCategory[]>()
    categories.forEach((item) => {
      const parentId = item.parent?._id || ''
      result.set(parentId, [...(result.get(parentId) || []), item])
    })
    return result
  }, [categories])
  const visiblePlants = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    const allowed = activeCategory ? new Set(collectCategoryIds(activeCategory, categoryChildren)) : null
    return plants.filter((item) => {
      const matchesSearch = !term || [item.name, item.scientificName, item.sku].some((value) => value?.toLocaleLowerCase().includes(term))
      return matchesSearch && (!allowed || (item.categoryId && allowed.has(item.categoryId)))
    })
  }, [plants, search, activeCategory, categoryChildren])
  useEffect(() => {
    let active = true
    fetch('/api/manager/plant-catalog', { headers: { Authorization: 'Bearer ' + accessToken }, cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as { plants?: Plant[]; error?: string }
        if (!response.ok) throw new Error(result.error || 'Каталогът не може да бъде зареден.')
        if (active) setPlants(result.plants || [])
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Възникна грешка при зареждането на каталога.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [accessToken])
  useEffect(() => { setVariantKey(variants[0]?._key || ''); setPrice(''); setError(''); setNotice('') }, [plantId])
  const renderCategory = (item: PlantCategory, depth = 0) => {
    const children = categoryChildren.get(item._id) || []
    const isExpanded = expanded.includes(item._id)
    const isActive = activeCategory === item._id
    return <div key={item._id}>
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 14 }}>
        {children.length > 0 && <button type="button" aria-label={isExpanded ? 'Свий категорията' : 'Разгъни категорията'} onClick={() => setExpanded((current) => isExpanded ? current.filter((id) => id !== item._id) : [...current, item._id])} className="rounded p-2 text-stone-500 hover:bg-stone-100">{isExpanded ? '▾' : '▸'}</button>}
        {children.length === 0 && <span className="w-9" />}
        <button type="button" onClick={() => { setActiveCategory(isActive ? '' : item._id); setPlantId('') }} className={'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ' + (isActive ? 'bg-lime-100 font-semibold text-lime-950' : 'hover:bg-stone-100')}>
          <span aria-hidden="true">📁</span><span className="truncate">{item.name}</span>
        </button>
      </div>
      {isExpanded && children.map((child) => renderCategory(child, depth + 1))}
    </div>
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!plant) return
    setSaving(true); setError(''); setNotice('')
    try {
      const body = initialMode === 'variant'
        ? { action: 'submitVariant', targetDocumentId: plant._id, targetRevision: plant._rev, name, saleHeightCm: height, containerVolumeL: container, priceEUR: price, stockQuantity: quantity, stockStatus }
        : { action: 'submitPrice', targetDocumentId: plant._id, targetRevision: plant._rev, variantKey, newPriceEUR: price }
      const response = await fetch('/api/manager/plant-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken }, body: JSON.stringify(body) })
      const result = await response.json() as { error?: string; submissionId?: string }
      if (!response.ok || !result.submissionId) throw new Error(result.error || 'Заявката не може да бъде създадена.')
      await fetch('/api/manager/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken }, body: JSON.stringify({ submissionId: result.submissionId }) }).catch(() => undefined)
      setNotice('Заявката е изпратена за одобрение. Каталогът ще се промени след отделното публикуване.')
      setName(''); setHeight(''); setContainer(''); setPrice(''); setQuantity('')
      await onSubmitted()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Заявката не може да бъде изпратена.') }
    finally { setSaving(false) }
  }
  return <section className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">{initialMode === 'variant' ? 'Добавяне на размер / вариант' : 'Промяна на цена'}</h2><p className="mt-1 text-sm text-stone-600">Първо намерете и изберете растение. Формата за промяна ще се отвори след избора.</p></div>
      <button type="button" onClick={onBack} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Назад</button>
    </div>
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 rounded-lg bg-lime-50 p-3 text-sm text-lime-900">{notice}</p>}
    {loading ? <p className="mt-4 text-sm text-stone-500">Зареждане на каталога…</p> : !plants.length ? <p className="mt-4 text-sm text-stone-500">В каталога няма активни растения с варианти за продажба.</p> : <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
      <aside className="space-y-3">
        <label className={label}>Търсене по име, латинско име или SKU<input className={field} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPlantId('') }} placeholder="Въведете име или артикулен код…" /></label>
        <div className="rounded-xl border border-stone-200 p-3">
          <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Каталог на растенията</h3><button type="button" onClick={() => { setActiveCategory(''); setPlantId('') }} className="text-xs font-semibold text-lime-800">Всички</button></div>
          <div className="max-h-80 space-y-1 overflow-y-auto">{categories.filter((item) => !item.parent?._id || item.parent._id === 'plants-root').map((item) => renderCategory(item))}</div>
        </div>
      </aside>
      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Намерени растения</h3><span className="text-xs text-stone-500">{visiblePlants.length} резултата</span></div>
        {visiblePlants.length ? <div className="grid gap-2 sm:grid-cols-2">
          {visiblePlants.map((item) => <button key={item._id} type="button" onClick={() => setPlantId(item._id)} className={'rounded-xl border p-3 text-left transition ' + (plantId === item._id ? 'border-lime-700 bg-lime-50 ring-1 ring-lime-700' : 'border-stone-200 hover:border-lime-600')}>
            <span className="block font-semibold text-stone-900">{item.name}</span>
            {item.scientificName && <span className="mt-1 block text-sm italic text-stone-600">{item.scientificName}</span>}
            <span className="mt-2 block text-xs text-stone-500">{item.sku ? 'SKU: ' + item.sku + ' · ' : ''}{(item.saleVariants || []).length} варианта</span>
          </button>)}
        </div> : <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Няма растения, които отговарят на търсенето и избраната категория.</p>}
      </div>
    </div>}
    {plant && <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-lime-200 bg-lime-50/40 p-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-lime-800">Избрано растение</p><h3 className="mt-1 text-lg font-semibold">{plant.name}</h3>{plant.scientificName && <p className="text-sm italic text-stone-600">{plant.scientificName}</p>}</div>
      {initialMode === 'variant' ? <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>Размер / вариант *<input className={field} value={name} onChange={(event) => setName(event.target.value)} placeholder="Напр.: 120 см / C 25" required /></label>
        <label className={label}>Височина при продажба (см)<input className={field} type="number" min="0.1" step="0.1" value={height} onChange={(event) => setHeight(event.target.value)} /></label>
        <label className={label}>Обем на контейнера (л)<input className={field} type="number" min="0.1" step="0.1" value={container} onChange={(event) => setContainer(event.target.value)} /></label>
        <label className={label}>Цена с ДДС (EUR)<input className={field} type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        <label className={label}>Наличност<select className={field} value={stockStatus} onChange={(event) => setStockStatus(event.target.value)}><option value="inStock">В наличност</option><option value="onRequest">По заявка</option><option value="outOfStock">Изчерпан</option></select></label>
        <label className={label}>Количество<input className={field} type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      </div> : <>
        {!variants.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">За това растение все още няма добавени размери или варианти. Използвайте „Добавяне на размер“.</p>}
        <label className={label}>Вариант<select className={field} value={variantKey} onChange={(event) => setVariantKey(event.target.value)}>{variants.map((item) => <option key={item._key} value={item._key}>{item.name || item._key} · {typeof item.priceEUR === 'number' ? item.priceEUR.toFixed(2) + ' €' : 'Няма зададена цена'}</option>)}</select></label>
        {selected && <p className="text-sm text-stone-600">Текуща цена: {typeof selected.priceEUR === 'number' ? selected.priceEUR.toFixed(2) + ' €' : 'не е зададена'}</p>}
        <label className={label}>Нова цена с ДДС (EUR) *<input className={field} type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
      </>}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setPlantId(''); setPrice(''); setError(''); setNotice('') }} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold">Избери друго растение</button><button disabled={saving || !plant || (initialMode === 'price' && !variants.length)} className="rounded-xl bg-lime-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Изпращане…' : 'Изпрати за одобрение'}</button></div>
    </form>}
  </section>
}
