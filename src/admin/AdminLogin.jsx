import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

export default function AdminLogin() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [message,setMessage]=useState('')

  async function login(e){
    e.preventDefault()
    if(!supabaseConfigured){setMessage('Supabase ابھی connect نہیں ہوا۔ پہلے .env میں credentials شامل کریں۔');return}
    setMessage('Logging in...')
    const {error}=await supabase.auth.signInWithPassword({email,password})
    setMessage(error ? error.message : 'Login successful')
  }

  return <div className="admin-page" dir="rtl">
    <div className="admin-card">
      <div className="admin-mark">ح</div>
      <span className="section-label">SECURE ADMIN</span>
      <h1>ایڈمن پینل</h1>
      <p>Courses، articles، media اور announcements manage کرنے کے لیے login کریں۔</p>
      <form onSubmit={login}>
        <label>ای میل<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>پاس ورڈ<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        <button className="btn primary" type="submit">Login</button>
      </form>
      {message && <div className="admin-message">{message}</div>}
    </div>
  </div>
}
