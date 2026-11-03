import { hasPermission, json, newId, nowIso, requireUser, type ManagerEnv } from './_lib'

const tables = new Set(['catalog_staff_profiles','catalog_submissions','catalog_submission_events'])
const columns: Record<string, Set<string>> = {
  catalog_staff_profiles: new Set(['user_id','email','role','display_name','is_active','permissions','created_at','updated_at']),
  catalog_submissions: new Set(['id','catalog','operation','target_document_id','target_revision','title','sku','payload','status','created_by','reviewed_by','review_note','submitted_at','reviewed_at','published_at','publish_error','notification_sent_at','notification_error','created_at','updated_at']),
  catalog_submission_events: new Set(['id','submission_id','actor_id','event_type','from_status','to_status','note','metadata','created_at']),
}
const parseJsonFields = (row: Record<string, unknown>) => {
  for (const key of ['payload','permissions','metadata']) if (typeof row[key] === 'string') { try { row[key] = JSON.parse(row[key] as string) } catch { /* preserve invalid legacy data for inspection */ } }
  return row
}
const allowedUpdate = new Set(['title','sku','payload','status','reviewed_by','review_note','submitted_at','reviewed_at','published_at','publish_error','notification_sent_at','notification_error','updated_at'])
const filtersAllowed = new Set(['id','user_id','catalog','created_by','submission_id','status'])

export const onRequest = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  const user = auth.user
  if (!['GET','POST','PATCH'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405)
  if (request.method !== 'GET') {
    const origin = request.headers.get('Origin')
    if (origin) { try { if (new URL(origin).origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403) } catch { return json({ error: 'Origin not allowed.' }, 403) } }
  }
  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch { return json({ error: 'Invalid request.' }, 400) }
  const table = typeof body.table === 'string' ? body.table : ''
  if (!tables.has(table)) return json({ error: 'Table is not available.' }, 400)
  const db = env.DB
  if (request.method === 'GET' || (request.method === 'POST' && body.action === 'select')) {
    const select = typeof body.select === 'string' ? body.select.split(',').map(x=>x.trim()).filter(Boolean) : []
    if (!select.length || select.some(x=>!columns[table].has(x))) return json({ error: 'Invalid columns.' }, 400)
    const filters = Array.isArray(body.filters) ? body.filters as Array<{column?:string;op?:string;value?:unknown}> : []
    const where: string[] = [], values: unknown[] = []
    for (const filter of filters) {
      if (!filter || typeof filter.column !== 'string' || !filtersAllowed.has(filter.column) || !columns[table].has(filter.column)) return json({ error: 'Invalid filter.' }, 400)
      if (filter.op === 'eq') { where.push(filter.column+'=?'); values.push(filter.value) }
      else if (filter.op === 'in' && Array.isArray(filter.value) && filter.value.length > 0 && filter.value.length <= 20) { where.push(filter.column+' IN ('+filter.value.map(()=>'?').join(',')+')'); values.push(...filter.value) }
      else return json({ error: 'Invalid filter operation.' }, 400)
    }
    if (table === 'catalog_staff_profiles') { where.push('user_id=?'); values.push(user.user_id) }
    if (table === 'catalog_submissions' && (user.role === 'seller' || user.role === 'manager' && !hasPermission(user,'canReviewPlantSubmissions') && !hasPermission(user,'canApprovePlantSubmission') && !hasPermission(user,'canPublishPlant'))) { where.push('created_by=?'); values.push(user.user_id) }
    if (table === 'catalog_submission_events') {
      const submissionFilter = filters.find(x=>x.column==='submission_id'&&x.op==='eq')?.value
      if (typeof submissionFilter !== 'string') return json({ error: 'Submission filter required.' }, 400)
      const parent = await db.prepare('SELECT created_by FROM catalog_submissions WHERE id=?').bind(submissionFilter).first<{created_by:string}>()
      if (!parent || (user.role==='seller' && parent.created_by!==user.user_id)) return json({ error: 'Submission not found.' }, 404)
    }
    const order = body.order && typeof body.order==='object' ? body.order as {column?:string;ascending?:boolean} : null
    let sql='SELECT '+select.join(',')+' FROM '+table+(where.length?' WHERE '+where.join(' AND '):'')
    if (order && typeof order.column==='string' && columns[table].has(order.column)) sql+=' ORDER BY '+order.column+(order.ascending===false?' DESC':' ASC')
    const limit = Number.isInteger(body.limit) ? Math.min(100,Math.max(1,Number(body.limit))) : 100
    sql+=' LIMIT '+limit
    const result=await db.prepare(sql).bind(...values).all<Record<string,unknown>>()
    return json({ data: result.results.map(parseJsonFields), error: null })
  }
  if (request.method==='POST' && body.action === 'insert') {
    if (table!=='catalog_submissions' || !hasPermission(user,'canCreatePlant')) return json({ error: 'Not authorized.' },403)
    const values=body.values && typeof body.values==='object'&&!Array.isArray(body.values)?body.values as Record<string,unknown>:null
    if (!values) return json({ error:'Invalid insert values.'},400)
    const id=newId(), now=nowIso(), payload=values.payload && typeof values.payload==='object'?JSON.stringify(values.payload):'{}'
    const title=typeof values.title==='string'?values.title.slice(0,250):''
    const sku=typeof values.sku==='string'?values.sku.slice(0,100):null
    await db.prepare("INSERT INTO catalog_submissions (id,catalog,operation,title,sku,payload,status,created_by,idempotency_key,created_at,updated_at) VALUES (?,'plants','create',?,?,?,'draft',?,?,?,?)")
      .bind(id,title,sku,payload,user.user_id,newId(),now,now).run()
    return json({ data:[{id}], error:null },201)
  }
  const values=body.values && typeof body.values==='object'&&!Array.isArray(body.values)?body.values as Record<string,unknown>:null
  const filters=Array.isArray(body.filters)?body.filters as Array<{column?:string;op?:string;value?:unknown}>:[]
  if (!values || table!=='catalog_submissions' || !filters.length) return json({error:'Invalid update request.'},400)
  const keys=Object.keys(values)
  const roleUpdate = user.role==='seller' ? new Set(['title','sku','payload','status','submitted_at','updated_at']) : user.role==='manager' ? new Set(['title','sku','payload','status','review_note','reviewed_at','submitted_at','updated_at']) : allowedUpdate
  if (!keys.length || keys.some(key=>!allowedUpdate.has(key)||!roleUpdate.has(key))) return json({error:'Invalid update fields.'},400)
  const idFilter=filters.find(x=>x.column==='id'&&x.op==='eq')
  if (typeof idFilter?.value!=='string') return json({error:'Submission ID required.'},400)
  const existing=await db.prepare('SELECT id,created_by,status,payload FROM catalog_submissions WHERE id=?').bind(idFilter.value).first<{id:string;created_by:string;status:string;payload:string}>()
  if (!existing || ((user.role==='seller'||user.role==='manager'&&!hasPermission(user,'canReviewPlantSubmissions')&&!hasPermission(user,'canApprovePlantSubmission'))&&existing.created_by!==user.user_id)) return json({error:'Submission not found.'},404)
  if ((user.role==='seller'||user.role==='manager'&&existing.created_by===user.user_id&&keys.some(key=>['title','sku','payload','submitted_at'].includes(key))) && !['draft','changes_requested'].includes(existing.status)) return json({error:'This submission can no longer be edited.'},409)
  if (values.status!==undefined) {
    const next=String(values.status)
    const sellerAllowed=['draft','submitted']
    const canReview=hasPermission(user,'canReviewPlantSubmissions')
    const canApprove=hasPermission(user,'canApprovePlantSubmission')
    const managerAllowed=(next==='in_review'||next==='changes_requested'||next==='rejected')&&canReview || next==='approved'&&canApprove
    if (user.role==='seller' ? !sellerAllowed.includes(next) : user.role==='manager' ? !managerAllowed : !['in_review','changes_requested','approved','rejected','publishing','published','publish_failed'].includes(next)) return json({error:'Invalid status transition.'},403)
    if (user.role==='manager' && next==='approved') {
      let payload:Record<string,unknown>={}
      try { payload=JSON.parse(existing.payload) as Record<string,unknown> } catch {}
      if (!payload.publication || typeof payload.publication!=='object') return json({error:'Първо подгответе и запазете финалната карта.'},409)
    }
    if (user.role==='manager' && next==='published') return json({error:'Публикацията трябва да премине през защитения endpoint.'},403)
  }
  const assignments:string[]=[], params:unknown[]=[]
  for(const key of keys){
    let value=values[key]
    if(key==='payload' || key==='permissions') value=JSON.stringify(value)
    if(user.role==='manager' && key==='reviewed_by') value=user.user_id
    assignments.push(key+'=?');params.push(value)
  }
  assignments.push('updated_at=?');params.push(nowIso())
  const where=['id=?'];params.push(idFilter.value)
  for(const filter of filters){
    if(filter.column==='id')continue
    if(typeof filter.column!=='string'||!filtersAllowed.has(filter.column)||!columns[table].has(filter.column))return json({error:'Invalid filter.'},400)
    if(filter.op==='eq'){where.push(filter.column+'=?');params.push(filter.value)}
    else if(filter.op==='in'&&Array.isArray(filter.value)&&filter.value.length>0&&filter.value.length<=20){where.push(filter.column+' IN ('+filter.value.map(()=>'?').join(',')+')');params.push(...filter.value)}
    else return json({error:'Invalid filter.'},400)
  }
  const requestedReturning=typeof body.select==='string'?body.select.split(',').map(x=>x.trim()).filter(Boolean):[]
  // The client QueryBuilder defaults select to '*'. D1 UPDATE must return an explicit allowlisted column.
  const returning=requestedReturning.length===1&&requestedReturning[0]==='*'?['id']:requestedReturning
  if(returning.some(x=>!columns[table].has(x)))return json({error:'Invalid return columns.'},400)
  const result=await db.prepare('UPDATE catalog_submissions SET '+assignments.join(',')+' WHERE '+where.join(' AND ')+(returning.length?' RETURNING '+returning.join(','):' RETURNING id')).bind(...params).all<Record<string,unknown>>()
  if(!result.results.length)return json({error:'Заявката е променена. Обновете екрана и опитайте отново.'},409)
  if(values.status && values.status!==existing.status) {
    await db.prepare('INSERT INTO catalog_submission_events (submission_id,actor_id,event_type,from_status,to_status,note,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(existing.id,user.user_id,'status_changed',existing.status,String(values.status),typeof values.review_note==='string'?values.review_note:null,'{}',nowIso()).run()
  }
  return json({data:result.results.map(parseJsonFields),error:null})
}
