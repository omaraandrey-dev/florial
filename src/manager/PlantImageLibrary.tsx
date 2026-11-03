import { useEffect, useMemo, useState } from 'react'
import { managerApi } from '../lib/managerApi'

export type IntakeLibraryImage = { path: string; url: string; assetId: string; name: string; size: number; type: string }

type LibraryAsset = {
  assetId: string
  url: string
  name: string
  size: number
  type: string
  createdAt: string
  width?: number
  height?: number
}

type Props = {
  selectedAssetIds: string[]
  usedAssetIds: string[]
  maxSelectable: number
  disabled?: boolean
  onToggle: (image: IntakeLibraryImage) => void
}

export default function PlantImageLibrary({ selectedAssetIds, usedAssetIds, maxSelectable, disabled = false, onToggle }: Props) {
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    void managerApi.images.list().then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError) setError(requestError.message)
      else setAssets(data || [])
      setLoading(false)
    })
    return () => { active = false }
  }, [refreshKey])

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    return term ? assets.filter((asset) => asset.name.toLocaleLowerCase().includes(term) || asset.assetId.toLocaleLowerCase().includes(term)) : assets
  }, [assets, search])

  return (
    <section className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-800">Библиотека фотографий</h3>
          <p className="mt-1 text-xs text-stone-500">Снимки из Sanity · набор „Растения“. Изберете вече качени снимки или добавете нови файлове.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">{selectedAssetIds.length} избрани</span>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading || disabled} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-50">Обнови</button>
        </div>
      </div>
      <input className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Търсене по име на файл или ID…" aria-label="Търсене в библиотеката с фотографии" />
      {loading && <p className="mt-3 text-sm text-stone-500">Зареждане на фотографиите…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">Библиотеката не може да бъде заредена: {error}</p>}
      {!loading && !error && assets.length === 0 && <p className="mt-3 text-sm text-stone-500">В библиотеката все още няма снимки.</p>}
      {!loading && !error && assets.length > 0 && filteredAssets.length === 0 && <p className="mt-3 text-sm text-stone-500">Няма снимки, съответстващи на търсенето.</p>}
      {filteredAssets.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredAssets.map((asset) => {
            const selected = selectedAssetIds.includes(asset.assetId)
            const alreadyUsed = usedAssetIds.includes(asset.assetId)
            const cannotAdd = disabled || alreadyUsed || (!selected && selectedAssetIds.length >= maxSelectable)
            return (
              <button key={asset.assetId} type="button" disabled={cannotAdd} onClick={() => onToggle({ path: asset.url, url: asset.url, assetId: asset.assetId, name: asset.name, size: asset.size, type: asset.type })} className={'overflow-hidden rounded-xl border bg-white text-left transition ' + (selected ? 'border-lime-700 ring-2 ring-lime-100' : alreadyUsed ? 'border-stone-200 opacity-60' : 'border-stone-200 hover:border-lime-600') + (cannotAdd && !selected ? ' cursor-not-allowed' : '')}>
                <img src={asset.url} alt={asset.name} loading="lazy" className="h-28 w-full bg-stone-100 object-cover" />
                <div className="p-2">
                  <div className="truncate text-xs font-semibold text-stone-700" title={asset.name}>{asset.name}</div>
                  <div className="mt-1 text-[11px] text-stone-500">{asset.width && asset.height ? asset.width + ' × ' + asset.height + ' px' : 'Sanity image'}</div>
                  <div className="mt-2 text-xs font-semibold">{alreadyUsed ? 'Вече е в заявката' : selected ? 'Избрана · натиснете за отказ' : 'Добави към растението'}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-stone-500">Показват се всички снимки от общата библиотека на растенията, а не само качените от конкретен служител. Файловете в Sanity не се изтриват при премахване от заявка.</p>
    </section>
  )
}
