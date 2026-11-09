import { useCallback, useEffect, useMemo, useState } from 'react'

type Role='owner'|'manager'|'seller'
type ImageItem={assetId:string;url:string;name:string;alt:string;altEn:string;altRu:string}
type Variant={_key:string;name:string;nameEn:string;nameRu:string;sku:string;saleHeightCm:string;containerVolumeL:string;priceEUR:string;oldPriceEUR:string;stockStatus:string;stockQuantity:string}
type PlantForm={
 name:string;slug:string;scientificName:string;sku:string;productType:string;categoryId:string;categoryIds:string[];
 shortDescription:string;description:string;isFeatured:boolean;isActive:boolean;
 saleVariants:Variant[];
 translations:Record<string,any>;
 seo:{h1:string;metaTitle:string;metaDescription:string};
}
type Category={_id:string;name:string;slug?:string;parentId?:string;parentName?:string}
type ListItem={_id:string;_rev:string;name:string;scientificName?:string;sku?:string;slug?:string;categoryId?:string;categoryName?:string;categoryParent?:string;thumbnail?:string;priceFromEUR:number|null;listStockStatus:string;variantCount:number;isActive?:boolean}
type Props={role:Role}
const stockLabels:Record<string,string>={inStock:'В наличност',onRequest:'По заявка',outOfStock:'Няма наличност',mixed:'Различна наличност'}
const productTypes=[['plant','Растение'],['tree','Дърво'],['shrub','Храст'],['flower','Цвете'],['perennial','Многогодишно растение'],['indoor','Стайно растение'],['citrus','Цитрус'],['palm','Палма'],['conifer','Иглолистно растение'],['fruit','Плодово растение'],['succulent','Сукулент'],['climber','Катерливо растение'],['ornamentalGrass','Декоративна трева'],['groundcover','Почвопокривно растение'],['bulb','Луковично растение'],['herb','Билка'],['aquatic','Водно растение'],['other','Друг вид растение']]
const newVariant=():Variant=>({_key:crypto.randomUUID().replace(/-/g,'').slice(0,12),name:'',nameEn:'',nameRu:'',sku:'',saleHeightCm:'',containerVolumeL:'',priceEUR:'',oldPriceEUR:'',stockStatus:'onRequest',stockQuantity:''})
const emptyForm=():PlantForm=>({name:'',slug:'',scientificName:'',sku:'',productType:'plant',categoryId:'',categoryIds:[],shortDescription:'',description:'',isFeatured:false,isActive:true,saleVariants:[newVariant()],translations:{bg:{},ru:{},en:{}},seo:{h1:'',metaTitle:'',metaDescription:''}})
const plainText=(value:any):string=>typeof value==='string'?value:Array.isArray(value)?value.map((block:any)=>Array.isArray(block?.children)?block.children.map((child:any)=>child?.text||'').join(''):'').filter(Boolean).join('\n\n'):''
const slugify=(value:string)=>value.toLocaleLowerCase('bg-BG').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96)
const imageFrom=(value:any):ImageItem|null=>{
 const assetId=value?.asset?._id||value?.asset?._ref
 const url=value?.asset?.url
 if(typeof assetId!=='string'||typeof url!=='string')return null
 return {assetId,url,name:value?.originalFilename||'Снимка',alt:value?.alt||'',altEn:value?.altEn||'',altRu:value?.altRu||''}
}
const variantFrom=(value:any,rootStatus?:string):Variant=>({
 _key:value?._key||crypto.randomUUID().replace(/-/g,'').slice(0,12),name:value?.name||'',nameEn:value?.nameEn||'',nameRu:value?.nameRu||'',sku:value?.sku||'',
 saleHeightCm:value?.saleHeightCm==null?'':String(value.saleHeightCm),containerVolumeL:value?.containerVolumeL==null?'':String(value.containerVolumeL),
 priceEUR:value?.priceEUR==null?'':String(value.priceEUR),oldPriceEUR:value?.oldPriceEUR==null?'':String(value.oldPriceEUR),
 stockStatus:value?.stockStatus||rootStatus||'onRequest',stockQuantity:value?.stockQuantity==null?'':String(value.stockQuantity),
})
const inputClass='w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const labelClass='mb-1 block text-sm font-semibold text-stone-700'
const btn='rounded-xl px-4 py-3 text-sm font-semibold'
const responseJson=async(response:Response)=>await response.json().catch(()=>({}))
const money=(value:number|null)=>value==null?'Цена не указана':new Intl.NumberFormat('bg-BG',{style:'currency',currency:'EUR'}).format(value)

export default function PlantCatalogManager({role}:Props){
 const [items,setItems]=useState<ListItem[]>([])
 const [categories,setCategories]=useState<Category[]>([])
 const [query,setQuery]=useState('')
 const [categoryId,setCategoryId]=useState('')
 const [sort,setSort]=useState<'name'|'category'>('category')
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [editorOpen,setEditorOpen]=useState(false)
 const [editingId,setEditingId]=useState<string|null>(null)
 const [revision,setRevision]=useState('')
 const [form,setForm]=useState<PlantForm>(emptyForm)
 const [images,setImages]=useState<ImageItem[]>([])
 const [mainImageIndex,setMainImageIndex]=useState(0)
 const [saving,setSaving]=useState(false)
 const [aiLoading,setAiLoading]=useState(false)
 const [imageLoading,setImageLoading]=useState(false)
 const [historyOpen,setHistoryOpen]=useState(false)
 const [history,setHistory]=useState<any[]>([])
 const [historyLoading,setHistoryLoading]=useState(false)
 const [aiWarnings,setAiWarnings]=useState<string[]>([])

 const load=useCallback(async()=>{
  setLoading(true);setError('')
  try{
   const params=new URLSearchParams({sort,limit:'100'})
   if(query.trim())params.set('q',query.trim())
   if(categoryId)params.set('categoryId',categoryId)
   const response=await fetch('/api/manager/plants?'+params.toString(),{credentials:'same-origin',cache:'no-store'})
   const result=await responseJson(response)
   if(!response.ok)throw new Error(result.error||'Не успяхме да заредим растенията.')
   setItems(Array.isArray(result.items)?result.items:[])
   setCategories(Array.isArray(result.categories)?result.categories:[])
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да заредим каталога.')}
  finally{setLoading(false)}
 },[query,categoryId,sort])
 useEffect(()=>{void load()},[load])
 useEffect(()=>{setPendingIdempotencyKey(null)},[form,images])

 const openNew=()=>{setEditingId(null);setRevision('');setForm(emptyForm());setImages([]);setMainImageIndex(0);setAiWarnings([]);setError('');setNotice('');setEditorOpen(true)}
 const openExisting=async(id:string)=>{
  setError('');setNotice('');setLoading(true)
  try{
   const response=await fetch('/api/manager/plants/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'})
   const result=await responseJson(response)
   if(!response.ok)throw new Error(result.error||'Не успяхме да отворим растението.')
   const p=result.product
   const main=imageFrom(p.mainImage)
   const gallery=(Array.isArray(p.gallery)?p.gallery:[]).map(imageFrom).filter(Boolean) as ImageItem[]
   const all=[...(main?[main]:[]),...gallery]
   const translations=p.translations||{}
   setEditingId(id);setRevision(p._rev);setImages(all);setMainImageIndex(0);setAiWarnings([])
   setForm({
    name:p.name||'',slug:p.slug?.current||'',scientificName:p.scientificName||'',sku:p.sku||'',productType:p.productType||'plant',
    categoryId:p.category?._ref||p.categoryId||'',categoryIds:Array.from(new Set([p.category?._ref,...(Array.isArray(p.categories)?p.categories.map((item:any)=>item?._ref):[])].filter(Boolean))),shortDescription:p.shortDescription||'',description:plainText(p.description),
    isFeatured:p.isFeatured===true,isActive:p.isActive!==false,
    saleVariants:Array.isArray(p.saleVariants)&&p.saleVariants.length?p.saleVariants.map((variant:any)=>variantFrom(variant,p.stockStatus)):[newVariant()],
    translations:{
     bg:{...(translations.bg||{}),description:plainText(translations.bg?.description)},
     ru:{...(translations.ru||{}),description:plainText(translations.ru?.description)},
     en:{...(translations.en||{}),description:plainText(translations.en?.description)},
    },
    seo:{h1:p.seo?.h1||'',metaTitle:p.seo?.metaTitle||'',metaDescription:p.seo?.metaDescription||''},
   })
   setEditorOpen(true)
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да отворим растението.')}
  finally{setLoading(false)}
 }
 const setField=(key:keyof PlantForm,value:any)=>setForm(previous=>({...previous,[key]:value}))
 const setVariant=(index:number,key:keyof Variant,value:string)=>setForm(previous=>({...previous,saleVariants:previous.saleVariants.map((variant,i)=>i===index?{...variant,[key]:value}:variant)}))
 const uploadFiles=async(filesList:FileList|null)=>{
  if(!filesList?.length)return
  if(images.length+filesList.length>10){setError('Максимумът е 10 снимки.');return}
  setImageLoading(true);setError('')
  try{
   const added:ImageItem[]=[]
   for(const file of Array.from(filesList)){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=0||file.size>10*1024*1024)throw new Error('Използвайте JPG, PNG или WebP до 10 MB.')
    const data=new FormData();data.append('file',file,file.name)
    const response=await fetch('/api/manager/upload-image',{method:'POST',credentials:'same-origin',body:data})
    const result=await responseJson(response)
    if(!response.ok)throw new Error(result.error||'Снимката не беше качена.')
    added.push({assetId:result.assetId,url:result.url,name:file.name,alt:'',altEn:'',altRu:''})
   }
   setImages(previous=>[...previous,...added])
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да качим снимките.')}
  finally{setImageLoading(false)}
 }
 const generateWithAI=async()=>{
  if(aiLoading)return
  setAiLoading(true);setError('');setAiWarnings([])
  try{
   const category=categories.find(item=>item._id===form.categoryId)
   const response=await fetch('/api/manager/plants/ai-enrich',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:{name:form.name,scientificName:form.scientificName,productType:form.productType,categoryName:category?.name||'',shortDescription:form.shortDescription,description:form.description}})})
   const result=await responseJson(response)
   if(!response.ok)throw new Error(result.error||'ИИ не успя да попълни данните.')
   const suggestion=result.suggestion||{}
   setForm(previous=>({...previous,
    shortDescription:suggestion.shortDescription||previous.shortDescription,
    description:suggestion.description||previous.description,
    translations:suggestion.translations||previous.translations,
    seo:suggestion.seo||previous.seo,
   }))
   setAiWarnings(Array.isArray(suggestion.warnings)?suggestion.warnings:[])
   setNotice('ИИ подготви текстовете. Проверете ги преди публикуване.')
  }catch(e){setError(e instanceof Error?e.message:'ИИ не успя да попълни данните.')}
  finally{setAiLoading(false)}
 }
 const save=async()=>{
  if(saving)return
  if(!form.name.trim()||!form.categoryIds.length||!form.slug.trim()||!form.saleVariants.length||!images.length){setError('Попълнете име, URL, категория, поне един размер и добавете снимка.');return}
  setSaving(true);setError('');setNotice('')
  try{
   const selected=images[mainImageIndex]
   const product={
    name:form.name,slug:form.slug,scientificName:form.scientificName,sku:form.sku,productType:form.productType,categoryId:form.categoryId||form.categoryIds[0],categoryIds:form.categoryIds,
    shortDescription:form.shortDescription,description:form.description,isFeatured:form.isFeatured,isActive:form.isActive,
    saleVariants:form.saleVariants.map(v=>({...v,saleHeightCm:v.saleHeightCm,containerVolumeL:v.containerVolumeL,priceEUR:v.priceEUR,oldPriceEUR:v.oldPriceEUR,stockQuantity:v.stockQuantity})),
    mainImage:selected,gallery:images.filter((_,index)=>index!==mainImageIndex),
    translations:form.translations,seo:form.seo,
   }
   const idempotencyKey=pendingIdempotencyKey||crypto.randomUUID()
   if(!pendingIdempotencyKey)setPendingIdempotencyKey(idempotencyKey)
   const response=await fetch(editingId?'/api/manager/plants/'+encodeURIComponent(editingId):'/api/manager/plants',{
    method:editingId?'PATCH':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(editingId?{expectedRevision:revision,idempotencyKey,product}:{idempotencyKey,product}),
   })
   const result=await responseJson(response)
   if(!response.ok){if(result.conflict)throw new Error('Карточката е променена от друг служител. Затворете я и отворете отново, за да заредите актуалните данни.');throw new Error(result.error||'Не успяхме да запазим растението.')}
   setPendingIdempotencyKey(null)
   setNotice('Растението е публикувано и запазено в каталога.')
   setEditorOpen(false);setEditingId(null);await load()
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да запазим растението.')}
  finally{setSaving(false)}
 }
 const openHistory=async(productId?:string)=>{
  setHistoryLoading(true);setHistoryOpen(true);setError('')
  try{
   const url='/api/manager/plant-audit'+(productId?'?productId='+encodeURIComponent(productId):'?limit=50')
   const response=await fetch(url,{credentials:'same-origin',cache:'no-store'})
   const result=await responseJson(response)
   if(!response.ok)throw new Error(result.error||'Не успяхме да заредим историята.')
   setHistory(result.items||[])
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да заредим историята.')}
  finally{setHistoryLoading(false)}
 }
 const categoryOptions=useMemo(()=>categories.map(item=>({ ...item,label:item.parentName?item.parentName+' / '+item.name:item.name})),[categories])
 const activeImages=images.length>0

 return <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
  {!editorOpen&&!historyOpen&&<>
   <div className="mb-4 flex items-center justify-between gap-3">
    <div><h1 className="text-2xl font-bold text-stone-900">Каталог растений</h1><p className="mt-1 text-sm text-stone-500">Единое управление товарами · {items.length} в списке</p></div>
    {role==='owner'&&<button className={btn+' border border-stone-300 bg-white'} onClick={()=>void openHistory()}>История</button>}
   </div>
   <div className="sticky top-0 z-10 -mx-3 mb-3 space-y-2 border-y border-stone-200 bg-[#f5f6ef] px-3 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
    <input className={inputClass} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Търсене по име, латинско име или артикул…" aria-label="Търсене на растение"/>
    <div className="grid grid-cols-2 gap-2">
     <select className={inputClass} value={categoryId} onChange={event=>setCategoryId(event.target.value)}><option value="">Всички категории</option>{categoryOptions.map(item=><option key={item._id} value={item._id}>{item.label}</option>)}</select>
     <select className={inputClass} value={sort} onChange={event=>setSort(event.target.value as 'name'|'category')}><option value="category">Сортиране: категория</option><option value="name">Сортиране: име</option></select>
    </div>
   </div>
   {error&&<div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
   {notice&&<div className="mb-3 rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
   {loading?<div className="py-12 text-center text-stone-500">Зареждане на растенията…</div>:items.length===0?<div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">Няма намерени растения.</div>:
    <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
     {items.map(item=><button key={item._id} onClick={()=>void openExisting(item._id)} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-lime-50 sm:gap-4 sm:p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">{item.thumbnail?<img src={item.thumbnail} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-xs text-stone-400">Без снимка</div>}</div>
      <div className="min-w-0 flex-1">
       <div className="line-clamp-2 font-semibold text-stone-900">{item.name}</div>
       {item.scientificName&&<div className="mt-0.5 truncate text-xs italic text-stone-500">{item.scientificName}</div>}
       <div className="mt-1 text-sm font-semibold text-stone-800">{money(item.priceFromEUR)}</div>
       <div className="mt-1 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">{stockLabels[item.listStockStatus]||'Наличност не е посочена'}</span>{item.variantCount>1&&<span className="rounded-full bg-lime-50 px-2 py-1 text-lime-800">{item.variantCount} размера</span>}</div>
      </div>
      <span className="text-xl text-stone-400">›</span>
     </button>)}
    </div>}
   <div className="h-20"/>
   <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0">
    <button onClick={openNew} className="w-full rounded-xl bg-lime-800 px-5 py-4 text-base font-bold text-white shadow-lg hover:bg-lime-900">＋ Добави растение</button>
   </div>
  </>}
  {editorOpen&&<>
   <div className="mb-4 flex items-center justify-between gap-3"><button className={btn+' border border-stone-300 bg-white'} onClick={()=>setEditorOpen(false)}>← Назад</button><h2 className="text-xl font-bold">{editingId?'Редактиране на растение':'Ново растение'}</h2><span className="w-16"/></div>
   {error&&<div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
   {notice&&<div className="mb-3 rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
   <div className="space-y-4">
    <section className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Снимки на растението</h3><label className={btn+' cursor-pointer bg-lime-50 text-lime-800'}>{imageLoading?'Качване…':'＋ Добави снимки'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={imageLoading} onChange={event=>{void uploadFiles(event.target.files);event.currentTarget.value=''}}/></label></div>
     <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((image,index)=><div key={image.assetId} className={'relative overflow-hidden rounded-xl border-2 '+(mainImageIndex===index?'border-lime-700':'border-stone-200')}>
       <button type="button" className="block aspect-square w-full" onClick={()=>setMainImageIndex(index)}><img src={image.url} alt="" className="h-full w-full object-cover"/>{mainImageIndex===index&&<span className="absolute left-1 top-1 rounded-md bg-lime-800 px-2 py-1 text-[10px] font-bold text-white">Основна</span>}</button>
       <button type="button" onClick={()=>{setImages(previous=>previous.filter((_,i)=>i!==index));setMainImageIndex(previous=>previous>index?previous-1:previous===index?0:previous)}} className="absolute right-1 top-1 rounded-full bg-white/95 px-2 py-1 text-xs text-red-700" aria-label="Премахни снимка">×</button>
      </div>)}
      {images.length===0&&<div className="col-span-3 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Добавете поне една снимка. Натиснете снимка, за да я направите основна.</div>}
     </div>
     {images.map((image,index)=><div key={image.assetId} className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3">
      <div className="text-xs font-semibold text-stone-600">Снимка {index+1}{mainImageIndex===index?' · Основна':''}</div>
      <label><span className={labelClass}>ALT (BG)</span><input className={inputClass} value={image.alt} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,alt:event.target.value}:item))}/></label>
      <label><span className={labelClass}>ALT (EN)</span><input className={inputClass} value={image.altEn} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,altEn:event.target.value}:item))}/></label>
      <label><span className={labelClass}>ALT (RU)</span><input className={inputClass} value={image.altRu} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,altRu:event.target.value}:item))}/></label>
     </div>)}
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <h3 className="font-bold">Основна информация</h3>
     <label className="block"><span className={labelClass}>Име на растението *</span><input className={inputClass} value={form.name} onChange={event=>{const name=event.target.value;setForm(previous=>({...previous,name,slug:previous.slug?previous.slug:slugify(name)}))}}/></label>
     <label className="block"><span className={labelClass}>Ботаническо име</span><input className={inputClass} value={form.scientificName} onChange={event=>setField('scientificName',event.target.value)}/></label>
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Тип растение</span><select className={inputClass} value={form.productType} onChange={event=>setField('productType',event.target.value)}>{productTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
     </div>
     <div className="space-y-2">
      <span className={labelClass}>Категории и подкатегории * · изберете всички подходящи</span>
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-stone-300 bg-white p-2">
       {categoryOptions.map(item=><div key={item._id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-stone-50">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={form.categoryIds.includes(item._id)} onChange={event=>setForm(previous=>{const ids=event.target.checked?Array.from(new Set([...previous.categoryIds,item._id])):previous.categoryIds.filter(id=>id!==item._id);return {...previous,categoryIds:ids,categoryId:ids.includes(previous.categoryId)?previous.categoryId:ids[0]||''}}}/><span className="truncate">{item.label}</span></label>
        {form.categoryIds.includes(item._id)&&<button type="button" onClick={()=>setField('categoryId',item._id)} className={'shrink-0 rounded-lg px-2 py-1 text-xs font-semibold '+(form.categoryId===item._id?'bg-lime-800 text-white':'bg-stone-100 text-stone-600')}>{form.categoryId===item._id?'Основна':'Основна?'}</button>}
       </div>)}
      </div>
      <p className="text-xs text-stone-500">Основната категория се използва като главна връзка; всички избрани категории се запазват към растението.</p>
     </div>
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Артикул / SKU</span><input className={inputClass} value={form.sku} onChange={event=>setField('sku',event.target.value)}/></label>
      <label><span className={labelClass}>URL адрес (slug) *</span><input className={inputClass} value={form.slug} onChange={event=>setField('slug',event.target.value)}/></label>
     </div>
     <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={event=>setField('isFeatured',event.target.checked)}/>Препоръчано растение</label>
     {editingId&&<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={event=>setField('isActive',event.target.checked)}/>Показвай в магазина</label>}
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Размери и цени</h3><span className="text-xs text-stone-500">{form.saleVariants.length}/30</span></div>
     {form.saleVariants.map((variant,index)=><div key={variant._key} className="space-y-3 rounded-xl border border-stone-200 p-3">
      <div className="flex items-center justify-between"><strong>Размер {index+1}</strong>{form.saleVariants.length>1&&<button type="button" onClick={()=>setForm(previous=>({...previous,saleVariants:previous.saleVariants.filter((_,i)=>i!==index)}))} className="text-sm font-semibold text-red-700">Премахни</button>}</div>
      <label><span className={labelClass}>Наименование / височина *</span><input className={inputClass} placeholder="Напр. 120–140 см, контейнер 10 л" value={variant.name} onChange={event=>setVariant(index,'name',event.target.value)}/></label>
      <div className="grid grid-cols-2 gap-2">
       <label><span className={labelClass}>Височина (см)</span><input type="number" min="0" step="1" className={inputClass} value={variant.saleHeightCm} onChange={event=>setVariant(index,'saleHeightCm',event.target.value)}/></label>
       <label><span className={labelClass}>Контейнер (л)</span><input type="number" min="0.1" step="0.1" className={inputClass} value={variant.containerVolumeL} onChange={event=>setVariant(index,'containerVolumeL',event.target.value)}/></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
       <label><span className={labelClass}>Цена (€) *</span><input type="number" min="0.01" step="0.01" className={inputClass} value={variant.priceEUR} onChange={event=>setVariant(index,'priceEUR',event.target.value)}/></label>
       <label><span className={labelClass}>Стара цена (€)</span><input type="number" min="0" step="0.01" className={inputClass} value={variant.oldPriceEUR} onChange={event=>setVariant(index,'oldPriceEUR',event.target.value)}/></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
       <label><span className={labelClass}>Наличност</span><select className={inputClass} value={variant.stockStatus} onChange={event=>setVariant(index,'stockStatus',event.target.value)}><option value="inStock">В наличност</option><option value="onRequest">По заявка</option><option value="outOfStock">Няма наличност</option></select></label>
       <label><span className={labelClass}>Количество</span><input type="number" min="0" step="1" className={inputClass} value={variant.stockQuantity} onChange={event=>setVariant(index,'stockQuantity',event.target.value)}/></label>
      </div>
      <label><span className={labelClass}>SKU на размера (по избор)</span><input className={inputClass} value={variant.sku} onChange={event=>setVariant(index,'sku',event.target.value)}/></label>
     </div>)}
     <button type="button" disabled={form.saleVariants.length>=30} onClick={()=>setForm(previous=>({...previous,saleVariants:[...previous.saleVariants,newVariant()]}))} className="w-full rounded-xl border border-dashed border-lime-700 px-4 py-3 font-semibold text-lime-800 disabled:opacity-40">＋ Добави размер</button>
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Описание и преводи</h3><button type="button" disabled={aiLoading||form.name.trim().length<2} onClick={()=>void generateWithAI()} className={btn+' bg-lime-800 text-white disabled:opacity-50'}>{aiLoading?'ИИ работи…':'✦ Попълни с ИИ'}</button></div>
     <label><span className={labelClass}>Кратко описание (BG)</span><textarea rows={3} className={inputClass} value={form.shortDescription} onChange={event=>setField('shortDescription',event.target.value)}/></label>
     <label><span className={labelClass}>Описание (BG)</span><textarea rows={7} className={inputClass} value={form.description} onChange={event=>setField('description',event.target.value)}/></label>
     {(['ru','en'] as const).map(language=><details key={language} className="rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">{language==='ru'?'Русский':'English'}</summary>
      <div className="mt-3 space-y-2">
       <label><span className={labelClass}>Название</span><input className={inputClass} value={form.translations[language]?.name||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],name:event.target.value}}}))}/></label>
       <label><span className={labelClass}>Краткое описание</span><textarea rows={2} className={inputClass} value={form.translations[language]?.shortDescription||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],shortDescription:event.target.value}}}))}/></label>
       <label><span className={labelClass}>Описание</span><textarea rows={5} className={inputClass} value={form.translations[language]?.description||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],description:event.target.value}}}))}/></label>
      </div>
     </details>)}
     {aiWarnings.length>0&&<ul className="list-disc space-y-1 pl-5 text-xs text-amber-800">{aiWarnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <h3 className="font-bold">SEO</h3>
     <label><span className={labelClass}>H1</span><input className={inputClass} value={form.seo.h1} onChange={event=>setField('seo',{...form.seo,h1:event.target.value})}/></label>
     <label><span className={labelClass}>Meta title</span><input maxLength={70} className={inputClass} value={form.seo.metaTitle} onChange={event=>setField('seo',{...form.seo,metaTitle:event.target.value})}/></label>
     <label><span className={labelClass}>Meta description</span><textarea rows={3} maxLength={320} className={inputClass} value={form.seo.metaDescription} onChange={event=>setField('seo',{...form.seo,metaDescription:event.target.value})}/></label>
    </section>
    {role==='owner'&&<section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4"><div className="font-semibold">Ботаническа проверка</div><p className="mt-1 text-sm text-stone-500">Отделното изследване на биологичните свойства остава скрито от служителите и ще се включва само в Owner workflow.</p></section>}
    <div className="sticky bottom-0 z-10 -mx-3 border-t border-stone-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
     <button type="button" disabled={saving||!activeImages} onClick={()=>void save()} className="w-full rounded-xl bg-lime-800 px-5 py-4 text-base font-bold text-white disabled:opacity-50">{saving?'Запазване…':editingId?'Запази промените':'Публикувай растението'}</button>
    </div>
   </div>
  </>}
  {historyOpen&&<div className="rounded-2xl border border-stone-200 bg-white p-4">
   <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">История на промените</h2><button className={btn+' border border-stone-300'} onClick={()=>setHistoryOpen(false)}>Назад</button></div>
   {historyLoading?'Зареждане…':history.length===0?<p className="text-sm text-stone-500">Няма записи.</p>:<div className="divide-y divide-stone-200">{history.map((event:any)=><div key={event.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><strong>{event.product_name}</strong><span className="text-xs text-stone-500">{new Date(event.created_at).toLocaleString('bg-BG')}</span></div><p className="mt-1 text-sm">{event.actor_name||event.actor_id} · {event.actor_role} · {event.action} · {event.result}</p><p className="mt-1 text-xs text-stone-500">Променени полета: {(event.changed_fields||[]).join(', ')||'—'}</p>{event.error_code&&<p className="mt-1 text-xs text-red-700">Код: {event.error_code}</p>}</div>)}</div>}
  </div>}
 </div>
}
