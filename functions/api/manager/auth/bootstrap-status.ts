import { json, type ManagerEnv } from '../_lib'
export const onRequestGet=async({env}:{env:ManagerEnv})=>{
 if(!env.DB)return json({available:false,configured:false},503)
 const owner=await env.DB.prepare("SELECT user_id FROM catalog_staff_profiles WHERE role='owner' LIMIT 1").first()
 return json({available:!owner,configured:!!env.MANAGER_BOOTSTRAP_SECRET})
}
