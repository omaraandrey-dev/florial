import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, requirePlantRole } from '../plant-direct-lib'

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const VISION_MODEL='@cf/meta/llama-3.2-11b-vision-instruct'
type ScientificCandidate={scientificName:string;confidence:'high'|'medium'|'low';reason:string}
type GbifMatch={confidence?:number;matchType?:string;rank?:string;status?:string;canonicalName?:string;scientificName?:string;usageKey?:number}
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
const analyzeMainImage=async(env:ManagerEnv,value:unknown):Promise<string>=>{
 if(!isObject(value)||typeof value.url!=='string'||!/^https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/plants\//i.test(value.url))return ''
 const download=await fetch(value.url)
 if(!download.ok)throw new Error('AI_IMAGE_DOWNLOAD_FAILED')
 const contentType=(download.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
 if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw new Error('AI_IMAGE_TYPE_INVALID')
 const bytes=new Uint8Array(await download.arrayBuffer())
 if(!bytes.length||bytes.length>10*1024*1024)throw new Error('AI_IMAGE_SIZE_INVALID')
 const response=await env.AI!.run(VISION_MODEL,{
  messages:[
   {role:'system',content:'Describe only visible visual details for accessible alt text. Never identify a plant species or infer botanical properties. Return one concise Bulgarian sentence only.'},
   {role:'user',content:'Describe the main visible plant or plants, their foliage, form, flowers or container only when clearly visible. Maximum 150 characters. No location, SEO keywords, image number or assumptions.'},
  ],
  image:'data:'+contentType+';base64,'+bytesToBase64(bytes),
 })
 return cleanText(extractText(response),180)
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
 const response=await fetch('https://api.gbif.org/v1/species/match?name='+encodeURIComponent(name)+'&kingdom=Plantae&verbose=true',{headers:{Accept:'application/json','User-Agent':'Florial/1.0 (+https://florial-bg.com)'}})
 if(!response.ok)throw new Error('GBIF_UNAVAILABLE')
 return await response.json() as GbifMatch
}
const runJsonModel=async(env:ManagerEnv,prompt:string,maxTokens:number)=>{
 let lastError:unknown=null
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await env.AI!.run(MODEL,{messages:[{role:'system',content:'You are a careful professional horticultural editor for Florial, a Bulgarian garden centre. Return one valid JSON object only. Never invent commercial facts.'},{role:'user',content:prompt}],response_format:{type:'json_object'},max_tokens:maxTokens,temperature:0.15})
   return parseModelJson(response)
  }catch(error){lastError=error}
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
 const name=cleanText(source.name,160)
 if(name.length<2)return errorJson('Първо въведете име на растението.',400)
 const productType=cleanText(source.productType,40)||'plant'
 const category=cleanText(source.categoryName,120)
 const suppliedScientificName=cleanText(source.scientificName,160)
 const description=cleanText(source.description,3000)
 const shortDescription=cleanText(source.shortDescription,500)
 const role=auth.user.role
 const warnings:string[]=[]
 let visibleObservation=''
 let candidates:ScientificCandidate[]=[]
 let verifiedScientificName=suppliedScientificName
 let botanicalVerification:Record<string,unknown>|null=null
 try{
  stage='image_analysis'
  if(body.mainImage){try{visibleObservation=await analyzeMainImage(env,body.mainImage);if(!visibleObservation)warnings.push('ALT за основната снимка не беше генериран.')}catch{warnings.push('Основната снимка не можа да бъде анализирана; текстовете ще бъдат генерирани без визуално описание.')}}
  if(!suppliedScientificName){
   stage='botanical_candidate_generation'
   try{
    const identifyPrompt=[
     'Identify likely botanical species from the seller-entered plant name and text only. This is taxonomic name resolution, not photo recognition.',
     'Use Bulgarian common names and horticultural context. Return up to three real Latin binomials, ranked by likelihood. Do not invent cultivars or names. Mark confidence high only when the common name has one clear, widely accepted species meaning; otherwise medium or low.',
     'Input name: '+name,
     'Plant type: '+productType,
     'Category: '+(category||'not supplied'),
     'Seller description: '+(description||shortDescription||'not supplied'),
     'Return JSON: {"candidates":[{"scientificName":"Prunus laurocerasus","confidence":"high","reason":"Кратко обяснение на български"}]}',
    ].join('\n\n')
    const identified=await runJsonModel(env,identifyPrompt,900)
    candidates=normalizeCandidates(identified.candidates)
    const highCandidates=candidates.filter(item=>item.confidence==='high')
    for(const candidate of highCandidates){
     try{
      const match=await matchGbif(candidate.scientificName)
      if(acceptedSpecies(match)){
       verifiedScientificName=cleanText(match?.canonicalName||match?.scientificName||candidate.scientificName,160)
       botanicalVerification={source:'GBIF',accepted:true,matchType:match?.matchType,rank:match?.rank,confidence:match?.confidence,usageKey:match?.usageKey,url:'https://www.gbif.org/species/'+match?.usageKey,aiConfidence:candidate.confidence}
       break
      }
     }catch{warnings.push('GBIF временно не потвърди ботаническото име; то остава за проверка от Owner.');break}
    }
    if(!verifiedScientificName){
     if(candidates.length)warnings.push('ИИ предложи възможни ботанически имена, но няма точна потвърдена видова идентификация. Научното име не е попълнено автоматично.')
     else warnings.push('ИИ не успя да определи ботаническото име с достатъчна увереност.')
    }
   }catch{warnings.push('Ботаническото име не беше определено автоматично; описанията ще бъдат генерирани без непотвърдени видови твърдения.')}
  }
  stage='content_generation'
  const prompt=[
   'Prepare a substantial, accurate, locally optimized plant product listing for Florial, a Bulgarian garden and plant retailer.',
   'LANGUAGES: Bulgarian is the source language and must read like polished native Bulgarian horticultural commerce copy. Then create genuinely fluent Russian and English versions, adapted naturally rather than translated word-for-word.',
   'VERIFIED IDENTITY: '+(verifiedScientificName||'No verified botanical name. Do not assert a species-specific identity or species-specific facts. Use the seller common name and only reliable general information.'),
   'SELLER INPUT: name: '+name+'; type: '+productType+'; category: '+(category||'not supplied')+'; existing short description: '+(shortDescription||'none')+'; existing description: '+(description||'none')+'.',
   'VISIBLE MAIN PHOTO OBSERVATION (for ALT only; never use it to infer the species): '+(visibleObservation||'No visual observation available.'),
   'HORTICULTURAL DESCRIPTION: Write a genuinely useful full product description, normally 2,000–3,000 characters in Bulgarian and 1,500–2,300 characters in Russian and English. Do not pad or repeat. Use clear short headings and practical paragraphs. Cover where reliable: botanical identity and plant group; appearance, foliage, flowering/fruiting and seasonal interest; growth habit and typical mature size; light; soil and drainage; watering and drought tolerance; feeding; pruning and maintenance; planting and container growing; landscape uses in private gardens, courtyards, hotels and commercial green areas; practical suitability and limitations for the Bulgarian Black Sea climate. Distinguish mature size from the size of the item for sale.',
   'CARE: Give concrete but cautious care advice. Do not invent exact watering schedules, fertilizer quantities, winter temperatures, toxicity, pet safety or hardiness. If a detail is uncertain, say so briefly. Do not use empty generic advertising language.',
   'LOCAL SEO: Florial serves Несебър, Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас; Burgas is the outer limit. Mention Несебър naturally as primary local reference and only 1–3 additional nearby towns where relevant. Never mention Созопол. Do not claim free/same-day delivery, stock, installation or delivery prices.',
   'SHORT DESCRIPTION: max 300 characters per language, natural and informative.',
   'IMAGE ALT: Describe only what is visibly present in the main photo. BG ALT should begin "Купи "+name+" в Несебър — ". EN and RU should be natural translations, max 180 characters. Do not add unsupported visual details. If no visual observation exists, return empty ALT values.',
   'SEO: Return localized H1, metaTitle (max 70 chars) and metaDescription (max 320 chars) for BG, RU and EN. Bulgarian meta description begins with "Продажба". Use local signals naturally, without keyword stuffing.',
   'OWNER-ONLY BOTANICAL TAGS: Also return plantCare with only defensible values for light (sun|partialShade|shade), waterNeeds (low|medium|high), foliageType (evergreen|deciduous), floweringSeason (spring|summer|autumn|winter), plantingSeason (spring|summer|autumn|winter|yearRound), adultHeightCm and minWinterTempC. If not well-established for the verified species, use null or empty arrays. blackSeaCoast MUST be "needsVerification"; never infer coastal suitability. Return careGuide as a practical Bulgarian care summary covering planting, light, soil/drainage, watering, feeding, pruning and winter care; omit unsupported exact schedules or quantities.',
   'FACTUAL SAFETY: Never invent price, stock, SKU, sale height, container volume, category, delivery terms or cultivar. Never treat AI confidence as scientific confirmation. Do not use photo observations to determine plant identity.',
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
  if(bgDescription.length<900||ruDescription.length<650||enDescription.length<650){
   stage='content_quality_retry'
   generated=await runJsonModel(env,prompt+'\n\nQUALITY CONTROL: Your previous response was too short. Return the complete JSON again with a substantial, practical description in all three languages: at least 900 characters BG and 650 characters each RU and EN. Include the relevant care sections, but do not invent facts.',8192)
   translations=isObject(generated.translations)?generated.translations:{}
   bg=isObject(translations.bg)?translations.bg:{}
   ru=isObject(translations.ru)?translations.ru:{}
   en=isObject(translations.en)?translations.en:{}
   bgDescription=cleanText(generated.description||bg.description,8000)
   ruDescription=cleanText(ru.description,8000)
   enDescription=cleanText(en.description,8000)
   if(bgDescription.length<900||ruDescription.length<650||enDescription.length<650)throw new Error('AI_CONTENT_TOO_SHORT')
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
   warnings:[...warnings,...(visibleObservation&&!generated.imageAltEn?['Не беше генериран английски ALT за основната снимка.']:[]),...(visibleObservation&&!generated.imageAltRu?['Не беше генериран руски ALT за основната снимка.']:[])].slice(0,8),
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
   suggestion.careGuide=cleanText(generated.careGuide,5000)
  }
  return json({ok:true,suggestion,model:MODEL,visionModel:visibleObservation?VISION_MODEL:null,requestId})
 }catch(error){
  const failure=safeFailure(error)
  console.error('[manager-plants-ai-enrich]',{requestId,stage,code:failure.code,role})
  return json({error:failure.hint,code:failure.code,stage,requestId,retryable:transientError(error)},502)
 }
}
