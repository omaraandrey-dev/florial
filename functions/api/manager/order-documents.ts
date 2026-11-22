import { checkSameOrigin, json, newId, nowIso, requireUser, type ManagerEnv, type ManagerIdentity } from './_lib'
import { createProformaPdf, sendOrderEmail, toBase64, type ProformaOrder } from '../_lib/order-documents'
import { createIrrigationProjectPdf } from '../_lib/irrigation-project-pdf'

type Row={id:string;order_number:string;customer_name:string;phone:string;email:string|null;city:string|null;address:string|null;delivery_method:string;payment_method:string;items:string;subtotal_cents:number;delivery_fee_cents:number|null;total_cents:number|null;created_at:string;updated_at?:string;status:string;is_test:number}
type RuntimeEnv=ManagerEnv & {PROFORMA_FONT_URL?:string}
type Item={name:string;qty:number;price:number;sku?:string;imageUrl?:string;[key:string]:unknown}
const ev=(db:NonNullable<ManagerEnv['DB']>,r:Row,u:ManagerIdentity,eventType:string,note:string,metadata:Record<string,unknown>={})=>db.prepare('INSERT INTO order_events(id,order_id,order_number,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(newId(),r.id,r.order_number,u.user_id,u.display_name||u.email,u.role,eventType,r.status,r.status,note,JSON.stringify(metadata),nowIso())
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))
const readOrder=async(db:NonNullable<ManagerEnv['DB']>,id:string)=>db.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Row>()
const makePdf=async(r:Row,env:RuntimeEnv,items:Item[],confirmedAt:string|null=null)=>createProformaPdf({order_number:r.order_number,customer_name:r.customer_name,phone:r.phone,email:r.email,city:r.city||'',address:r.address,delivery_method:r.delivery_method,payment_method:r.payment_method,items,subtotal:r.subtotal_cents/100,delivery_fee:r.delivery_fee_cents==null?null:r.delivery_fee_cents/100,total:r.total_cents==null?null:r.total_cents/100,created_at:r.created_at,issued_at:confirmedAt||r.created_at,confirmed_at:confirmedAt} satisfies ProformaOrder,env.PROFORMA_FONT_URL)
const latestConfirmation=async(db:NonNullable<ManagerEnv['DB']>,id:string)=>db.prepare("SELECT event_type,created_at FROM order_events WHERE order_id=? AND event_type IN ('proforma_confirmed','proforma_confirmation_invalidated') ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(id).first<{event_type:string;created_at:string}>()
const isConfirmed=async(db:NonNullable<ManagerEnv['DB']>,id:string)=>{const e=await latestConfirmation(db,id);return e?.event_type==='proforma_confirmed'?e.created_at:null}
const htmlFor=(r:Row,items:Item[])=>'<h2>Актуализирана поръчка '+escapeHtml(r.order_number)+'</h2><p>Здравейте, '+escapeHtml(r.customer_name)+'. Съставът на поръчката Ви е актуализиран след съгласуване с екипа на Florial.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Артикул</th><th>Количество</th><th align="right">Цена</th></tr></thead><tbody>'+items.map(i=>'<tr><td>'+escapeHtml(i.name)+(i.sku?' <small>SKU: '+escapeHtml(i.sku)+'</small>':'')+'</td><td align="center">'+i.qty+'</td><td align="right">'+(i.price*i.qty).toFixed(2)+' EUR</td></tr>').join('')+'</tbody></table><p>Продукти: '+(r.subtotal_cents/100).toFixed(2)+' EUR</p><p>Доставка: '+(r.delivery_fee_cents==null?'Ще бъде уточнена':(r.delivery_fee_cents/100).toFixed(2)+' EUR')+'</p><h3>Общо: '+(r.total_cents==null?'Ще бъде потвърдено':(r.total_cents/100).toFixed(2)+' EUR')+'</h3><p>Благодарим Ви!<br>Екипът на Florial</p>'

export const onRequestGet=async({request,env}:{request:Request;env:RuntimeEnv})=>{
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(auth.user.role!=='owner'&&!auth.user.permissionsObject.canViewOrders&&!auth.user.permissionsObject.canEditOrders&&!auth.user.permissionsObject.canDeleteTestOrders)return json({error:'Нямате право да преглеждате поръчки.'},403)
 const id=new URL(request.url).searchParams.get('id')||''
 if(!id)return json({error:'Липсва номер на поръчката.'},400)
 const db=env.DB!,r=await readOrder(db,id)
 if(!r)return json({error:'Поръчката не е намерена.'},404)
 try{
  const items=JSON.parse(r.items||'[]') as Item[]
  const confirmedAt=await isConfirmed(db,id)
  const pdf=await makePdf(r,env,items,confirmedAt)
  await db.batch([ev(db,r,auth.user,'pdf_downloaded','PDF документът е генериран и изтеглен.',{item_count:items.length,total_cents:r.total_cents})])
  const pdfBody = new Uint8Array(pdf.byteLength)
  pdfBody.set(pdf)
  return new Response(pdfBody.buffer,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Florial-'+r.order_number+'.pdf"','Cache-Control':'no-store'}})
 }catch{return json({error:'Не успяхме да генерираме PDF документа.'},502)}
}

export const onRequestPost=async({request,env}:{request:Request;env:RuntimeEnv})=>{
 if(!checkSameOrigin(request))return json({error:'Origin not allowed.'},403)
 const auth=await requireUser(request,env)
 if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
 if(auth.user.role!=='owner'&&!auth.user.permissionsObject.canEditOrders)return json({error:'Нямате право да изпращате поръчки.'},403)
 let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return json({error:'Невалидна заявка.'},400)}
 const id=typeof body.id==='string'?body.id:'',action=body.action
 if(!id||!['email_proforma','email_customer','email_store','confirm_proforma','approve_irrigation_project'].includes(String(action)))return json({error:'Невалидна операция.'},400)
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return json({error:'Email service is not configured.'},503)
 const db=env.DB!,r=await readOrder(db,id)
 if(!r)return json({error:'Поръчката не е намерена.'},404)
 if(['completed','cancelled','archived'].includes(r.status))return json({error:'Финална поръчка не може да бъде променена.'},409)
 const items=JSON.parse(r.items||'[]') as Item[],html=htmlFor(r,items)
 try{
 if(action==='confirm_proforma'){
  if(auth.user.role!=='owner'&&auth.user.role!=='manager')return json({error:'Само собственик или мениджър може да потвърди наличност и сума.'},403)
  if(r.payment_method!=='bank_transfer')return json({error:'Потвърждение на проформа е налично само за плащане по банков път.'},409)
  if(r.total_cents==null||r.delivery_fee_cents==null)return json({error:'Първо уточнете и запишете окончателната цена за доставка.'},409)
  if(!r.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))return json({error:'Няма валиден email адрес на клиента.'},400)
  const current=await latestConfirmation(db,id)
  if(current?.event_type==='proforma_confirmed')return json({error:'Поръчката вече е потвърдена. При промяна първо редактирайте поръчката.'},409)
  const ownerResult=await db.prepare("SELECT email FROM catalog_staff_profiles WHERE role='owner' AND is_active=1 ORDER BY created_at ASC LIMIT 1").first<{email:string}>()
  const ownerEmail=String(ownerResult?.email||'').trim()
  if(!ownerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail))return json({error:'Не е намерен активен email адрес на собственика на Florial.'},503)
  const confirmedAt=nowIso()
  const pdf=await makePdf(r,env,items,confirmedAt)
  const attachment=[{filename:'Florial-Proforma-'+r.order_number+'.pdf',content:toBase64(pdf),type:'application/pdf'}]
  const ownerBcc=ownerEmail.toLowerCase()===r.email.toLowerCase()?undefined:[ownerEmail]
  const finalHtml='<h2>Поръчката е потвърдена — Florial</h2><p>Здравейте, '+escapeHtml(r.customer_name)+'. Потвърждаваме наличността и окончателната сума по поръчка <strong>'+escapeHtml(r.order_number)+'</strong>.</p><p>Към писмото е приложена окончателната проформа. Моля, извършете плащането в срок до 5 календарни дни след датата на потвърждение.</p><p>Благодарим Ви!<br>Екипът на Florial</p>'
  const idempotency='florial-proforma-confirmed-'+r.id+'-'+String(r.updated_at||r.created_at)+'-'+r.total_cents
  await sendOrderEmail(env.RESEND_API_KEY!,env.EMAIL_FROM!,r.email,'Потвърдена проформа '+r.order_number+' — Florial',finalHtml,attachment,idempotency,ownerBcc)
  await db.batch([db.prepare('INSERT INTO order_events(id,order_id,order_number,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(newId(),r.id,r.order_number,auth.user.user_id,auth.user.display_name||auth.user.email,auth.user.role,'proforma_confirmed',r.status,r.status,'Наличността и окончателната сума са потвърдени; окончателната проформа е изпратена на клиента и собственика.',JSON.stringify({confirmed_at:confirmedAt,total_cents:r.total_cents,delivery_fee_cents:r.delivery_fee_cents,item_count:items.length,recipients:['customer','owner']}),confirmedAt)])
  const pdfBody=new Uint8Array(pdf.byteLength);pdfBody.set(pdf)
  return new Response(pdfBody.buffer,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Florial-Proforma-'+r.order_number+'.pdf"','Cache-Control':'no-store','X-Florial-Proforma-Delivered':'customer-and-owner'}})
 }
  if(action==='approve_irrigation_project'){
   if(auth.user.role!=='owner')return json({error:'Само собственикът може да одобри и изпрати инженерния проект.'},403)
   if(!r.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))return json({error:'Няма валиден email адрес на клиента.'},400)
   const projectEvent=await db.prepare("SELECT metadata FROM order_events WHERE order_id=? AND event_type='irrigation_project_attached' ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(id).first<{metadata:string}>()
   if(!projectEvent?.metadata)return json({error:'Към поръчката няма запазен инженерен проект.'},404)
   let storedProject:Record<string,unknown>|null=null
   try{const parsed=JSON.parse(projectEvent.metadata) as Record<string,unknown>;if(parsed.project&&typeof parsed.project==='object'&&!Array.isArray(parsed.project))storedProject=parsed.project as Record<string,unknown>}catch{}
   if(!storedProject)return json({error:'Запазеният инженерен проект е невалиден.'},409)
   const previousApproval=await db.prepare("SELECT created_at FROM order_events WHERE order_id=? AND event_type='irrigation_project_approved' ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(id).first<{created_at:string}>()
   const confirmation=await latestConfirmation(db,id)
   if(previousApproval||confirmation?.event_type==='proforma_confirmed')return json({error:'Инженерният проект вече е одобрен и изпратен.'},409)
   const ownerResult=await db.prepare("SELECT email FROM catalog_staff_profiles WHERE role='owner' AND is_active=1 ORDER BY created_at ASC LIMIT 1").first<{email:string}>()
   const ownerEmail=String(ownerResult?.email||'').trim()
   if(!ownerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail))return json({error:'Не е намерен активен email адрес на собственика на Florial.'},503)
   const orderPdf=await makePdf(r,env,items)
   const projectPdf=await createIrrigationProjectPdf(storedProject as any,r.order_number,r.created_at,env.PROFORMA_FONT_URL)
   const attachments=[
    {filename:'Florial-Proforma-'+r.order_number+'.pdf',content:toBase64(orderPdf),type:'application/pdf'},
    {filename:'Florial-'+r.order_number+'-irrigation-project.pdf',content:toBase64(projectPdf),type:'application/pdf'},
   ]
   const ownerBcc=ownerEmail.toLowerCase()===r.email.toLowerCase()?undefined:[ownerEmail]
   const approvedAt=nowIso()
   const html='<h2>Одобрен предварителен проект за поливане — Florial</h2><p>Здравейте, '+escapeHtml(r.customer_name)+'. Екипът на Florial прегледа и одобри предварителната схема към поръчка <strong>'+escapeHtml(r.order_number)+'</strong>.</p><p>Към писмото са приложени два PDF документа: документът за поръчката и инженерната схема с въведените параметри на терена, разположението на разпръсквачите, зоните и ведомостта на материалите.</p><p>Схемата е предварителна и не замества хидравличното оразмеряване и проверката на място.</p><p>Благодарим Ви!<br>Екипът на Florial</p>'
   await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,r.email,'Одобрен проект и поръчка '+r.order_number+' — Florial',html,attachments,'florial-irrigation-approved-'+r.id+'-'+String(r.updated_at||r.created_at),ownerBcc)
   await db.batch([ev(db,r,auth.user,'irrigation_project_approved','Собственикът одобри предварителния проект и изпрати двата PDF документа на клиента и собственика.',{approved_at:approvedAt,recipients:['customer','owner'],attachments:['order-proforma','irrigation-project']})])
   return json({ok:true,approved_at:approvedAt})
  }
  if(action==='email_proforma'){
   if(!r.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))return json({error:'Няма валиден email адрес на клиента.'},400)
   const ownerResult=await db.prepare("SELECT email FROM catalog_staff_profiles WHERE role='owner' AND is_active=1 ORDER BY created_at ASC LIMIT 1").first<{email:string}>()
   const ownerEmail=String(ownerResult?.email||'').trim()
   if(!ownerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail))return json({error:'Не е намерен активен email адрес на собственика на Florial.'},503)
   const confirmedAt=await isConfirmed(db,id)
   const pdf=await makePdf(r,env,items,confirmedAt)
   const total=r.total_cents==null?'ще бъде потвърдена след уточняване на доставката':(r.total_cents/100).toFixed(2)+' EUR'
   const proformaHtml='<h2>Сметка проформа от Florial</h2><p>Здравейте, '+escapeHtml(r.customer_name)+'.</p><p>Изпращаме Ви сметка проформа за поръчка <strong>'+escapeHtml(r.order_number)+'</strong>. PDF документът е приложен към това писмо.</p><p>Обща сума: <strong>'+total+'</strong></p><p>Благодарим Ви!<br>Екипът на Florial</p>'
   const attachment=[{filename:'Florial-Proforma-'+r.order_number+'.pdf',content:toBase64(pdf),type:'application/pdf'}]
   const ownerBcc=ownerEmail.toLowerCase()===r.email.toLowerCase()?undefined:[ownerEmail]
   await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,r.email,'Сметка проформа '+r.order_number+' — Florial',proformaHtml,attachment,'florial-proforma-'+r.id+'-'+newId(),ownerBcc)
   await db.batch([ev(db,r,auth.user,'proforma_email_sent','Сметката проформа е изпратена на клиента и на собственика на Florial; PDF е предоставен за изтегляне.',{recipients:['customer','owner'],item_count:items.length,total_cents:r.total_cents})])
   const pdfBody=new Uint8Array(pdf.byteLength);pdfBody.set(pdf)
   return new Response(pdfBody.buffer,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Florial-Proforma-'+r.order_number+'.pdf"','Cache-Control':'no-store','X-Florial-Proforma-Delivered':'customer-and-owner'}})
  }
  if(action==='email_customer'){
   if(!r.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))return json({error:'Няма валиден email адрес на клиента.'},400)
   await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,r.email,'Актуализация на поръчка '+r.order_number+' — Florial',html)
   await db.batch([ev(db,r,auth.user,'order_email_sent','Актуализираният състав е изпратен на клиента по email.',{recipient:'customer',email:r.email,item_count:items.length,total_cents:r.total_cents})])
   return json({ok:true})
  }
  const sellerEmail=(env.ORDER_NOTIFICATION_EMAIL||'').trim()
  if(!sellerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail))return json({error:'Работният email на Florial не е настроен.'},503)
  const confirmedAt=await isConfirmed(db,id)
  const pdf=await makePdf(r,env,items,confirmedAt)
  await sendOrderEmail(env.RESEND_API_KEY,env.EMAIL_FROM,sellerEmail,'PDF на актуализирана поръчка '+r.order_number+' — Florial',html,[{filename:'Florial-'+r.order_number+'.pdf',content:toBase64(pdf),type:'application/pdf'}])
  await db.batch([ev(db,r,auth.user,'order_email_sent','PDF документът е изпратен на работния email на Florial.',{recipient:'store',email:sellerEmail,item_count:items.length,total_cents:r.total_cents})])
  return json({ok:true})
 }catch{return json({error:'Не успяхме да изпратим email. Проверете Resend и опитайте отново.'},502)}
}
