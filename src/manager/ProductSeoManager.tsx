import { useState } from 'react'

type Catalog = 'irrigation' | 'plants'
type ProductSeoPreview = {
  mode: 'preview'
  catalog: Catalog
  dataset: string
  total: number
  previewProducts: number
  generatedFields: number
  overwrittenFields: number
  skippedLocales: number
  sample: Array<{ product: string; locale: 'bg' | 'ru' | 'en'; h1: string; metaTitle: string; metaDescription: string; location: string; fieldPath: string }>
}

const catalogs: Catalog[] = ['irrigation', 'plants']

export default function ProductSeoManager() {
  const [preview, setPreview] = useState<ProductSeoPreview[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadPreview = async () => {
    if (previewLoading || saving) return
    setPreviewLoading(true)
    setError('')
    setNotice('')
    try {
      const results = await Promise.all(catalogs.map(async (catalog) => {
        const response = await fetch('/api/manager/product-seo', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'preview', catalog }),
        })
        const result = await response.json() as ProductSeoPreview & { error?: string }
        if (!response.ok) throw new Error(result.error || 'Не успяхме да подготвим SEO прегледа.')
        return result
      }))
      setPreview(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да подготвим SEO прегледа.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const applySeo = async () => {
    if (saving || preview.length !== 2) return
    if (!window.confirm('Ще бъдат записани нови активни H1, Meta Title и Meta Description за всички публикувани продукти на български, руски и английски език, когато има превод. Съществуващите H1 и Meta Title/Description ще бъдат заменени. Старите SEO полета title/description на растенията ще бъдат запазени. Продължаваме ли?')) return

    setSaving(true)
    setError('')
    setNotice('')
    let generatedFields = 0
    let overwrittenFields = 0
    let processedProducts = 0
    try {
      for (const catalog of catalogs) {
        let offset = 0
        let hasMore = true
        let total = 0
        while (hasMore) {
          const response = await fetch('/api/manager/product-seo', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'apply', catalog, offset, confirm: true }),
          })
          const result = await response.json() as { total?: number; processed?: number; generatedFields?: number; overwrittenFields?: number; nextOffset?: number; hasMore?: boolean; error?: string }
          if (!response.ok) throw new Error(result.error || 'Записът на SEO не беше успешен.')
          total = Number(result.total || total)
          processedProducts += Number(result.processed || 0)
          generatedFields += Number(result.generatedFields || 0)
          overwrittenFields += Number(result.overwrittenFields || 0)
          offset = Number(result.nextOffset || 0)
          hasMore = result.hasMore === true
          setProgress((catalog === 'irrigation' ? 'Поливно оборудване' : 'Растения') + ': ' + offset + ' от ' + total + ' · общо обработени продукти: ' + processedProducts)
        }
      }
      setProgress('')
      setNotice('Готово. Обработени продукти: ' + processedProducts + '. Записани SEO полета: ' + generatedFields + '. Преди това попълнени активни полета, заменени с новия стандарт: ' + overwrittenFields + '.')
      setPreview([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна грешка при записването на SEO.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">SEO на продуктовите карти</h1>
          <p className="mt-1 text-sm leading-6 text-stone-600">Генерира директно активните H1, Meta Title и Meta Description за продуктите от двата каталога. Не се създават полета „Предложение SEO“. Всяка стойност може да бъде редактирана в Sanity Studio.</p>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
        {progress && <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">{progress}</div>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void loadPreview()} disabled={previewLoading || saving} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 disabled:opacity-50">{previewLoading ? 'Проверка…' : preview.length ? 'Обнови прегледа' : 'Покажи пример'}</button>
          <button type="button" onClick={() => void applySeo()} disabled={saving || previewLoading || preview.length !== 2} className="rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Записване…' : 'Запиши SEO за всички продукти'}</button>
        </div>
        {previewLoading && preview.length === 0 && <p className="text-sm text-stone-500">Зареждане на каталозите и примерните SEO стойности…</p>}
        <div className="grid gap-5 lg:grid-cols-2">
          {preview.map((catalog) => (
            <article key={catalog.catalog} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{catalog.catalog === 'irrigation' ? 'Поливно оборудване' : 'Растения'}</h2>
              <p className="mt-2 text-sm text-stone-600">Публикувани продукти: {catalog.total}. Примерни продукти: {catalog.previewProducts}. Попълнени полета в примерите, които ще бъдат заменени: {catalog.overwrittenFields}.</p>
              <div className="mt-4 space-y-4">
                {catalog.sample.slice(0, 6).map((item, index) => (
                  <div key={catalog.catalog + '-' + item.product + '-' + item.locale + '-' + index} className="border-t border-stone-100 pt-3">
                    <p className="text-xs font-semibold text-stone-500">{item.locale.toUpperCase()} · {item.product}</p>
                    <p className="mt-1 text-sm"><strong>H1:</strong> {item.h1}</p>
                    <p className="mt-1 text-sm"><strong>Meta Title ({item.metaTitle.length}/70):</strong> {item.metaTitle}</p>
                    <p className="mt-1 text-sm text-stone-600"><strong>Meta Description:</strong> {item.metaDescription}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="text-xs leading-5 text-stone-500">Записът заменя вече попълнените активни SEO стойности за публикуваните продукти. Старите полета title/description в SEO на растенията се запазват. Географският списък не включва Созопол. Действието е достъпно само за собственика и се изпълнява на партиди с проверка на Sanity revision.</p>
      </div>
    </section>
  )
}
