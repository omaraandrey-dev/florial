import { checkSameOrigin, json, newId, nowIso, requireUser, type ManagerEnv, type ManagerIdentity } from './_lib'
import { createProformaPdf, sendOrderEmail, toBase64, type ProformaOrder } from '../_lib/order-documents'

type Row={id:string;order_number:string;customer_name:string;phone:string;email:string|null;city:string|null;address:string|null;delivery_method:string;items:string;subtotal_cents:number;delivery_fee_cents:number|null;total_cents:number|null;created_at:string;status:string;is_test:number}
type Item={name:string;qty:number;price:number;sku?:string;imageUrl?:string;[key:string]:unknown}
const ev=(db:NonNullable<ManagerEnv['DB']>,r:Row,u:ManagerIdentity,eventType:string,note:string,metadata:Record<string,unknown>={})=>db.prepare('INSERT INTO order_events(id,order_id,order_number,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(newId(),r.id,r.order_number,u.user_id,u.display_name||u.email,u.role,eventType,r.status,r.status,note,JSON.stringify(metadata),nowIso())
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))
const readOrder=async(db:NonNullable<ManagerEnv['DB']>,id:string)=>db.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Row>()
const makePdf=async(r:Row,env:ManagerEnv,items:Item[])=>createProformaPdf({order_number:r.order_number,customer_name:r.customer_name,phone:r.phone,email:r.email,city:r.city||'',address:r.address,delivery_method:r.delivery_method,items,subtotal:r.subtotal_cents/100,delivery_fee:r.delivery_fee_cents==null?null:r.delivery_fee_cents/100,total:r.total_cents==null?null:r.total_cents/100,created_at:r.created_at} satisfies ProformaOrder,env.PROFORMA_FONT_URL)
const htmlFor=(r:Row,items:Item[])=>'<h2>Актуализирана поръчка '+escapeHtml(r.order_number)+'</h2><p>Здравейте, '+escapeHtml(r.customer_name)+'. Съставът на поръчката Ви е актуализиран след съгласуване с екипа на Florial.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Артикул</th><th>Количество</th><th align="right">Цена</th></tr></thead><tbody>'+items.map(i=>'<tr><td>'+escapeHtml(i.name)+(i.sku?' <small>SKU: '+escapeHtml(i.sku)+'</small>':'')+'</td><td align="center">'+i.qty+'</td><td align="right">'+(i.price*i.qty).toFixed(2)+' EUR</td></tr>').join('')+'</tbody></table><p>Продукти: '+(r.subtotal_cents/100).toFixed(2)+' EUR</p><p>Доставка: '+(r.delivery_fee_cents==null?'Ще бъде уточнена':(r.delivery_fee_cents/100).toFixed(2)+' EUR')+'</p><h3>Общо: '+(r.total_cents==null?'Ще бъде потвърдено':(r.total_cents/100).toFixed(2)+' EUR')+'</h3><p>Благодарим Ви!<br>Екипът на Florial</p>'

export const onRequestGet=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(auth.user.role!=='owner'&&!auth.user.permissionsObject.canViewOrders)return json({error:'Нямате право да преглеждате поръчки.'},403)
 const id=new URL(request.url).searchParams.get('id')||''
 if(!id)return json({error:'Липсва номер на поръчката.'},400)
 const db=env.DB!,r=await readOrder(db,id)
 if(!r)return json({error:'Поръчката не е намерена.'},404)
 if(['completed','cancelled','archived'].includes(r.status))return json({error:'Финална поръчка не може да бъде променена.'},409)
 try{
  const items=JSON.parse(r.items||'[]') as Item[]
  const pdf=await makePdf(r,env,items)
  await db.batch([ev(db,r,auth.user,'pdf_downloaded','PDF документът е генериран и изтеглен.',{item_count:items.length,total_cents:r.total_cents})])
  return new Response(pdf,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Florial-'+r.order_number+'.pdf"','Cache-Control':'no-store'}})
 }catch{return json({error:'Не успяхме да генерираме PDF документа.'},502)}
}

export const onRequestPost=async({request,env}:{request:Request;env:ManagerEnv})=>{
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(auth.user.role!=='owner'&&!auth.user.permissionsObject.canEditOrders)return json({error:'Нямате право да изпращате поръчки.'},403)
 let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return json({error:'Невалидна заявка.'},400)}
 const id=typeof body.id==='string'?body.id:'',action=body.action
 if(!id||!['email_customer','email_store'].includes(String(action)))return json({error:'Невалидна операция.'},400)
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return json({error:'Email service is not configured.'},503)
 const db=env.DB!,r=await readOrder(db,id)
 if(!r)return json({error:'Поръчката не е намерена.'},404)
 if(['completed','cancelled','archived'].includes(r.status))return json({error:'Финална поръчка не може да бъде променена.'},409)
 const items=JSON.parse(r.items||'[]') as Item[],html=htmlFor(r,items)
 try{
  if(action==='email_customer'){
   if(!r.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))return json({error:'У заказа не указан корректный email клиента.'},400)
   await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,r.email,'Актуализация на поръчка '+r.order_number+' — Florial',html)
   await db.batch([ev(db,r,auth.user,'order_email_sent','Актуализираният състав е изпратен на клиента по email.',{recipient:'customer',email:r.email,item_count:items.length,total_cents:r.total_cents})])
   return json({ok:true})
  }
  const sellerEmail=(env.ORDER_NOTIFICATION_EMAIL||'').trim()
  if(!sellerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail))return json({error:'Работният email на Florial не е настроен.'},503)
  const pdf=await makePdf(r,env,items)
  await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,sellerEmail,'PDF на актуализирана поръчка '+r.order_number+' — Florial',html,[{filename:'Florial-'+r.order_number+'.pdf',content:toBase64(pdf),type:'application/pdf'}])
  await db.batch([ev(db,r,auth.user,'order_email_sent','PDF документът е изпратен на работния email на Florial.',{recipient:'store',email:sellerEmail,item_count:items.length,total_cents:r.total_cents})])
  return json({ok:true})
 }catch{return json({error:'Не успяхме да изпратим email. Проверете Resend и опитайте отново.'},502)}
}
