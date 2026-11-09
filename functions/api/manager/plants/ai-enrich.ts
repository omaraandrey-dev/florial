import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, requirePlantRole } from '../plant-direct-lib'

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast'
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
 const prompt=[
  'Create accurate, useful multilingual e-commerce copy for a plant sold by Florial in Bulgaria.',
  'Return JSON only, no markdown. Never invent price, stock, SKU, sale size, container size, delivery conditions, scientific name, botanical certainty, toxicity, hardiness or care data.',
  'Do not generate plantCare, careGuide, mature dimensions, winter temperatures, irrigation recommendations or botanical research.',
  'Preserve the supplied product name exactly. Do not guess or change scientificName.',
  'Write in natural Bulgarian first, then natural Russian and English. Avoid literal translations and keyword stuffing.',
  'BG local SEO: Florial plant offer in Несебър and nearby Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас. Use Несебър as primary location; mention only 1–3 nearby places naturally. Never mention Созопол.',
  'Descriptions should explain visible/known product qualities and buyer uses without unsupported horticultural claims. If information is limited, stay concise and cautious.',
  'BG SEO title should target 50–65 characters and meta description 140–160 characters; hard max 70 and 320. Localize SEO separately for RU and EN.',
  'Return shape: {"shortDescription":"","description":"","translations":{"bg":{"shortDescription":"","description":""},"ru":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}},"en":{"name":"","shortDescription":"","description":"","seo":{"h1":"","metaTitle":"","metaDescription":""}}},"seo":{"h1":"","metaTitle":"","metaDescription":""},"warnings":[]}',
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
  return json({
   ok:true,
   suggestion:{
    shortDescription:cleanText(generated.shortDescription||bg.shortDescription,500),
    description:cleanText(generated.description||bg.description,8000),
    translations:{
     bg:{name,shortDescription:cleanText(bg.shortDescription||generated.shortDescription,500),description:cleanText(bg.description||generated.description,8000)},
     ru:{name:cleanText(ru.name,160)||name,shortDescription:cleanText(ru.shortDescription,500),description:cleanText(ru.description,8000),seo:isObject(ru.seo)?ru.seo:{}},
     en:{name:cleanText(en.name,160)||name,shortDescription:cleanText(en.shortDescription,500),description:cleanText(en.description,8000),seo:isObject(en.seo)?en.seo:{}},
    },
    seo:{
     h1:cleanText(seo.h1,160)||name,
     metaTitle:cleanText(seo.metaTitle,70),
     metaDescription:cleanText(seo.metaDescription,320),
    },
    warnings:Array.isArray(generated.warnings)?generated.warnings.slice(0,8).map(item=>cleanText(item,240)):[],
   },
   model:MODEL,
  })
 }catch(error){
  const code=error instanceof Error&&error.message==='AI_INVALID_JSON'?'invalid_ai_response':'ai_generation_failed'
  console.error('[manager-plants-ai-enrich]',{code,role:auth.user.role})
  return json({error:'ИИ не успя да подготви текста. Проверете въведените данни и опитайте отново.'},502)
 }
}
