import { hasPermission, json, requireUser, type ManagerEnv } from './_lib'
export const onRequestGet=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!env.DB)return json({error:'D1 database is not configured.'},503)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(!hasPermission(auth.user,'canViewAnalytics'))return json({error:'Нямате право да преглеждате аналитиката.'},403)
 const daysRaw=Number(new URL(request.url).searchParams.get('days')||30)
 const days=[1,7,30,90].includes(daysRaw)?daysRaw:30
 const start=new Date(Date.now()-days*86400000).toISOString()
 const result=await env.DB.prepare('SELECT created_at,event_type,lang,page_path FROM site_events WHERE created_at>=? ORDER BY created_at ASC').bind(start).all<{created_at:string;event_type:string;lang:string;page_path:string}>()
 const dailyMap=new Map<string,{event_day:string;page_views:number;call_bg:number;call_en_ru:number;chat_click:number}>()
 const eventMap=new Map<string,number>(),languageMap=new Map<string,number>(),pageMap=new Map<string,number>()
 const totals={page_views:0,call_bg:0,call_en_ru:0,chat_click:0,total_events:result.results.length}
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit'})
 for(const row of result.results){
  const eventDay=formatter.format(new Date(row.created_at))
  if(!dailyMap.has(eventDay))dailyMap.set(eventDay,{event_day:eventDay,page_views:0,call_bg:0,call_en_ru:0,chat_click:0})
  const day=dailyMap.get(eventDay)!
  if(row.event_type==='page_view'){day.page_views++;totals.page_views++;pageMap.set(row.page_path,(pageMap.get(row.page_path)||0)+1)}
  if(row.event_type==='call_bg'){day.call_bg++;totals.call_bg++}
  if(row.event_type==='call_en_ru'){day.call_en_ru++;totals.call_en_ru++}
  if(row.event_type==='chat_click'){day.chat_click++;totals.chat_click++}
  eventMap.set(row.event_type,(eventMap.get(row.event_type)||0)+1)
  languageMap.set(row.lang,(languageMap.get(row.lang)||0)+1)
 }
 const daily=[...dailyMap.values()].sort((a,b)=>a.event_day.localeCompare(b.event_day))
 const byEvent=[...eventMap.entries()].map(([event_type,event_count])=>({event_type,event_count})).sort((a,b)=>b.event_count-a.event_count)
 const byLanguage=[...languageMap.entries()].map(([lang,event_count])=>({lang,event_count})).sort((a,b)=>b.event_count-a.event_count)
 const topPages=[...pageMap.entries()].map(([page_path,page_views])=>({page_path,page_views})).sort((a,b)=>b.page_views-a.page_views).slice(0,10)
 return json({period_days:days,totals:{...totals,contact_clicks:totals.call_bg+totals.call_en_ru+totals.chat_click},daily,by_event:byEvent,by_language:byLanguage,top_pages:topPages})
}
