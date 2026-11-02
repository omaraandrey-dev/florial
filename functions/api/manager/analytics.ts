import { json, requireUser, type ManagerEnv } from './_lib'
export const onRequestGet=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB)return json({error:'D1 database is not configured.'},503)
 const auth=await requireUser(request,env,['owner'])
 if(auth.response)return auth.response
 const daysRaw=Number(new URL(request.url).searchParams.get('days')||30)
 const days=[1,7,30,90].includes(daysRaw)?daysRaw:30
 const start=new Date(Date.now()-days*86400000).toISOString()
 const daily=await env.DB.prepare("SELECT substr(datetime(created_at,'+0 hours'),1,10) AS event_day, SUM(event_type='page_view') AS page_views, SUM(event_type='call_bg') AS call_bg, SUM(event_type='call_en_ru') AS call_en_ru, SUM(event_type='chat_click') AS chat_click FROM site_events WHERE created_at>=? GROUP BY event_day ORDER BY event_day").bind(start).all<Record<string,number|string>>()
 const totals=await env.DB.prepare("SELECT SUM(event_type='page_view') AS page_views,SUM(event_type='call_bg') AS call_bg,SUM(event_type='call_en_ru') AS call_en_ru,SUM(event_type='chat_click') AS chat_click,COUNT(*) AS total_events FROM site_events WHERE created_at>=?").bind(start).first<Record<string,number>>()
 const byEvent=await env.DB.prepare('SELECT event_type,COUNT(*) AS event_count FROM site_events WHERE created_at>=? GROUP BY event_type ORDER BY event_count DESC').bind(start).all()
 const byLanguage=await env.DB.prepare('SELECT lang,COUNT(*) AS event_count FROM site_events WHERE created_at>=? GROUP BY lang ORDER BY event_count DESC').bind(start).all()
 const topPages=await env.DB.prepare("SELECT page_path,COUNT(*) AS page_views FROM site_events WHERE event_type='page_view' AND created_at>=? GROUP BY page_path ORDER BY page_views DESC LIMIT 10").bind(start).all()
 const t=totals||{page_views:0,call_bg:0,call_en_ru:0,chat_click:0,total_events:0}
 return json({period_days:days,totals:{...t,contact_clicks:(t.call_bg||0)+(t.call_en_ru||0)+(t.chat_click||0)},daily:daily.results,by_event:byEvent.results,by_language:byLanguage.results,top_pages:topPages.results})
}
