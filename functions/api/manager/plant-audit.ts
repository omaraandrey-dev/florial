import { json, requireUser, type ManagerEnv } from './_lib'

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return null }
}
const clean = (value: string | null, max: number) => (value || '').trim().slice(0,max)

export const onRequestGet = async ({request,env}:{request:Request;env:ManagerEnv}) => {
  if(!env.DB)return json({error:'D1 database is not configured.'},503)
  const auth=await requireUser(request,env)
  if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
  if(auth.user.role!=='owner')return json({error:'Историята е достъпна само за собственика.'},403)

  const url=new URL(request.url)
  const productId=clean(url.searchParams.get('productId'),128)
  const actorId=clean(url.searchParams.get('actorId'),64)
  const action=clean(url.searchParams.get('action'),32)
  const from=clean(url.searchParams.get('from'),40)
  const to=clean(url.searchParams.get('to'),40)
  const rawLimit=Number(url.searchParams.get('limit')||30)
  const limit=Number.isInteger(rawLimit)?Math.min(100,Math.max(1,rawLimit)):30
  const rawOffset=Number(url.searchParams.get('offset')||0)
  const offset=Number.isInteger(rawOffset)?Math.min(100000,Math.max(0,rawOffset)):0
  const where:string[]=[]
  const values:unknown[]=[]
  if(productId){where.push('a.product_id=?');values.push(productId)}
  if(actorId){where.push('a.actor_id=?');values.push(actorId)}
  if(action){where.push('a.action=?');values.push(action)}
  if(from){where.push('a.created_at>=?');values.push(from)}
  if(to){where.push('a.created_at<=?');values.push(to)}
  try{
    const rows=await env.DB.prepare(`
      WITH ranked AS (
        SELECT a.*,
          ROW_NUMBER() OVER (
            PARTITION BY a.idempotency_key
            ORDER BY CASE WHEN a.phase='result' THEN 0 ELSE 1 END, a.created_at DESC
          ) AS row_number
        FROM manager_product_audit a
        ${where.length?'WHERE '+where.join(' AND '):''}
      )
      SELECT a.id,a.request_id,a.idempotency_key,a.phase,a.actor_id,a.actor_role,
        p.display_name AS actor_name,a.product_id,a.product_name,a.action,a.changed_fields,
        a.before_data,a.after_data,a.result,a.error_code,a.created_at
      FROM ranked a
      LEFT JOIN catalog_staff_profiles p ON p.user_id=a.actor_id
      WHERE a.row_number=1
      ORDER BY a.created_at DESC,a.id DESC LIMIT ? OFFSET ?
    `).bind(...values,limit+1,offset).all<Record<string,unknown>>()
    const hasMore=rows.results.length>limit
    const items=rows.results.slice(0,limit).map(row=>({
      ...row,
      changed_fields:parseJson(row.changed_fields),
      before_data:parseJson(row.before_data),
      after_data:parseJson(row.after_data),
    }))
    return json({items,nextOffset:hasMore?offset+limit:null})
  }catch{
    return json({error:'Не успяхме да заредим историята на промените.'},503)
  }
}
