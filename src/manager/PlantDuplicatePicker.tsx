import { useEffect, useState } from 'react'

type DuplicateVariant = { _key?: string; name?: string; priceEUR?: number; saleHeightCm?: number | null; containerVolumeL?: number | null }
type DuplicateProduct = {
  _id: string
  _rev: string
  name: string
  scientificName?: string
  categoryName?: string
  thumbnail?: string
  variants: DuplicateVariant[]
}
type DuplicateImage = { assetId: string; url: string; alt?: string; altEn?: string; altRu?: string }
type PendingOperation = { fingerprint: string; idempotencyKey: string; variantKey: string }
type Props = {
  plantName: string
  scientificNames: string[]
  proof: string | null
  proofAssetId: string
  image: DuplicateImage | null
  onAdded: (result: { productName: string; imageAdded: boolean; imageAlreadyPresent?: boolean }) => void
}
const money = (value: number) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(value)
const responseJson = async (response: Response) => response.json().catch(() => ({}))

export default function PlantDuplicatePicker({ plantName, scientificNames, proof, proofAssetId, image, onAdded }: Props) {
  const [items, setItems] = useState<DuplicateProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<DuplicateProduct | null>(null)
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | null>(null)

  const scientificKey = scientificNames.filter(Boolean).slice(0, 3).join('|')
  useEffect(() => {
    const name = plantName.trim()
    const candidates = scientificKey.split('|').filter(Boolean)
    if (!name && !candidates.length) {
      setItems([])
      return
    }
    const controller = new AbortController()
    const params = new URLSearchParams()
    if (name) params.set('name', name)
    candidates.forEach(value => params.append('scientificName', value))
    setLoading(true)
    setItems([])
    setSelected(null)
    setOpen(false)
    setError('')
    void fetch('/api/manager/plants/duplicates?' + params.toString(), {
      credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
    }).then(async response => {
      const result = await responseJson(response)
      if (!response.ok) throw new Error(result.error || 'Не успяхме да проверим каталога.')
      setItems(Array.isArray(result.items) ? result.items : [])
    }).catch(reason => {
      if (reason instanceof Error && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : 'Не успяхме да проверим каталога.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [plantName, scientificKey, refreshKey])

  const canSave = Boolean(selected && size.trim().length >= 2 && Number.isFinite(Number(price)) && Number(price) > 0 && proof && image && image.assetId === proofAssetId && !saving && (selected.variants?.length || 0) < 30)

  const addVariant = async () => {
    if (!selected || !canSave || !image || !proof) return
    setSaving(true)
    setError('')
    try {
      const fingerprint = [selected._id, selected._rev, size.trim(), price, image.assetId].join('|')
      const operation = pendingOperation?.fingerprint === fingerprint ? pendingOperation : {
        fingerprint,
        idempotencyKey: crypto.randomUUID(),
        variantKey: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      }
      if (operation !== pendingOperation) setPendingOperation(operation)
      const response = await fetch('/api/manager/plants/' + encodeURIComponent(selected._id) + '/add-variant', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedRevision: selected._rev,
          idempotencyKey: operation.idempotencyKey,
          aiProof: proof,
          proofImageAssetId: image.assetId,
          variant: { _key: operation.variantKey, name: size.trim(), priceEUR: Number(price) },
          image,
        }),
      })
      const result = await responseJson(response)
      if (!response.ok) {
        if (result.conflict) {
          setPendingOperation(null)
          setSelected(null)
          setOpen(false)
          setRefreshKey(value => value + 1)
        }
        throw new Error(result.error || 'Не успяхме да добавим размера.')
      }
      onAdded({ productName: selected.name, imageAdded: result.imageAdded === true, imageAlreadyPresent: result.imageAlreadyPresent === true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не успяхме да добавим размера.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <span className="text-xs text-stone-500">Проверяваме каталога…</span>
  if (!items.length) return error ? <span className="text-xs text-amber-800">{error}</span> : null

  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 underline underline-offset-2" onClick={() => { setOpen(value => !value); setSelected(null); setError('') }}>
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
      {items.length === 1 ? 'Има съвпадение в каталога' : 'Има ' + items.length + ' съвпадения в каталога'}
    </button>
    {open && <div className="mt-3 basis-full space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-stone-800">Съществуващи растения</strong>
        <button type="button" className="text-xs font-semibold text-stone-600 underline" onClick={() => { setOpen(false); setSelected(null) }}>Затвори списъка</button>
      </div>
      <div className="space-y-2">
        {items.map(item => <button key={item._id} type="button" onClick={() => { setSelected(item); setSize(''); setPrice(''); setError(''); setPendingOperation(null) }} className={'flex w-full items-start gap-3 rounded-lg border bg-white p-2 text-left ' + (selected?._id === item._id ? 'border-lime-700 ring-1 ring-lime-700' : 'border-stone-200')}>
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {item.thumbnail ? <img src={item.thumbnail} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-stone-400">Без снимка</div>}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-stone-900">{item.name}</span>
            {item.scientificName && <span className="block text-xs italic text-stone-500">{item.scientificName}</span>}
            {item.categoryName && <span className="block text-xs text-stone-500">{item.categoryName}</span>}
            <span className="mt-1 block text-xs text-stone-600">{(item.variants || []).map(variant => variant.name + (Number(variant.priceEUR) > 0 ? ' · ' + money(Number(variant.priceEUR)) : '')).join(' | ') || 'Няма въведени размери'}</span>
          </span>
          {selected?._id === item._id && <span className="text-xs font-bold text-lime-800">Избрано</span>}
        </button>)}
      </div>
      {selected && <div className="space-y-3 rounded-lg border border-lime-200 bg-white p-3">
        <div>
          <strong className="text-sm">Добавяне към: {selected.name}</strong>
          <p className="text-xs text-stone-500">Съществуващите размери, цени и основна снимка ще останат непроменени.</p>
        </div>
        {(selected.variants?.length || 0) >= 30
          ? <p className="text-sm text-amber-800">Тази карточка вече съдържа максималните 30 размера.</p>
          : <>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-stone-700">Нов размер *</span>
              <input className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base" maxLength={100} placeholder="Напр. 80 см, 2 ствола" value={size} onChange={event => setSize(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-stone-700">Цена (€) *</span>
              <input className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base" type="number" min="0.01" step="0.01" placeholder="Напр. 145" value={price} onChange={event => setPrice(event.target.value)} />
            </label>
            {image && image.assetId === proofAssetId && proof
              ? <div className="flex items-center gap-2 rounded-lg bg-stone-50 p-2">
                <img src={image.url} alt="" className="h-12 w-12 rounded-md object-cover" />
                <span className="text-xs text-stone-600">Текущата снимка ще бъде добавена в общата галерия на растението.</span>
              </div>
              : <p className="text-xs text-amber-800">За да добавите този вариант, първо трябва да има снимка, проверена от Google.</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="button" disabled={!canSave} onClick={() => void addVariant()} className="w-full rounded-lg bg-lime-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
              {saving ? 'Добавяне…' : 'Добави размер и цена към тази карточка'}
            </button>
          </>}
      </div>}
    </div>}
  </div>
}
