type Props = {
  submission: { title: string; sku: string | null; payload: Record<string, unknown>; created_at: string } | null
  images: Array<{ name: string; url: string }>
  loading: boolean
}

export default function SubmissionDetails({ submission, images, loading }: Props) {
  if (!submission) return <p className="mt-2 text-sm text-stone-500">Изберете заявка, за да видите подробностите.</p>
  const publication = submission.payload.publication && typeof submission.payload.publication === 'object'
    ? submission.payload.publication as Record<string, unknown>
    : {}
  const originalVariant = (submission.payload.saleVariants as Array<Record<string, unknown>> | undefined)?.[0] || {}
  const publishedVariant = (publication.saleVariants as Array<Record<string, unknown>> | undefined)?.[0] || {}
  const variant = Object.keys(publishedVariant).length ? publishedVariant : originalVariant
  const name = String(publication.name || submission.payload.name || submission.title || '—')
  const scientificName = String(publication.scientificName || submission.payload.latinName || '—')
  const categoryName = String(publication.categoryName || submission.payload.categoryName || publication.categoryId || 'Не е избрана')
  const sku = String(publication.sku || submission.sku || '—')
  const productType = String(publication.productType || '—')
  const shortDescription = String(publication.shortDescription || '')
  const description = String(publication.description || submission.payload.description || '—')
  const documentId = String(publication.sanityDocumentId || '')
  return <div className="mt-3 space-y-3 text-sm">
    <div><span className="text-stone-500">Растение: </span><strong>{name}</strong></div>
    <div><span className="text-stone-500">Латинско име: </span>{scientificName}</div>
    <div><span className="text-stone-500">Тип на растението: </span>{productType}</div>
    <div><span className="text-stone-500">Категория: </span>{categoryName}</div>
    <div><span className="text-stone-500">SKU: </span>{sku}</div>
    {shortDescription && <div><span className="text-stone-500">Кратко описание: </span>{shortDescription}</div>}
    <div><span className="text-stone-500">Вариант: </span>{String(variant.name || '—')}</div>
    <div><span className="text-stone-500">Височина: </span>{variant.saleHeightCm == null ? '—' : String(variant.saleHeightCm) + ' см'}</div>
    <div><span className="text-stone-500">Обем на контейнера: </span>{variant.containerVolumeL == null ? '—' : String(variant.containerVolumeL) + ' л'}</div>
    <div><span className="text-stone-500">Цена с ДДС: </span>{variant.priceEUR == null ? 'По запитване' : Number(variant.priceEUR).toFixed(2) + ' EUR'}</div>
    <div><span className="text-stone-500">Количество: </span>{String(variant.stockQuantity ?? '—')}</div>
    <div><span className="text-stone-500">Наличност: </span>{variant.stockStatus === 'inStock' ? 'В наличност' : variant.stockStatus === 'onRequest' ? 'По заявка' : variant.stockStatus === 'outOfStock' ? 'Изчерпан' : '—'}</div>
    <div><span className="text-stone-500">Описание:</span><p className="whitespace-pre-wrap">{description}</p></div>
    {documentId && <div className="rounded-lg bg-lime-50 p-3 text-xs text-lime-950"><strong>Sanity document ID:</strong><p className="mt-1 break-all">{documentId}</p></div>}
    <div className="border-t border-stone-100 pt-3"><strong>Снимки ({images.length})</strong>
      {loading && <p>Зареждане на снимките…</p>}
      {!loading && images.length === 0 && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900">Няма качени снимки към тази заявка.</p>}
      <div className="mt-2 grid gap-2">{images.map((photo) => <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-stone-200"><img src={photo.url} alt={photo.name} className="h-36 w-full object-cover" /><span className="block truncate p-2 text-xs">{photo.name}</span></a>)}</div>
    </div>
  </div>
}
