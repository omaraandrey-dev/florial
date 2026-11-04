import { checkSameOrigin, json, requireUser, type ManagerEnv } from './_lib'

type Product = { _id: string; name?: string; sku?: string; priceEUR?: number; imageUrl?: string; saleVariants?: Array<{_key:string;name?:string;nameEn?:string;nameRu?:string;sku?:string;saleHeightCm?:number;containerVolumeL?:number;priceEUR?:number;stockStatus?:string}> }
const clean=(v:string,max=100)=>v.trim().slice(0,max)
const escapeQuery=(v:string)=>JSON.stringify(v)

export const onRequestGet=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(auth.user.role!=='owner'&&(!auth.user.permissionsObject.canEditOrders))return json({error:'Нямате право да добавяте артикули към поръчки.'},403)
 if(!env.SANITY_API_TOKEN||!env.SANITY_PROJECT_ID)return json({error:'Sanity catalogue is not configured.'},503)
 const url=new URL(request.url),catalog=url.searchParams.get('catalog')==='plants'?'plants':'production',term=clean(url.searchParams.get('q')||'',100)
 if(term.length<2)return json({products:[]})
 const dataset=catalog==='plants'?(env.SANITY_PLANTS_DATASET||'plants'):(env.SANITY_DATASET||'production')
 const pattern='*'+term.replace(/[\\*]/g,'')+'*'
 const query=catalog==='plants'
  ? '*[_type=="product" && isActive!=false && !(_id in path("drafts.**")) && (name match '+escapeQuery(pattern)+' || scientificName match '+escapeQuery(pattern)+' || sku match '+escapeQuery(pattern)+')]|order(name asc)[0...30]{_id,name,scientificName,sku,imageUrl,saleVariants[]{_key,name,nameEn,nameRu,sku,saleHeightCm,containerVolumeL,priceEUR,stockStatus}}'
  : '*[_type=="product" && isActive!=false && !(_id in path("drafts.**")) && (name match '+escapeQuery(pattern)+' || sku match '+escapeQuery(pattern)+')]|order(name asc)[0...30]{_id,name,sku,priceEUR,imageUrl}'
 try{
  const response=await fetch('https://'+env.SANITY_PROJECT_ID+'.api.sanity.io/v2025-02-19/data/query/'+dataset+'?query='+encodeURIComponent(query),{headers:{Authorization:'Bearer '+env.SANITY_API_TOKEN}})
  if(!response.ok)return json({error:'Не успяхме да потърсим артикули в каталога.'},502)
  const data=await response.json() as {result:Product[]}
  const products=(data.result||[]).flatMap(product=>{
   if(catalog==='plants'){
    return (product.saleVariants||[]).map(variant=>({catalog,productId:product._id,variantKey:variant._key,name:product.name+(variant.name?' — '+variant.name:'')+([variant.saleHeightCm?variant.saleHeightCm+' cm':'',variant.containerVolumeL?variant.containerVolumeL+' L':''].filter(Boolean).length?' ('+[variant.saleHeightCm?variant.saleHeightCm+' cm':'',variant.containerVolumeL?variant.containerVolumeL+' L':''].filter(Boolean).join(', ')+')':''),saleHeightCm:variant.saleHeightCm??null,containerVolumeL:variant.containerVolumeL??null,sku:variant.sku||product.sku||'',price:Number(variant.priceEUR)||0,imageUrl:product.imageUrl||null,stockStatus:variant.stockStatus||'onRequest',saleHeightCm:variant.saleHeightCm??null,containerVolumeL:variant.containerVolumeL??null}))
   }
   return [{catalog,productId:product._id,name:product.name||'Продукт',sku:product.sku||'',price:Number(product.priceEUR)||0,imageUrl:product.imageUrl||null,stockStatus:'catalog'}]
  })
  return json({products})
 }catch{return json({error:'Грешка при търсене в каталога.'},502)}
}
