import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

type Env = { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; PROFORMA_FONT_URL?: string }
type SavedOrder = { order_number: string; customer_name: string; phone: string; email: string | null; city: string; address: string | null; items: Array<{sku?:string;name?:string;qty:number;price:number}>; subtotal:number; created_at:string }

export async function onRequestGet({ env, params }: { env: Env; params: { orderNumber?: string } }) {
  const fail = (message: string, status: number) => new Response(JSON.stringify({error:message}), {status,headers:{'Content-Type':'application/json; charset=utf-8'}})
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return fail('Сървърът не е конфигуриран.',503)
  const number = params.orderNumber || ''
  if (!/^FL-\d{8}-[A-F0-9]{6}$/i.test(number)) return fail('Невалиден номер на поръчка.',400)
  try {
    const url = new URL(env.SUPABASE_URL.replace(/\/$/,'') + '/rest/v1/orders')
    url.searchParams.set('select','order_number,customer_name,phone,email,city,address,items,subtotal,created_at')
    url.searchParams.set('order_number','eq.'+number)
    url.searchParams.set('limit','1')
    const headers: Record<string,string> = { apikey: env.SUPABASE_SERVICE_ROLE_KEY }
    if (!env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) headers.Authorization = 'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY
    const response = await fetch(url.toString(),{headers})
    if (!response.ok) return fail('Не успяхме да заредим поръчката.',502)
    const rows = await response.json() as SavedOrder[]
    const order = rows[0]
    if (!order) return fail('Поръчката не е намерена.',404)

    const fontUrl = env.PROFORMA_FONT_URL || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'
    const fontResponse = await fetch(fontUrl)
    if (!fontResponse.ok) return fail('Шрифтът за PDF документа не е достъпен.',502)
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const font = await pdf.embedFont(await fontResponse.arrayBuffer(),{subset:true})
    const page = pdf.addPage([595,842])
    const left = 44
    let y = 785
    const draw = (text:string,size=10,color=rgb(0.15,0.2,0.2)) => { page.drawText(text,{x:left,y,size,font,color}); y -= size+9 }
    draw('FLORIAL OOD',22,rgb(0.02,0.39,0.29))
    draw('ПРОФОРМА / ПОТВЪРЖДЕНИЕ НА ПОРЪЧКА',12)
    draw('Номер: '+order.order_number)
    draw('Дата: '+new Date(order.created_at).toLocaleDateString('bg-BG'))
    y -= 8
    draw('КЛИЕНТ',12,rgb(0.02,0.39,0.29))
    draw('Име: '+order.customer_name)
    draw('Телефон: '+order.phone)
    if(order.email) draw('Имейл: '+order.email)
    draw('Населено място: '+order.city)
    if(order.address) draw('Адрес: '+order.address)
    y -= 8
    draw('АРТИКУЛИ',12,rgb(0.02,0.39,0.29))
    for(const item of order.items || []) {
      const line = (item.name || 'Продукт')+(item.sku?' ('+item.sku+')':'')+' — '+item.qty+' x '+Number(item.price).toFixed(2)+' EUR = '+(Number(item.price)*Number(item.qty)).toFixed(2)+' EUR'
      if(y < 85) break
      draw(line,9)
    }
    y -= 8
    draw('ОБЩО ЗА ПРОДУКТИТЕ: '+Number(order.subtotal).toFixed(2)+' EUR',13,rgb(0.02,0.39,0.29))
    draw('Това е проформа / потвърждение на поръчка, а не данъчна фактура.',8)
    draw('Разходите за доставка се потвърждават отделно, ако не са включени.',8)
    return new Response(await pdf.save(),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Florial-'+order.order_number+'.pdf"','Cache-Control':'no-store'}})
  } catch(error) {
    console.error('PDF proforma error',error)
    return fail('Не успяхме да генерираме PDF документа.',502)
  }
}
