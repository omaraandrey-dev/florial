type Env={SUPABASE_URL?:string;SUPABASE_SERVICE_ROLE_KEY?:string;SANITY_API_TOKEN?:string}
type Perms={canCreatePlant:boolean;canAddPlantVariant:boolean;canEditPlantPrice:boolean}
type Profile={role:string;is_active:boolean;permissions:Perms}
type Variant={_key:string;name?:string;saleHeightCm?:number;containerVolumeL?:number;priceEUR?:number|null;stockStatus?:string;stockQuantity?:number|null}
type Plant={_id:string;_rev:string;name:string;sku?:string;saleVariants?:Variant[]}
const project='bxvcy0qs',dataset='plants'
const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})
const obj=(v:unknown):Record<string,unknown>|null=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null
const str=(v:unknown,max=160)=>typeof v==='string'?v.trim().slice(0,max):''
const num=(v:unknown,min:number,integer=false):number|null=>{if(v==null||v==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<min||(integer&&!Number.isInteger(n)))throw new Error('Проверете въведената числова стойност.');return n}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const onRequest=async({request,env}:{request:Request;env:Env})=>{
 const url=new URL(request.url),origin=request.headers.get('Origin')
 if(origin){try{if(new URL(origin).origin!==url.origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Invalid origin.'},403)}}
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405)
 const {SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SANITY_API_TOKEN}=env
 if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!SANITY_API_TOKEN)return json({error:'Plant catalogue service is not configured.'},503)
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'')
 if(!token)return json({error:'Authentication required.'},401)
 const base=SUPABASE_URL.replace(/\/+$/,'')
 const admin={apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'}
 const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+token}})
 if(!auth.ok)return json({error:'Invalid or expired session.'},401)
 const user=await auth.json() as {id?:string}
 if(!user.id)return json({error:'Invalid session.'},401)
 const pr=await fetch(base+'/rest/v1/catalog_staff_profiles?user_id=eq.'+encodeURIComponent(user.id)+'&select=role,is_active,permissions',{headers:admin})
 if(!pr.ok)return json({error:'Unable to verify staff permissions.'},503)
 const profiles=await pr.json() as Profile[],profile=profiles[0]
 if(!profile||!profile.is_active)return json({error:'Active staff access required.'},403)
 const query=async<T>(q:string):Promise<T>=>{const r=await fetch('https://'+project+'.api.sanity.io/v2025-02-19/data/query/'+dataset+'?query='+encodeURIComponent(q),{headers:{Authorization:'Bearer '+SANITY_API_TOKEN}});if(!r.ok)throw new Error('Не удалось прочитать каталог растений в Sanity.');return (await r.json() as {result:T}).result}
 const mutate=async(variants:Variant[],id:string,rev:string)=>{const r=await fetch('https://'+project+'.api.sanity.io/v2025-02-19/data/mutate/'+dataset+'?returnIds=true',{method:'POST',headers:{Authorization:'Bearer '+SANITY_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({mutations:[{patch:{id,ifRevisionID:rev,set:{saleVariants:variants}}}]})});if(!r.ok)throw new Error('Sanity не принял изменение. Возможно, документ уже изменён; обновите заявку.')}
 if(request.method==='GET'){
  if(profile.role==='seller'&&!profile.permissions?.canAddPlantVariant&&!profile.permissions?.canEditPlantPrice)return json({error:'Нямате право да променяте съществуващи растения.'},403)
  try{return json({plants:await query<Plant[]>('*[_type=="product" && defined(saleVariants) && isActive!=false && !(_id in path("drafts.**"))]|order(name asc){_id,_rev,name,sku,saleVariants}')})}catch(e){return json({error:e instanceof Error?e.message:'Не удалось загрузить каталог.'},502)}
 }
 let body:Record<string,unknown>|null=null;try{body=obj(await request.json())}catch{}
 if(!body||typeof body.action!=='string')return json({error:'Invalid request body.'},400)
 if(body.action==='approve'){
  if(profile.role!=='owner')return json({error:'Owner access required.'},403)
  const id=str(body.submissionId,64);if(!uuid.test(id))return json({error:'Invalid submission ID.'},400)
  const sr=await fetch(base+'/rest/v1/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&select=id,operation,status,target_document_id,target_revision,payload',{headers:admin})
  if(!sr.ok)return json({error:'Unable to load the change request.'},502)
  const subs=await sr.json() as Array<{id:string;operation:string;status:string;target_document_id:string;target_revision:string;payload:Record<string,unknown>}>
  const sub=subs[0];if(!sub||sub.operation!=='update'||!['submitted','in_review'].includes(sub.status))return json({error:'Change request is not available for approval.'},409)
  try{
   const current=await query<Plant|null>('*[_type=="product" && _id=='+JSON.stringify(sub.target_document_id)+'][0]{_id,_rev,name,saleVariants}')
   if(!current)return json({error:'Растението вече не е намерено.'},404)
   if(current._rev!==sub.target_revision)return json({error:'Растението е променено след създаването на заявката. Проверете актуалните данни.'},409)
   const variants=current.saleVariants||[],payload=obj(sub.payload)||{}
   let next:Variant[]
   if(payload.changeType==='addVariant'){
    const v=obj(payload.proposedVariant);if(!v||variants.length>=30)return json({error:'Невалиден вариант или достигнат лимит от 30.'},400)
    const key=str(v._key,80);if(!key||variants.some(x=>x._key===key))return json({error:'Невалиден ключ на варианта.'},409)
    next=[...variants,v as Variant]
   }else if(payload.changeType==='editPrice'){
    const key=str(payload.variantKey,80),price=num(payload.newPriceEUR,.01)
    if(!variants.some(x=>x._key===key)||price===null)return json({error:'Вариантът или цената са невалидни.'},400)
    next=variants.map(x=>x._key===key?{...x,priceEUR:price}:x)
   }else return json({error:'Unknown change type.'},400)
   await mutate(next,current._id,current._rev)
   const updated=await fetch(base+'/rest/v1/catalog_submissions?id=eq.'+encodeURIComponent(id)+'&status=in.(submitted,in_review)',{method:'PATCH',headers:{...admin,Prefer:'return=representation'},body:JSON.stringify({status:'published',reviewed_by:user.id,reviewed_at:new Date().toISOString(),published_at:new Date().toISOString(),updated_at:new Date().toISOString()})})
   if(!updated.ok)return json({error:'Каталогът е променен, но статусът на заявката не се обнови. Проверете заявката преди повторение.'},502)
   await fetch(base+'/rest/v1/catalog_submission_events',{method:'POST',headers:{...admin,Prefer:'return=minimal'},body:JSON.stringify({submission_id:id,actor_id:user.id,event_type:'catalog_change_published',from_status:sub.status,to_status:'published',note:payload.changeType==='addVariant'?'Добавен е вариант към съществуващо растение.':'Обновена е цената на вариант.',metadata:{target_document_id:sub.target_document_id,change_type:payload.changeType}})})
   return json({ok:true})
  }catch(e){return json({error:e instanceof Error?e.message:'Не удалось применить изменение.'},502)}
 }
 if(profile.role!=='seller'&&profile.role!=='manager')return json({error:'Seller or manager access required.'},403)
 const action=body.action
 if(action!=='submitVariant'&&action!=='submitPrice')return json({error:'Unknown action.'},400)
 if(action==='submitVariant'&&!profile.permissions?.canAddPlantVariant)return json({error:'Нямате право да добавяте размери и варианти.'},403)
 if(action==='submitPrice'&&!profile.permissions?.canEditPlantPrice)return json({error:'Нямате право да променяте цени.'},403)
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
   payload={changeType:'addVariant',targetName:plant.name,proposedVariant:{_key:crypto.randomUUID().replace(/-/g,''),name,saleHeightCm:height,containerVolumeL:container,priceEUR:price,stockStatus:status,stockQuantity:qty}}
  }else{
   const key=str(body.variantKey,80),price=num(body.newPriceEUR,.01),variant=variants.find(v=>v._key===key)
   if(!variant||price===null)return json({error:'Изберете вариант и положителна цена.'},400)
   payload={changeType:'editPrice',targetName:plant.name,variantKey:key,variantName:variant.name||'',oldPriceEUR:variant.priceEUR??null,newPriceEUR:price}
  }
  const insert=await fetch(base+'/rest/v1/catalog_submissions',{method:'POST',headers:{...admin,Prefer:'return=representation'},body:JSON.stringify({catalog:'plants',operation:'update',target_document_id:targetId,target_revision:rev,title:plant.name,sku:plant.sku||null,payload,status:'submitted',created_by:user.id,submitted_at:new Date().toISOString()})})
  if(!insert.ok)return json({error:'Не удалось создать заявку на изменение каталога.'},502)
  const rows=await insert.json() as Array<{id:string}>;if(!rows[0]?.id)return json({error:'Заявка создана без идентификатора.'},502)
  return json({ok:true,submissionId:rows[0].id},201)
 }catch(e){return json({error:e instanceof Error?e.message:'Не удалось подготовить заявку.'},400)}
}
