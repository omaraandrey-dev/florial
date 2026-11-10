import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, requirePlantRole } from '../plant-direct-lib'

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const VISION_MODEL='@cf/meta/llama-3.2-11b-vision-instruct'
const bytesToBase64=(bytes:Uint8Array)=>{let binary='';for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));return btoa(binary)}
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
   {role:'system',content:'Describe visible image details for accessible alt text. Do not identify plant species. Do not infer botanical properties. Reply with one concise sentence in Bulgarian only, without JSON, labels, quotes or markdown.'},
   {role:'user',content:'Describe only what is visibly apparent in this photo. Write one natural Bulgarian alt description, maximum 180 characters. Do not mention image number, location or SEO keywords.'},
  ],
  image:'data:'+contentType+';base64,'+bytesToBase64(bytes),
 })
 return cleanText(extractText(response),180)
}
const extractText=(value:unknown):string=>{
 if(typeof value==='string')return value
 if(!isObject(value))return ''
 for(const key of ['response','output_text','text'])if(typeof value[key]==='string')return value[key]
 if(Array.isArray(value.choices)){
  const choice=value.choices[0]
  if(isObject(choice)&&isObject(choice.message)&&typeof choice.message.content==='string')return choice.message.content
 }
 return ''
}
const parseModelJson=(value:unknown)=>{
 const raw=extractText(value).trim()
 const normalized=raw.replace(/^\uFEFF/,'').replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'')
 const start=normalized.indexOf('{'),end=normalized.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('AI_INVALID_JSON')
 return JSON.parse(normalized.slice(start,end+1)) as Record<string,unknown>
}

export const onRequestPost=async({request,env}:{request:Request;env:ManagerEnv})=>{
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
 const type=cleanText(source.productType,40)||'plant'
 const category=cleanText(source.categoryName,120)
 const scientificName=cleanText(source.scientificName,160)
 const description=cleanText(source.description,3000)
 const shortDescription=cleanText(source.shortDescription,500)
 let visibleObservation=''
 const warnings:string[]=[]
 if(body.mainImage){try{visibleObservation=await analyzeMainImage(env,body.mainImage);if(!visibleObservation)warnings.push('ALT за основната снимка не беше генериран.')}catch{warnings.push('Не успяхме да анализираме основната снимка; текстовете са генерирани без визуално описание.')}}
 const prompt=[
  'Create accurate, useful multilingual e-commerce copy for a plant sold by Florial in Bulgaria.',
  'Return JSON only, no markdown. Never invent price, stock, SKU, sale size, container size, delivery conditions, scientific name, botanical certainty, toxicity, hardiness or care data.',
  'Do not generate plantCare, careGuide, mature dimensions, winter temperatures, irrigation recommendations or botanical research.',
  'Preserve the supplied product name exactly. Do not guess or change scientificName.',
  'Write in natural Bulgarian first, then natural Russian and English. Avoid literal translations and keyword stuffing.',
  'BG local SEO: Florial plant offer in Несебър and nearby Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас. Use Несебър as primary location; mention only 1–3 nearby places naturally. Never mention Созопол.',
  'Descriptions should explain visible/known product qualities and buyer uses without unsupported horticultural claims. If information is limited, stay concise and cautious.',
  'Visible observation from the main photo (do not identify species from this observation): '+(visibleObservation||'no visual observation available'),
  'BG SEO title should target 50–65 characters and meta description 140–160 characters; hard max 70 and 320. Localize SEO separately for RU and EN.',
  'Create imageAltEn and imageAltRu translations of the supplied visible observation, each maximum 180 characters. If no visible observation was supplied, leave both ALT fields empty. Do not add SEO locations or guess a plant species.',
  'Return shape: {"shortDescription":"","description":"","imageAltEn":"","imageAltRu":"","translations":{"bg":{"shortDescription":"","description":""},"ru":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}},"en":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}}},"seo":{"h1":"","metaTitle":"","metaDescription":""},"warnings":[]}',
  'Product name (preserve): '+name,
  'Scientific name supplied by staff (do not alter or infer): '+(scientificName||'not supplied'),
  'Plant type: '+type,
  'Category: '+(category||'not supplied'),
  'Existing short description: '+(shortDescription||'none'),
  'Existing description: '+(description||'none'),
 ].join('\n\n')
 try{
  const response=await env.AI.run(MODEL,{
   messages:[
    {role:'system',content:'You are a careful horticultural e-commerce copywriter for a Bulgarian garden centre. Output valid JSON only. Do not invent facts or commercial data.'},
    {role:'user',content:prompt},
   ],
   response_format:{type:'json_object'},
   max_tokens:7000,
   temperature:0.2,
  })
  const generated=parseModelJson(response)
  const translations=isObject(generated.translations)?generated.translations:{}
  const bg=isObject(translations.bg)?translations.bg:{}
  const ru=isObject(translations.ru)?translations.ru:{}
  const en=isObject(translations.en)?translations.en:{}
  const seo=isObject(generated.seo)?generated.seo:{}
  const cleanSeo=(value:unknown,fallbackName:string,language:'bg'|'ru'|'en')=>{
   const item=isObject(value)?value:{}
   const bgTitle=fallbackName+' | Несебър | Градински център Флориал'
   const localizedTitle=language==='bg'?(bgTitle.length<=70?bgTitle:fallbackName+' | Несебър | Florial'):language==='ru'?'Продажа '+fallbackName+' | Несебър | Florial':'Buy '+fallbackName+' | Nessebar | Florial'
   const localizedDescription=language==='bg'?'Продажба на '+fallbackName+' в Несебър и района — Равда, Слънчев бряг и Свети Влас. Разгледайте наличните размери и цени в градински център Florial.':language==='ru'?'Продажа '+fallbackName+' в Несебре и районе — Равда, Солнечный берег и Свети Влас. Ознакомьтесь с доступными размерами и ценами в садовом центре Florial.':'Buy '+fallbackName+' in Nessebar and nearby Ravda, Sunny Beach and Sveti Vlas. Explore available sizes and prices at Florial garden centre.'
   return {
    h1:cleanText(item.h1,160)||fallbackName,
    metaTitle:cleanText(item.metaTitle,70)||localizedTitle.slice(0,70),
    metaDescription:cleanText(item.metaDescription,320)||localizedDescription.slice(0,320),
   }
  }
  const bgSeo=cleanSeo(seo,name,'bg')
  const ruName=cleanText(ru.name,160)||name
  const enName=cleanText(en.name,160)||name
  const ruSeo=cleanSeo(ru.seo,ruName,'ru')
  const enSeo=cleanSeo(en.seo,enName,'en')
  const mainImageAlt=visibleObservation?cleanText('Купи '+name+' в Несебър — '+visibleObservation,180):''
  const imageAltEn=cleanText(generated.imageAltEn,180)
  const imageAltRu=cleanText(generated.imageAltRu,180)
  const mainImageAltEn=visibleObservation&&imageAltEn?cleanText('Buy '+enName+' in Nessebar — '+imageAltEn,180):''
  const mainImageAltRu=visibleObservation&&imageAltRu?cleanText('Купите '+ruName+' в Несебре — '+imageAltRu,180):''
  return json({
   ok:true,
   suggestion:{
    shortDescription:cleanText(generated.shortDescription||bg.shortDescription,500),
    description:cleanText(generated.description||bg.description,8000),
    translations:{
     bg:{name,shortDescription:cleanText(bg.shortDescription||generated.shortDescription,500),description:cleanText(bg.description||generated.description,8000),seo:bgSeo},
     ru:{name:ruName,shortDescription:cleanText(ru.shortDescription,500),description:cleanText(ru.description,8000),seo:ruSeo},
     en:{name:enName,shortDescription:cleanText(en.shortDescription,500),description:cleanText(en.description,8000),seo:enSeo},
    },
    seo:bgSeo,
    mainImageAlt,
    mainImageAltEn,
    mainImageAltRu,
    warnings:[...warnings,...(visibleObservation&&!imageAltEn?['Не беше генериран английски ALT за основната снимка.']:[]),...(visibleObservation&&!imageAltRu?['Не беше генериран руски ALT за основната снимка.']:[]),...(Array.isArray(generated.warnings)?generated.warnings.slice(0,8).map(item=>cleanText(item,240)):[])].slice(0,8),
   },
   model:MODEL,
   visionModel:visibleObservation?VISION_MODEL:null,
  })
 }catch(error){
  const code=error instanceof Error&&error.message==='AI_INVALID_JSON'?'invalid_ai_response':'ai_generation_failed'
  console.error('[manager-plants-ai-enrich]',{code,role:auth.user.role})
  return json({error:'ИИ не успя да подготви текста. Проверете въведените данни и опитайте отново.'},502)
 }
}
