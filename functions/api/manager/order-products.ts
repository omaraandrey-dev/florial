import { checkSameOrigin, json, requireUser, type ManagerEnv } from './_lib'

type Product = {
  _id: string
  name?: string
  sku?: string
  priceEUR?: number
  stockStatus?: string
  imageUrl?: string
  saleVariants?: Array<{
    _key: string
    name?: string
    nameEn?: string
    nameRu?: string
    sku?: string
    saleHeightCm?: number
    containerVolumeL?: number
    priceEUR?: number
    stockStatus?: string
  }>
}

const clean = (value: string, max = 120) => value.trim().slice(0, max)
const quote = (value: string) => JSON.stringify(value)

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (auth.user.role !== 'owner' && !auth.user.permissionsObject.canEditOrders) {
    return json({ error: 'Нямате право да добавяте артикули към поръчки.' }, 403)
  }
  if (!env.SANITY_API_TOKEN || !env.SANITY_PROJECT_ID) {
    return json({ error: 'Sanity catalogue is not configured.' }, 503)
  }

  const url = new URL(request.url)
  const catalog = url.searchParams.get('catalog') === 'plants' ? 'plants' : 'production'
  const mode = url.searchParams.get('mode') || 'search'
  const dataset = catalog === 'plants'
    ? (env.SANITY_PLANTS_DATASET || 'plants')
    : (env.SANITY_DATASET || 'production')

  let query = ''
  const params: Record<string, string> = {}

  if (mode === 'categories') {
    query = '*[_type == "category" && !(_id in path("drafts.**"))] | order(coalesce(sortOrder, 9999) asc, name asc)[0...200]{_id,name,"parentId":parent._ref,"productCount":count(*[_type == "product" && isActive != false && references(^._id)]),"imageUrl":coalesce(image.asset->url,externalImageUrl)}'
  } else if (mode === 'products') {
    const categoryId = clean(url.searchParams.get('categoryId') || '', 128)
    if (!categoryId) return json({ error: 'Не е избрана категория.' }, 400)
    params.categoryId = categoryId
    query = catalog === 'plants'
      ? '*[_type == "product" && isActive != false && !(_id in path("drafts.**")) && (category._ref == $categoryId || $categoryId in categories[]._ref)] | order(sortOrder asc, name asc)[0...100]{_id,name,sku,stockStatus,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,category->image.asset->url,category->externalImageUrl),saleVariants[]{_key,name,nameEn,nameRu,sku,saleHeightCm,containerVolumeL,priceEUR,stockStatus}}'
      : '*[_type == "product" && isActive != false && !(_id in path("drafts.**")) && (category._ref == $categoryId || $categoryId in categories[]._ref)] | order(sortOrder asc, name asc)[0...100]{_id,name,sku,priceEUR,stockStatus,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,externalImageUrl)}'
  } else {
    const term = clean(url.searchParams.get('q') || '', 100)
    if (term.length < 2) return json({ products: [] })
    const pattern = '*' + term.replace(/[\\*]/g, '') + '*'
    query = catalog === 'plants'
      ? '*[_type == "product" && isActive != false && !(_id in path("drafts.**")) && (name match ' + quote(pattern) + ' || scientificName match ' + quote(pattern) + ' || sku match ' + quote(pattern) + ')] | order(name asc)[0...30]{_id,name,sku,stockStatus,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,category->image.asset->url,category->externalImageUrl),saleVariants[]{_key,name,nameEn,nameRu,sku,saleHeightCm,containerVolumeL,priceEUR,stockStatus}}'
      : '*[_type == "product" && isActive != false && !(_id in path("drafts.**")) && (name match ' + quote(pattern) + ' || sku match ' + quote(pattern) + ')] | order(name asc)[0...30]{_id,name,sku,priceEUR,stockStatus,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,externalImageUrl)}'
  }

  try {
    const sanityUrl = new URL('https://' + env.SANITY_PROJECT_ID + '.api.sanity.io/v2025-02-19/data/query/' + dataset)
    sanityUrl.searchParams.set('query', query)
    for (const [key, value] of Object.entries(params)) {
      sanityUrl.searchParams.set('$' + key, JSON.stringify(value))
    }
    const response = await fetch(sanityUrl.toString(), {
      headers: { Authorization: 'Bearer ' + env.SANITY_API_TOKEN },
    })
    if (!response.ok) return json({ error: 'Не успяхме да заредим каталога.' }, 502)
    const data = await response.json() as { result?: Array<Product & { parentId?: string | null; productCount?: number }> }

    if (mode === 'categories') {
      const categories = (data.result || []).map(category => ({
        _id: category._id,
        name: category.name || 'Категория без име',
        parentId: category.parentId || null,
        productCount: Number(category.productCount) || 0,
        imageUrl: category.imageUrl || null,
      }))
      return json({ categories })
    }

    const products = (data.result || []).flatMap(product => {
      if (catalog === 'plants') {
        return (product.saleVariants || []).map(variant => {
          const size = [
            typeof variant.saleHeightCm === 'number' ? variant.saleHeightCm + ' cm' : '',
            typeof variant.containerVolumeL === 'number' ? variant.containerVolumeL + ' L' : '',
          ].filter(Boolean).join(', ')
          return {
            catalog,
            productId: product._id,
            variantKey: variant._key,
            name: (product.name || 'Растение') +
              (variant.name ? ' — ' + variant.name : '') +
              (size ? ' (' + size + ')' : ''),
            sku: variant.sku || product.sku || '',
            price: Number(variant.priceEUR) || 0,
            stockStatus: variant.stockStatus || 'onRequest',
            saleHeightCm: variant.saleHeightCm ?? null,
            containerVolumeL: variant.containerVolumeL ?? null,
            imageUrl: product.imageUrl || null,
          }
        })
      }
      return [{
        catalog,
        productId: product._id,
        name: product.name || 'Продукт',
        sku: product.sku || '',
        price: Number(product.priceEUR) || 0,
        stockStatus: product.stockStatus || 'catalog',
        imageUrl: product.imageUrl || null,
      }]
    })
    return json({ products })
  } catch {
    return json({ error: 'Грешка при зареждане на каталога.' }, 502)
  }
}
