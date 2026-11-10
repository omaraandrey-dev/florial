import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, requirePlantRole, PRODUCT_TYPES, issuePlantAiProof } from '../plant-direct-lib'

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const VISION_MODEL='@cf/meta/llama-3.2-11b-vision-instruct'
type ScientificCandidate={scientificName:string;confidence:'high'|'medium'|'low';reason:string}
type GbifMatch={confidence?:number;matchType?:string;rank?:string;status?:string;canonicalName?:string;scientificName?:string;usageKey?:number}
type ImageAnalysis={observation:string;name:string;candidates:ScientificCandidate[];productType:string;categoryId:string;confidence:'high'|'medium'|'low'}
const withTimeout=<T>(promise:Promise<T>,milliseconds:number,code:string):Promise<T>=>{
 let timer:ReturnType<typeof setTimeout>|undefined
 return Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error(code)),milliseconds)})]).finally(()=>{if(timer)clearTimeout(timer)})
}
const bytesToBase64=(bytes:Uint8Array)=>{let binary='';for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));return btoa(binary)}
const extractText=(value:unknown):string=>{
 if(typeof value==='string')return value
 if(!isObject(value))return ''
 for(const key of ['response','output_text','text'])if(typeof value[key]==='string')return value[key] as string
 if(Array.isArray(value.choices)){const choice=value.choices[0];if(isObject(choice)&&isObject(choice.message)&&typeof choice.message.content==='string')return choice.message.content}
 return ''
}
const parseModelJson=(value:unknown)=>{
 const raw=extractText(value).trim().replace(/^\uFEFF/,'').replace(/^\s*\x60{3}(?:json)?\s*/i,'').replace(/\s*\x60{3}\s*$/,'')
 const start=raw.indexOf('{'),end=raw.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('AI_INVALID_JSON')
 try{return JSON.parse(raw.slice(start,end+1)) as Record<string,unknown>}catch{throw new Error('AI_INVALID_JSON')}
}
const analyzeMainImage=async(env:ManagerEnv,value:unknown,categories:Array<{id:string;name:string}>):Promise<ImageAnalysis>=>{
 if(!isObject(value)||typeof value.url!=='string'||!/^https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/plants\//i.test(value.url))throw new Error('AI_IMAGE_INVALID')
 const download=await withTimeout(fetch(value.url),10000,'AI_IMAGE_DOWNLOAD_TIMEOUT')
 if(!download.ok)throw new Error('AI_IMAGE_DOWNLOAD_FAILED')
 const contentType=(download.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
 if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw new Error('AI_IMAGE_TYPE_INVALID')
 const bytes=new Uint8Array(await download.arrayBuffer())
 if(!bytes.length||bytes.length>10*1024*1024)throw new Error('AI_IMAGE_SIZE_INVALID')
 const imageData='data:'+contentType+';base64,'+bytesToBase64(bytes)
 const categoryOptions=categories.slice(0,100).map(item=>({id:item.id,name:item.name}))
 const prompt=[
  'Identify the most likely plant shown in this product photograph for a professional Bulgarian garden centre.',
  'The seller may not know the Bulgarian common name. Suggest the most useful Bulgarian commercial/common plant name, likely botanical Latin candidates, plant type and one matching category from the supplied exact category list.',
  'Do not pretend certainty: use high only for visually distinctive, clear identification; medium for a plausible group/species; low when the photo is insufficient or multiple plants look similar. If unsure, return an empty plantName and low confidence.',
  'Do not infer exact cultivar, age, sale height, pot volume, price, stock or winter hardiness. Do not confuse mature plant size with the size of the photographed specimen.',
  'Return visibleDescription for ALT: describe only the visible plant specimen, not shelves, rows or unrelated background.',
  'Allowed productType values: '+Array.from(PRODUCT_TYPES).join(', '),
  'Choose categoryId only from this exact list; otherwise return an empty string: '+JSON.stringify(categoryOptions),
  'Return JSON only: {"plantName":"","confidence":"low","scientificCandidates":[{"scientificName":"Genus species","confidence":"low","reason":"brief Bulgarian reason"}],"productType":"plant","categoryId":"","visibleDescription":""}',
 ].join('\n\n')
 let lastError:unknown=null
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await withTimeout(env.AI!.run(VISION_MODEL,{
    messages:[
     {role:'system',content:'You are a cautious botanical visual assistant. Examine the plant in the supplied image and return one valid JSON object only. Do not hallucinate identity.'},
     {role:'user',content:prompt},
    ],
    image:imageData,
   }),20000,'AI_VISION_TIMEOUT')
   const parsed=parseModelJson(response)
   const suggestedType=String(parsed.productType||'')
   const suggestedCategory=cleanText(parsed.categoryId,128)
   const confidence=String(parsed.confidence||'low').toLowerCase()
   return {
    observation:cleanText(parsed.visibleDescription,160),
    name:cleanText(parsed.plantName||parsed.commonName,160),
    candidates:normalizeCandidates(parsed.scientificCandidates),
    productType:PRODUCT_TYPES.has(suggestedType)?suggestedType:'plant',
    categoryId:categoryOptions.some(item=>item.id===suggestedCategory)?suggestedCategory:'',
    confidence:(['high','medium','low'].includes(confidence)?confidence:'low') as ImageAnalysis['confidence'],
   }
  }catch(error){lastError=error;if(attempt===1)throw error}
 }
 throw lastError instanceof Error?lastError:new Error('AI_VISION_FAILED')
}
const latinBinomial=(value:unknown)=>typeof value==='string'?(value.trim().match(/\b([A-Z][A-Za-z-]+\s+[a-z][A-Za-z-]+)\b/)?.[1]||''):''
const normalizeCandidates=(value:unknown):ScientificCandidate[]=>{
 if(!Array.isArray(value))return []
 const seen=new Set<string>()
 return value.slice(0,5).map(entry=>isObject(entry)?entry:{}).map(entry=>({
  scientificName:latinBinomial(entry.scientificName),
  confidence:(['high','medium','low'].includes(String(entry.confidence).toLowerCase())?String(entry.confidence).toLowerCase():'low') as ScientificCandidate['confidence'],
  reason:cleanText(entry.reason,240),
 })).filter(entry=>{const key=entry.scientificName.toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true}).slice(0,3)
}
const acceptedSpecies=(match:GbifMatch|null)=>!!match&&match.matchType==='EXACT'&&typeof match.confidence==='number'&&match.confidence>=95&&match.rank==='SPECIES'&&match.status==='ACCEPTED'&&typeof match.usageKey==='number'
const matchGbif=async(name:string):Promise<GbifMatch|null>=>{
 const response=await fetch('https://api.gbif.org/v1/species/match?name='+encodeURIComponent(name)+'&kingdom=Plantae&verbose=true',{headers:{Accept:'application/json','User-Agent':'Florial/1.0 (+https://florial-bg.com)'},signal:AbortSignal.timeout(8000)})
 if(!response.ok)throw new Error('GBIF_UNAVAILABLE')
 return await response.json() as GbifMatch
}
const runJsonModel=async(env:ManagerEnv,prompt:string,maxTokens:number)=>{
 let lastError:unknown=null
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await withTimeout(env.AI!.run(MODEL,{messages:[{role:'system',content:'You are a careful professional horticultural editor for Florial, a Bulgarian garden centre. Return one valid JSON object only. Never invent commercial facts.'},{role:'user',content:prompt}],response_format:{type:'json_object'},max_tokens:maxTokens,temperature:0.15}),20000,'AI_MODEL_TIMEOUT')
   return parseModelJson(response)
  }catch(error){
   lastError=error
   const message=error instanceof Error?error.message:String(error)
   const canRetry=/AI_INVALID_JSON|429|5\d\d|timeout|timed out|temporar|overload|capacity|rate.?limit|network|fetch failed/i.test(message)
   if(attempt===0&&canRetry){await new Promise(resolve=>setTimeout(resolve,500));continue}
   throw error
  }
 }
 throw lastError instanceof Error?lastError:new Error('AI_REQUEST_FAILED')
}
const cleanSeo=(value:unknown,name:string,language:'bg'|'ru'|'en')=>{
 const item=isObject(value)?value:{}
 const title=language==='bg'?(name+' | Несебър | Градински център Флориал'):language==='ru'?('Продажа '+name+' | Несебър | Florial'):('Buy '+name+' | Nessebar | Florial')
 const description=language==='bg'?'Продажба на '+name+' в Несебър и района — Равда, Слънчев бряг и Свети Влас. Разгледайте наличните размери и цени в градински център Florial.':language==='ru'?'Продажа '+name+' в Несебре и районе — Равда, Солнечный берег и Свети Влас. Ознакомьтесь с доступными размерами и ценами в садовом центре Florial.':'Buy '+name+' in Nessebar and nearby Ravda, Sunny Beach and Sveti Vlas. Explore available sizes and prices at Florial garden centre.'
 return {h1:cleanText(item.h1,160)||name,metaTitle:cleanText(item.metaTitle,70)||(title.length<=70?title:title.slice(0,70)),metaDescription:cleanText(item.metaDescription,320)||description.slice(0,320)}
}
const transientError=(error:unknown)=>{
 const message=error instanceof Error?error.message:String(error)
 return /429|5\d\d|timeout|timed out|temporar|overload|capacity|rate.?limit|network|fetch failed|AI_INVALID_JSON/i.test(message)
}
const safeFailure=(error:unknown)=>{
 const message=error instanceof Error?error.message:''
 if(/license|licence|terms/i.test(message))return {code:'AI_MODEL_LICENSE',hint:'Cloudflare изисква приемане на лиценза за AI модела.'}
 if(/429|quota|neurons|rate.?limit/i.test(message))return {code:'AI_RATE_LIMIT',hint:'Временно е достигнат лимитът на AI модела. Изчакайте малко и опитайте отново.'}
 if(/GBIF_UNAVAILABLE/i.test(message))return {code:'GBIF_UNAVAILABLE',hint:'Ботаническото име не можа да бъде проверено в GBIF; останалото съдържание може да се генерира без автоматично научно име.'}
 if(/AI_CONTENT_TOO_SHORT/i.test(message))return {code:'AI_CONTENT_INCOMPLETE',hint:'ИИ върна непълно описание дори след повторна генерация. Нищо не е записано; опитайте отново.'}
 return {code:'AI_GENERATION_FAILED',hint:'Неуспешен отговор от AI модела след автоматичен повторен опит. Проверете данните и опитайте отново.'}
}

export const onRequestPost=async({request,env}:{request:Request;env:ManagerEnv})=>{
 const requestId=crypto.randomUUID()
 let stage='request_validation'
 if(!env.DB||!env.AI)return json({error:'AI service is not configured.'},503)
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(!requirePlantRole(auth.user))return json({error:'Insufficient permissions.'},403)
 const body=await parseJsonBody(request)
 if(!body||!isObject(body.product))return errorJson('Въведете основна информация за растението.',400)
 const source=body.product
 const suppliedName=cleanText(source.name,160)
 const suppliedProductType=cleanText(source.productType,40)||'plant'
 const suppliedScientificName=cleanText(source.scientificName,160)
 const description=cleanText(source.description,3000)
 const shortDescription=cleanText(source.shortDescription,500)
 const role=auth.user.role
 const categoryOptions=Array.isArray(body.categories)?body.categories.slice(0,100).map((item:unknown)=>isObject(item)?({id:cleanText(item.id,128),name:cleanText(item.name,120)}):null).filter((item:any)=>item&&item.id&&item.name):[]
 const warnings:string[]=[]
 let visibleObservation=''
 let imageAnalysis:ImageAnalysis={observation:'',name:'',candidates:[],productType:'plant',categoryId:'',confidence:'low'}
 let candidates:ScientificCandidate[]=[]
 let name=suppliedName
 let productType=suppliedProductType
 let categoryId=cleanText(source.categoryId,128)
 let category=cleanText(source.categoryName,120)
 let verifiedScientificName=suppliedScientificName
 let botanicalVerification:Record<string,unknown>|null=null
 try{
  stage='image_analysis_and_botanical_candidate'
  if(!body.mainImage)return errorJson('Добавете основна снимка, за да ИИ определи растението.',400)
  const imageTask=analyzeMainImage(env,body.mainImage,categoryOptions)
  const identifyPrompt=[
   'Identify likely botanical species from the seller-entered plant name and text only. Return up to three real Latin binomials. Do not invent cultivars.',
   'Input name: '+suppliedName,
   'Plant type: '+suppliedProductType,
   'Category: '+category,
   'Seller description: '+(description||shortDescription||'not supplied'),
   'Return JSON: {"candidates":[{"scientificName":"Prunus laurocerasus","confidence":"high","reason":"Кратко обяснение на български"}]}',
  ].join('\n\n')
  const candidateTask=!suppliedScientificName&&suppliedName?runJsonModel(env,identifyPrompt,900):Promise.resolve(null)
  const [imageResult,candidateResult]=await Promise.allSettled([imageTask,candidateTask])
  if(imageResult.status==='fulfilled'){
   imageAnalysis=imageResult.value
   visibleObservation=imageAnalysis.observation
   if(!visibleObservation)warnings.push('ALT за основната снимка не беше генериран.')
  }else{
   warnings.push('Снимката не можа да бъде анализирана. Проверете връзката или опитайте друга снимка.')
   if(!suppliedName)return json({error:'ИИ не успя да прочете снимката. Опитайте снимку с растението на преден план.',code:'AI_IMAGE_ANALYSIS_FAILED',stage,requestId,retryable:true},502)
  }
  name=suppliedName||imageAnalysis.name
  if(name.length<2)return json({error:'ИИ не успя да разпознае достатъчно ясно растението. Въведете име ръчно или добавете по-ясна снимка.',code:'AI_PLANT_IDENTITY_UNCLEAR',stage,requestId,retryable:false},422)
  if(suppliedProductType==='plant'&&imageAnalysis.productType!=='plant')productType=imageAnalysis.productType
  if(!categoryId&&imageAnalysis.categoryId)categoryId=imageAnalysis.categoryId
  if(!category&&categoryId)category=categoryOptions.find(item=>item.id===categoryId)?.name||''
  candidates=imageAnalysis.candidates.length?imageAnalysis.candidates:[]
  if(!candidates.length&&candidateResult.status==='fulfilled'&&candidateResult.value)candidates=normalizeCandidates(candidateResult.value.candidates)
  if(!suppliedScientificName){
   if(candidates.length){
    stage='botanical_verification'
    const highCandidates=candidates.filter(item=>item.confidence==='high')
    for(const candidate of highCandidates){
     try{
      const match=await withTimeout(matchGbif(candidate.scientificName),8000,'GBIF_TIMEOUT')
      if(acceptedSpecies(match)){
       verifiedScientificName=cleanText(match?.canonicalName||match?.scientificName||candidate.scientificName,160)
       botanicalVerification={source:'GBIF',accepted:true,matchType:match?.matchType,rank:match?.rank,confidence:match?.confidence,usageKey:match?.usageKey,url:'https://www.gbif.org/species/'+match?.usageKey,aiConfidence:candidate.confidence}
       break
      }
     }catch{warnings.push('GBIF временно не потвърди ботаническото име; то остава за проверка от Owner.');break}
    }
    if(!verifiedScientificName)warnings.push('ИИ предложи възможни ботанически имена, но научното име не е потвърдено точно в GBIF.')
   }else warnings.push('Ботаническото име не беше определено с достатъчна увереност.')
  }
  stage='content_generation'
  const prompt=[
   'Prepare a substantial, accurate, locally optimized plant product listing for Florial, a Bulgarian garden and plant retailer.',
   'LANGUAGES: Bulgarian is the source language and must read like polished native Bulgarian horticultural commerce copy. Then create genuinely fluent Russian and English versions, adapted naturally rather than translated word-for-word.',
   'VISUAL IDENTITY: '+(imageAnalysis.confidence==='high'?'High-confidence visual candidate, still subject to seller confirmation.':imageAnalysis.confidence==='medium'?'Plausible visual candidate; seller must confirm.':'Low-confidence visual observation; do not assert a species without confirmation.')+' Suggested common name: '+name+'. Verified botanical name: '+(verifiedScientificName||'not confirmed; do not present a candidate as fact.'),
   'SELLER INPUT: name: '+name+'; type: '+productType+'; category: '+(category||'not supplied')+'; existing short description: '+(shortDescription||'none')+'; existing description: '+(description||'none')+'.',
   'VISIBLE MAIN PHOTO OBSERVATION: '+(visibleObservation||'No visual observation available.'),
   'HORTICULTURAL DESCRIPTION: Write a genuinely useful full product description, normally 2,000–3,000 characters in Bulgarian and 1,500–2,300 characters in Russian and English. Do not pad or repeat. Use clear short headings and practical paragraphs. Cover where reliable: botanical identity and plant group; appearance, foliage, flowering/fruiting and seasonal interest; growth habit and typical mature size; light; soil and drainage; watering and drought tolerance; feeding; pruning and maintenance; planting and container growing; landscape uses in private gardens, courtyards, hotels and commercial green areas; practical suitability and limitations for the Bulgarian Black Sea climate. Distinguish mature size from the size of the item for sale.',
   'CARE: Give concrete but cautious care advice. Do not invent exact watering schedules, fertilizer quantities, winter temperatures, toxicity, pet safety or hardiness. If a detail is uncertain, say so briefly. Do not use empty generic advertising language.',
   'LOCAL SEO: Florial serves Несебър, Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас; Burgas is the outer limit. Mention Несебър naturally as primary local reference and only 1–3 additional nearby towns where relevant. Never mention Созопол. Do not claim free/same-day delivery, stock, installation or delivery prices.',
   'SHORT DESCRIPTION: max 300 characters per language, natural and informative.',
   'IMAGE ALT: Describe only what is visibly present in the main photo. BG ALT should begin "Купи "+name+" в Несебър — ". EN and RU should be natural translations, max 180 characters. Do not add unsupported visual details. If no visual observation exists, return empty ALT values.',
   'SEO: Return localized H1, metaTitle (max 70 chars) and metaDescription (max 320 chars) for BG, RU and EN. Bulgarian meta description begins with "Продажба". Use local signals naturally, without keyword stuffing.',
   'OWNER-ONLY BOTANICAL TAGS: Also return plantCare with only defensible values for light (sun|partialShade|shade), waterNeeds (low|medium|high), foliageType (evergreen|deciduous), floweringSeason (spring|summer|autumn|winter), plantingSeason (spring|summer|autumn|winter|yearRound), adultHeightCm and minWinterTempC. If not well-established for the verified species, use null or empty arrays. blackSeaCoast MUST be "needsVerification"; never infer coastal suitability. Return careGuide as a practical Bulgarian care summary covering planting, light, soil/drainage, watering, feeding, pruning and winter care; omit unsupported exact schedules or quantities.',
   'FACTUAL SAFETY: Never invent price, stock, SKU, sale height, container volume, delivery terms or cultivar. Photo identification is a suggestion, not scientific proof. Do not assert a species-specific fact unless the botanical name is confirmed.',
   'Return valid JSON only with this shape: {"shortDescription":"","description":"","translations":{"bg":{"shortDescription":"","description":""},"ru":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}},"en":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}}},"seo":{"h1":"","metaTitle":"","metaDescription":""},"imageAltEn":"","imageAltRu":"","plantCare":{"light":null,"waterNeeds":null,"minWinterTempC":null,"blackSeaCoast":"needsVerification","adultHeightCm":null,"foliageType":null,"floweringSeason":[],"plantingSeason":[]},"careGuide":""}',
  ].join('\n\n')
  let generated:Record<string,unknown>
  try{generated=await runJsonModel(env,prompt,8192)}catch(error){
   stage='content_generation_failed'
   const failure=safeFailure(error)
   console.error('[manager-plants-ai-enrich]',{requestId,stage,code:failure.code,role})
   return json({error:failure.hint,code:failure.code,stage:'content_generation',requestId,retryable:transientError(error)},502)
  }
  stage='response_validation'
  let translations=isObject(generated.translations)?generated.translations:{}
  let bg=isObject(translations.bg)?translations.bg:{}
  let ru=isObject(translations.ru)?translations.ru:{}
  let en=isObject(translations.en)?translations.en:{}
  let bgDescription=cleanText(generated.description||bg.description,8000)
  let ruDescription=cleanText(ru.description,8000)
  let enDescription=cleanText(en.description,8000)
  let careGuideText=cleanText(generated.careGuide,5000)
  if(bgDescription.length<900||ruDescription.length<650||enDescription.length<650||(role==='owner'&&careGuideText.length<250)){
   stage='content_quality_retry'
   generated=await runJsonModel(env,prompt+'\n\nQUALITY CONTROL: Your previous response was too short. Return the complete JSON again with a substantial, practical description in all three languages: at least 900 characters BG and 650 characters each RU and EN. For Owner also return a practical Bulgarian careGuide of at least 250 characters. Include the relevant care sections, but do not invent facts.',8192)
   translations=isObject(generated.translations)?generated.translations:{}
   bg=isObject(translations.bg)?translations.bg:{}
   ru=isObject(translations.ru)?translations.ru:{}
   en=isObject(translations.en)?translations.en:{}
   bgDescription=cleanText(generated.description||bg.description,8000)
   ruDescription=cleanText(ru.description,8000)
   enDescription=cleanText(en.description,8000)
   careGuideText=cleanText(generated.careGuide,5000)
   if(bgDescription.length<900||ruDescription.length<650||enDescription.length<650||(role==='owner'&&careGuideText.length<250))throw new Error('AI_CONTENT_TOO_SHORT')
  }
  const seo=isObject(generated.seo)?generated.seo:{}
  const bgSeo=cleanSeo(seo,name,'bg')
  const ruName=cleanText(ru.name,160)||name
  const enName=cleanText(en.name,160)||name
  const ruSeo=cleanSeo(ru.seo,ruName,'ru')
  const enSeo=cleanSeo(en.seo,enName,'en')
  const mainImageAlt=visibleObservation?cleanText('Купи '+name+' в Несебър — '+visibleObservation,180):''
  const mainImageAltEn=visibleObservation&&cleanText(generated.imageAltEn,150)?cleanText('Buy '+enName+' in Nessebar — '+cleanText(generated.imageAltEn,150),180):''
  const mainImageAltRu=visibleObservation&&cleanText(generated.imageAltRu,150)?cleanText('Купите '+ruName+' в Несебре — '+cleanText(generated.imageAltRu,150),180):''
  const suggestion:Record<string,unknown>={
   name,productType,categoryId,
   visualIdentificationConfidence:imageAnalysis.confidence,
   scientificName:verifiedScientificName,
   botanicalVerification,
   scientificNameCandidates:candidates,
   shortDescription:cleanText(generated.shortDescription||bg.shortDescription,500),
   description:bgDescription,
   translations:{
    bg:{name,shortDescription:cleanText(bg.shortDescription||generated.shortDescription,500),description:bgDescription,seo:bgSeo},
    ru:{name:ruName,shortDescription:cleanText(ru.shortDescription,500),description:ruDescription,seo:ruSeo},
    en:{name:enName,shortDescription:cleanText(en.shortDescription,500),description:enDescription,seo:enSeo},
   },
   seo:bgSeo,
   mainImageAlt,mainImageAltEn,mainImageAltRu,
   warnings:[...warnings,...(imageAnalysis.confidence==='low'?['Визуалната идентификация е с ниска увереност. Проверете предложеното име ръчно.']:imageAnalysis.confidence==='medium'?['Визуалната идентификация е предварителна. Потвърдете името преди публикуване.']:[]),...(visibleObservation&&!generated.imageAltEn?['Не беше генериран английски ALT за основната снимка.']:[]),...(visibleObservation&&!generated.imageAltRu?['Не беше генериран руски ALT за основната снимка.']:[])].slice(0,8),
  }
  if(role==='owner'){
   const care=isObject(generated.plantCare)?generated.plantCare:{}
   const allowedValues=(value:unknown,allowed:string[])=>Array.isArray(value)?value.filter(item=>allowed.includes(String(item))).slice(0,5):[]
   suggestion.plantCare={
    ...( ['sun','partialShade','shade'].includes(String(care.light))?{light:care.light}:{}),
    ...( ['low','medium','high'].includes(String(care.waterNeeds))?{waterNeeds:care.waterNeeds}:{}),
    ...(typeof care.minWinterTempC==='number'&&Number.isFinite(care.minWinterTempC)&&care.minWinterTempC>=-40&&care.minWinterTempC<=20?{minWinterTempC:care.minWinterTempC}:{}),
    blackSeaCoast:'needsVerification',
    ...(typeof care.adultHeightCm==='number'&&Number.isFinite(care.adultHeightCm)&&care.adultHeightCm>=1&&care.adultHeightCm<=100000?{adultHeightCm:care.adultHeightCm}:{}),
    ...( ['evergreen','deciduous'].includes(String(care.foliageType))?{foliageType:care.foliageType}:{}),
    floweringSeason:allowedValues(care.floweringSeason,['spring','summer','autumn','winter']),
    plantingSeason:allowedValues(care.plantingSeason,['spring','summer','autumn','winter','yearRound']),
   }
   suggestion.careGuide=careGuideText
  }
  const proofProduct={
   name,
   scientificName:verifiedScientificName||suppliedScientificName,
   productType,
   categoryId:categoryId||cleanText(source.categoryId,128)||(Array.isArray(source.categoryIds)&&source.categoryIds.length?cleanText(source.categoryIds[0],128):''),
   categoryIds:Array.isArray(source.categoryIds)&&source.categoryIds.length?source.categoryIds:(categoryId?[categoryId]:[]),
   mainImage:body.mainImage,
  }
  const aiProof=await issuePlantAiProof(request,proofProduct)
  return json({ok:true,suggestion,aiProof,model:MODEL,visionModel:VISION_MODEL,requestId})
 }catch(error){
  const failure=safeFailure(error)
  console.error('[manager-plants-ai-enrich]',{requestId,stage,code:failure.code,role})
  return json({error:failure.hint,code:failure.code,stage,requestId,retryable:transientError(error)},502)
 }
}
