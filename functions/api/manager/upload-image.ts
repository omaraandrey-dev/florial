import { json, requireUser, type ManagerEnv } from './_lib'
import { requirePlantRole } from './plant-direct-lib'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const hasSignature = (bytes: Uint8Array, mime: string) => {
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)
  if (mime === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP'
  return false
}
export const onRequestPost = async ({request,env}:{request:Request;env:ManagerEnv}) => {
  if(!env.DB||!env.SANITY_API_TOKEN)return json({error:'Image upload service is not configured.'},503)
  const auth=await requireUser(request,env)
  if(auth.response||!auth.user)return auth.response||json({error:'Authentication required.'},401)
  if(!requirePlantRole(auth.user))return json({error:'Нямате право да качвате снимки за каталога.'},403)
  const origin=request.headers.get('Origin')
  if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return json({error:'Origin not allowed.'},403)}catch{return json({error:'Origin not allowed.'},403)}}
  const form=await request.formData()
  const file=form.get('file')
  if(!(file instanceof File))return json({error:'Изберете снимка.'},400)
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=0||file.size>MAX_IMAGE_SIZE)return json({error:'Допустими са само JPEG, PNG и WebP до 10 MB.'},400)
  const bytes=new Uint8Array(await file.arrayBuffer())
  if(!hasSignature(bytes,file.type))return json({error:'Форматът на файла не съответства на съдържанието му.'},400)
  const project=env.SANITY_PROJECT_ID||'bxvcy0qs',dataset=env.SANITY_PLANTS_DATASET||'plants'
  const filename=file.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-100)||'plant-image'
  const upload=await fetch('https://'+project+'.api.sanity.io/v2024-01-01/assets/images/'+encodeURIComponent(dataset)+'?filename='+encodeURIComponent(filename),{
    method:'POST',headers:{Authorization:'Bearer '+env.SANITY_API_TOKEN,'Content-Type':file.type},body:bytes
  })
  if(!upload.ok)return json({error:'Sanity не успя да приеме снимката. Опитайте отново.'},502)
  const result=await upload.json() as {document?:{_id?:string;url?:string}}
  const assetId=result.document?._id||''
  const url=result.document?.url||''
  if(!assetId||!url)return json({error:'Sanity не върна идентификатор на снимката.'},502)
  return json({assetId,url,path:url,name:file.name,size:file.size,type:file.type},201)
}
