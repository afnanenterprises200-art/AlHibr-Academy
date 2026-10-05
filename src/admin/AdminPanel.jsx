import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, FileText, Video, Megaphone, Settings, LogOut, Plus, Pencil, Trash2, Save, X, Upload, BarChart3 } from 'lucide-react'

const emptyCourse={title:'',slug:'',short_description:'',description:'',syllabus:'',flyer_url:'',video_url:'',video_platform:'youtube',google_form_url:'',instructor:'',duration:'',fee:'',published:false,featured:false}
const emptyArticle={title:'',slug:'',excerpt:'',content:'',cover_url:'',author:'',category:'',topic_id:null,published:false,published_at:''}
const emptyMedia={title:'',type:'youtube',url:'',thumbnail_url:'',description:'',playlist_id:null,published:false}
const emptyAnnouncement={title:'',description:'',image_url:'',link_url:'',published:false,sort_order:0}
const emptyQuranClass={title:'',short_description:'',description:'',instructor:'',timing:'',age_group:'',class_type:'One-to-One',fee:'',registration_url:'',published:false,featured:false,sort_order:0}

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
  const [playlists,setPlaylists]=useState([])
  const [articleTopics,setArticleTopics]=useState([])
  const [analytics,setAnalytics]=useState([])
  const [analyticsRange,setAnalyticsRange]=useState('30d')
  const [analyticsFrom,setAnalyticsFrom]=useState('')
  const [analyticsTo,setAnalyticsTo]=useState('')

  useEffect(()=>{supabase?.auth.getUser().then(({data})=>setUser(data.user))},[])
  useEffect(()=>{if(user) load()},[user,tab,analyticsRange,analyticsFrom,analyticsTo])

  async function load(){
    setLoading(true); setMessage('')
    if(tab==='analytics'){
      const {from,to}=getAnalyticsRange(analyticsRange,analyticsFrom,analyticsTo)
      let query=supabase.from('analytics_events').select('*').gte('created_at',from).lt('created_at',to).order('created_at',{ascending:false}).limit(50000)
      const {data,error}=await query
      if(error) setMessage(error.message); else setAnalytics(data||[])
      setLoading(false); return
    }
    if(tab==='articles'){
      const [{data,error},{data:ts,error:te}]=await Promise.all([
        supabase.from('articles').select('*').order('created_at',{ascending:false}),
        supabase.from('article_topics').select('*').order('created_at',{ascending:false})
      ])
      if(error||te) setMessage((error||te).message); else {setItems(data||[]);setArticleTopics(ts||[])}
      setLoading(false); return
    }
    if(tab==='topics'){
      const {data,error}=await supabase.from('article_topics').select('*').order('created_at',{ascending:false})
      if(error) setMessage(error.message); else setItems(data||[])
      setLoading(false); return
    }
    if(tab==='media'){
      const [{data,error},{data:ps,error:pe}]=await Promise.all([supabase.from('media').select('*').order('created_at',{ascending:false}),supabase.from('media_playlists').select('*').order('created_at',{ascending:false})])
      if(error||pe) setMessage((error||pe).message); else {setItems(data||[]);setPlaylists(ps||[])}
      setLoading(false); return
    }
    if(tab==='playlists'){
      const {data,error}=await supabase.from('media_playlists').select('*').order('created_at',{ascending:false})
      if(error) setMessage(error.message); else setItems(data||[])
      setLoading(false); return
    }
    const {data,error}=await supabase.from(tab).select('*').order('created_at',{ascending:false})
    if(error) setMessage(error.message); else setItems(data||[])
    setLoading(false)
  }

  function startNew(){
    setEditing(tab==='courses'?{...emptyCourse}:tab==='articles'?{...emptyArticle}:tab==='topics'?{title:'',cover_url:'',published:true}:tab==='media'?{...emptyMedia}:tab==='playlists'?{title:'',cover_url:'',published:true}:tab==='announcements'?{...emptyAnnouncement}:{...emptyQuranClass})
    setMessage('')
  }
  function startEdit(item){setEditing({...item})}

  async function saveItem(e){
    e.preventDefault(); setSaving(true); setMessage('')
    const table=tab==='playlists'?'media_playlists':tab==='topics'?'article_topics':tab
    const payload={...editing}
    if(table==='courses' && !payload.slug) payload.slug=slugify(payload.title)
    if(table==='articles' && !payload.slug) payload.slug=slugify(payload.title)
    if(table==='articles') payload.topic_id = payload.topic_id ? Number(payload.topic_id) : null
    if(table==='media') { payload.playlist_id = payload.playlist_id ? Number(payload.playlist_id) : null; delete payload.playlist_title; delete payload.playlist_cover_url; delete payload.is_playlist }
    if(table==='media_playlists') { payload.published = !!payload.published }
    if(table==='courses') payload.fee=payload.fee===''?null:Number(payload.fee)
    if(table==='announcements'||table==='quran_classes') payload.sort_order=Number(payload.sort_order||0)
    if(table==='quran_classes') payload.fee=payload.fee===''?null:Number(payload.fee)
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
    const table=tab==='playlists'?'media_playlists':tab==='topics'?'article_topics':tab
    const {error}=await supabase.from(table).delete().eq('id',id)
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
    ['analytics','Analytics',BarChart3],['courses','کورسز',BookOpen],['articles','مقالات',FileText],['topics','عناوین',FileText],['media','میڈیا',Video],['playlists','پلے لسٹس',Video],['quran_classes','Quran Classes',BookOpen],['announcements','اعلانات',Megaphone],['settings','سائٹ سیٹنگز',Settings]
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
      {tab==='settings'?<SettingsForm settings={settings} setSettings={setSettings} onSave={saveSettings} saving={saving}/>:tab==='analytics'?<AnalyticsDashboard events={analytics} range={analyticsRange} setRange={setAnalyticsRange} from={analyticsFrom} to={analyticsTo} setFrom={setAnalyticsFrom} setTo={setAnalyticsTo}/>:editing?<Editor tab={tab} value={editing} setValue={setEditing} onSave={saveItem} onCancel={()=>setEditing(null)} saving={saving} uploadFile={uploadFile} playlists={playlists} articleTopics={articleTopics}/>:loading?<div className="admin-empty">Loading...</div>:<List tab={tab} items={items} onEdit={startEdit} onDelete={removeItem}/>}
    </main>
  </div>
}

function List({tab,items,onEdit,onDelete}){
 return <div className="admin-list">{items.length===0?<div className="admin-empty">ابھی کوئی ریکارڈ موجود نہیں۔</div>:items.map(item=><div className="admin-row" key={item.id}><div><strong>{item.title}</strong><span>{item.published?'Published':'Draft'}{tab==='courses'&&item.featured?' • Featured':''}</span></div><div className="row-actions"><button onClick={()=>onEdit(item)}><Pencil/> Edit</button><button className="danger" onClick={()=>onDelete(item.id)}><Trash2/> Delete</button></div></div>)}</div>
}

function Field({label,children}){return <label className="admin-field"><span>{label}</span>{children}</label>}
function Editor({tab,value,setValue,onSave,onCancel,saving,uploadFile,playlists=[],articleTopics=[]}){
 const set=(k,v)=>setValue(x=>({...x,[k]:v}))
 const common=<>
  <Field label="عنوان"><input value={value.title||''} onChange={e=>set('title',e.target.value)} required/></Field>
  {tab!=='media'&&<Field label="Slug"><input value={value.slug||''} onChange={e=>set('slug',e.target.value)} placeholder="خالی چھوڑیں تو خود بن جائے گا"/></Field>}
 </>
 return <form className="admin-editor" onSubmit={onSave}>
   {common}
   {tab==='courses'&&<><Field label="مختصر تفصیل"><textarea value={value.short_description||''} onChange={e=>set('short_description',e.target.value)}/></Field><Field label="مکمل تفصیل"><textarea rows="6" value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Field label="نصاب"><textarea rows="6" value={value.syllabus||''} onChange={e=>set('syllabus',e.target.value)}/></Field><Field label="Instructor"><input value={value.instructor||''} onChange={e=>set('instructor',e.target.value)}/></Field><Field label="Duration"><input value={value.duration||''} onChange={e=>set('duration',e.target.value)}/></Field><Field label="Fee"><input type="number" value={value.fee??''} onChange={e=>set('fee',e.target.value)}/></Field><Field label="Video URL"><input value={value.video_url||''} onChange={e=>set('video_url',e.target.value)} placeholder="YouTube یا دیگر video link"/></Field><Field label="Google Form Link"><input value={value.google_form_url||''} onChange={e=>set('google_form_url',e.target.value)} placeholder="https://forms.google.com/..."/></Field><Field label="Flyer URL"><input value={value.flyer_url||''} onChange={e=>set('flyer_url',e.target.value)}/><label className="upload-btn"><Upload/> Flyer upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'flyer_url')}/></label></Field><Checks value={value} set={set} featured/></>}
   {tab==='articles'&&<><Field label="مختصر خلاصہ"><textarea value={value.excerpt||''} onChange={e=>set('excerpt',e.target.value)}/></Field><Field label="مضمون"><textarea rows="14" value={value.content||''} onChange={e=>set('content',e.target.value)} required/></Field><Field label="مصنف"><input value={value.author||''} onChange={e=>set('author',e.target.value)}/></Field><Field label="Category"><input value={value.category||''} onChange={e=>set('category',e.target.value)}/></Field><Field label="عنوان"><select value={value.topic_id||''} onChange={e=>set('topic_id',e.target.value||null)}><option value="">No Topic</option>{articleTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></Field><Field label="Cover URL"><input value={value.cover_url||''} onChange={e=>set('cover_url',e.target.value)}/><label className="upload-btn"><Upload/> Cover upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'cover_url')}/></label></Field><Checks value={value} set={set}/></>}
   {tab==='topics'&&<><Field label="Topic Title"><input value={value.title||''} onChange={e=>set('title',e.target.value)} required/></Field><Field label="Topic Cover Photo"><input value={value.cover_url||''} onChange={e=>set('cover_url',e.target.value)}/><label className="upload-btn"><Upload/> Cover Photo Upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'cover_url')}/></label></Field><Checks value={value} set={set}/></>}
   {tab==='playlists'&&<><Field label="Playlist Title"><input value={value.title||''} onChange={e=>set('title',e.target.value)} required/></Field><Field label="Playlist Cover Photo"><input value={value.cover_url||''} onChange={e=>set('cover_url',e.target.value)}/><label className="upload-btn"><Upload/> Cover Photo Upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'cover_url')}/></label></Field><Checks value={value} set={set}/></>}
   {tab==='media'&&<><Field label="Type"><select value={value.type||'youtube'} onChange={e=>set('type',e.target.value)}><option value="youtube">YouTube</option><option value="video">Video</option><option value="lecture">Lecture</option></select></Field><Field label="Playlist"><select value={value.playlist_id||''} onChange={e=>set('playlist_id',e.target.value||null)}><option value="">No Playlist</option>{playlists.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="Video URL"><input value={value.url||''} onChange={e=>set('url',e.target.value)} required/></Field><Field label="Cover Photo"><input value={value.thumbnail_url||''} onChange={e=>set('thumbnail_url',e.target.value)} /><label className="upload-btn"><Upload/> Cover Photo Upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'thumbnail_url')}/></label></Field><Field label="Short Description"><textarea rows="4" value={value.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brief description for the video card..."/></Field><Checks value={value} set={set}/></>}
   {tab==='announcements'&&<><Field label="تفصیل"><textarea value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Field label="Image URL"><input value={value.image_url||''} onChange={e=>set('image_url',e.target.value)}/><label className="upload-btn"><Upload/> Image upload<input type="file" accept="image/*" onChange={e=>uploadFile(e.target.files[0],'image_url')}/></label></Field><Field label="Link URL"><input value={value.link_url||''} onChange={e=>set('link_url',e.target.value)}/></Field><Field label="Sort order"><input type="number" value={value.sort_order||0} onChange={e=>set('sort_order',e.target.value)}/></Field><Checks value={value} set={set}/></>}\n   {tab==='quran_classes'&&<><Field label="Class Title"><input value={value.title||''} onChange={e=>set('title',e.target.value)} required/></Field><Field label="Short Description"><textarea rows="3" value={value.short_description||''} onChange={e=>set('short_description',e.target.value)}/></Field><Field label="Full Description"><textarea rows="6" value={value.description||''} onChange={e=>set('description',e.target.value)}/></Field><Field label="Instructor / Teacher"><input value={value.instructor||''} onChange={e=>set('instructor',e.target.value)}/></Field><Field label="Timing"><input value={value.timing||''} onChange={e=>set('timing',e.target.value)} placeholder="e.g. Flexible / Mon-Fri"/></Field><Field label="Age Group"><input value={value.age_group||''} onChange={e=>set('age_group',e.target.value)} placeholder="e.g. Children & Adults"/></Field><Field label="Class Type"><select value={value.class_type||'One-to-One'} onChange={e=>set('class_type',e.target.value)}><option>One-to-One</option><option>Small Group</option><option>Both</option></select></Field><Field label="Fee"><input type="number" value={value.fee??''} onChange={e=>set('fee',e.target.value)}/></Field><Field label="Registration / Form Link"><input value={value.registration_url||''} onChange={e=>set('registration_url',e.target.value)} placeholder="Google Form or registration page"/></Field><Field label="Sort order"><input type="number" value={value.sort_order||0} onChange={e=>set('sort_order',e.target.value)}/></Field><Checks value={value} set={set} featured/></>}
   <div className="editor-actions"><button className="btn primary" disabled={saving}><Save/>{saving?'Saving...':'محفوظ کریں'}</button><button type="button" className="btn secondary" onClick={onCancel}><X/> Cancel</button></div>
 </form>
}
function Checks({value,set,featured=false}){return <div className="check-row"><label><input type="checkbox" checked={!!value.published} onChange={e=>set('published',e.target.checked)}/> Published</label>{featured&&<label><input type="checkbox" checked={!!value.featured} onChange={e=>set('featured',e.target.checked)}/> Featured</label>}</div>}
function SettingsForm({settings,setSettings,onSave,saving}){const s=settings||{};const set=(k,v)=>setSettings(x=>({...x,[k]:v}));return <form className="admin-editor" onSubmit={onSave}><Field label="Academy Name"><input value={s.academy_name||''} onChange={e=>set('academy_name',e.target.value)}/></Field><Field label="Urdu Name"><input value={s.academy_name_urdu||''} onChange={e=>set('academy_name_urdu',e.target.value)}/></Field><Field label="Methodology"><textarea rows="6" value={s.methodology||''} onChange={e=>set('methodology',e.target.value)}/></Field><Field label="YouTube URL"><input value={s.youtube_url||''} onChange={e=>set('youtube_url',e.target.value)}/></Field><Field label="WhatsApp URL"><input value={s.whatsapp_url||''} onChange={e=>set('whatsapp_url',e.target.value)} placeholder="https://wa.me/923..." /></Field><Field label="Facebook URL"><input value={s.facebook_url||''} onChange={e=>set('facebook_url',e.target.value)} placeholder="https://facebook.com/..." /></Field><Field label="Instagram URL"><input value={s.instagram_url||''} onChange={e=>set('instagram_url',e.target.value)} placeholder="https://instagram.com/..." /></Field><Field label="TikTok URL"><input value={s.tiktok_url||''} onChange={e=>set('tiktok_url',e.target.value)} placeholder="https://tiktok.com/@..." /></Field><Field label="Contact Email"><input type="email" value={s.contact_email||''} onChange={e=>set('contact_email',e.target.value)}/></Field><button className="btn primary" disabled={saving}><Save/> محفوظ کریں</button></form>}


function getAnalyticsRange(range,customFrom,customTo){
 const now=new Date()
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate())
 let from=start,to=new Date(start.getTime()+86400000)
 if(range==='yesterday'){from=new Date(start.getTime()-86400000)}
 if(range==='7d'){from=new Date(start.getTime()-6*86400000)}
 if(range==='30d'){from=new Date(start.getTime()-29*86400000)}
 if(range==='90d'){from=new Date(start.getTime()-89*86400000)}
 if(range==='lastWeek'){
   const day=start.getDay()||7
   from=new Date(start.getTime()-(day+6)*86400000)
   to=new Date(from.getTime()+7*86400000)
 }
 if(range==='lastMonth'){
   from=new Date(start.getFullYear(),start.getMonth()-1,1)
   to=new Date(start.getFullYear(),start.getMonth(),1)
 }
 if(range==='custom'&&customFrom){
   from=new Date(customFrom+'T00:00:00')
   to=customTo?new Date(new Date(customTo+'T00:00:00').getTime()+86400000):new Date(from.getTime()+86400000)
 }
 return {from:from.toISOString(),to:to.toISOString()}
}

function AnalyticsDashboard({events=[],range,setRange,from,to,setFrom,setTo}){
 const rangeLabel={today:'Today',yesterday:'Yesterday','7d':'Last 7 Days','30d':'Last 30 Days','90d':'Last 90 Days',lastWeek:'Last Week',lastMonth:'Last Month',custom:'Custom Date'}[range]||'Last 30 Days'
 const visitors=new Set(events.map(e=>e.visitor_id).filter(Boolean)).size
 const views=events.filter(e=>e.event_type==='page_view').length
 const count=(type)=>events.filter(e=>e.event_type===type).length
 const top=(type)=>Object.entries(events.filter(e=>e.event_type===type).reduce((m,e)=>(m[e.content_title||'Untitled']=(m[e.content_title||'Untitled']||0)+1,m),{})).sort((a,b)=>b[1]-a[1]).slice(0,5)
 const daily={}
 events.forEach(e=>{
   const d=new Date(e.created_at).toLocaleDateString('en-CA')
   if(!daily[d]) daily[d]={date:d,visitors:new Set(),views:0,articles:0,videos:0,courses:0,topics:0}
   daily[d].visitors.add(e.visitor_id)
   if(e.event_type==='page_view')daily[d].views++
   if(e.event_type==='article_view')daily[d].articles++
   if(e.event_type==='video_view')daily[d].videos++
   if(e.event_type==='course_view')daily[d].courses++
   if(e.event_type==='topic_open')daily[d].topics++
 })
 const dailyRows=Object.values(daily).sort((a,b)=>b.date.localeCompare(a.date))
 return <div className="analytics-dashboard" dir="rtl">
  <div className="analytics-range-bar">
   <div className="analytics-range-buttons">
    {[
      ['today','Today'],['yesterday','Yesterday'],['7d','Last 7 Days'],['30d','Last 30 Days'],['90d','Last 90 Days'],['lastWeek','Last Week'],['lastMonth','Last Month'],['custom','Custom Date']
    ].map(([key,label])=><button key={key} className={range===key?'active':''} onClick={()=>setRange(key)}>{label}</button>)}
   </div>
   {range==='custom'&&<div className="analytics-date-inputs"><label>From <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To <input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div>}
   <strong className="analytics-range-title">{rangeLabel}</strong>
  </div>
  <div className="analytics-cards">
   <div><strong>{visitors}</strong><span>Unique Visitors</span></div>
   <div><strong>{views}</strong><span>Page Views</span></div>
   <div><strong>{count('article_view')}</strong><span>Article Views</span></div>
   <div><strong>{count('video_view')}</strong><span>Video Views</span></div>
   <div><strong>{count('course_view')}</strong><span>Course Views</span></div>
   <div><strong>{count('topic_open')}</strong><span>Topics Opened</span></div>
  </div>
  <div className="analytics-panel analytics-daily"><h3>Daily Breakdown</h3><div className="analytics-table-wrap"><table><thead><tr><th>Date</th><th>Visitors</th><th>Page Views</th><th>Articles</th><th>Videos</th><th>Courses</th><th>Topics</th></tr></thead><tbody>{dailyRows.map(r=><tr key={r.date}><td>{r.date}</td><td>{r.visitors.size}</td><td>{r.views}</td><td>{r.articles}</td><td>{r.videos}</td><td>{r.courses}</td><td>{r.topics}</td></tr>)}</tbody></table></div></div>
  <div className="analytics-grid">
   <div className="analytics-panel"><h3>Top Articles</h3>{top('article_view').map(([t,n])=><p key={t}><span>{t}</span><b>{n}</b></p>)}</div>
   <div className="analytics-panel"><h3>Top Videos</h3>{top('video_view').map(([t,n])=><p key={t}><span>{t}</span><b>{n}</b></p>)}</div>
   <div className="analytics-panel"><h3>Top Courses</h3>{top('course_view').map(([t,n])=><p key={t}><span>{t}</span><b>{n}</b></p>)}</div>
  </div>
  <p className="analytics-note">تمام analytics events Supabase میں محفوظ رہتے ہیں۔ یہاں آپ Today، Yesterday، Last 7/30/90 Days، Last Week، Last Month یا اپنی مخصوص تاریخ دیکھ سکتے ہیں۔</p>
 </div>
}
