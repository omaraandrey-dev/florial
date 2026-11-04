import { useCallback, useEffect, useState } from 'react'

export type CatalogProduct = {
  catalog: 'production' | 'plants'
  productId: string
  variantKey?: string
  name: string
  sku: string
  price: number
  imageUrl?: string | null
  stockStatus?: string
  saleHeightCm?: number | null
  containerVolumeL?: number | null
}

type CatalogCategory = {
  _id: string
  name: string
  parentId: string | null
  productCount: number
  imageUrl?: string | null
}

type Props = {
  catalog: 'production' | 'plants'
  onCatalogChange: (catalog: 'production' | 'plants') => void
  onAdd: (product: CatalogProduct) => void
}

const money = (value: number) => new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
}).format(value)

export default function OrderCatalogBrowser({ catalog, onCatalogChange, onAdd }: Props) {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [trail, setTrail] = useState<CatalogCategory[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [mode, setMode] = useState<'categories' | 'products'>('categories')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [addedKey, setAddedKey] = useState('')

  const loadProducts = useCallback(async (categoryId: string) => {
    setBusy(true)
    setError('')
    setMode('products')
    try {
      const response = await fetch(
        '/api/manager/order-products?catalog=' + catalog + '&mode=products&categoryId=' + encodeURIComponent(categoryId),
        { credentials: 'same-origin', cache: 'no-store' },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить товары категории.')
      setProducts(data.products || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ошибка загрузки товаров.')
      setProducts([])
    } finally {
      setBusy(false)
    }
  }, [catalog])

  const loadCategories = useCallback(async () => {
    setBusy(true)
    setError('')
    setProducts([])
    setMode('categories')
    try {
      const response = await fetch(
        '/api/manager/order-products?catalog=' + catalog + '&mode=categories',
        { credentials: 'same-origin', cache: 'no-store' },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить категории.')
      const loaded: CatalogCategory[] = data.categories || []
      setCategories(loaded)
      const roots = loaded.filter(category => !category.parentId)
      if (roots.length === 1) {
        const root = roots[0]
        setTrail([root])
        const children = loaded.filter(category => category.parentId === root._id && (
          category.productCount > 0 || loaded.some(child => child.parentId === category._id)
        ))
        if (!children.length) await loadProducts(root._id)
      } else {
        setTrail([])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ошибка загрузки категориите.')
      setCategories([])
      setTrail([])
    } finally {
      setBusy(false)
    }
  }, [catalog, loadProducts])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const currentCategory = trail.length ? trail[trail.length - 1] : null
  const visibleCategories = categories.filter(category =>
    category.parentId === (currentCategory?._id || null) && (
      category.productCount > 0 || categories.some(child => child.parentId === category._id)
    )
  )

  const openCategory = async (category: CatalogCategory) => {
    const nextTrail = [...trail, category]
    setTrail(nextTrail)
    const children = categories.filter(child => child.parentId === category._id && (
      child.productCount > 0 || categories.some(grandchild => grandchild.parentId === child._id)
    ))
    if (children.length) {
      setProducts([])
      setMode('categories')
    } else {
      await loadProducts(category._id)
    }
  }

  const showTrail = async (nextTrail: CatalogCategory[]) => {
    setTrail(nextTrail)
    const current = nextTrail.length ? nextTrail[nextTrail.length - 1] : null
    if (!current) {
      setProducts([])
      setMode('categories')
      return
    }
    const children = categories.filter(child => child.parentId === current._id && (
      child.productCount > 0 || categories.some(grandchild => grandchild.parentId === child._id)
    ))
    if (children.length) {
      setProducts([])
      setMode('categories')
    } else {
      await loadProducts(current._id)
    }
  }

  const stockLabel = (status?: string) => {
    if (status === 'outOfStock') return 'Изчерпан'
    if (status === 'inStock') return 'В наличност'
    if (status === 'onRequest') return 'По заявка'
    return ''
  }

  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <b className="text-sm">Избор на артикул от каталога</b>
          <p className="text-xs text-stone-500">Изберете категория, след това конкретния продукт или вариант.</p>
        </div>
        <select
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          value={catalog}
          onChange={event => onCatalogChange(event.target.value as 'production' | 'plants')}
        >
          <option value="production">Оборудване за поливане</option>
          <option value="plants">Растения</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
        <button type="button" onClick={() => void showTrail([])} className="font-semibold text-lime-800 underline">
          Каталог
        </button>
        {trail.map((category, index) => (
          <span key={category._id} className="flex items-center gap-1">
            <span>/</span>
            <button
              type="button"
              onClick={() => void showTrail(trail.slice(0, index + 1))}
              className={index === trail.length - 1 ? 'font-semibold text-stone-800' : 'text-lime-800 underline'}
            >
              {category.name}
            </button>
          </span>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {busy && <p className="py-3 text-center text-sm text-stone-500">Зареждане на каталога…</p>}

      {!busy && mode === 'categories' && currentCategory && currentCategory.productCount > 0 && visibleCategories.length > 0 && (
        <button
          type="button"
          onClick={() => void loadProducts(currentCategory._id)}
          className="w-full rounded-lg border border-lime-700 px-3 py-2 text-sm font-semibold text-lime-800 hover:bg-lime-50"
        >
          Покажи всички артикули в категорията ({currentCategory.productCount})
        </button>
      )}

      {!busy && mode === 'categories' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleCategories.map(category => (
            <button
              type="button"
              key={category._id}
              onClick={() => void openCategory(category)}
              className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 text-left transition hover:border-lime-700 hover:bg-lime-50"
            >
              {category.imageUrl
                ? <img src={category.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xl">📁</span>}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-800">{category.name}</span>
                <span className="block text-xs text-stone-500">{category.productCount} артикула</span>
              </span>
              <span className="text-lg text-stone-400">›</span>
            </button>
          ))}
          {!visibleCategories.length && (
            <p className="col-span-full rounded-lg border border-dashed p-4 text-center text-sm text-stone-500">
              Няма подкатегории. Върнете се едно ниво назад.
            </p>
          )}
        </div>
      )}

      {!busy && mode === 'products' && (
        <div className="space-y-2">
          {products.map((product, index) => {
            const key = product.productId + '::' + (product.variantKey || '') + '::' + index
            const unavailable = product.stockStatus === 'outOfStock'
            return (
              <div key={key} className="flex items-center gap-3 border-t border-stone-100 py-2">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-stone-50 object-contain p-1" />
                  : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100">🌿</span>}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-800">{product.name}</span>
                  <span className="block text-xs text-stone-500">
                    {product.sku || 'Без артикул'} · {money(product.price)}
                    {stockLabel(product.stockStatus) ? ' · ' + stockLabel(product.stockStatus) : ''}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    onAdd(product)
                    setAddedKey(key)
                  }}
                  className="shrink-0 rounded-lg bg-lime-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addedKey === key ? 'Добавен' : 'Добави'}
                </button>
              </div>
            )
          })}
          {!products.length && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-stone-500">
              В тази категория няма активни артикули с варианти за продажба.
            </p>
          )}
        </div>
      )}

      {trail.length > 0 && (
        <button
          type="button"
          onClick={() => void showTrail(trail.slice(0, -1))}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
        >
          ← Назад към категориите
        </button>
      )}
    </section>
  )
}
