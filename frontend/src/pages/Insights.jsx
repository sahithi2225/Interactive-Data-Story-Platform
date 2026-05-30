import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../api/client.js'
import { useDataset } from '../context/DatasetContext.jsx'

export default function Insights() {
  const { dataset, analysis } = useDataset()
  const [q, setQ] = useState('')
  const [chat, setChat] = useState([])
  const [busy, setBusy] = useState(false)

  if (!dataset || !analysis)
    return <div className="container"><p>Upload a dataset first.</p><Link to="/upload"><button className="btn">Upload</button></Link></div>

  const ask = async (e) => {
    e.preventDefault()
    if (!q.trim()) return
    const question = q; setQ('')
    setChat(c => [...c, { who:'you', text: question }])
    setBusy(true)
    try {
      const { data } = await client.post(`/datasets/${dataset.id}/chat`, { question })
      setChat(c => [...c, { who:'ai', text: data.answer }])
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const i = analysis.insights
  return (
    <div className="container grid cols-2">
      <div className="glass card">
        <h3>🎯 Executive Overview</h3>
        <p><b>Opportunity:</b> {i.opportunity}</p>
        <p><b>Risk:</b> {i.risk}</p>
        <h4>Key Findings</h4>
        <ul>{i.summary.map((s,k)=><li key={k}>{s}</li>)}</ul>
        {i.anomalies?.length>0 && <>
          <h4>⚠️ Anomalies</h4>
          <ul>{i.anomalies.map((a,k)=><li key={k}>{a}</li>)}</ul>
        </>}
        <h4>✅ Recommendations</h4>
        <ul>{i.recommendations.map((r,k)=><li key={k}>{r}</li>)}</ul>
      </div>

      <div className="glass card">
        <h3>💬 Ask your data</h3>
        <p style={{ color:'var(--muted)', marginTop: 0 }}>
          Try: "total revenue", "average customer_rating", "top 5 product by revenue", "schema"
        </p>
        <div style={{ height: 320, overflow:'auto', padding: 10, background:'var(--surface-2)', borderRadius: 10 }}>
          {chat.length===0 && <p style={{ color:'var(--muted)' }}>No messages yet.</p>}
          {chat.map((m,k)=>(
            <div key={k} style={{ marginBottom: 10, textAlign: m.who==='you'?'right':'left' }}>
              <div style={{ display:'inline-block', padding:'8px 12px', borderRadius: 10,
                background: m.who==='you' ? 'var(--primary)' : 'var(--surface)',
                color: m.who==='you' ? '#fff' : 'var(--text)', maxWidth: '80%' }}>{m.text}</div>
            </div>
          ))}
        </div>
        <form onSubmit={ask} style={{ display:'flex', gap: 8, marginTop: 12 }}>
          <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a question…" />
          <button className="btn" disabled={busy}>{busy ? <span className="spinner"/> : 'Ask'}</button>
        </form>
      </div>
    </div>
  )
}
