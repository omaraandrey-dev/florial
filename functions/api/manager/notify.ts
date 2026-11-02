import { json, nowIso, requireUser, type ManagerEnv } from './_lib'

type Submission = { id:string; title:string; sku:string|null; catalog:string; operation:string; status:string; created_by:string; submitted_at:string|null; notification_sent_at:string|null }
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))
export const onRequestPost=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)return json({error:'Notification service is not configured.'},503)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 const origin=request.headers.get('Origin')
 if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Origin not allowed.'},403)}}
 let body:{submissionId?:unknown}
 try{body=await request.json() as typeof body}catch{return json({error:'Invalid request.'},400)}
 const id=typeof body.submissionId==='string'?body.submissionId:''
 if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Invalid submission.'},400)
 const submission=await env.DB.prepare('SELECT id,title,sku,catalog,operation,status,created_by,submitted_at,notification_sent_at FROM catalog_submissions WHERE id=?').bind(id).first<Submission>()
 if(!submission||(auth.user.role==='seller'&&submission.created_by!==auth.user.user_id))return json({error:'Submission not found.'},404)
 if(submission.status!=='submitted')return json({error:'Submission is not awaiting review.'},409)
 if(submission.notification_sent_at)return json({ok:true,alreadySent:true})
 const recipient=env.CATALOG_REVIEW_EMAIL||env.ORDER_NOTIFICATION_EMAIL
 if(!recipient)return json({error:'Notification recipient is not configured.'},503)
 const title=escapeHtml(submission.title||'Без име'),sku=escapeHtml(submission.sku||'—'),author=escapeHtml(auth.user.email||auth.user.user_id)
 const managerUrl=new URL('/manager',new URL(request.url).origin).toString()
 const html='<div style="font-family:Arial,sans-serif;line-height:1.6;color:#26332c"><h2>Нова заявка за приемане на растение — Florial</h2><p><b>Продукт:</b> '+title+'</p><p><b>Артикул:</b> '+sku+'</p><p><b>Каталог:</b> Растения</p><p><b>Операция:</b> '+(submission.operation==='create'?'Нова карточка':'Предложена промяна')+'</p><p><b>Изпратил:</b> '+author+'</p><p><b>Дата:</b> '+escapeHtml(submission.submitted_at||nowIso())+'</p><p><a href="'+managerUrl+'">Отвори Florial Manager</a></p></div>'
 const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[recipient],subject:'Нова заявка за растение — '+(submission.title||'Florial'),html})})
 if(!sent.ok){await env.DB.prepare('UPDATE catalog_submissions SET notification_error=?,updated_at=? WHERE id=?').bind('Email provider returned '+sent.status,nowIso(),id).run();return json({error:'The request was submitted, but the owner notification could not be sent.'},502)}
 await env.DB.prepare('UPDATE catalog_submissions SET notification_sent_at=?,notification_error=NULL,updated_at=? WHERE id=?').bind(nowIso(),nowIso(),id).run()
 return json({ok:true})
}
