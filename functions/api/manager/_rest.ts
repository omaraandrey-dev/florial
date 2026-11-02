import { authenticate, json, nowIso, type D1Database, type ManagerEnv } from './_lib'

const tableColumns: Record<string, Set<string>> = {
  catalog_staff_profiles: new Set(['user_id','email','role','display_name','is_active','permissions','created_at','updated_at']),
  catalog_submissions: new Set(['id','catalog','operation','target_document_id','target_revision','title','sku','payload','status','created_by','reviewed_by','review_note','submitted_at','reviewed_at','published_at','publish_error','idempotency_key','notification_sent_at','notification_error','created_at','updated_at']),
  catalog_submission_events: new Set(['id','submission_id','actor_id','event_type','from_status','to_status','note','metadata','created_at']),
}
const jsonFields = new Set(['payload','permissions','metadata'])
const decodeRow = (row: Record<string,unknown>) => {
  const next={...row}
  for(const key of jsonFields)if(typeof next[key]==='string'){try{next[key]=JSON.parse(next[key] as string)}catch{/* keep original */}}
  if(typeof next.is_active==='number')next.is_active=next.is_active===1
  return next
}
const response = (body: unknown, status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})
const parseFilter = (value:string) => {
  if(value.startsWith('eq.'))return {op:'eq',values:[value.slice(3)] as string[]}
  if(value.startsWith('in.(')&&value.endsWith(')'))return {op:'in',values:value.slice(4,-1).split(',').map(x=>x.trim()).filter(Boolean)}
  return null
}

export const d1RestFetch = async (env:ManagerEnv, incoming:Request, input:RequestInfo|URL, init?:RequestInit):Promise<Response> => {
  const url = new URL(typeof input==='string'?input:input instanceof URL?input.toString():input.url)
  if(url.origin!=='https://florial-d1.local')return fetch(input,init)
  if(!env.DB)return response({message:'D1 database is not configured.'},503)
  const method=(init?.method||'GET').toUpperCase()
  if(url.pathname==='/auth/v1/user'){
    const auth=await authenticate(incoming,env)
    if(auth.error||!auth.user)return response({message:'Invalid or expired session.'},401)
    return response({id:auth.user.user_id,email:auth.user.email})
  }
  const match=url.pathname.match(/^\/rest\/v1\/(catalog_staff_profiles|catalog_submissions|catalog_submission_events)$/)
  if(!match)return response({message:'Unsupported D1 compatibility endpoint.'},404)
  const table=match[1],allowed=tableColumns[table]
  const db=env.DB
  try{
    if(method==='GET'){
      const requested=url.searchParams.get('select')||'*'
      const selected=requested==='*'?Array.from(allowed):requested.split(',').map(x=>x.trim())
      if(selected.some(x=>!allowed.has(x)))return response({message:'Invalid select fields.'},400)
      const where:string[]=[],values:unknown[]=[]
      for(const [key,value] of url.searchParams.entries()){
        if(key==='select'||key==='order'||key==='limit')continue
        if(!allowed.has(key))return response({message:'Invalid filter field.'},400)
        const filter=parseFilter(value);if(!filter)return response({message:'Invalid filter.'},400)
        if(filter.op==='eq'){where.push(key+'=?');values.push(filter.values[0])}
        else{where.push(key+' IN ('+filter.values.map(()=>'?').join(',')+')');values.push(...filter.values)}
      }
      if(table==='catalog_staff_profiles'){
        const auth=await authenticate(incoming,env);if(auth.error||!auth.user)return response({message:'Authentication required.'},401)
        where.push('user_id=?');values.push(auth.user.user_id)
      }
      let sql='SELECT '+selected.join(',')+' FROM '+table+(where.length?' WHERE '+where.join(' AND '):'')
      const order=url.searchParams.get('order')
      if(order){const [column,direction]=order.split('.');if(!allowed.has(column))return response({message:'Invalid sort column.'},400);sql+=' ORDER BY '+column+(direction==='desc'?' DESC':' ASC')}
      const limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||100)));sql+=' LIMIT '+limit
      const rows=await db.prepare(sql).bind(...values).all<Record<string,unknown>>()
      return response(rows.results.map(decodeRow))
    }
    if(method==='POST'){
      const body=JSON.parse(String(init?.body||'{}')) as Record<string,unknown>
      const keys=Object.keys(body)
      if(!keys.length||keys.some(x=>!allowed.has(x)))return response({message:'Invalid insert fields.'},400)
      if(table==='catalog_staff_profiles')return response({message:'Staff profiles can only be managed through the staff API.'},403)
      const auth=await authenticate(incoming,env);if(auth.error||!auth.user)return response({message:'Authentication required.'},401)
      const now=nowIso()
      const values=keys.map(key=>jsonFields.has(key)?JSON.stringify(body[key]):body[key])
      if(table==='catalog_submissions'){
        body.id=body.id||crypto.randomUUID();body.idempotency_key=body.idempotency_key||crypto.randomUUID();body.created_by=auth.user.user_id;body.created_at=body.created_at||now;body.updated_at=body.updated_at||now
        for(const key of ['id','idempotency_key','created_by','created_at','updated_at'])if(!keys.includes(key)){keys.push(key);values.push(body[key])}
      }
      const sql='INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')'
      await db.prepare(sql).bind(...keys.map(key=>jsonFields.has(key)?JSON.stringify(body[key]):body[key])).run()
      const prefer=init?.headers instanceof Headers?init.headers.get('Prefer'):new Headers(init?.headers).get('Prefer')
      if(prefer?.includes('return=representation')){
        const id=String(body.id||'')
        if(id){const row=await db.prepare('SELECT id FROM '+table+' WHERE id=?').bind(id).first();return response(row?[row]:[],201)}
      }
      return response([],201)
    }
    if(method==='PATCH'){
      if(table!=='catalog_submissions')return response({message:'Updates are not allowed for this table.'},403)
      const auth=await authenticate(incoming,env);if(auth.error||!auth.user)return response({message:'Authentication required.'},401)
      const body=JSON.parse(String(init?.body||'{}')) as Record<string,unknown>,keys=Object.keys(body)
      const updatable=new Set(['title','sku','payload','status','reviewed_by','review_note','submitted_at','reviewed_at','published_at','publish_error','notification_sent_at','notification_error','updated_at'])
      if(!keys.length||keys.some(x=>!updatable.has(x)))return response({message:'Invalid update fields.'},400)
      const where:string[]=[],values:unknown[]=[]
      for(const [key,value] of url.searchParams.entries()){
        if(key==='select'||key==='order'||key==='limit')continue
        if(!allowed.has(key))return response({message:'Invalid filter field.'},400)
        const filter=parseFilter(value);if(!filter)return response({message:'Invalid filter.'},400)
        if(filter.op==='eq'){where.push(key+'=?');values.push(filter.values[0])}
        else{where.push(key+' IN ('+filter.values.map(()=>'?').join(',')+')');values.push(...filter.values)}
      }
      if(auth.user.role==='seller'){where.push('created_by=?');values.push(auth.user.user_id);where.push("status IN ('draft','changes_requested')")}
      if(!where.length)return response({message:'An update filter is required.'},400)
      const sets=keys.map(key=>key+'=?')
      const params=[...keys.map(key=>jsonFields.has(key)?JSON.stringify(body[key]):body[key]),...values]
      const prefer=init?.headers instanceof Headers?init.headers.get('Prefer'):new Headers(init?.headers).get('Prefer')
      const returning=prefer?.includes('return=representation')||url.searchParams.has('select')
      const sql='UPDATE catalog_submissions SET '+sets.join(',')+' WHERE '+where.join(' AND ')+(returning?' RETURNING '+(url.searchParams.get('select')||'id'):'')
      const result=await db.prepare(sql).bind(...params).all<Record<string,unknown>>()
      if(returning)return response(result.results.map(decodeRow))
      return response(null)
    }
    return response({message:'Method not allowed.'},405)
  }catch(error){
    return response({message:error instanceof Error?error.message:'D1 compatibility operation failed.'},500)
  }
}
