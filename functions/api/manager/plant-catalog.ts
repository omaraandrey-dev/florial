import { d1RestFetch } from './_rest'
import type { ManagerEnv } from './_lib'
type Env=ManagerEnv
type Perms={canCreatePlant:boolean;canAddPlantVariant:boolean;canEditPlantPrice:boolean;canApprovePlantSubmission?:boolean;canPublishPlant?:boolean}
type Profile={role:string;is_active:boolean;permissions:Perms}
type Variant={_key:string;name?:string;saleHeightCm?:number;containerVolumeL?:number;priceEUR?:number|null;stockStatus?:string;stockQuantity?:number|null}
type Plant={_id:string;_rev:string;name:string;scientificName?:string;sku?:string;categoryId?:string;saleVariants?:Variant[]}
const project='bxvcy0qs',dataset='plants'
const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})
const obj=(v:unknown):Record<string,unknown>|null=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null
const str=(v:unknown,max=160)=>typeof v==='string'?v.trim().slice(0,max):''
const num=(v:unknown,min:number,integer=false):number|null=>{if(v==null||v==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<min||(integer&&!Number.isInteger(n)))throw new Error('Проверете въведената числова стойност.');return n}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const handleRequest=async({request,env,setStage}:{request:Request;env:Env;setStage:(stage:string)=>void})=>{
 const fetch=(input:RequestInfo|URL,init?:RequestInit)=>d1RestFetch(env,request,input,init)
 const base='https://florial-d1.local'
 const D1_INTERNAL_HEADER='D1-compat'
 setStage('origin_check')
 const url=new URL(request.url),origin=request.headers.get('Origin')
 if(origin){try{if(new URL(origin).origin!==url.origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Invalid origin.'},403)}}
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405)
 const {SANITY_API_TOKEN}=env
 if(!env.DB||!SANITY_API_TOKEN)return json({error:'Plant catalogue service is not configured.'},503)
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'')
 if(!token)return json({error:'Authentication required.'},401)
 const admin={apikey:D1_INTERNAL_HEADER,Authorization:'Bearer '+D1_INTERNAL_HEADER,'Content-Type':'application/json'}
 setStage('session_authentication')
 const auth=await fetch(base+'/internal-d1/auth/user',{headers:{apikey:D1_INTERNAL_HEADER,Authorization:'Bearer '+token}})
 if(!auth.ok)return json({error:'Invalid or expired session.'},401)
 const user=await auth.json() as {id?:string}
 if(!user.id)return json({error:'Invalid session.'},401)
 setStage('staff_permissions')
 const pr=await fetch(base+'/internal-d1/data/catalog_staff_profiles?user_id=eq.'+encodeURIComponent(user.id)+'&select=role,is_active,permissions',{headers:admin})
 if(!pr.ok)return json({error:'Unable to verify staff permissions.'},503)
 const profiles=await pr.json() as Profile[],profile=profiles[0]
 if(!profile||!profile.is_active)return json({error:'Active staff access required.'},403)
 const query=async<T>(q:string):Promise<T>=>{const r=await fetch('https://'+project+'.api.sanity.io/v2025-02-19/data/query/'+dataset+'?query='+encodeURIComponent(q),{headers:{Authorization:'Bearer '+SANITY_API_TOKEN}});if(!r.ok)throw new Error('Не успяхме да прочетем каталога с растения в Sanity.');return (await r.json() as {result:T}).result}
 const mutate=async(variants:Variant[],id:string,rev:string)=>{const r=await fetch('https://'+project+'.api.sanity.io/v2025-02-19/data/mutate/'+dataset+'?returnIds=true',{method:'POST',headers:{Authorization:'Bearer '+SANITY_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({mutations:[{patch:{id,ifRevisionID:rev,set:{saleVariants:variants}}}]})});if(!r.ok)throw new Error('Sanity не прие промяната. Възможно е документът вече да е променен; обновете заявката.')}
 if(request.method==='GET'){
  setStage('sanity_catalog_query');
  if(profile.role!=='owner'&&!profile.permissions?.canAddPlantVariant&&!profile.permissions?.canEditPlantPrice)return json({error:'Нямате право да променяте съществуващи растения.'},403)
  try{return json({plants:await query<Plant[]>('*[_type=="product" && isActive!=false && !(_id in path("drafts.**"))]|order(name asc){_id,_rev,name,scientificName,sku,categoryId:category->_id,saleVariants}')})}catch(e){return json({error:e instanceof Error?e.message:'Не успяхме да заредим каталога.'},502)}
 }
 let body:Record<string,unknown>|null=null;try{body=obj(await request.json())}catch{}
 if(!body||typeof body.action!=='string')return json({error:'Invalid request body.'},400)
 if(body.action==='approve'||body.action==='publish'){
  const action=body.action
  if(action==='approve'&&profile.role!=='owner'&&(profile.role!=='manager'||!profile.permissions?.canApprovePlantSubmission))return json({error:'Нямате право да одобрявате промени в каталога.'},403)
  if(action==='publish'&&profile.role!=='owner'&&(profile.role!=='manager'||!profile.permissions?.canPublishPlant))return json({error:'Нямате право да публикувате промени в каталога.'},403)
  const id=str(body.submissionId,64);if(!uuid.test(id))return json({error:'Invalid submission ID.'},400)
  const sr=await fetch(base+'/internal-d1/data/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&select=id,operation,status,target_document_id,target_revision,payload',{headers:admin})
  if(!sr.ok)return json({error:'Unable to load the change request.'},502)
  const subs=await sr.json() as Array<{id:string;operation:string;status:string;target_document_id:string;target_revision:string;payload:Record<string,unknown>}>
  const sub=subs[0]
  if(!sub||sub.operation!=='update')return json({error:'Change request is not available.'},404)
  const payload=obj(sub.payload)||{}
  const current=await query<Plant|null>('*[_type=="product" && _id=='+JSON.stringify(sub.target_document_id)+'][0]{_id,_rev,name,saleVariants}')
  if(!current)return json({error:'Растението вече не е намерено.'},404)
  const variants=current.saleVariants||[]
  if(action==='approve'){
   if(!['submitted','in_review'].includes(sub.status))return json({error:'Заявката вече е обработена.'},409)
   if(current._rev!==sub.target_revision)return json({error:'Растението е променено след създаването на заявката. Обновете заявката преди одобрение.'},409)
   if(payload.changeType==='addVariant'){
    const v=obj(payload.proposedVariant),key=str(v?._key,80)
    if(!v||!key||variants.some(x=>x._key===key)||variants.length>=30)return json({error:'Предложеният вариант вече съществува или не е валиден.'},409)
   }else if(payload.changeType==='editPrice'){
    const key=str(payload.variantKey,80),price=num(payload.newPriceEUR,.01)
    if(!variants.some(x=>x._key===key)||price===null)return json({error:'Вариантът или новата цена са невалидни.'},400)
   }else return json({error:'Unknown change type.'},400)
   const now=new Date().toISOString()
   const approved=await fetch(base+'/internal-d1/data/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&status=in.(submitted,in_review)',{method:'PATCH',headers:{...admin,Prefer:'return=representation'},body:JSON.stringify({status:'approved',reviewed_by:user.id,reviewed_at:now,updated_at:now})})
   const approvedRows=await approved.json().catch(()=>[]) as unknown[]
   if(!approved.ok||!Array.isArray(approvedRows)||approvedRows.length===0)return json({error:'Заявката не можа да бъде одобрена. Обновете списъка и опитайте отново.'},409)
   await fetch(base+'/internal-d1/data/catalog_submission_events',{method:'POST',headers:{...admin,Prefer:'return=minimal'},body:JSON.stringify({submission_id:id,actor_id:user.id,event_type:'catalog_change_approved',from_status:sub.status,to_status:'approved',note:'Промяната е одобрена и очаква отделна публикация.',metadata:{target_document_id:sub.target_document_id,change_type:payload.changeType}})})
   return json({ok:true,status:'approved'})
  }
  if(!['approved','publish_failed'].includes(sub.status))return json({error:'Първо одобрете заявката. Публикуването е отделна стъпка.'},409)
  let next:Variant[]|null=null
  let alreadyApplied=false
  if(payload.changeType==='addVariant'){
   const v=obj(payload.proposedVariant) as Variant|null,key=str(v?._key,80)
   if(!v||!key)return json({error:'Невалиден вариант в заявката.'},400)
   const existing=variants.find(x=>x._key===key)
   if(existing){
    alreadyApplied=existing.name===v.name&&(existing.saleHeightCm??null)===(v.saleHeightCm??null)&&(existing.containerVolumeL??null)===(v.containerVolumeL??null)&&(existing.priceEUR??null)===(v.priceEUR??null)&&existing.stockStatus===v.stockStatus&&(existing.stockQuantity??null)===(v.stockQuantity??null)
    if(!alreadyApplied)return json({error:'Ключът на варианта вече използван с други данни. Нужна е ръчна проверка.'},409)
   }else{
    if(current._rev!==sub.target_revision)return json({error:'Растението е променено след одобрението. Проверете каталога и създайте нова заявка.'},409)
    if(variants.length>=30)return json({error:'Достигнат е лимитът от 30 варианта.'},409)
    next=[...variants,v]
   }
  }else if(payload.changeType==='editPrice'){
   const key=str(payload.variantKey,80),price=num(payload.newPriceEUR,.01),variant=variants.find(x=>x._key===key)
   if(!variant||price===null)return json({error:'Вариантът или новата цена са невалидни.'},409)
   alreadyApplied=variant.priceEUR===price
   if(!alreadyApplied){
    if(current._rev!==sub.target_revision)return json({error:'Растението е променено след одобрението. Проверете каталога и създайте нова заявка.'},409)
    next=variants.map(x=>x._key===key?{...x,priceEUR:price}:x)
   }
  }else return json({error:'Unknown change type.'},400)
  if(!alreadyApplied&&next){
   try{await mutate(next,current._id,current._rev)}
   catch(e){
    const message=e instanceof Error?e.message:'Не успяхме да приложим промяната.'
    await fetch(base+'/internal-d1/data/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&status=in.(approved,publish_failed)',{method:'PATCH',headers:{...admin,Prefer:'return=minimal'},body:JSON.stringify({status:'publish_failed',publish_error:message,updated_at:new Date().toISOString()})})
    return json({error:message},502)
   }
  }
  const now=new Date().toISOString()
  const published=await fetch(base+'/internal-d1/data/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&status=in.(approved,publish_failed)',{method:'PATCH',headers:{...admin,Prefer:'return=representation'},body:JSON.stringify({status:'published',published_at:now,publish_error:null,updated_at:now})})
  const publishedRows=await published.json().catch(()=>[]) as unknown[]
  if(!published.ok||!Array.isArray(publishedRows)||publishedRows.length===0)return json({error:'Каталогът е променен, но статусът на заявката не се обнови. Повторното публикуване е безопасно.'},502)
  await fetch(base+'/internal-d1/data/catalog_submission_events',{method:'POST',headers:{...admin,Prefer:'return=minimal'},body:JSON.stringify({submission_id:id,actor_id:user.id,event_type:'catalog_change_published',from_status:sub.status,to_status:'published',note:alreadyApplied?'Публикацията е потвърдена при повторна проверка.':'Промяната е публикувана в каталога.',metadata:{target_document_id:sub.target_document_id,change_type:payload.changeType}})})
  return json({ok:true,status:'published',alreadyApplied})
 }
 if(profile.role!=='owner'&&profile.role!=='seller'&&profile.role!=='manager')return json({error:'Staff access required.'},403)
 const action=body.action
 if(action!=='submitVariant'&&action!=='submitPrice')return json({error:'Unknown action.'},400)
 if(profile.role!=='owner'&&action==='submitVariant'&&!profile.permissions?.canAddPlantVariant)return json({error:'Нямате право да добавяте размери и варианти.'},403)
 if(profile.role!=='owner'&&action==='submitPrice'&&!profile.permissions?.canEditPlantPrice)return json({error:'Нямате право да променяте цени.'},403)
 const targetId=str(body.targetDocumentId,128),rev=str(body.targetRevision,128)
 if(!targetId||!rev)return json({error:'Изберете растение от каталога.'},400)
 try{
  const plant=await query<Plant|null>('*[_type=="product" && _id=='+JSON.stringify(targetId)+'][0]{_id,_rev,name,sku,saleVariants}')
  if(!plant||plant._rev!==rev)return json({error:'Каталогът е обновен. Презаредете списъка и опитайте отново.'},409)
  const variants=plant.saleVariants||[];let payload:Record<string,unknown>
  if(action==='submitVariant'){
   if(variants.length>=30)return json({error:'Достигнат е лимитът от 30 варианта.'},409)
   const name=str(body.name,100),height=num(body.saleHeightCm,.1),container=num(body.containerVolumeL,.1),price=num(body.priceEUR,.01),qty=num(body.stockQuantity,0,true),status=str(body.stockStatus,20)
   if(name.length<2||(height===null&&container===null)||!['inStock','onRequest','outOfStock'].includes(status))return json({error:'Въведете име, размер и валидна наличност.'},400)
   if(status==='inStock'&&(price===null||qty===null||qty<1))return json({error:'За наличен вариант въведете цена и количество поне 1.'},400)
   const duplicate=variants.some(v=>(v.name||'').trim().toLocaleLowerCase()===name.toLocaleLowerCase()&&(v.saleHeightCm??null)===height&&(v.containerVolumeL??null)===container)
   if(duplicate)return json({error:'Този вариант вече съществува за избраното растение.'},409)
   payload={changeType:'addVariant',targetName:plant.name,proposedVariant:{_type:'plantSaleVariant',_key:crypto.randomUUID().replace(/-/g,''),name,saleHeightCm:height,containerVolumeL:container,priceEUR:price,stockStatus:status,stockQuantity:qty}}
  }else{
   const key=str(body.variantKey,80),price=num(body.newPriceEUR,.01),variant=variants.find(v=>v._key===key)
   if(!variant||price===null)return json({error:'Изберете вариант и положителна цена.'},400)
   payload={changeType:'editPrice',targetName:plant.name,variantKey:key,variantName:variant.name||'',oldPriceEUR:variant.priceEUR??null,newPriceEUR:price}
  }
  const insert=await fetch(base+'/internal-d1/data/catalog_submissions',{method:'POST',headers:{...admin,Prefer:'return=representation'},body:JSON.stringify({catalog:'plants',operation:'update',target_document_id:targetId,target_revision:rev,title:plant.name,sku:plant.sku||null,payload,status:'submitted',created_by:user.id,submitted_at:new Date().toISOString()})})
  if(!insert.ok)return json({error:'Не успяхме да създадем заявка за промяна на каталога.'},502)
  const rows=await insert.json() as Array<{id:string}>;if(!rows[0]?.id)return json({error:'Заявката е създадена без идентификатор.'},502)
  return json({ok:true,submissionId:rows[0].id},201)
 }catch(e){return json({error:e instanceof Error?e.message:'Не успяхме да подготвим заявката.'},400)}
}


export const onRequest=async({request,env}:{request:Request;env:Env})=>{
 const requestId=crypto.randomUUID()
 let stage='initialization'
 try{
  return await handleRequest({request,env,setStage:(next)=>{stage=next}})
 }catch(error){
  const message=error instanceof Error?error.message:String(error)
  console.error('[manager-plant-catalog]',JSON.stringify({requestId,stage,errorName:error instanceof Error?error.name:'UnknownError',message:message.slice(0,300)}))
  return json({error:'Възникна вътрешна грешка при обработката на каталога. Уведомете администратора с кода за проверка.',requestId,stage},500)
 }
}
