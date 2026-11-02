import { hashPassword, json, nowIso, newId, requireUser, type ManagerEnv, type StaffRole } from './_lib'

const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const permissionsDefault={canCreatePlant:true,canAddPlantVariant:false,canEditPlantPrice:false}
export const onRequest=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB)return json({error:'D1 database is not configured.'},503)
 if(!['GET','POST','PATCH'].includes(request.method))return json({error:'Method not allowed.'},405)
 const auth=await requireUser(request,env,['owner'])
 if(auth.response||!auth.user)return auth.response||json({error:'Owner access required.'},403)
 if(request.method!=='GET'){
  const origin=request.headers.get('Origin')
  if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Origin not allowed.'},403)}}
 }
 if(request.method==='GET'){
  const rows=await env.DB.prepare('SELECT user_id,email,role,display_name,is_active,permissions,created_at FROM catalog_staff_profiles ORDER BY created_at ASC').all<Record<string,unknown>>()
  return json({staff:rows.results.map(row=>({...row,is_active:row.is_active===1,permissions:typeof row.permissions==='string'?JSON.parse(row.permissions):row.permissions}))})
 }
 let body:Record<string,unknown>
 try{body=await request.json() as Record<string,unknown>}catch{return json({error:'Invalid request.'},400)}
 if(request.method==='POST'){
  if(body.action!=='create')return json({error:'Unknown action.'},400)
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():''
  const password=typeof body.password==='string'?body.password:''
  const displayName=typeof body.displayName==='string'?body.displayName.trim().slice(0,120):''
  const role=body.role
  if(!validEmail(email)||password.length<12||password.length>128||!displayName||(role!=='seller'&&role!=='manager'))return json({error:'Въведете валиден email, име, роля и парола с поне 12 символа.'},400)
  const exists=await env.DB.prepare('SELECT user_id FROM catalog_staff_profiles WHERE email=? COLLATE NOCASE').bind(email).first()
  if(exists)return json({error:'Служител с този email вече съществува.'},409)
  const {salt,hash,iterations}=await hashPassword(password),id=newId(),now=nowIso()
  await env.DB.prepare('INSERT INTO catalog_staff_profiles (user_id,email,password_salt,password_hash,password_iterations,role,display_name,is_active,permissions,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,?,?)')
   .bind(id,email,salt,hash,iterations,role,displayName,JSON.stringify(permissionsDefault),now,now).run()
  return json({ok:true,user_id:id},201)
 }
 const userId=typeof body.userId==='string'?body.userId:''
 if(!/^[0-9a-f-]{36}$/i.test(userId)||userId===auth.user.user_id)return json({error:'Този акаунт не може да бъде променян.'},400)
 const target=await env.DB.prepare('SELECT user_id,role FROM catalog_staff_profiles WHERE user_id=?').bind(userId).first<{user_id:string;role:StaffRole}>()
 if(!target||target.role==='owner')return json({error:'Акаунтите на собственика не могат да се променят от този екран.'},403)
 if(body.action==='set_password'){
  const password=typeof body.password==='string'?body.password:''
  if(password.length<12||password.length>128)return json({error:'Паролата трябва да съдържа между 12 и 128 символа.'},400)
  const {salt,hash,iterations}=await hashPassword(password)
  await env.DB.prepare('UPDATE catalog_staff_profiles SET password_salt=?,password_hash=?,password_iterations=?,updated_at=? WHERE user_id=?').bind(salt,hash,iterations,nowIso(),userId).run()
  await env.DB.prepare('DELETE FROM manager_sessions WHERE user_id=?').bind(userId).run()
  return json({ok:true})
 }
 if(body.action==='activate'||body.action==='deactivate'){
  const active=body.action==='activate'?1:0
  await env.DB.prepare('UPDATE catalog_staff_profiles SET is_active=?,updated_at=? WHERE user_id=?').bind(active,nowIso(),userId).run()
  if(!active)await env.DB.prepare('DELETE FROM manager_sessions WHERE user_id=?').bind(userId).run()
  return json({ok:true})
 }
 if(body.action==='update'){
  const sets:string[]=[],values:unknown[]=[]
  if(body.role==='seller'||body.role==='manager'){sets.push('role=?');values.push(body.role)}
  else if(body.role!==undefined)return json({error:'Невалидна роля.'},400)
  if(typeof body.displayName==='string'){sets.push('display_name=?');values.push(body.displayName.trim().slice(0,120))}
  if(body.permissions!==undefined){
   const p=body.permissions&&typeof body.permissions==='object'&&!Array.isArray(body.permissions)?body.permissions as Record<string,unknown>:null
   if(!p||typeof p.canCreatePlant!=='boolean'||typeof p.canAddPlantVariant!=='boolean'||typeof p.canEditPlantPrice!=='boolean')return json({error:'Невалидни права на служителя.'},400)
   sets.push('permissions=?');values.push(JSON.stringify({canCreatePlant:p.canCreatePlant,canAddPlantVariant:p.canAddPlantVariant,canEditPlantPrice:p.canEditPlantPrice}))
  }
  if(!sets.length)return json({error:'Няма промени за запис.'},400)
  sets.push('updated_at=?');values.push(nowIso(),userId)
  await env.DB.prepare('UPDATE catalog_staff_profiles SET '+sets.join(',')+' WHERE user_id=?').bind(...values).run()
  return json({ok:true})
 }
 return json({error:'Unknown action.'},400)
}
