import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, FileText, Video, Megaphone, Settings, LogOut, Plus, Pencil, Trash2, Save, X, Upload } from 'lucide-react'

const emptyCourse={title:'',slug:'',short_description:'',description:'',syllabus:'',flyer_url:'',video_url:'',video_platform:'youtube',instructor:'',duration:'',fee:'',published:false,featured:false}
const emptyArticle={title:'',slug:'',excerpt:'',content:'',cover_url:'',author:'',category:'',published:false,published_at:''}
const emptyMedia={title:'',type:'youtube',url:'',thumbnail_url:'',description:'',published:false}
const emptyAnnouncement={title:'',description:'',image_url:'',link_url:'',published:false,sort_order:0}

function slugify(v){return v.toString().trim().toLowerCase().replace(/[^\w\u0600-\u06ff\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-')}

export default function AdminPanel(){
  const [tab,setTab]=useState('courses')
  const [user,setUser]=useState(null)
  const [items,setItems]=useState([])
  const [editing,setEditing]=useState(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const [settings,setSettings]=useState(null)

  useEffect(()=>{supabase?.auth.getUser().then(({data})=>setUser(data.user))},[])
  useEffect(()=>{if(user) load()},[user,tab])

  async function load(){
    setLoading(true); setMessage('')
    if(tab==='settings'){
      const {data,error}=await supabase.from('site_settings').select('*').eq('id',1).maybeSingle()
      if(error) setMessage(error.message); else setSettings(data||{})
      setLoading(false); return
    }
    const {data,error}=await supabase.from(tab).select('*').order('created_at',{ascending:false})
    if(error) setMessage(error.message); else setItems(data||[])
    setLoading(false)
  }

  function startNew(){
    setEditing(tab==='courses'?{...emptyCourse}:tab==='articles'?{...emptyArticle}:tab==='media'?{...emptyMedia}:{...emptyAnnouncement})
    setMessage('')
  }
  function startEdit(item){setEditing({...item})}

  async function saveItem(e){
    e.preventDefault(); setSaving(true); setMessage('')
    const table=tab
    const payload={...editing}
    if(table==='courses' && !payload.slug) payload.slug=slugify(payload.title)
    if(table==='articles' && !payload.slug) payload.slug=slugify(payload.title)
    if(table==='courses') payload.fee=payload.fee===''?null:Number(payload.fee)
    if(table==='announcements') payload.sort_order=Number(payload.sort_order||0)
    if(table==='articles' && payload.published && !payload.published_at) payload.published_at=new Date().toISOString()
    delete payload.id; delete payload.created_at; delete payload.updated_at
    const query=editing.id
      ? supabase.from(table).update(payload).eq('id',editing.id).select().single()
      : supabase.from(table).insert(payload).select().single()
    const {error}=await query
    setSaving(false)
    if(error){setMessage(error.message);return}
    setMessage('محفوظ ہوگیا۔'); setEditing(null); await load()
  }

  async function removeItem(id){
    if(!confirm('کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟')) return
    const {error}=await supabase.from(tab).delete().eq('id',id)
    setMessage(error?error.message:'حذف ہوگیا۔'); if(!error) await load()
  }

  async function saveSettings(e){
    e.preventDefault();setSaving(true);setMessage('')
    const {error}=await supabase.from('site_settings').upsert({...settings,id:1}).eq('id',1)
    setSaving(false);setMessage(error?error.message:'Settings محفوظ ہوگئیں۔')
  }

  async function uploadFile(file,field){
    if(!file) return
    setMessage('فائل upload ہو رہی ہے...')
    const ext=file.name.split('.').pop()
    const path=`${crypto.randomUUID()}.${ext}`
    const {error}=await supabase.storage.from('academy-media').upload(path,file,{upsert:false})
    if(error){setMessage(error.message);return}
    const {data}=supabase.storage.from('academy-media').getPublicUrl(path)
    setEditing(x=>({...x,[field]:data.publicUrl}))
    setMessage('فائل upload ہوگئی۔')
  }

  async function logout(){await supabase.auth.signOut()}

  if(!supabase) return <div className="admin-page"><div className="admin-card"><h1>Supabase not configured</h1></div></div>
  if(!user) return <div className="admin-page"><div className="admin-card"><h1>Access required</h1><p>Admin login required.</p></div></div>

  const nav=[
    ['courses','کورسز',BookOpen],['articles','مقالات',FileText],['media','میڈیا',Video],['announcements','اعلانات',Megaphone],['settings','سائٹ سیٹنگز',Settings]
  ]
  return <div className="admin-shell" dir="rtl">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="admin-mark">ح</span><div><strong>الحبر اکیڈمی</strong><small>ADMIN PANEL</small></div></div>
      <div className="admin-user">{user.email}</div>
      <nav>{nav.map(([key,label,Icon])=><button className={tab===key?'active':''} key={key} onClick={()=>{setTab(key);setEditing(null)}}><Icon/>{label}</button>)}</nav>
      <button className="logout-btn" onClick={logout}><LogOut/> Logout</button>
    </aside>
    <main className="admin-main">
      <div className="admin-top"><div><span className="section-label">AL-HIBR ACADEMY</span><h1>{nav.find(x=>x[0]===tab)?.[1]}</h1></div>{tab!=='settings'&&<button className="btn primary" onClick={startNew}><Plus/> نیا شامل کریں</button>}</div>
      {message&&<div className="admin-message">{message}</div>}
      {tab==='settings'?<SettingsForm settings={settings} setSettings={setSettings} onSave={saveSettings} saving={saving}/>:editing?<Editor tab={tab} value={editing} setValue={setEditing} onSave={saveItem} onCancel={()=>setEditing(null)} saving={saving} uploadFile={uploadFile}/>:loading?<div className="admin-empty">Loading...</div>:<List tab={tab} items={items} onEdit={startEdit} onDelete={removeItem}/>}
    </main>
  </div>
}

function List({tab,items,onEdit,onDelete}){
 return <div className="admin-list">{items.length===0?<div className="admin-empty">ابھی کوئی ریکارڈ موجود نہیں۔</div>:items.map(item=><div className="admin-row" key={item.id}><div><strong>{item.title}</strong><span>{item.published?'Published':'Draft'}{tab==='courses'&&item.featured?' • Featured':''}</span></div><div className="row-actions"><button onClick={()=>onEdit(item)}><Pencil/> Edit</button><button className="danger" onClick={()=>onDelete(item.id)}><Trash2/> Delete</button></div></div>)}</div>
}

function Field({label,children}){return <label className="admin-field"><span>{label}</span>{children}</label>}
function Editor({tab,value,setValue,onSave,onCancel,saving,uploadFile}){
 const set=(k,v)=>setValue(x=>({...x,[k]:v}))
 const common=<>
  <Field label="عنوان"><input value={value.title||''} onChange={e=>set('title',e.target.value)} required/></Field>
  {tab!=='media'&&<Field label="Slug"><input value={value.slug||''} onChange={e=>set('slug',e.target.value)} placeholder="خالی چھوڑیں تو خود بن جائے گا"/></Field>}
 </>
 return <form className="admin-editor" onSubmit={onSave}>
   {common}
   {tab==='courses'&&<><Field label="مختصر تفصیل"><textarea value={value.short_description||''} onChange={e=>set('short_description',e.target.value)}/></Field><Field label="مکمل تفصیل"><textarea rows="6" value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Field label="نصاب"><textarea rows="6" value={value.syllabus||''} onChange={e=>set('syllabus',e.target.value)}/></Field><Field label="Instructor"><input value={value.instructor||''} onChange={e=>set('instructor',e.target.value)}/></Field><Field label="Duration"><input value={value.duration||''} onChange={e=>set('duration',e.target.value)}/></Field><Field label="Fee"><input type="number" value={value.fee??''} onChange={e=>set('fee',e.target.value)}/></Field><Field label="Video URL"><input value={value.video_url||''} onChange={e=>set('video_url',e.target.value)} placeholder="YouTube یا دیگر video link"/></Field><Field label="Flyer URL"><input value={value.flyer_url||''} onChange={e=>set('flyer_url',e.target.value)}/><label className="upload-btn"><Upload/> Flyer upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'flyer_url')}/></label></Field><Checks value={value} set={set} featured/></>}
   {tab==='articles'&&<><Field label="مختصر خلاصہ"><textarea value={value.excerpt||''} onChange={e=>set('excerpt',e.target.value)}/></Field><Field label="مضمون"><textarea rows="14" value={value.content||''} onChange={e=>set('content',e.target.value)} required/></Field><Field label="مصنف"><input value={value.author||''} onChange={e=>set('author',e.target.value)}/></Field><Field label="Category"><input value={value.category||''} onChange={e=>set('category',e.target.value)}/></Field><Field label="Cover URL"><input value={value.cover_url||''} onChange={e=>set('cover_url',e.target.value)}/><label className="upload-btn"><Upload/> Cover upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'cover_url')}/></label></Field><Checks value={value} set={set}/></>}
   {tab==='media'&&<><Field label="Type"><select value={value.type||'youtube'} onChange={e=>set('type',e.target.value)}><option value="youtube">YouTube</option><option value="video">Video</option><option value="lecture">Lecture</option></select></Field><Field label="Video URL"><input value={value.url||''} onChange={e=>set('url',e.target.value)} required/></Field><Field label="Thumbnail URL"><input value={value.thumbnail_url||''} onChange={e=>set('thumbnail_url',e.target.value)}/></Field><Field label="تفصیل"><textarea value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Checks value={value} set={set}/></>}
   {tab==='announcements'&&<><Field label="تفصیل"><textarea value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Field label="Image URL"><input value={value.image_url||''} onChange={e=>set('image_url',e.target.value)}/><label className="upload-btn"><Upload/> Image upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'image_url')}/></label></Field><Field label="Link URL"><input value={value.link_url||''} onChange={e=>set('link_url',e.target.value)}/></Field><Field label="Sort order"><input type="number" value={value.sort_order||0} onChange={e=>set('sort_order',e.target.value)}/></Field><Checks value={value} set={set}/></>}
   <div className="editor-actions"><button className="btn primary" disabled={saving}><Save/>{saving?'Saving...':'محفوظ کریں'}</button><button type="button" className="btn secondary" onClick={onCancel}><X/> Cancel</button></div>
 </form>
}
function Checks({value,set,featured=false}){return <div className="check-row"><label><input type="checkbox" checked={!!value.published} onChange={e=>set('published',e.target.checked)}/> Published</label>{featured&&<label><input type="checkbox" checked={!!value.featured} onChange={e=>set('featured',e.target.checked)}/> Featured</label>}</div>}
function SettingsForm({settings,setSettings,onSave,saving}){const s=settings||{};const set=(k,v)=>setSettings(x=>({...x,[k]:v}));return <form className="admin-editor" onSubmit={onSave}><Field label="Academy Name"><input value={s.academy_name||''} onChange={e=>set('academy_name',e.target.value)}/></Field><Field label="Urdu Name"><input value={s.academy_name_urdu||''} onChange={e=>set('academy_name_urdu',e.target.value)}/></Field><Field label="Methodology"><textarea rows="6" value={s.methodology||''} onChange={e=>set('methodology',e.target.value)}/></Field><Field label="YouTube URL"><input value={s.youtube_url||''} onChange={e=>set('youtube_url',e.target.value)}/></Field><Field label="WhatsApp URL"><input value={s.whatsapp_url||''} onChange={e=>set('whatsapp_url',e.target.value)}/></Field><Field label="Contact Email"><input type="email" value={s.contact_email||''} onChange={e=>set('contact_email',e.target.value)}/></Field><button className="btn primary" disabled={saving}><Save/> محفوظ کریں</button></form>}
