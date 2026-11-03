import { hasPermission, json, nowIso, requireUser, type ManagerEnv } from './_lib'
export const onRequestPost=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB)return json({error:'D1 database is not configured.'},503)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(!hasPermission(auth.user,'canReviewPlantSubmissions'))return json({error:'Нямате право да проверявате заявки.'},403)
 let body:{submission_id?:unknown;request_note?:unknown}
 try{body=await request.json() as typeof body}catch{return json({error:'Invalid request.'},400)}
 const id=typeof body.submission_id==='string'?body.submission_id:'',note=typeof body.request_note==='string'?body.request_note.trim().slice(0,1000):''
 if(!/^[0-9a-f-]{36}$/i.test(id)||note.length<3)return json({error:'Добавьте комментарий для исправлений.'},400)
 const row=await env.DB.prepare("SELECT status FROM catalog_submissions WHERE id=? AND status IN ('submitted','in_review')").bind(id).first<{status:string}>()
 if(!row)return json({error:'Заявката не найдена или уже обработана.'},409)
 const now=nowIso()
 await env.DB.prepare("UPDATE catalog_submissions SET status='changes_requested',review_note=?,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=? AND status IN ('submitted','in_review')").bind(note,auth.user.user_id,now,now,id).run()
 await env.DB.prepare("INSERT INTO catalog_submission_events (submission_id,actor_id,event_type,from_status,to_status,note,metadata,created_at) VALUES (?,?, 'changes_requested',?,'changes_requested',?,'{}',?)").bind(id,auth.user.user_id,row.status,note,now).run()
 return json({ok:true})
}
