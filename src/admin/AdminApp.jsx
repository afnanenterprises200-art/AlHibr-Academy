import { useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'

export default function AdminApp(){
  const [session,setSession]=useState(undefined)
  useEffect(()=>{
    if(!supabase){setSession(null);return}
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next))
    return ()=>subscription.unsubscribe()
  },[])
  if(session===undefined) return <div className="admin-page"><div className="admin-card"><h1>Loading...</h1></div></div>
  return session ? <AdminPanel/> : <AdminLogin/>
}
