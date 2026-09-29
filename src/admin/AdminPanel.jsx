import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPanel(){
  const [user,setUser]=useState(null)
  useEffect(()=>{supabase?.auth.getUser().then(({data})=>setUser(data.user))},[])
  if(!supabase) return <div className="admin-page"><div className="admin-card"><h1>Supabase not configured</h1></div></div>
  if(!user) return <div className="admin-page"><div className="admin-card"><h1>Access required</h1><p>Admin login required.</p></div></div>
  return <div className="admin-page" dir="rtl"><div className="admin-dashboard">
    <span className="section-label">AL-HIBR ACADEMY</span>
    <h1>Admin Dashboard</h1>
    <p>{user.email}</p>
    <div className="admin-grid">
      {['Courses','Articles','Media','Announcements','Site Settings'].map(x=><div className="admin-tile" key={x}><strong>{x}</strong><span>Manage</span></div>)}
    </div>
  </div></div>
}
