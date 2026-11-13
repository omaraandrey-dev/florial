import { useState } from 'react'

type ProductSeoPreview = {
  mode: 'preview'
  strategy: 'missing-only'
  catalog: 'irrigation'
  dataset: string
  total: number
  productsWithMissingFields: number
  missingFields: number
  preservedFields: number
  missingFieldCounts: {
    bg: { h1: number; metaTitle: number; metaDescription: number }
    ru: { h1: number; metaTitle: number; metaDescription: number }
    en: { h1: number; metaTitle: number; metaDescription: number }
  }
  previewProducts: number
  sampleFieldsToFill: number
  sampleFieldsPreserved: number
  skippedLocales: number
  sample: Array<{
    product: string
    locale: 'bg' | 'ru' | 'en'
    h1: string
    metaTitle: string
    metaDescription: string
    location: string
    fieldsToFill: string[]
    fieldsToPreserve: string[]
  }>
}

const fieldLabels: Record<string, string> = {
  h1: 'H1',
  metaTitle: 'Meta Title',
  metaDescription: 'Meta Description',
}

const localeLabels: Record<string, string> = { bg: 'Български', ru: 'Руски', en: 'Английски' }

export default function ProductSeoManager() {
  const [preview, setPreview] = useState<ProductSeoPreview | null>(null)
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
      const response = await fetch('/api/manager/product-seo', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', catalog: 'irrigation', strategy: 'missing-only' }),
      })
      const result = await response.json() as ProductSeoPreview & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да подготвим SEO прегледа.')
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да подготвим SEO прегледа.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const applySeo = async () => {
    if (saving || !preview || preview.catalog !== 'irrigation' || preview.strategy !== 'missing-only') return
    const confirmed = window.confirm(
      'Ще бъдат добавени само липсващите H1, Meta Title и Meta Description за продуктите от каталога „Поливно оборудване“ в Sanity production. Вече попълнените стойности няма да бъдат променяни. Каталогът с растения няма да бъде обработван. Всяка партида ще се записва само ако Sanity revision не се е променила. Продължаваме ли?',
    )
    if (!confirmed) return

    setSaving(true)
    setError('')
    setNotice('')
    let generatedFields = 0
    let preservedFields = 0
    let processedProducts = 0
    try {
      let offset = 0
      let hasMore = true
      let total = 0
      while (hasMore) {
        const response = await fetch('/api/manager/product-seo', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'apply', catalog: 'irrigation', strategy: 'missing-only', offset, confirm: true }),
        })
        const result = await response.json() as {
          total?: number
          processed?: number
          generatedFields?: number
          preservedFields?: number
          nextOffset?: number
          hasMore?: boolean
          error?: string
        }
        if (!response.ok) throw new Error(result.error || 'Записът на SEO не беше успешен.')
        total = Number(result.total || total)
        processedProducts += Number(result.processed || 0)
        generatedFields += Number(result.generatedFields || 0)
        preservedFields += Number(result.preservedFields || 0)
        offset = Number(result.nextOffset || 0)
        hasMore = result.hasMore === true
        setProgress('Поливно оборудване: ' + offset + ' от ' + total + ' · обработени продукти: ' + processedProducts)
      }
      setProgress('')
      setNotice('Готово. Обработени продукти: ' + processedProducts + '. Добавени липсващи SEO полета: ' + generatedFields + '. Съществуващи стойности, оставени без промяна: ' + preservedFields + '.')
      setPreview(null)
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
          <p className="mt-1 text-sm leading-6 text-stone-600">Безопасно попълване само на липсващи H1, Meta Title и Meta Description за поливното оборудване в Sanity production. Съществуващите SEO стойности се запазват. Каталогът с растения не се обработва.</p>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
        {progress && <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">{progress}</div>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void loadPreview()} disabled={previewLoading || saving} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 disabled:opacity-50">{previewLoading ? 'Проверка…' : preview ? 'Обнови прегледа' : 'Провери липсващите SEO полета'}</button>
          <button type="button" onClick={() => void applySeo()} disabled={saving || previewLoading || !preview || preview.missingFields === 0} className="rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Записване…' : 'Запиши само липсващите SEO полета'}</button>
        </div>
        {previewLoading && !preview && <p className="text-sm text-stone-500">Проверка на всички публикувани продукти и подготовка на примерите…</p>}
        {preview && (
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Поливно оборудване · Sanity {preview.dataset}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Режим: само липсващи полета</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Публикувани продукти</p><p className="mt-1 text-2xl font-semibold">{preview.total}</p></div>
              <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Продукти с липси</p><p className="mt-1 text-2xl font-semibold">{preview.productsWithMissingFields}</p></div>
              <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Полета за добавяне</p><p className="mt-1 text-2xl font-semibold">{preview.missingFields}</p></div>
              <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Съществуващи полета за запазване</p><p className="mt-1 text-2xl font-semibold">{preview.preservedFields}</p></div>
            </div>
            <h3 className="mt-5 text-sm font-semibold">Липсващи полета по език</h3>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {(['bg', 'ru', 'en'] as const).map((locale) => (
                <div key={locale} className="rounded-xl border border-stone-200 p-3">
                  <p className="text-sm font-semibold">{localeLabels[locale]}</p>
                  <p className="mt-1 text-sm text-stone-600">H1: {preview.missingFieldCounts[locale].h1}</p>
                  <p className="text-sm text-stone-600">Meta Title: {preview.missingFieldCounts[locale].metaTitle}</p>
                  <p className="text-sm text-stone-600">Meta Description: {preview.missingFieldCounts[locale].metaDescription}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Прегледът показва {preview.previewProducts} примерни продукта. Обобщените количества са изчислени за целия каталог. При записване всяка партида отново проверява текущите стойности и revision на документите.
            </div>
            <h3 className="mt-5 font-semibold">Примерни генерирани стойности</h3>
            <div className="mt-3 space-y-4">
              {preview.sample.map((item, index) => (
                <div key={item.product + '-' + item.locale + '-' + index} className="border-t border-stone-100 pt-3">
                  <p className="text-xs font-semibold text-stone-500">{item.locale.toUpperCase()} · {item.product} · {item.location}</p>
                  {(['h1', 'metaTitle', 'metaDescription'] as const).map((field) => {
                    const willFill = item.fieldsToFill.includes(field)
                    return (
                      <div key={field} className="mt-2">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {fieldLabels[field]}
                          <span className={willFill ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800' : 'rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600'}>
                            {willFill ? 'Ще се добави' : 'Ще се запази'}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-stone-700">{item[field]}</p>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-stone-500">Записът е ограничен до каталога за поливно оборудване. Растения, категории, описания, цени, наличности, изображения, връзки и други полета не се променят. Ако документ е редактиран след прочитането му, Sanity отказва промяната поради несъответстваща revision.</p>
          </article>
        )}
      </div>
    </section>
  )
}
