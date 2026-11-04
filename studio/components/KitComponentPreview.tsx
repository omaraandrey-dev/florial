import React, {useEffect, useState} from 'react'
import {useClient} from 'sanity'

interface PreviewProduct {
  name?: string
  imageUrl?: string
}

interface KitComponentPreviewProps {
  productRef?: string
  quantity?: number
  unit?: string
}

export function KitComponentPreview(props: KitComponentPreviewProps) {
  const productRef = props.productRef
  const client = useClient({apiVersion: '2024-01-01'})
  const [product, setProduct] = useState<PreviewProduct | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!productRef) {
      setProduct(null)
      return () => { cancelled = true }
    }

    client.fetch(
      '*[_id == $id || _id == $draftId][0]{name, "imageUrl": coalesce(mainImage.asset->url, image.asset->url)}',
      {id: productRef, draftId: 'drafts.' + productRef},
    ).then((result: PreviewProduct | null) => {
      if (!cancelled) setProduct(result || null)
    }).catch(() => {
      if (!cancelled) setProduct(null)
    })

    return () => { cancelled = true }
  }, [client, productRef])

  const quantity = typeof props.quantity === 'number' ? props.quantity : null
  const unit = props.unit === 'm' ? 'm' : 'бр.'

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: 8}}>
      {product?.imageUrl ? (
        <img src={product.imageUrl} alt={product.name || ''} width={44} height={44} style={{objectFit: 'contain', borderRadius: 6}} />
      ) : (
        <div aria-hidden="true" style={{width: 44, height: 44, borderRadius: 6, background: '#f1f3f5'}} />
      )}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontWeight: 600}}>{product?.name || 'Изберете продукт'}</div>
        <div style={{fontSize: 12, color: '#6b7280'}}>{quantity === null ? 'Количество не задано' : String(quantity) + ' ' + unit}</div>
      </div>
    </div>
  )
}
