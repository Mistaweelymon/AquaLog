import { useState, useEffect } from 'react'
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export const fsSet = (col, id, data) => setDoc(doc(db, col, id), data)
export const fsDel = (col, id)       => deleteDoc(doc(db, col, id))
export const uid   = ()              => Math.random().toString(36).slice(2, 9)
export const today = ()              => new Date().toISOString().slice(0, 10)
export const fmt   = (n)             => Number(n).toFixed(2)

const PARAMS = [
  { key:'ammonia',  label:'Ammonia',  unit:'ppm', ideal:'0',       warnAbove:0.25, dangerAbove:0.5,  color:'#f97316' },
  { key:'nitrite',  label:'Nitrite',  unit:'ppm', ideal:'0',       warnAbove:0.25, dangerAbove:0.5,  color:'#ef4444' },
  { key:'nitrate',  label:'Nitrate',  unit:'ppm', ideal:'<40',     warnAbove:40,   dangerAbove:80,   color:'#a855f7' },
  { key:'ph',       label:'pH',       unit:'',    ideal:'6.8–7.6', warnBelow:6.4,  warnAbove:8.0,   color:'#06b6d4' },
  { key:'gh',       label:'GH',       unit:'dGH', ideal:'4–12',    warnBelow:2,    warnAbove:20,    color:'#22c55e' },
  { key:'kh',       label:'KH',       unit:'dKH', ideal:'3–10',    warnBelow:2,    warnAbove:14,    color:'#84cc16' },
  { key:'temp',     label:'Temp',     unit:'°F',  ideal:'74–80',   warnBelow:70,   warnAbove:82,    color:'#f59e0b' },
  { key:'tds',      label:'TDS',      unit:'ppm', ideal:'100–300', warnAbove:500,  dangerAbove:800, color:'#8b5cf6' },
  { key:'chlorine', label:'Chlorine', unit:'ppm', ideal:'0',       warnAbove:0.1,  dangerAbove:0.5, color:'#ec4899' },
  { key:'salinity', label:'Salinity', unit:'ppt', ideal:'0 (FW)',  warnAbove:2,                     color:'#0ea5e9' },
]
export { PARAMS }

export const getParamStatus = (param, value) => {
  if (value === '' || value === null || value === undefined) return 'none'
  const v = parseFloat(value)
  if (isNaN(v)) return 'none'
  if (param.dangerAbove !== undefined && v >= param.dangerAbove) return 'danger'
  if (param.warnAbove   !== undefined && v >= param.warnAbove)   return 'warn'
  if (param.warnBelow   !== undefined && v <= param.warnBelow)   return 'warn'
  return 'good'
}
export const getStatusColor = (s) =>
  s==='danger' ? 'rgba(239,68,68,0.55)'
  : s==='warn' ? 'rgba(245,158,11,0.55)'
  : s==='good' ? 'rgba(34,197,94,0.55)'
  : 'rgba(14,165,233,0.22)'

export const EXPENSE_CATS = ['Fish','Plants','Equipment','Food','Medications','Water Conditioners','Substrate/Decor','Testing','Other']

const EC = { textAlign:'center', padding:'46px 20px', background:'rgba(14,165,233,0.04)', border:'1px dashed rgba(14,165,233,0.2)', borderRadius:16, color:'#4a7a9b' }
const ST = { fontSize:22, fontWeight:900, color:'#7dd3fc', margin:'0 0 16px', letterSpacing:'-0.5px' }
const RB = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }
const MT = { fontSize:20, fontWeight:900, color:'#7dd3fc', margin:'0 0 18px' }

// ── Shared small components ───────────────────────────────────────────────────
export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ fontSize:11, color:'#4a90c4', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:0.4 }}>
        {label}{hint && <span style={{ color:'#4a7a9b', marginLeft:6, textTransform:'none' }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}
export function Chip({ label, color='#38bdf8' }) {
  return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>
}
function ModalActions({ onSave, onCancel, label }) {
  return <div style={{ display:'flex', gap:10, marginTop:8 }}><button onClick={onSave} className="pbtn">{label}</button><button onClick={onCancel} className="gbtn">Cancel</button></div>
}
function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(145deg,#041929,#061e35)', border:'1px solid rgba(14,165,233,0.22)', borderRadius:18, padding:'26px 24px', width:'100%', maxWidth:530, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 80px rgba(0,0,0,0.65)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Ocean Background ──────────────────────────────────────────────────────────
function OceanBg() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#020c18 0%,#031a2e 40%,#041e38 70%,#031525 100%)' }} />
      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'75%', opacity:0.09 }} viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ls1" cx="25%" cy="0%" r="70%"><stop offset="0%" stopColor="#38bdf8" stopOpacity="1"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/></radialGradient>
          <radialGradient id="ls2" cx="65%" cy="0%" r="55%"><stop offset="0%" stopColor="#7dd3fc" stopOpacity="1"/><stop offset="100%" stopColor="#7dd3fc" stopOpacity="0"/></radialGradient>
          <radialGradient id="ls3" cx="85%" cy="0%" r="45%"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8"/><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/></radialGradient>
        </defs>
        <ellipse cx="225" cy="-20" rx="280" ry="520" fill="url(#ls1)" style={{ animation:'lsway 8s ease-in-out infinite' }}/>
        <ellipse cx="585" cy="-20" rx="210" ry="420" fill="url(#ls2)" style={{ animation:'lsway 11s ease-in-out infinite reverse' }}/>
        <ellipse cx="765" cy="-20" rx="160" ry="360" fill="url(#ls3)" style={{ animation:'lsway 6s ease-in-out infinite' }}/>
      </svg>
      {Array.from({length:16},(_,i) => (
        <div key={i} className="bbl" style={{ left:`${(i*59+11)%94}%`, width:5+i%5*5, height:5+i%5*5, animationDuration:`${8+i%6*2.5}s`, animationDelay:`${i*0.9}s` }}/>
      ))}
      {Array.from({length:22},(_,i) => (
        <div key={i} className={`ptcl ptcl${i%3+1}`} style={{ left:`${(i*43+5)%98}%`, bottom:`${20+i%60}%`, width:1.5+i%3, height:1.5+i%3, animationDelay:`${i*0.6}s` }}/>
      ))}
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:180, opacity:0.13 }} viewBox="0 0 1000 180" preserveAspectRatio="xMidYMax slice">
        {[60,140,230,330,430,510,620,710,810,900].map((x,i) => (
          <path key={i} d={`M${x},180 Q${x+(i%2?14:-14)},${130+i%2*12} ${x+(i%2?6:-6)},${85+i%3*18} Q${x+(i%2?-18:18)},${45+i%2*12} ${x+(i%2?4:-4)},10`}
            fill="none" stroke="#22c55e" strokeWidth={2.5+i%3} strokeLinecap="round"
            style={{ transformOrigin:`${x}px 180px`, animation:`swd${i%2+1} ${2.5+i%3*0.8}s ease-in-out infinite` }}/>
        ))}
      </svg>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:45, background:'linear-gradient(180deg,transparent,rgba(160,120,60,0.07))' }}/>
    </div>
  )
}

// ── Sync Badge ────────────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  const c = { synced:{col:'#22c55e',ic:'☁️',lb:'Synced'}, saving:{col:'#f59e0b',ic:'↻',lb:'Saving…'}, error:{col:'#ef4444',ic:'⚠',lb:'Error'} }[status]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:c.col, background:`${c.col}18`, border:`1px solid ${c.col}30`, borderRadius:20, padding:'3px 9px' }}>
      <span style={{ animation:status==='saving'?'spin 1s linear infinite':'none', display:'inline-block' }}>{c.ic}</span>
      <span className="tlb">{c.lb}</span>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function SC({ emoji, label, value, sub, onClick }) {
  return (
    <div onClick={onClick} className="sc">
      <div style={{ fontSize:26, marginBottom:6 }}>{emoji}</div>
      <div style={{ fontSize:10, color:'#4a90c4', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#7dd3fc', margin:'3px 0 2px' }}>{value}</div>
      <div style={{ fontSize:11, color:'#4a7a9b' }}>{sub}</div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ tank, latestWater, tankFish, totalSpent, tankMaint, setTab, setModal }) {
  const alerts = []
  if (latestWater) PARAMS.forEach(p => {
    const s = getParamStatus(p, latestWater[p.key])
    if (s==='danger') alerts.push({ l:'danger', msg:`${p.label} is dangerously high (${latestWater[p.key]} ${p.unit})` })
    else if (s==='warn') alerts.push({ l:'warn', msg:`${p.label} is outside ideal range (${latestWater[p.key]} ${p.unit})` })
  })
  return (
    <div>
      <h2 style={ST}>{tank.name} <span style={{ fontSize:14, fontWeight:500, color:'#4a7a9b' }}>{tank.volume && `${tank.volume} ${tank.unit||'gal'}`}</span></h2>
      {tank.notes && <p style={{ color:'#4a7a9b', fontSize:13, marginTop:-12, marginBottom:16 }}>{tank.notes}</p>}
      {alerts.map((a,i) => (
        <div key={i} style={{ padding:'9px 14px', borderRadius:10, marginBottom:6,
          background:a.l==='danger'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',
          border:`1px solid ${a.l==='danger'?'rgba(239,68,68,0.28)':'rgba(245,158,11,0.28)'}`,
          color:a.l==='danger'?'#fca5a5':'#fcd34d', fontSize:13 }}>
          {a.l==='danger'?'🚨':'⚠️'} {a.msg}
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:12, margin:'18px 0 24px' }}>
        <SC emoji="🐟" label="Livestock"        value={tankFish.length}        sub="tracked"        onClick={() => setTab('fish')} />
        <SC emoji="💰" label="Total Invested"   value={`$${fmt(totalSpent)}`}  sub="all time"       onClick={() => setTab('expenses')} />
        <SC emoji="💧" label="Last Water Test"  value={latestWater?.date||'—'} sub="water quality"  onClick={() => setTab('water')} />
        <SC emoji="🔧" label="Last Maintenance" value={tankMaint[0]?.date||'—'} sub={tankMaint[0]?.type||'none'} onClick={() => setTab('maintenance')} />
      </div>
      {latestWater ? (
        <>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#4a90c4', margin:'0 0 12px' }}>Latest Water — {latestWater.date}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {PARAMS.map(p => {
              const v = latestWater[p.key]
              if (v===''||v===undefined||v===null) return null
              const s = getParamStatus(p, v)
              return (
                <div key={p.key} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${getStatusColor(s)}`, borderRadius:12, padding:'11px 13px' }}>
                  <div style={{ fontSize:10, color:'#4a90c4', textTransform:'uppercase', letterSpacing:0.5 }}>{p.label}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:p.color, margin:'3px 0 2px' }}>{v}<span style={{ fontSize:11, fontWeight:400, color:'#4a7a9b' }}> {p.unit}</span></div>
                  <div style={{ fontSize:10, color:s==='danger'?'#fca5a5':s==='warn'?'#fcd34d':s==='good'?'#86efac':'#4a7a9b' }}>
                    {s==='none'?`ideal: ${p.ideal}`:s==='good'?'✓ good':s==='warn'?'⚠ check':'🚨 danger'}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div style={EC}>
          <div style={{ fontSize:44, marginBottom:12 }}>💧</div>
          <div style={{ color:'#4a90c4', marginBottom:14 }}>No water tests logged yet.</div>
          <button onClick={() => setModal({type:'addWater'})} className="pbtn">Log First Test</button>
        </div>
      )}
    </div>
  )
}

// ── Water Log Row ─────────────────────────────────────────────────────────────
function WLR({ log, onDel }) {
  const [open, setOpen] = useState(false)
  const filled = PARAMS.filter(p => log[p.key]!==''&&log[p.key]!==undefined&&log[p.key]!==null)
  const hasAlert = filled.some(p => { const s=getParamStatus(p,log[p.key]); return s==='warn'||s==='danger' })
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(14,165,233,0.14)', borderRadius:12, overflow:'hidden' }}>
      <div onClick={() => setOpen(v=>!v)} style={{ padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{hasAlert?'⚠️':'✅'}</span>
          <div>
            <div style={{ fontWeight:700, color:'#7dd3fc' }}>{log.date}</div>
            <div style={{ fontSize:12, color:'#4a7a9b' }}>{filled.length} params{log.notes?' · '+log.notes:''}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          {filled.slice(0,3).map(p => { const s=getParamStatus(p,log[p.key]); return (
            <span key={p.key} style={{ fontSize:11, padding:'2px 7px', borderRadius:20,
              background:s==='danger'?'rgba(239,68,68,0.15)':s==='warn'?'rgba(245,158,11,0.15)':'rgba(34,197,94,0.12)',
              color:s==='danger'?'#fca5a5':s==='warn'?'#fcd34d':'#86efac' }}>
              {p.label}: {log[p.key]}{p.unit}
            </span>
          )})}
          <span style={{ color:'#4a7a9b', fontSize:13 }}>{open?'▲':'▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:'0 16px 14px', borderTop:'1px solid rgba(14,165,233,0.1)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(128px,1fr))', gap:8, marginTop:12 }}>
            {filled.map(p => { const s=getParamStatus(p,log[p.key]); return (
              <div key={p.key} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${getStatusColor(s)}`, borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'#4a90c4', textTransform:'uppercase' }}>{p.label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:p.color }}>{log[p.key]}<span style={{ fontSize:10, color:'#4a7a9b' }}> {p.unit}</span></div>
                <div style={{ fontSize:10, color:'#4a7a9b' }}>ideal: {p.ideal}</div>
              </div>
            )})}
          </div>
          {log.notes && <p style={{ fontSize:12, color:'#4a7a9b', marginTop:10, fontStyle:'italic' }}>📝 {log.notes}</p>}
          <button onClick={onDel} className="dbtn" style={{ marginTop:10 }}>Delete Log</button>
        </div>
      )}
    </div>
  )
}

// ── Tab Components ────────────────────────────────────────────────────────────
function WaterTab({ logs, onDel, setModal }) {
  const [all, setAll] = useState(false)
  return (
    <div>
      <div style={RB}><h2 style={ST}>Water Quality Log</h2><button onClick={() => setModal({type:'addWater'})} className="pbtn">＋ Log Test</button></div>
      {logs.length===0 ? <div style={EC}><div style={{fontSize:36}}>💧</div><div style={{color:'#4a90c4',marginTop:8}}>No water tests logged yet.</div></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {(all?logs:logs.slice(0,10)).map(log => <WLR key={log.id} log={log} onDel={() => { onDel(log.id) }} />)}
        </div>
      )}
      {logs.length>10 && <button onClick={() => setAll(v=>!v)} className="gbtn" style={{ marginTop:14, display:'block', margin:'14px auto 0' }}>{all?'Show Less':`Show All ${logs.length}`}</button>}
    </div>
  )
}

function FishTab({ fish, onDel, setModal }) {
  return (
    <div>
      <div style={RB}><h2 style={ST}>Livestock</h2><button onClick={() => setModal({type:'addFish'})} className="pbtn">＋ Add Fish</button></div>
      {fish.length===0 ? <div style={EC}><div style={{fontSize:36}}>🐟</div><div style={{color:'#4a90c4',marginTop:8}}>No livestock added yet.</div></div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(245px,1fr))', gap:14 }}>
          {fish.map(f => (
            <div key={f.id} style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.18)', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div><div style={{ fontWeight:900, fontSize:16, color:'#7dd3fc' }}>{f.name}</div>
                {f.species && <div style={{ fontSize:12, color:'#4a90c4', fontStyle:'italic' }}>{f.species}</div>}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setModal({type:'editFish',payload:f})} className="tbtn2">✏️</button>
                  <button onClick={() => { onDel(f.id) }} className="tbtn2">🗑️</button>
                </div>
              </div>
              <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
                {f.count  && <Chip label={`Qty: ${f.count}`} />}
                {f.sex    && <Chip label={f.sex} />}
                {f.added  && <Chip label={`Added: ${f.added}`} />}
                {f.cost   && <Chip label={`$${fmt(f.cost)}`} color="#22c55e" />}
                {f.status && <Chip label={f.status} color={f.status==='Deceased'?'#ef4444':f.status==='Rehomed'?'#a855f7':'#38bdf8'} />}
              </div>
              {f.notes && <p style={{ fontSize:12, color:'#4a7a9b', marginTop:8, fontStyle:'italic' }}>{f.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpensesTab({ expenses, totalSpent, onDel, setModal }) {
  const [confirmId, setConfirmId] = useState(null)
  const byCat = EXPENSE_CATS.map(c => ({ c, t:expenses.filter(e=>e.category===c).reduce((s,e)=>s+parseFloat(e.amount||0),0) })).filter(r=>r.t>0).sort((a,b)=>b.t-a.t)
  return (
    <div>
      <div style={RB}><h2 style={ST}>Costs & Expenses</h2><button onClick={() => setModal({type:'addExpense'})} className="pbtn">＋ Add Expense</button></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, color:'#4a90c4', textTransform:'uppercase' }}>Total Invested</div>
          <div style={{ fontSize:32, fontWeight:900, color:'#22c55e', margin:'4px 0 2px' }}>${fmt(totalSpent)}</div>
          <div style={{ fontSize:12, color:'#4a7a9b' }}>{expenses.length} transactions</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, color:'#4a90c4', textTransform:'uppercase', marginBottom:8 }}>By Category</div>
          {byCat.length===0 ? <div style={{color:'#4a7a9b',fontSize:13}}>No data yet</div> :
            byCat.map(r => <div key={r.c} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}><span style={{color:'#94a3b8'}}>{r.c}</span><span style={{color:'#7dd3fc',fontWeight:700}}>${fmt(r.t)}</span></div>)}
        </div>
      </div>
      {expenses.length===0 ? <div style={EC}><div style={{fontSize:36}}>💰</div><div style={{color:'#4a90c4',marginTop:8}}>No expenses logged yet.</div></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[...expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(14,165,233,0.12)', borderRadius:10, padding:'12px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#e0f0ff' }}>{e.description||e.category}</div>
                  <div style={{ fontSize:12, color:'#4a7a9b' }}>{e.date} · {e.category}{e.vendor?' · '+e.vendor:''}</div>
                  {e.notes && <div style={{ fontSize:11, color:'#4a7a9b', fontStyle:'italic', marginTop:2 }}>{e.notes}</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:'#22c55e' }}>${fmt(e.amount)}</div>
                  <button onClick={() => setModal({type:'editExpense', payload:e})} className="tbtn2">✏️</button>
                  <button onClick={() => setConfirmId(e.id)} className="tbtn2">🗑️</button>
                </div>
              </div>
              {confirmId === e.id && (
                <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'#fca5a5' }}>Delete this expense?</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => { onDel(e.id); setConfirmId(null) }} className="dbtn">Yes, delete</button>
                    <button onClick={() => setConfirmId(null)} className="gbtn" style={{padding:'4px 12px', fontSize:12}}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaintenanceTab({ logs, onDel, setModal }) {
  const ic = t => t==='Water Change'?'🪣':t==='Filter Clean'?'🔄':t==='Gravel Vacuum'?'🧹':t==='Medication'?'💊':t==='Glass Clean'?'🪟':t==='Plant Trim'?'✂️':'🔧'
  return (
    <div>
      <div style={RB}><h2 style={ST}>Maintenance Log</h2><button onClick={() => setModal({type:'addMaintenance'})} className="pbtn">＋ Log Task</button></div>
      {logs.length===0 ? <div style={EC}><div style={{fontSize:36}}>🔧</div><div style={{color:'#4a90c4',marginTop:8}}>No maintenance logged yet.</div></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(14,165,233,0.14)', borderRadius:12, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:12 }}>
                <span style={{ fontSize:22 }}>{ic(log.type)}</span>
                <div>
                  <div style={{ fontWeight:700, color:'#7dd3fc' }}>{log.type}</div>
                  <div style={{ fontSize:12, color:'#4a7a9b' }}>{log.date}{log.waterChangePercent?` · ${log.waterChangePercent}% changed`:''}{ log.duration?` · ${log.duration} min`:''}</div>
                  {log.products && <div style={{ fontSize:11, color:'#4a7a9b', marginTop:2 }}>Products: {log.products}</div>}
                  {log.notes    && <div style={{ fontSize:12, color:'#64a0c0', marginTop:4, fontStyle:'italic' }}>{log.notes}</div>}
                </div>
              </div>
              <button onClick={() => { onDel(log.id) }} className="tbtn2">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────
function AddTankModal({ onSave, close }) {
  const [f, sf] = useState({ name:'', volume:'', unit:'gal', notes:'' })
  const u = k => e => sf(v => ({...v,[k]:e.target.value}))
  return (<>
    <h3 style={MT}>Add New Tank</h3>
    <Field label="Tank Name *"><input className="inp" value={f.name} onChange={u('name')} placeholder="e.g. 55-Gal Community Tank"/></Field>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <Field label="Volume"><input className="inp" type="number" value={f.volume} onChange={u('volume')} placeholder="55"/></Field>
      <Field label="Unit"><select className="inp" value={f.unit} onChange={u('unit')}><option>gal</option><option>L</option></select></Field>
    </div>
    <Field label="Notes"><textarea className="inp" style={{minHeight:65}} value={f.notes} onChange={u('notes')} placeholder="Setup notes…"/></Field>
    <ModalActions onSave={() => { if(!f.name) return alert('Name required'); onSave(f); close() }} onCancel={close} label="Add Tank"/>
  </>)
}

function AddWaterModal({ onSave, close }) {
  const init = { date:today(), notes:'' }
  PARAMS.forEach(p => init[p.key]='')
  const [f, sf] = useState(init)
  const u = k => e => sf(v => ({...v,[k]:e.target.value}))
  return (<>
    <h3 style={MT}>Log Water Test</h3>
    <Field label="Date"><input className="inp" type="date" value={f.date} onChange={u('date')}/></Field>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'10px 0' }}>
      {PARAMS.map(p => (
        <Field key={p.key} label={`${p.label}${p.unit?` (${p.unit})`:''}`} hint={`ideal: ${p.ideal}`}>
          <input className="inp" type="number" step="0.01" value={f[p.key]} onChange={u(p.key)} placeholder="—"
            style={{ borderColor:f[p.key]!==''?getStatusColor(getParamStatus(p,f[p.key])):undefined }}/>
        </Field>
      ))}
    </div>
    <Field label="Notes"><textarea className="inp" style={{minHeight:55}} value={f.notes} onChange={u('notes')}/></Field>
    <ModalActions onSave={() => { onSave(f); close() }} onCancel={close} label="Save Test"/>
  </>)
}

function AddFishModal({ onSave, close, existing }) {
  const [f, sf] = useState(existing || { name:'', species:'', count:1, sex:'', added:today(), cost:'', status:'Alive', notes:'' })
  const u = k => e => sf(v => ({...v,[k]:e.target.value}))
  return (<>
    <h3 style={MT}>{existing?'Edit':'Add'} Livestock</h3>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <Field label="Common Name *"><input className="inp" value={f.name} onChange={u('name')} placeholder="Neon Tetra"/></Field>
      <Field label="Scientific Name"><input className="inp" value={f.species} onChange={u('species')} placeholder="Paracheirodon innesi"/></Field>
      <Field label="Quantity"><input className="inp" type="number" value={f.count} onChange={u('count')}/></Field>
      <Field label="Sex"><select className="inp" value={f.sex} onChange={u('sex')}><option value="">Unknown</option><option>Male</option><option>Female</option><option>Mixed</option></select></Field>
      <Field label="Date Added"><input className="inp" type="date" value={f.added} onChange={u('added')}/></Field>
      <Field label="Cost ($)"><input className="inp" type="number" step="0.01" value={f.cost} onChange={u('cost')} placeholder="0.00"/></Field>
      <Field label="Status"><select className="inp" value={f.status} onChange={u('status')}><option>Alive</option><option>Deceased</option><option>Rehomed</option><option>Sick</option></select></Field>
    </div>
    <Field label="Notes"><textarea className="inp" style={{minHeight:55}} value={f.notes} onChange={u('notes')}/></Field>
    <ModalActions onSave={() => { if(!f.name) return alert('Name required'); onSave(f); close() }} onCancel={close} label={existing?'Save Changes':'Add Livestock'}/>
  </>)
}

function AddExpenseModal({ onSave, close, existing }) {
  const [f, sf] = useState(existing || { date:today(), description:'', category:'Fish', amount:'', vendor:'', notes:'' })
  const u = k => e => sf(v => ({ ...v, [k]: e.target.value }))
  return (<>
    <h3 style={MT}>{existing?'Edit':'Add'} Expense</h3>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <Field label="Date"><input className="inp" type="date" value={f.date} onChange={u('date')}/></Field>
      <Field label="Amount ($) *"><input className="inp" type="number" step="0.01" value={f.amount} onChange={u('amount')} placeholder="0.00"/></Field>
      <Field label="Category"><select className="inp" value={f.category} onChange={u('category')}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Vendor"><input className="inp" value={f.vendor} onChange={u('vendor')} placeholder="LFS, Amazon…"/></Field>
    </div>
    <Field label="Description"><input className="inp" value={f.description} onChange={u('description')} placeholder="What did you buy?"/></Field>
    <Field label="Notes">
      <textarea className="inp" style={{minHeight:70}} value={f.notes}
        onChange={e => sf(v => ({ ...v, notes: e.target.value }))}
        placeholder="Any additional notes…"/>
    </Field>
    <ModalActions onSave={() => { if(!f.amount||isNaN(f.amount)) return alert('Valid amount required'); onSave(f); close() }} onCancel={close} label={existing?'Save Changes':'Save Expense'}/>
  </>)
}

function AddMaintenanceModal({ onSave, close }) {
  const TYPES = ['Water Change','Filter Clean','Gravel Vacuum','Glass Clean','Plant Trim','Equipment Check','Medication','Other']
  const [f, sf] = useState({ date:today(), type:'Water Change', waterChangePercent:'', duration:'', products:'', notes:'' })
  const u = k => e => sf(v => ({...v,[k]:e.target.value}))
  return (<>
    <h3 style={MT}>Log Maintenance</h3>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <Field label="Date"><input className="inp" type="date" value={f.date} onChange={u('date')}/></Field>
      <Field label="Task Type"><select className="inp" value={f.type} onChange={u('type')}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
      {f.type==='Water Change' && <Field label="Water Changed (%)"><input className="inp" type="number" value={f.waterChangePercent} onChange={u('waterChangePercent')} placeholder="25"/></Field>}
      <Field label="Duration (min)"><input className="inp" type="number" value={f.duration} onChange={u('duration')} placeholder="30"/></Field>
    </div>
    <Field label="Products Used"><input className="inp" value={f.products} onChange={u('products')} placeholder="Prime, Stability…"/></Field>
    <Field label="Notes"><textarea className="inp" style={{minHeight:55}} value={f.notes} onChange={u('notes')}/></Field>
    <ModalActions onSave={() => { onSave(f); close() }} onCancel={close} label="Save Task"/>
  </>)
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tanks,           setTanks]           = useState([])
  const [fish,            setFish]            = useState([])
  const [waterLogs,       setWaterLogs]       = useState([])
  const [expenses,        setExpenses]        = useState([])
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [activeTankId,    setActiveTankId]    = useState(null)
  const [tab,             setTab]             = useState('dashboard')
  const [modal,           setModal]           = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [syncStatus,      setSyncStatus]      = useState('synced')

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db,'tanks'),           s => setTanks(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'fish'),            s => setFish(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'waterLogs'),       s => setWaterLogs(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'expenses'),        s => setExpenses(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'maintenanceLogs'), s => setMaintenanceLogs(s.docs.map(d=>({id:d.id,...d.data()})))),
    ]
    getDocs(collection(db,'settings')).then(s => {
      const p = s.docs.find(d => d.id==='prefs')
      if (p) setActiveTankId(p.data().activeTankId || null)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => unsubs.forEach(u => u())
  }, [])

  useEffect(() => {
    if (!activeTankId && tanks.length > 0) setActiveTankId(tanks[0].id)
  }, [tanks, activeTankId])

  const setActiveTank = async (id) => { setActiveTankId(id); await fsSet('settings','prefs',{ activeTankId:id }) }
  const withSync = async (fn) => { setSyncStatus('saving'); try { await fn(); setSyncStatus('synced') } catch(e) { console.error(e); setSyncStatus('error') } }

  const addTank        = t  => withSync(async () => { const id=uid(); await fsSet('tanks',id,{...t,id}); await setActiveTank(id) })
  const addWaterLog    = l  => withSync(() => fsSet('waterLogs',uid(),{...l,id:uid(),tankId:activeTankId}))
  const delWaterLog    = id => withSync(() => fsDel('waterLogs',id))
  const addFish        = f  => withSync(() => fsSet('fish',uid(),{...f,id:uid(),tankId:activeTankId}))
  const editFish       = f  => withSync(() => fsSet('fish',f.id,f))
  const delFish        = id => withSync(() => fsDel('fish',id))
  const addExpense     = e  => withSync(() => fsSet('expenses',uid(),{...e,id:uid(),tankId:activeTankId}))
  const delExpense     = id => withSync(() => fsDel('expenses',id))
  const addMaintenance = m  => withSync(() => fsSet('maintenanceLogs',uid(),{...m,id:uid(),tankId:activeTankId}))
  const delMaintenance = id => withSync(() => fsDel('maintenanceLogs',id))

  const tank         = tanks.find(t => t.id===activeTankId) || tanks[0]
  const tankWater    = waterLogs.filter(l => l.tankId===activeTankId).sort((a,b) => b.date.localeCompare(a.date))
  const tankFish     = fish.filter(f => f.tankId===activeTankId)
  const tankExpenses = expenses.filter(e => e.tankId===activeTankId)
  const tankMaint    = maintenanceLogs.filter(m => m.tankId===activeTankId).sort((a,b) => b.date.localeCompare(a.date))
  const totalSpent   = tankExpenses.reduce((s,e) => s + parseFloat(e.amount||0), 0)
  const latestWater  = tankWater[0]

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#020c18', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:"'Nunito',sans-serif", position:'relative' }}>
      <OceanBg/>
      <div style={{ fontSize:56, animation:'bob 2s ease-in-out infinite', position:'relative', zIndex:1 }}>🐠</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#7dd3fc', position:'relative', zIndex:1 }}>Connecting to Firebase…</div>
      <div style={{ fontSize:13, color:'#4a7a9b', position:'relative', zIndex:1 }}>Syncing your aquarium data</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#020c18', fontFamily:"'Nunito',sans-serif", color:'#e0f0ff', position:'relative', overflow:'hidden' }}>
      <OceanBg/>
      <header className="hdr">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:30 }}>🐠</span>
          <div>
            <div style={{ fontSize:21, fontWeight:900, color:'#7dd3fc', letterSpacing:'-0.5px', lineHeight:1 }}>AquaLog</div>
            <div style={{ fontSize:11, color:'#4a7a9b' }}>Home Aquarium Tracker</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <SyncBadge status={syncStatus}/>
          {tanks.length > 0 && (
            <select value={activeTankId||''} onChange={e => setActiveTank(e.target.value)} className="gsel">
              {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={() => setModal({type:'addTank'})} className="ibtn">＋</button>
        </div>
      </header>
      <nav className="tnav">
        {[['dashboard','📊','Dashboard'],['water','💧','Water'],['fish','🐟','Livestock'],['expenses','💰','Costs'],['maintenance','🔧','Maintenance']].map(([k,ic,lb]) => (
          <button key={k} onClick={() => setTab(k)} className={`tbtn${tab===k?' act':''}`}>
            <span>{ic}</span><span className="tlb">{lb}</span>
          </button>
        ))}
      </nav>
      <main style={{ padding:'24px 18px', maxWidth:960, margin:'0 auto', position:'relative', zIndex:1 }}>
        {tanks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 20px' }}>
            <div style={{ fontSize:64, animation:'bob 3s ease-in-out infinite', marginBottom:18 }}>🐠</div>
            <h2 style={{ fontSize:26, fontWeight:900, color:'#7dd3fc', marginBottom:10 }}>Welcome to AquaLog</h2>
            <p style={{ color:'#4a7a9b', maxWidth:380, margin:'0 auto 24px' }}>Your data syncs across all devices via Firebase. Add your first tank to get started!</p>
            <button onClick={() => setModal({type:'addTank'})} className="pbtn" style={{ fontSize:16, padding:'13px 30px' }}>＋ Add My First Tank</button>
          </div>
        ) : !tank ? (
          <div style={{ textAlign:'center', padding:'46px 20px', color:'#4a7a9b' }}>Select or add a tank.</div>
        ) : (
          <>
            {tab==='dashboard'   && <Dashboard tank={tank} latestWater={latestWater} tankFish={tankFish} totalSpent={totalSpent} tankMaint={tankMaint} setTab={setTab} setModal={setModal}/>}
            {tab==='water'       && <WaterTab logs={tankWater} onDel={delWaterLog} setModal={setModal}/>}
            {tab==='fish'        && <FishTab fish={tankFish} onDel={delFish} setModal={setModal}/>}
            {tab==='expenses'    && <ExpensesTab expenses={tankExpenses} totalSpent={totalSpent} onDel={delExpense} setModal={setModal}/>}
            {tab==='maintenance' && <MaintenanceTab logs={tankMaint} onDel={delMaintenance} setModal={setModal}/>}
          </>
        )}
      </main>
      {modal && (
        <Overlay onClose={() => setModal(null)}>
          {modal.type==='addTank'        && <AddTankModal        onSave={addTank}        close={() => setModal(null)}/>}
          {modal.type==='addWater'       && <AddWaterModal       onSave={addWaterLog}    close={() => setModal(null)}/>}
          {modal.type==='addFish'        && <AddFishModal        onSave={addFish}        close={() => setModal(null)}/>}
          {modal.type==='editFish'       && <AddFishModal        onSave={editFish}       close={() => setModal(null)} existing={modal.payload}/>}
          {modal.type==='addExpense'  && <AddExpenseModal onSave={addExpense}  close={() => setModal(null)}/>}
          {modal.type==='editExpense' && <AddExpenseModal onSave={(data) => withSync(() => fsSet('expenses', modal.payload.id, {...data, id: modal.payload.id, tankId: activeTankId}))} close={() => setModal(null)} existing={modal.payload}/>}
          {modal.type==='addMaintenance' && <AddMaintenanceModal onSave={addMaintenance} close={() => setModal(null)}/>}
        </Overlay>
      )}
    </div>
  )
}