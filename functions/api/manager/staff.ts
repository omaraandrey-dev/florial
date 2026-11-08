import {
  DEFAULT_STAFF_PERMISSIONS, STAFF_PERMISSION_KEYS, hashPassword, json, nowIso, newId, requireUser,
  type ManagerEnv, type StaffPermissionKey, type StaffPermissions, type StaffRole,
} from './_lib'

const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)
const allPermissions=(value:unknown):StaffPermissions|null=>{
 if(!isObject(value)||STAFF_PERMISSION_KEYS.some(key=>typeof value[key]!=='boolean'))return null
 if(value.canManageServiceLeads===true&&value.canViewServiceLeads!==true)return null
 return Object.fromEntries(STAFF_PERMISSION_KEYS.map(key=>[key,value[key]])) as StaffPermissions
}
const canManage=(role:StaffRole,permissions:StaffPermissions)=>role==='owner'||role==='manager'&&permissions.canManageStaff
const logPermissions=async(env:ManagerEnv,actorId:string,targetId:string,action:string,before:StaffPermissions|null,after:StaffPermissions|null)=>{
 await env.DB!.prepare('INSERT INTO catalog_staff_permission_events (actor_id,target_user_id,action,previous_permissions,new_permissions,created_at) VALUES (?,?,?,?,?,?)')
  .bind(actorId,targetId,action,before?JSON.stringify(before):null,after?JSON.stringify(after):null,nowIso()).run()
}
export const onRequest=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB)return json({error:'D1 database is not configured.'},503)
 if(!['GET','POST','PATCH'].includes(request.method))return json({error:'Method not allowed.'},405)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 const actor=auth.user,owner=actor.role==='owner',actorPermissions=actor.permissionsObject
 if(!canManage(actor.role,actorPermissions))return json({error:'Нямате право да управлявате служители.'},403)
 if(request.method!=='GET'){
  const origin=request.headers.get('Origin')
  if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Origin not allowed.'},403)}}
 }
 if(request.method==='GET'){
  const rows=owner
   ?await env.DB.prepare('SELECT user_id,email,role,display_name,is_active,permissions,created_at,created_by FROM catalog_staff_profiles ORDER BY created_at ASC').all<Record<string,unknown>>()
   :await env.DB.prepare('SELECT user_id,email,role,display_name,is_active,permissions,created_at,created_by FROM catalog_staff_profiles WHERE created_by=? ORDER BY created_at ASC').bind(actor.user_id).all<Record<string,unknown>>()
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
  if(!owner&&role==='manager'&&!actorPermissions.canDelegatePermissions)return json({error:'Нямате право да създавате мениджъри и да делегирате права.'},403)
  const requested=body.permissions===undefined?Object.fromEntries(STAFF_PERMISSION_KEYS.map(key=>[key,false])) as StaffPermissions:allPermissions(body.permissions)
  if(!requested)return json({error:'Невалиден набор от права.'},400)
  if(!owner){
   if(!actorPermissions.canDelegatePermissions&&body.permissions!==undefined)return json({error:'Нямате право да задавате разрешения.'},403)
   if(requested.canEditPlantStock)return json({error:'Правото за промяна на количествата може да бъде предоставено само от собственика.'},403)
   for(const key of STAFF_PERMISSION_KEYS){
    if(requested[key]&&!actorPermissions[key])return json({error:'Не можете да делегирате право, което не притежавате: '+key},403)
   }
  }
  if(role==='seller'&&(requested.canEditPlantCard||requested.canReviewPlantSubmissions||requested.canApprovePlantSubmission||requested.canPublishPlant||requested.canManageStaff||requested.canDelegatePermissions||requested.canViewAnalytics||requested.canViewOrders||requested.canEditOrders||requested.canDeleteTestOrders||requested.canManageCategorySeo||requested.canViewServiceLeads||requested.canManageServiceLeads)){
   return json({error:'Тези права могат да бъдат назначени само на мениджър.'},400)
  }
  const exists=await env.DB.prepare('SELECT user_id FROM catalog_staff_profiles WHERE email=? COLLATE NOCASE').bind(email).first()
  if(exists)return json({error:'Служител с този email вече съществува.'},409)
  const {salt,hash,iterations}=await hashPassword(password),id=newId(),now=nowIso()
  await env.DB.prepare('INSERT INTO catalog_staff_profiles (user_id,email,password_salt,password_hash,password_iterations,role,display_name,is_active,permissions,created_at,updated_at,created_by) VALUES (?,?,?,?,?,?,?,1,?,?,?,?)')
   .bind(id,email,salt,hash,iterations,role,displayName,JSON.stringify(requested),now,now,actor.user_id).run()
  await logPermissions(env,actor.user_id,id,'created',null,requested)
  return json({ok:true,user_id:id},201)
 }
 const userId=typeof body.userId==='string'?body.userId:''
 if(!/^[0-9a-f-]{36}$/i.test(userId)||userId===actor.user_id)return json({error:'Този акаунт не може да бъде променян.'},400)
 const target=await env.DB.prepare('SELECT user_id,role,permissions,created_by FROM catalog_staff_profiles WHERE user_id=?').bind(userId).first<{user_id:string;role:StaffRole;permissions:string;created_by:string|null}>()
 if(!target||target.role==='owner'||(!owner&&target.created_by!==actor.user_id))return json({error:'Нямате право да променяте този акаунт.'},403)
 const before=allPermissions(JSON.parse(target.permissions))||{...DEFAULT_STAFF_PERMISSIONS}
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
  let nextRole=target.role
  if(body.role==='seller'||body.role==='manager'){
   nextRole=body.role
   if(!owner&&nextRole==='manager'&&!actorPermissions.canDelegatePermissions)return json({error:'Нямате право да назначавате мениджъри.'},403)
   sets.push('role=?');values.push(nextRole)
  }else if(body.role!==undefined)return json({error:'Невалидна роля.'},400)
  if(typeof body.displayName==='string'){sets.push('display_name=?');values.push(body.displayName.trim().slice(0,120))}
  let after=before
  let permissionsChanged=false
  if(body.permissions!==undefined){
   if(!owner&&!actorPermissions.canDelegatePermissions)return json({error:'Нямате право да делегирате разрешения.'},403)
   const parsed=allPermissions(body.permissions)
   if(!parsed)return json({error:'Невалидни права на служителя.'},400)
   if(!owner&&parsed.canEditPlantStock!==before.canEditPlantStock)return json({error:'Правото за промяна на количествата може да бъде променено само от собственика.'},403)
   if(!owner)for(const key of STAFF_PERMISSION_KEYS as StaffPermissionKey[])if(parsed[key]&&!actorPermissions[key])return json({error:'Не можете да делегирате право, което не притежавате: '+key},403)
   if(nextRole==='seller'&&(parsed.canEditPlantCard||parsed.canReviewPlantSubmissions||parsed.canApprovePlantSubmission||parsed.canPublishPlant||parsed.canManageStaff||parsed.canDelegatePermissions||parsed.canViewAnalytics||parsed.canViewOrders||parsed.canEditOrders||parsed.canDeleteTestOrders||parsed.canManageCategorySeo||parsed.canViewServiceLeads||parsed.canManageServiceLeads))return json({error:'Тези права могат да бъдат назначени само на мениджър.'},400)
   after=parsed;permissionsChanged=true
  }else if(nextRole==='seller'){
   after={...before,canEditPlantCard:false,canReviewPlantSubmissions:false,canApprovePlantSubmission:false,canPublishPlant:false,canManageStaff:false,canDelegatePermissions:false,canViewAnalytics:false,canViewOrders:false,canEditOrders:false,canDeleteTestOrders:false,canManageCategorySeo:false,canViewServiceLeads:false,canManageServiceLeads:false}
   permissionsChanged=STAFF_PERMISSION_KEYS.some(key=>after[key]!==before[key])
  }
  if(permissionsChanged){sets.push('permissions=?');values.push(JSON.stringify(after))}
  if(!sets.length)return json({error:'Няма промени за запис.'},400)
  sets.push('updated_at=?');values.push(nowIso(),userId)
  await env.DB.prepare('UPDATE catalog_staff_profiles SET '+sets.join(',')+' WHERE user_id=?').bind(...values).run()
  if(permissionsChanged)await logPermissions(env,actor.user_id,userId,'updated',before,after)
  return json({ok:true})
 }
 return json({error:'Unknown action.'},400)
}
