import React, {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Flex, Text} from 'sanity/ui'

interface PreviewProduct {
  name?: string
  imageUrl?: string
}

interface KitComponentPreviewValue {
  product?: {_ref?: string}
  quantity?: number
  unit?: string
}

export function KitComponentPreview(props: any) {
  const value = (props.value || {}) as KitComponentPreviewValue
  const productRef = value.product?._ref
  const client = useClient({apiVersion: '2024-01-01'})
  const [product, setProduct] = useState<PreviewProduct | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!productRef) {
      setProduct(null)
      return () => { cancelled = true }
    }

    client.fetch(
      '*[_id == $id || _id == $draftId][0]{name, "imageUrl": mainImage.asset->url}',
      {id: productRef, draftId: 'drafts.' + productRef},
    ).then((result: PreviewProduct | null) => {
      if (!cancelled) setProduct(result || null)
    }).catch(() => {
      if (!cancelled) setProduct(null)
    })

    return () => { cancelled = true }
  }, [client, productRef])

  const quantity = typeof value.quantity === 'number' ? value.quantity : null
  const unit = value.unit === 'm' ? 'm' : 'бр.'

  return (
    <Flex align="center" gap={3} padding={2}>
      {product?.imageUrl ? (
        <img src={product.imageUrl} alt={product.name || ''} width={44} height={44} style={{objectFit: 'contain', borderRadius: 6}} />
      ) : (
        <Box width={44} height={44} radius={2} background="gray100" />
      )}
      <Box flex={1}>
        <Text weight="semibold">{product?.name || 'Изберете продукт'}</Text>
        <Text size={1} muted>{quantity === null ? 'Количество не задано' : String(quantity) + ' ' + unit}</Text>
      </Box>
    </Flex>
  )
}
