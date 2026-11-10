import { useCallback, useEffect, useMemo, useState } from 'react'
import PlantImageLibrary, { type IntakeLibraryImage } from './PlantImageLibrary'

type Role='owner'|'manager'|'seller'
type ImageItem={assetId:string;url:string;name:string;alt:string;altEn:string;altRu:string}
type Variant={_key:string;name:string;nameEn:string;nameRu:string;sku:string;saleHeightCm:string;containerVolumeL:string;priceEUR:string;oldPriceEUR:string;stockStatus:string;stockQuantity:string;nameAuto?:boolean}
type PlantForm={
 name:string;slug:string;slugAuto:boolean;scientificName:string;sku:string;productType:string;categoryId:string;categoryIds:string[];
 shortDescription:string;description:string;isFeatured:boolean;isActive:boolean;
 saleVariants:Variant[];plantCare:Record<string,any>;careGuide:string;
 translations:Record<string,any>;
 seo:{h1:string;metaTitle:string;metaDescription:string};
}
type Category={_id:string;name:string;slug?:string;parentId?:string;parentName?:string}
type ListItem={_id:string;_rev:string;name:string;scientificName?:string;sku?:string;slug?:string;categoryId?:string;categoryName?:string;categoryParent?:string;thumbnail?:string;priceFromEUR:number|null;listStockStatus:string;variantCount:number;isActive?:boolean}
type Props={role:Role}
type RichTextOriginal={description:any;careGuide:any;translations:Record<string,any>}
const stockLabels:Record<string,string>={inStock:'В наличност',onRequest:'По заявка',outOfStock:'Няма наличност',mixed:'Различна наличност'}
const productTypes=[['plant','Растение'],['tree','Дърво'],['shrub','Храст'],['flower','Цвете'],['perennial','Многогодишно растение'],['indoor','Стайно растение'],['citrus','Цитрус'],['palm','Палма'],['conifer','Иглолистно растение'],['fruit','Плодово растение'],['succulent','Сукулент'],['climber','Катерливо растение'],['ornamentalGrass','Декоративна трева'],['groundcover','Почвопокривно растение'],['bulb','Луковично растение'],['herb','Билка'],['aquatic','Водно растение'],['other','Друг вид растение']]
const newVariant=():Variant=>({_key:crypto.randomUUID().replace(/-/g,'').slice(0,12),name:'',nameEn:'',nameRu:'',sku:'',saleHeightCm:'',containerVolumeL:'',priceEUR:'',oldPriceEUR:'',stockStatus:'onRequest',stockQuantity:'',nameAuto:true})
const emptyForm=():PlantForm=>({name:'',slug:'',slugAuto:true,scientificName:'',sku:'',productType:'plant',categoryId:'',categoryIds:[],shortDescription:'',description:'',isFeatured:false,isActive:true,saleVariants:[newVariant()],plantCare:{},careGuide:'',translations:{bg:{},ru:{},en:{}},seo:{h1:'',metaTitle:'',metaDescription:''}})
const plainText=(value:any):string=>typeof value==='string'?value:Array.isArray(value)?value.map((block:any)=>Array.isArray(block?.children)?block.children.map((child:any)=>child?.text||'').join(''):'').filter(Boolean).join('\n\n'):''
const transliteration:Record<string,string>={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'y',ю:'yu',я:'ya',ё:'yo'}
const slugify=(value:string)=>value.toLocaleLowerCase('bg-BG').replace(/[а-яё]/g,char=>transliteration[char]||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96)||'plant'
const imageFrom=(value:any):ImageItem|null=>{
 const assetId=value?.asset?._id||value?.asset?._ref
 const url=value?.asset?.url
 if(typeof assetId!=='string'||typeof url!=='string')return null
 return {assetId,url,name:value?.originalFilename||'Снимка',alt:value?.alt||'',altEn:value?.altEn||'',altRu:value?.altRu||''}
}
const variantFrom=(value:any,rootStatus?:string):Variant=>({
 _key:value?._key||crypto.randomUUID().replace(/-/g,'').slice(0,12),name:value?.name||'',nameEn:value?.nameEn||'',nameRu:value?.nameRu||'',sku:value?.sku||'',nameAuto:!String(value?.name||'').trim(),
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
 const [originalRichText,setOriginalRichText]=useState<RichTextOriginal>({description:null,careGuide:null,translations:{}})
 const [mainImageIndex,setMainImageIndex]=useState(0)
 const [saving,setSaving]=useState(false)
 const [aiProof,setAiProof]=useState<string|null>(null)
 const [imageLoading,setImageLoading]=useState(false)
 const [libraryOpen,setLibraryOpen]=useState(false)
 const [historyOpen,setHistoryOpen]=useState(false)
 const [history,setHistory]=useState<any[]>([])
 const [historyLoading,setHistoryLoading]=useState(false)
 const [aiWarnings,setAiWarnings]=useState<string[]>([])
 const [geminiLoading,setGeminiLoading]=useState(false)
 const [geminiError,setGeminiError]=useState('')
 const [geminiResult,setGeminiResult]=useState<any|null>(null)
 const [geminiModalOpen,setGeminiModalOpen]=useState(false)
 const [geminiProof,setGeminiProof]=useState<string|null>(null)
 const [geminiProofAssetId,setGeminiProofAssetId]=useState('')
 const [geminiTextQuery,setGeminiTextQuery]=useState('')
 const [geminiStreamText,setGeminiStreamText]=useState('')
 const [geminiStage,setGeminiStage]=useState('')
 const [geminiRequestId,setGeminiRequestId]=useState('')
 const [geminiElapsedSeconds,setGeminiElapsedSeconds]=useState(0)
 const [aiIdentityNeedsConfirmation,setAiIdentityNeedsConfirmation]=useState(false)
 const [pendingIdempotencyKey,setPendingIdempotencyKey]=useState<string|null>(null)

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
 useEffect(()=>{
  if(!geminiLoading){setGeminiElapsedSeconds(0);return}
  const started=Date.now()
  const update=()=>setGeminiElapsedSeconds(Math.floor((Date.now()-started)/1000))
  update()
  const timer=window.setInterval(update,1000)
  return ()=>window.clearInterval(timer)
 },[geminiLoading])
 const openNew=()=>{setGeminiError('');setGeminiResult(null);setGeminiModalOpen(false);setGeminiProof(null);setGeminiProofAssetId('');setGeminiStreamText('');setGeminiStage('');setEditingId(null);setRevision('');setAiProof(null);setAiIdentityNeedsConfirmation(false);setForm(emptyForm());setOriginalRichText({description:null,careGuide:null,translations:{}});setImages([]);setLibraryOpen(false);setMainImageIndex(0);setAiWarnings([]);setError('');setNotice('');setEditorOpen(true)}
 const openExisting=async(id:string)=>{
  setGeminiError('');setGeminiResult(null);setGeminiModalOpen(false);setGeminiProof(null);setGeminiProofAssetId('');setGeminiStreamText('');setGeminiStage('')
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
   setOriginalRichText({description:p.description||null,careGuide:p.careGuide||null,translations:{bg:translations.bg?.description||null,ru:translations.ru?.description||null,en:translations.en?.description||null}})
   setAiProof(null);setAiIdentityNeedsConfirmation(false);setEditingId(id);setRevision(p._rev);setImages(all);setLibraryOpen(false);setMainImageIndex(0);setAiWarnings([])
   setForm({
    name:p.name||'',slug:p.slug?.current||slugify(p.name||''),slugAuto:!p.slug?.current,scientificName:p.scientificName||'',sku:p.sku||'',productType:p.productType||'plant',
    categoryId:p.category?._ref||p.categoryId||'',categoryIds:Array.from(new Set([p.category?._ref,...(Array.isArray(p.categories)?p.categories.map((item:any)=>item?._ref):[])].filter(Boolean))),shortDescription:p.shortDescription||'',description:plainText(p.description),
    isFeatured:p.isFeatured===true,isActive:p.isActive!==false,
    saleVariants:Array.isArray(p.saleVariants)&&p.saleVariants.length?p.saleVariants.map((variant:any)=>variantFrom(variant,p.stockStatus)):[newVariant()],
    translations:{
     bg:{...(translations.bg||{}),description:plainText(translations.bg?.description)},
     ru:{...(translations.ru||{}),description:plainText(translations.ru?.description)},
     en:{...(translations.en||{}),description:plainText(translations.en?.description)},
    },
    seo:{h1:p.seo?.h1||'',metaTitle:p.seo?.metaTitle||'',metaDescription:p.seo?.metaDescription||''},
    plantCare:p.plantCare||{},careGuide:plainText(p.careGuide),
   })
   setEditorOpen(true)
  }catch(e){setError(e instanceof Error?e.message:'Не успяхме да отворим растението.')}
  finally{setLoading(false)}
 }
 const setField=(key:keyof PlantForm,value:any)=>setForm(previous=>({...previous,[key]:value}))
 const makeVariantName=(height:string,container:string)=>{const h=Number(height),v=Number(container);const hasHeight=height.trim()!==''&&Number.isFinite(h)&&h>0;const hasContainer=container.trim()!==''&&Number.isFinite(v)&&v>0;const parts:string[]=[];if(hasHeight){const low=Math.round(h*0.95),high=Math.round(h*1.05);parts.push('Размер '+low+'–'+high+' см')}if(hasContainer){const volume=String(v);parts.push('C'+volume)}return parts.join(' ')}
 const setVariant=(index:number,key:keyof Variant,value:string)=>setForm(previous=>({...previous,saleVariants:previous.saleVariants.map((variant,i)=>{if(i!==index)return variant;const next={...variant,[key]:value};if(key==='name'){next.nameAuto=!value.trim();return next}if((key==='saleHeightCm'||key==='containerVolumeL')&&(variant.nameAuto||!variant.name.trim())){next.name=makeVariantName(key==='saleHeightCm'?value:variant.saleHeightCm,key==='containerVolumeL'?value:variant.containerVolumeL);next.nameAuto=true}return next})}))
 const uploadFiles=async(filesList:FileList|null)=>{
  if(!filesList?.length)return
  setGeminiError('');setGeminiResult(null)
  if(images.length+filesList.length>10){setError('Максимумът е 10 снимки.');return}
  setImageLoading(true);setAiProof(null);setError('')
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
 const toggleLibraryImage=(image:IntakeLibraryImage)=>{
  setGeminiError('');setGeminiResult(null);setAiProof(null)
  const exists=images.some(item=>item.assetId===image.assetId)
  if(exists){setImages(previous=>previous.filter(item=>item.assetId!==image.assetId));return}
  if(images.length>=10){setError('Максимумът е 10 снимки.');return}
  setImages(previous=>[...previous,{assetId:image.assetId,url:image.url,name:image.name,alt:'',altEn:'',altRu:''}])
 }
 const runGemini=async(mode:'photo'|'text')=>{
  if(geminiLoading)return
  const targetImage=images[mainImageIndex]||null
  const requestedName=mode==='text'?(geminiTextQuery.trim()||form.name.trim()):form.name.trim()
  if(mode==='photo'&&!targetImage){setGeminiError('Първо добавете основна снимка на растението.');return}
  if(mode==='text'&&!requestedName){setGeminiError('Въведете име на растение, например „лавровишня“.');return}
  setGeminiLoading(true);setGeminiError('');setGeminiResult(null);setGeminiModalOpen(false);setGeminiProof(null);setGeminiProofAssetId('');setAiProof(null);setGeminiStreamText('');setGeminiStage('Подготвяме заявката…');setGeminiRequestId('')
  const controller=new AbortController()
  const requestTimeout=window.setTimeout(()=>controller.abort(),310000)
  try{
   const category=categories.find(item=>item._id===form.categoryId)
   const requestBody=JSON.stringify({
    mode,
    mainImageAssetId:targetImage?.assetId||'',
    product:mode==='text'?{name:requestedName,productType:'plant'}:{name:requestedName,scientificName:form.scientificName,productType:form.productType,categoryId:form.categoryId,categoryIds:form.categoryIds,categoryName:category?.name||'',shortDescription:form.shortDescription,description:form.description},
    categories:categoryOptions.map(item=>({id:item._id,name:item.name})),
    ...(mode==='photo'&&targetImage?{mainImage:{assetId:targetImage.assetId,url:targetImage.url}}:{}),
   })
   let response:Response
   try{
    response=await fetch('/api/manager/plants/gemini-test',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:requestBody,signal:controller.signal})
   }catch(fetchError){
    if(fetchError instanceof Error&&fetchError.name==='AbortError')throw fetchError
    throw new Error('Не успяхме да установим връзка с Florial Manager. Код: GEMINI_CLIENT_REQUEST_FAILED · Проверете интернет връзката и опитайте отново.')
   }
   if(!response.ok){
    const result=await responseJson(response)
    throw new Error([result.error||'Gemini не успя да подготви тестовия резултат.',result.code?'Код: '+result.code:'',result.providerHttpStatus?'Google HTTP: '+result.providerHttpStatus:'',result.providerStatus?'Причина Google: '+result.providerStatus:'',result.providerMessage?'Подробности Google: '+result.providerMessage:'',result.requestId?'ID: '+result.requestId:''].filter(Boolean).join(' · '))
   }
   if(!response.body)throw new Error('Браузърът не получи поток отговор от Gemini.')
   const reader=response.body.getReader(),decoder=new TextDecoder()
   let buffer='',receivedResult=false,streamError='',observedRequestId='',observedStage='response_open'
   const handleLine=(line:string)=>{
    if(!line.startsWith('data:'))return
    const raw=line.slice(5).trim()
    if(!raw)return
    let event:any
    try{event=JSON.parse(raw)}catch{return}
    if(event.requestId){observedRequestId=event.requestId;setGeminiRequestId(event.requestId)}
    if(event.type==='progress'){observedStage=event.stage||observedStage;setGeminiStage((event.message||event.stage||'Gemini обработва заявката…')+(event.providerHttpStatus?' · Google HTTP '+event.providerHttpStatus:''))}
    if(event.type==='heartbeat')setGeminiStage('Връзката остава активна. Етап: '+(event.stage||observedStage)+'. Изчакваме следващия отговор от Google…')
    if(event.type==='delta')setGeminiStreamText(previous=>previous+(event.text||''))
    if(event.type==='result'){receivedResult=true;setGeminiResult(event);setGeminiProof(typeof event.aiProof==='string'?event.aiProof:null);setGeminiProofAssetId(typeof event.proofAssetId==='string'?event.proofAssetId:'');setGeminiModalOpen(true);setGeminiStage('Анализът е завършен. Проверете резултата и потвърдете прилагането.')}
    if(event.type==='error')streamError=[event.error||'Gemini не успя да обработи заявката.',event.code?'Код: '+event.code:'',event.stage?'Етап: '+event.stage:'',event.providerHttpStatus?'Google HTTP: '+event.providerHttpStatus:'',event.providerStatus?'Причина Google: '+event.providerStatus:'',event.providerContentType?'Тип отговора: '+event.providerContentType:'',event.providerBytesReceived!==undefined?'Получени bytes: '+event.providerBytesReceived:'',event.modelCharsReceived!==undefined?'Получени символи: '+event.modelCharsReceived:'',event.providerMessage?'Подробности Google: '+event.providerMessage:'',event.requestId?'ID: '+event.requestId:''].filter(Boolean).join(' · ')
   }
   while(true){
    let next:{value:Uint8Array|undefined;done:boolean}
    try{next=await reader.read()}catch{
     if(controller.signal.aborted)throw new DOMException('Gemini request timed out','AbortError')
     throw new Error(['Потокът отговор прекъсна на връзката с браузъра.', 'Код: GEMINI_CLIENT_STREAM_INTERRUPTED', 'Етап: '+observedStage, observedRequestId?'Request ID: '+observedRequestId:''].filter(Boolean).join(' · '))
    }
    const {value,done}=next
    if(done)break
    buffer+=decoder.decode(value,{stream:true})
    let newline=buffer.indexOf('\n')
    while(newline>=0){handleLine(buffer.slice(0,newline).replace(/\r$/,''));buffer=buffer.slice(newline+1);newline=buffer.indexOf('\n')}
   }
   buffer+=decoder.decode()
   if(buffer)handleLine(buffer.replace(/\r$/,''))
   if(streamError)throw new Error(streamError)
   if(!receivedResult)throw new Error('Поток Gemini приключи, но не получихме завършен структуриран резултат. Проверете потока отговор по-горе.')
  }catch(e){
   setGeminiError(e instanceof Error?(e.name==='AbortError'?'Gemini не отговори в рамките на пет минути. Потокът беше прекъснат от браузъра.':e.message):'Неуспешен тест на Gemini.')
  }finally{window.clearTimeout(requestTimeout);setGeminiLoading(false)}
 }
 const applyGeminiResult=async()=>{
  const suggestion=geminiResult?.result
  if(!suggestion){setGeminiError('Няма завършен резултат от Google за прилагане.');return}
  const selected=images[mainImageIndex]
  const proofMatchesSelectedImage=Boolean(selected&&geminiProof&&geminiProofAssetId===selected.assetId)
  if(!proofMatchesSelectedImage){setGeminiError('За да запишете резултата, добавете основна снимка в карточката и изпълнете отново Gemini Photo или Text. В Text режим снимката не се изпраща към Google.');return}
  const plantName=String(suggestion.plantName||'').trim()
  const nextName=plantName||form.name||'Растение за идентификация'
  const categoryId=categoryOptions.some(item=>item._id===suggestion.categoryId)?suggestion.categoryId:''
  const localized={...form.translations}
  for(const language of ['bg','ru','en'] as const){
   const incoming=suggestion.descriptions?.[language]||{}
   const seo=suggestion.seo?.[language]||{}
   const previous=localized[language]||{}
   localized[language]={...previous,name:incoming.name||previous.name||(language==='bg'?nextName:''),shortDescription:incoming.shortDescription||'',description:incoming.description||'',seo:{...(previous.seo||{}),h1:seo.h1||'',metaTitle:seo.metaTitle||'',metaDescription:seo.metaDescription||''}}
  }
  const bgSeo=suggestion.seo?.bg||{}
  const care=suggestion.plantCare||{}
  const numeric=(value:any)=>value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):undefined
  const topScientificCandidate=Array.isArray(suggestion.scientificCandidates)?suggestion.scientificCandidates[0]:null
  const nextScientificName=topScientificCandidate?.confidence==='high'?topScientificCandidate.scientificName:form.scientificName
  const needsIdentityConfirmation=!plantName&&!form.name.trim()
  const nextForm:PlantForm={...form,name:nextName,scientificName:nextScientificName,slug:form.slugAuto?slugify(nextName):form.slug,productType:productTypes.some(([value])=>value===suggestion.productType)?suggestion.productType:form.productType,categoryId:categoryId||form.categoryId,categoryIds:categoryId?[categoryId]:form.categoryIds,shortDescription:suggestion.descriptions?.bg?.shortDescription||'',description:suggestion.descriptions?.bg?.description||'',translations:localized,seo:{h1:bgSeo.h1||'',metaTitle:bgSeo.metaTitle||'',metaDescription:bgSeo.metaDescription||''},...(role==='owner'?{plantCare:{light:['sun','partialShade','shade'].includes(care.light)?care.light:undefined,waterNeeds:['low','medium','high'].includes(care.waterNeeds)?care.waterNeeds:undefined,minWinterTempC:numeric(care.minWinterTempC),adultHeightCm:numeric(care.adultHeightCm),foliageType:['evergreen','deciduous'].includes(care.foliageType)?care.foliageType:undefined,floweringSeason:Array.isArray(care.floweringSeason)?care.floweringSeason:[],plantingSeason:Array.isArray(care.plantingSeason)?care.plantingSeason:[],blackSeaCoast:'needsVerification'},careGuide:suggestion.careGuide||''}:{})}
  const nextImages=geminiResult.mode==='photo'&&suggestion.imageAlt?images.map((image,index)=>index===mainImageIndex?{...image,alt:suggestion.imageAlt.bg||image.alt,altRu:suggestion.imageAlt.ru||image.altRu,altEn:suggestion.imageAlt.en||image.altEn}:image):images
  setForm(nextForm)
  setImages(nextImages)
  setAiProof(geminiProof)
  setAiIdentityNeedsConfirmation(needsIdentityConfirmation)
  const warnings:string[]=[]
  if(!plantName)warnings.push('Google не определи достатъчно уверено името. Въведете и потвърдете името ръчно.')
  if(suggestion.confidence==='low')warnings.push('Увереността на идентификацията е ниска. Проверете ботаническото име и описанието.')
  else if(suggestion.confidence==='medium')warnings.push('Идентификацията е предварителна. Проверете предложеното растение.')
  if(!categoryId)warnings.push('Google не предложи валидна категория. Запазена е текущата категория.')
  if(Array.isArray(suggestion.scientificCandidates)&&suggestion.scientificCandidates.length)warnings.push('Латинските имена са кандидати, а не научно потвърдено име. Изберете и проверете ботаническото име ръчно.')
  setAiWarnings(warnings)
  setGeminiError('')
  const saved=await save({form:nextForm,images:nextImages,aiProof:geminiProof,identityNeedsConfirmation:needsIdentityConfirmation})
  if(saved){setGeminiModalOpen(false);setGeminiError('')}else{setGeminiModalOpen(false)}
 }
 const save=async(overrides?:{form?:PlantForm;images?:ImageItem[];aiProof?:string|null;identityNeedsConfirmation?:boolean}):Promise<boolean>=>{
  if(saving)return false
  const activeForm=overrides?.form||form
  const activeImages=overrides?.images||images
  const activeProof=overrides&&Object.prototype.hasOwnProperty.call(overrides,'aiProof')?overrides.aiProof:aiProof
  const needsIdentityConfirmation=overrides?.identityNeedsConfirmation??aiIdentityNeedsConfirmation
  const fail=(message:string)=>{setError(message);if(overrides)setGeminiError(message);return false}
  if(needsIdentityConfirmation)return fail('Въведете и потвърдете реалното име на растението преди записване.')
  if(!activeProof)return fail('Първо проверете растението с Google Gemini и потвърдете резултата.')
  if(!activeForm.saleVariants.some(variant=>Number(variant.saleHeightCm)>0||Number(variant.containerVolumeL)>0))return fail('Добавете поне един реален размер: височина или обем на контейнера.')
  const allowedCategoryIds=activeForm.categoryIds.filter(id=>categoryOptions.some(item=>item._id===id));
  if(!activeForm.name.trim()||!allowedCategoryIds.length||!activeForm.slug.trim()||!activeForm.saleVariants.length||!activeImages.length)return fail('Попълнете име, крайна категория, поне един размер и добавете снимка.')
  setSaving(true);setError('');setNotice('')
  try{
   const selected=activeImages[mainImageIndex]
   const product={
    name:activeForm.name,slug:activeForm.slug,scientificName:activeForm.scientificName,sku:activeForm.sku,productType:activeForm.productType,categoryId:allowedCategoryIds.includes(activeForm.categoryId)?activeForm.categoryId:allowedCategoryIds[0],categoryIds:allowedCategoryIds,
    shortDescription:activeForm.shortDescription,
    description:Array.isArray(originalRichText.description)&&activeForm.description===plainText(originalRichText.description)?originalRichText.description:activeForm.description,
    isFeatured:activeForm.isFeatured,isActive:activeForm.isActive,
    saleVariants:activeForm.saleVariants.map(v=>({...v,nameAuto:undefined,saleHeightCm:v.saleHeightCm,containerVolumeL:v.containerVolumeL,priceEUR:v.priceEUR,oldPriceEUR:v.oldPriceEUR,stockQuantity:v.stockQuantity})),
    mainImage:selected,gallery:activeImages.filter((_,index)=>index!==mainImageIndex),
    translations:Object.fromEntries(['bg','ru','en'].map(language=>{const current=activeForm.translations[language]||{};const original=originalRichText.translations[language];return [language,{...current,description:Array.isArray(original)&&current.description===plainText(original)?original:current.description}]})),
    seo:activeForm.seo,
    ...(role==='owner'?{plantCare:activeForm.plantCare,careGuide:Array.isArray(originalRichText.careGuide)&&activeForm.careGuide===plainText(originalRichText.careGuide)?originalRichText.careGuide:activeForm.careGuide}:{}),
   }
   const idempotencyKey=pendingIdempotencyKey||crypto.randomUUID()
   if(!pendingIdempotencyKey)setPendingIdempotencyKey(idempotencyKey)
   const response=await fetch(editingId?'/api/manager/plants/'+encodeURIComponent(editingId):'/api/manager/plants',{
    method:editingId?'PATCH':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(editingId?{expectedRevision:revision,idempotencyKey,aiProof:activeProof,product}:{idempotencyKey,aiProof:activeProof,product}),
   })
   const result=await responseJson(response)
   if(!response.ok){if(result.conflict)throw new Error('Продуктът е променена от друг служител. Затворете я и отворете отново, за да заредите актуалните данни.');throw new Error(result.error||'Не успяхме да запазим растението.')}
   setPendingIdempotencyKey(null)
   setNotice('Растението е публикувано и запазено в каталога.')
   setEditorOpen(false);setEditingId(null);await load();return true
  }catch(e){const message=e instanceof Error?e.message:'Не успяхме да запазим растението.';setError(message);if(overrides)setGeminiError(message);return false}
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
 const categoryOptions=useMemo(()=>{const parentIds=new Set(categories.map(item=>item.parentId).filter(Boolean));return categories.filter(item=>!parentIds.has(item._id)).map(item=>({...item,label:item.name}))},[categories])
 const activeImages=images.length>0

 return <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
  {!editorOpen&&!historyOpen&&<>
   <div className="mb-4 flex items-center justify-between gap-3">
    <div><h1 className="text-2xl font-bold text-stone-900">Каталог на растенията</h1><p className="mt-1 text-sm text-stone-500">Единое управление товарами · {items.length} в списке</p></div>
    {role==='owner'&&<button className={btn+' border border-stone-300 bg-white'} onClick={()=>void openHistory()}>История</button>}
   </div>
   <div className="sticky top-0 z-10 -mx-3 mb-3 space-y-2 border-y border-stone-200 bg-[#f5f6ef] px-3 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
    <input className={inputClass} value={query} onChange={event=>setQuery(event.target.value)} placeholder={role==='owner'?'Търсене по име, латинско име или артикул…':'Търсене по име или латинско име…'} aria-label="Търсене на растение"/>
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Снимки на растението</h3><div className="flex flex-wrap gap-2">
       <button type="button" className={btn+' border border-stone-300 bg-white'} onClick={()=>setLibraryOpen(previous=>!previous)}>{libraryOpen?'Скрий библиотека':'Избери от библиотеката'}</button>
       <label className={btn+' cursor-pointer bg-lime-50 text-lime-800'}>{imageLoading?'Качване…':'＋ Качи снимки'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={imageLoading} onChange={event=>{void uploadFiles(event.target.files);event.currentTarget.value=''}}/></label>
      </div></div>
     <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((image,index)=><div key={image.assetId} className={'relative overflow-hidden rounded-xl border-2 '+(mainImageIndex===index?'border-lime-700':'border-stone-200')}>
       <button type="button" className="block aspect-square w-full" onClick={()=>{setGeminiError('');setGeminiResult(null);setGeminiStreamText('');setGeminiStage('');setAiProof(null);setMainImageIndex(index)}}><img src={image.url} alt="" className="h-full w-full object-cover"/>{mainImageIndex===index&&<span className="absolute left-1 top-1 rounded-md bg-lime-800 px-2 py-1 text-[10px] font-bold text-white">Основна</span>}</button>
       <button type="button" onClick={()=>{setGeminiError('');setGeminiResult(null);setGeminiStreamText('');setGeminiStage('');setAiProof(null);setImages(previous=>previous.filter((_,i)=>i!==index));setMainImageIndex(previous=>previous>index?previous-1:previous===index?0:previous)}} className="absolute right-1 top-1 rounded-full bg-white/95 px-2 py-1 text-xs text-red-700" aria-label="Премахни снимка">×</button>
      </div>)}
      {images.length===0&&<div className="col-span-3 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Добавете поне една снимка. Натиснете снимка, за да я направите основна.</div>}
     </div>
     {libraryOpen&&<PlantImageLibrary selectedAssetIds={images.map(image=>image.assetId)} usedAssetIds={[]} maxSelectable={10} onToggle={toggleLibraryImage}/>}
     <div className="mt-3 flex flex-wrap items-center gap-3">
      <span className="text-xs text-stone-500">Изберете Google Gemini Flash-Lite за попълване по снимка или по име. Резултатът винаги се показва преди запис.</span>
     </div>
     <div className="mt-3 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
      <div><h4 className="font-bold text-indigo-950">Google Gemini 3.5 Flash-Lite</h4><p className="mt-1 text-xs text-stone-600">Photo анализира основната снимка. Text анализира само въведеното име и не изпраща изображението към Google. Резултатът се показва за проверка и не се записва без потвърждение.</p></div>
      <div className="flex flex-wrap gap-2">
       <button type="button" disabled={geminiLoading||imageLoading||!activeImages} onClick={()=>void runGemini('photo')} className={btn+' bg-lime-800 text-white disabled:opacity-50'}>{geminiLoading&&geminiStage.toLowerCase().includes('сним')?'Google Photo работи…':'✦ Попълни по снимка'}</button>
       <button type="button" disabled={geminiLoading||imageLoading||!(geminiTextQuery.trim()||form.name.trim())} onClick={()=>void runGemini('text')} className={btn+' border border-indigo-300 bg-white text-indigo-800 disabled:opacity-50'}>{geminiLoading&&geminiStage.toLowerCase().includes('text')?'Google Text работи…':'Попълни по име'}</button>
      </div>
      <label className="block"><span className={labelClass}>Име за проверка без снимка</span><input className={inputClass} value={geminiTextQuery} onChange={event=>setGeminiTextQuery(event.target.value)} placeholder={form.name||'Например: лавровишня'}/></label>
      {geminiLoading&&<div className="rounded-xl border border-indigo-200 bg-white p-3 text-sm text-indigo-950" role="status" aria-live="polite">
       <div className="flex flex-wrap items-center justify-between gap-2 font-semibold"><span>{geminiStage||'Google обработва заявката…'}</span><span className="tabular-nums">{String(Math.floor(geminiElapsedSeconds/60)).padStart(2,'0')}:{String(geminiElapsedSeconds%60).padStart(2,'0')}</span></div>
       <p className="mt-1 text-xs text-stone-500">Изчакването може да отнеме до 5 минути. Request ID: {geminiRequestId||'получава се…'}</p>
      </div>}
      {geminiStreamText&&<details className="rounded-xl border border-indigo-200 bg-white p-3" open={geminiLoading}><summary className="cursor-pointer text-sm font-semibold">Потоков отговор Google — {geminiStreamText.length} символа</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">{geminiStreamText}</pre></details>}
      {geminiError&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{geminiError}</div>}
      {aiProof&&<p className="text-xs font-semibold text-lime-800">Резултатът от Google е приложен. Цените, размерите, SKU, количествата и снимките не са променени.</p>}
     </div>
     {role==='owner'&&images.map((image,index)=><div key={image.assetId} className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3">
      <div className="text-xs font-semibold text-stone-600">Снимка {index+1}{mainImageIndex===index?' · Основна':''}</div>
      <label><span className={labelClass}>ALT (BG)</span><input className={inputClass} value={image.alt} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,alt:event.target.value}:item))}/></label>
      <label><span className={labelClass}>ALT (EN)</span><input className={inputClass} value={image.altEn} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,altEn:event.target.value}:item))}/></label>
      <label><span className={labelClass}>ALT (RU)</span><input className={inputClass} value={image.altRu} onChange={event=>setImages(previous=>previous.map((item,i)=>i===index?{...item,altRu:event.target.value}:item))}/></label>
     </div>)}
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <h3 className="font-bold">Основна информация</h3>
     <label className="block"><span className={labelClass}>Име на растението *</span><input className={inputClass} value={form.name} onChange={event=>{const name=event.target.value;if(aiIdentityNeedsConfirmation&&name.trim()&&name.trim()!=='Растение за идентификация')setAiIdentityNeedsConfirmation(false);setForm(previous=>({...previous,name,slug:previous.slugAuto?slugify(name):previous.slug}))}}/>{aiIdentityNeedsConfirmation&&<span className="mt-1 block text-sm text-amber-700">ИИ не определи надеждно растението. Заменете временното име с реалното име преди записване.</span>}</label>
     <label className="block"><span className={labelClass}>Ботаническо име</span><input className={inputClass} value={form.scientificName} onChange={event=>setField('scientificName',event.target.value)}/></label>
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Тип растение</span><select className={inputClass} value={form.productType} onChange={event=>setField('productType',event.target.value)}>{productTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
     </div>
     <div className="space-y-2">
      <span className={labelClass}>Категории и подкатегории * · изберете крайните категории</span>
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-stone-300 bg-white p-2">
       {categoryOptions.map(item=><div key={item._id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-stone-50">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={form.categoryIds.includes(item._id)} onChange={event=>setForm(previous=>{const ids=event.target.checked?Array.from(new Set([...previous.categoryIds,item._id])):previous.categoryIds.filter(id=>id!==item._id);return {...previous,categoryIds:ids,categoryId:ids.includes(previous.categoryId)?previous.categoryId:ids[0]||''}})}/><span className="truncate">{item.label}</span></label>
        {form.categoryIds.includes(item._id)&&<button type="button" onClick={()=>setField('categoryId',item._id)} className={'shrink-0 rounded-lg px-2 py-1 text-xs font-semibold '+(form.categoryId===item._id?'bg-lime-800 text-white':'bg-stone-100 text-stone-600')}>{form.categoryId===item._id?'Основна':'Основна?'}</button>}
       </div>)}
      </div>
      <p className="text-xs text-stone-500">Изберете само крайните категории, които описват растението.</p>
     </div>
     {role==='owner'&&<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Артикул / SKU</span><input className={inputClass} value={form.sku} onChange={event=>setField('sku',event.target.value)}/></label>
      <label><span className={labelClass}>URL адрес (slug) *</span><input className={inputClass} value={form.slug} onChange={event=>setForm(previous=>({...previous,slug:event.target.value,slugAuto:false}))}/></label>
     </div>}
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
      {role==='owner'&&<label><span className={labelClass}>SKU на размера (по избор)</span><input className={inputClass} value={variant.sku} onChange={event=>setVariant(index,'sku',event.target.value)}/></label>}
     </div>)}
     <button type="button" disabled={form.saleVariants.length>=30} onClick={()=>setForm(previous=>({...previous,saleVariants:[...previous.saleVariants,newVariant()]}))} className="w-full rounded-xl border border-dashed border-lime-700 px-4 py-3 font-semibold text-lime-800 disabled:opacity-40">＋ Добави размер</button>
    </section>
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{role==='owner'?'Описание и преводи':'Описание'}</h3>{aiProof&&<span className="text-xs font-semibold text-lime-800">Google попълването е изпълнено</span>}</div>
     <label><span className={labelClass}>Кратко описание (BG)</span><textarea rows={3} className={inputClass} value={form.shortDescription} onChange={event=>setField('shortDescription',event.target.value)}/></label>
     <label><span className={labelClass}>Описание (BG)</span><textarea rows={7} className={inputClass} value={form.description} onChange={event=>setField('description',event.target.value)}/></label>
     {role==='owner'&&(['ru','en'] as const).map(language=><details key={language} className="rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">{language==='ru'?'Русский':'English'}</summary>
      <div className="mt-3 space-y-2">
       <label><span className={labelClass}>Название</span><input className={inputClass} value={form.translations[language]?.name||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],name:event.target.value}}}))}/></label>
       <label><span className={labelClass}>Краткое описание</span><textarea rows={2} className={inputClass} value={form.translations[language]?.shortDescription||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],shortDescription:event.target.value}}}))}/></label>
       <label><span className={labelClass}>Описание</span><textarea rows={5} className={inputClass} value={form.translations[language]?.description||''} onChange={event=>setForm(previous=>({...previous,translations:{...previous.translations,[language]:{...previous.translations[language],description:event.target.value}}}))}/></label>
      </div>
     </details>)}
     {aiWarnings.length>0&&<ul className="list-disc space-y-1 pl-5 text-xs text-amber-800">{aiWarnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}
    </section>
    {role==='owner'&&<section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <h3 className="font-bold">SEO</h3>
     <label><span className={labelClass}>H1</span><input className={inputClass} value={form.seo.h1} onChange={event=>setField('seo',{...form.seo,h1:event.target.value})}/></label>
     <label><span className={labelClass}>Meta title</span><input maxLength={70} className={inputClass} value={form.seo.metaTitle} onChange={event=>setField('seo',{...form.seo,metaTitle:event.target.value})}/></label>
     <label><span className={labelClass}>Meta description</span><textarea rows={3} maxLength={320} className={inputClass} value={form.seo.metaDescription} onChange={event=>setField('seo',{...form.seo,metaDescription:event.target.value})}/></label>
    </section>}
    {role==='owner'&&<section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-5">
     <h3 className="font-bold">Ботанически характеристики и грижи · Owner</h3>
     <p className="text-xs text-stone-500">ИИ попълва само данни с достатъчна ботаническа опора. Черноморската пригодност остава за ръчна проверка.</p>
     <div className="grid gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Осветеност</span><select className={inputClass} value={form.plantCare.light||''} onChange={event=>setField('plantCare',{...form.plantCare,light:event.target.value||undefined})}><option value="">Не е определено</option><option value="sun">Пълно слънце</option><option value="partialShade">Полусянка</option><option value="shade">Сянка</option></select></label>
      <label><span className={labelClass}>Нужда от поливане</span><select className={inputClass} value={form.plantCare.waterNeeds||''} onChange={event=>setField('plantCare',{...form.plantCare,waterNeeds:event.target.value||undefined})}><option value="">Не е определена</option><option value="low">Ниска</option><option value="medium">Средна</option><option value="high">Висока</option></select></label>
      <label><span className={labelClass}>Тип листна маса</span><select className={inputClass} value={form.plantCare.foliageType||''} onChange={event=>setField('plantCare',{...form.plantCare,foliageType:event.target.value||undefined})}><option value="">Не е определен</option><option value="evergreen">Вечнозелено</option><option value="deciduous">Листопадно</option></select></label>
      <label><span className={labelClass}>Пригодност за Черноморието</span><select className={inputClass} value={form.plantCare.blackSeaCoast||'needsVerification'} onChange={event=>setField('plantCare',{...form.plantCare,blackSeaCoast:event.target.value})}><option value="needsVerification">Непроверено</option><option value="suitable">Подходящо</option><option value="notSuitable">Неподходящо</option></select></label>
      <label><span className={labelClass}>Минимална зимна температура (°C)</span><input type="number" className={inputClass} value={form.plantCare.minWinterTempC??''} onChange={event=>setField('plantCare',{...form.plantCare,minWinterTempC:event.target.value===''?undefined:Number(event.target.value)})}/></label>
      <label><span className={labelClass}>Височина на възрастното растение (см)</span><input type="number" min="1" className={inputClass} value={form.plantCare.adultHeightCm??''} onChange={event=>setField('plantCare',{...form.plantCare,adultHeightCm:event.target.value===''?undefined:Number(event.target.value)})}/></label>
     </div>
     <label><span className={labelClass}>Сезон на цъфтеж</span><div className="flex flex-wrap gap-3">{[['spring','Пролет'],['summer','Лято'],['autumn','Есен'],['winter','Зима']].map(([value,label])=><label key={value} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={(form.plantCare.floweringSeason||[]).includes(value)} onChange={event=>setField('plantCare',{...form.plantCare,floweringSeason:event.target.checked?[...(form.plantCare.floweringSeason||[]),value]:(form.plantCare.floweringSeason||[]).filter((item:string)=>item!==value)})}/>{label}</label>)}</div></label>
     <label><span className={labelClass}>Сезон на засаждане</span><div className="flex flex-wrap gap-3">{[['spring','Пролет'],['summer','Лято'],['autumn','Есен'],['winter','Зима'],['yearRound','През цялата година']].map(([value,label])=><label key={value} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={(form.plantCare.plantingSeason||[]).includes(value)} onChange={event=>setField('plantCare',{...form.plantCare,plantingSeason:event.target.checked?[...(form.plantCare.plantingSeason||[]),value]:(form.plantCare.plantingSeason||[]).filter((item:string)=>item!==value)})}/>{label}</label>)}</div></label>
     <label><span className={labelClass}>Практически грижи</span><textarea rows={7} className={inputClass} value={form.careGuide} onChange={event=>setField('careGuide',event.target.value)} placeholder="Засаждане, почва, поливане, подхранване, резитба и зимна защита…"/></label>
    </section>}
    <div className="sticky bottom-0 z-10 -mx-3 border-t border-stone-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
     <button type="button" disabled={saving||!activeImages||!aiProof||!form.saleVariants.some(variant=>Number(variant.saleHeightCm)>0||Number(variant.containerVolumeL)>0)} onClick={()=>void save()} className="w-full rounded-xl bg-lime-800 px-5 py-4 text-base font-bold text-white disabled:opacity-50">{saving?'Запазване…':!aiProof?'Първо проверете с Google':!form.saleVariants.some(variant=>Number(variant.saleHeightCm)>0||Number(variant.containerVolumeL)>0)?'Добавете размер на растението':editingId?'Запази промените':'Публикувай растението'}</button>
    </div>
   </div>
  </>}
  {historyOpen&&<div className="rounded-2xl border border-stone-200 bg-white p-4">
   <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">История на промените</h2><button className={btn+' border border-stone-300'} onClick={()=>setHistoryOpen(false)}>Назад</button></div>
   {historyLoading?'Зареждане…':history.length===0?<p className="text-sm text-stone-500">Няма записи.</p>:<div className="divide-y divide-stone-200">{history.map((event:any)=><div key={event.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><strong>{event.product_name}</strong><span className="text-xs text-stone-500">{new Date(event.created_at).toLocaleString('bg-BG')}</span></div><p className="mt-1 text-sm">{event.actor_name||event.actor_id} · {event.actor_role} · {event.action} · {event.result}</p><p className="mt-1 text-xs text-stone-500">Променени полета: {(event.changed_fields||[]).join(', ')||'—'}</p>
    {(event.before_data||event.after_data)&&<details className="mt-2 rounded-lg bg-stone-50 p-2"><summary className="cursor-pointer text-xs font-semibold text-stone-700">Преди / След</summary><div className="mt-2 grid gap-2 sm:grid-cols-2"><div><div className="mb-1 text-[11px] font-semibold text-stone-500">Преди</div><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px] text-stone-600">{JSON.stringify(event.before_data,null,2)||'—'}</pre></div><div><div className="mb-1 text-[11px] font-semibold text-stone-500">След</div><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px] text-stone-600">{JSON.stringify(event.after_data,null,2)||'—'}</pre></div></div></details>}
    {event.error_code&&<p className="mt-1 text-xs text-red-700">Код: {event.error_code}</p>}</div>)}</div>}

  </div>}
  {geminiModalOpen&&geminiResult&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-labelledby="gemini-result-title">
   <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between gap-3 border-b border-stone-200 p-4">
     <div><h2 id="gemini-result-title" className="text-lg font-bold text-stone-900">Резултат от Google Gemini</h2><p className="text-xs text-stone-500">{geminiResult.mode==='text'?'Проверка по име':'Проверка по снимка'} · {geminiResult.model} · {Math.round((geminiResult.elapsedMs||0)/1000)} сек.</p></div>
     <button type="button" className={btn+' border border-stone-300'} onClick={()=>setGeminiModalOpen(false)}>Затвори</button>
    </div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
     <div className="rounded-xl bg-stone-50 p-3">
      <h3 className="font-semibold">Идентификация</h3>
      <p className="mt-1 text-sm"><strong>Предложено име:</strong> {geminiResult.result.plantName||'Неопределено'}</p>
      <p className="text-sm"><strong>Увереност:</strong> {geminiResult.result.confidence||'low'} · <strong>Тип:</strong> {geminiResult.result.productType||'—'}</p>
      <p className="text-sm"><strong>Категория:</strong> {categoryOptions.find(item=>item._id===geminiResult.result.categoryId)?.label||'Няма валидна категория'}</p>
      <p className="mt-2 text-sm"><strong>Ботанически кандидати:</strong> {(geminiResult.result.scientificCandidates||[]).map((item:any)=>item.scientificName+' ('+item.confidence+') — '+(item.reason||'')).join('; ')||'Няма'}</p>
      {geminiResult.mode==='photo'&&<p className="mt-2 text-sm"><strong>Видимо описание:</strong> {geminiResult.result.visibleDescription||'—'}</p>}
      <p className="mt-2 text-xs text-amber-800">Ботаническите кандидати не са независимо потвърдени. Проверете латинското име преди публикуване.</p>
     </div>
     {(['bg','ru','en'] as const).map(language=><details key={language} className="rounded-xl border border-stone-200 p-3" open={language==='bg'}>
      <summary className="cursor-pointer font-semibold">{language==='bg'?'Български':language==='ru'?'Русский':'English'}</summary>
      <div className="mt-2 space-y-2 text-sm"><p><strong>Име:</strong> {geminiResult.result.descriptions?.[language]?.name||'—'}</p><p><strong>Кратко описание:</strong> {geminiResult.result.descriptions?.[language]?.shortDescription||'—'}</p><p className="whitespace-pre-wrap">{geminiResult.result.descriptions?.[language]?.description||'—'}</p></div>
     </details>)}
     <details className="rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">SEO и ALT</summary>
      {(['bg','ru','en'] as const).map(language=><div key={language} className="mt-2 border-b border-stone-100 pb-2 text-sm"><strong>{language.toUpperCase()}</strong><p>H1: {geminiResult.result.seo?.[language]?.h1||'—'}</p><p>Meta title: {geminiResult.result.seo?.[language]?.metaTitle||'—'}</p><p>Meta description: {geminiResult.result.seo?.[language]?.metaDescription||'—'}</p>{geminiResult.mode==='photo'&&<p>ALT: {geminiResult.result.imageAlt?.[language]||'—'}</p>}</div>)}
     </details>
     <details className="rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">Грижи и характеристики</summary><pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(geminiResult.result.plantCare||{},null,2)}</pre><p className="mt-2 whitespace-pre-wrap text-sm">{geminiResult.result.careGuide||'—'}</p></details>
     {!geminiProof&&<p className="text-sm text-amber-800">За да се запише резултатът, трябва да има основна снимка в карточката. В Text режим снимката се използва само за защита на записа и не се изпраща към Google.</p>}
    </div>
    <div className="flex flex-col-reverse gap-2 border-t border-stone-200 p-4 sm:flex-row sm:justify-end">
     <button type="button" className={btn+' border border-stone-300'} onClick={()=>setGeminiModalOpen(false)}>Отмени</button>
     <button type="button" disabled={!geminiProof||!images[mainImageIndex]||images[mainImageIndex].assetId!==geminiProofAssetId} className={btn+' bg-lime-800 text-white disabled:opacity-50'} onClick={applyGeminiResult}>Да, приложи и запази</button>
    </div>
   </div>
  </div>}
 </div>
}
