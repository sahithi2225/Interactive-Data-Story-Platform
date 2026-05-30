import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import toast from 'react-hot-toast'
import client from '../api/client.js'
import { useDataset } from '../context/DatasetContext.jsx'
import ChartRenderer, { PALETTES } from '../components/ChartRenderer.jsx'
import Loader from '../components/Loader.jsx'

const CHART_TYPES = ['bar', 'line', 'area', 'pie', 'scatter', 'histogram']

export default function Dashboard() {
  const { dataset, analysis, setAnalysis } = useDataset()
  const [palette, setPalette] = useState('Ocean')
  const [order, setOrder] = useState(null)
  const [overrides, setOverrides] = useState({}) // index -> {type, title}
  const [busy, setBusy] = useState(false)

  if (!dataset) return <div className="container"><p>Upload a dataset first.</p><Link to="/upload"><button className="btn">Go to upload</button></Link></div>
  if (!analysis) return <div className="container"><Loader label="Loading analysis…" /></div>

  const charts = analysis.charts || []
  const indices = order || charts.map((_, i) => i)

  const onDragEnd = (r) => {
    if (!r.destination) return
    const next = [...indices]
    const [m] = next.splice(r.source.index, 1)
    next.splice(r.destination.index, 0, m)
    setOrder(next)
  }

  const downloadPdf = async () => {
    setBusy(true)
    try {
      const res = await client.get(`/datasets/${dataset.id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `${dataset.filename}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const exportHtml = () => {
    const html = document.getElementById('dashboard-root').outerHTML
    const css = Array.from(document.styleSheets).map(s => {
      try { return Array.from(s.cssRules).map(r => r.cssText).join('\n') } catch { return '' }
    }).join('\n')
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${dataset.filename} report</title><style>${css}</style></head><body>${html}</body></html>`
    const blob = new Blob([full], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${dataset.filename}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{dataset.filename}</h2>
          <span className="badge">{analysis.rows.toLocaleString()} rows · {analysis.cols} cols</span>
        </div>
        <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
          <select className="input" value={palette} onChange={e=>setPalette(e.target.value)} style={{ width: 140 }}>
            {Object.keys(PALETTES).map(k => <option key={k}>{k}</option>)}
          </select>
          <button className="btn ghost" onClick={exportHtml}>⬇ HTML</button>
          <button className="btn" onClick={downloadPdf} disabled={busy}>
            {busy ? <span className="spinner"/> : '⬇ PDF'}
          </button>
        </div>
      </div>

      <div id="dashboard-root">
        <div className="grid cols-4" style={{ marginTop: 18 }}>
          <div className="glass card kpi"><div className="v">{analysis.rows.toLocaleString()}</div><div className="l">Rows</div></div>
          <div className="glass card kpi"><div className="v">{analysis.cols}</div><div className="l">Columns</div></div>
          <div className="glass card kpi"><div className="v">{Object.values(analysis.types||{}).filter(t=>t==='numeric').length}</div><div className="l">Numeric fields</div></div>
          <div className="glass card kpi"><div className="v">{(analysis.cleaning_report?.duplicates_removed)||0}</div><div className="l">Duplicates removed</div></div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="charts">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                className="grid cols-2" style={{ marginTop: 18 }}>
                {indices.map((idx, i) => {
                  const c = charts[idx]
                  if (!c) return null
                  const ov = overrides[idx] || {}
                  return (
                    <Draggable key={idx} draggableId={`c${idx}`} index={i}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} className="glass card draggable">
                          <div style={{ display:'flex', justifyContent:'space-between', gap: 8 }}>
                            <input className="editable"
                              defaultValue={ov.title || c.title}
                              onBlur={(e)=>setOverrides(o=>({...o, [idx]:{...o[idx], title:e.target.value}}))}
                              style={{ fontWeight: 600, fontSize: 16, minHeight: 0 }} />
                            <span {...p.dragHandleProps} className="section-handle">⋮⋮</span>
                          </div>
                          <select className="input" style={{ width: 150, marginBottom: 8 }}
                            value={ov.type || c.type}
                            onChange={e=>setOverrides(o=>({...o,[idx]:{...o[idx], type:e.target.value}}))}>
                            {CHART_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <ChartRenderer chart={c} palette={palette} type={ov.type || c.type} />
                          <p style={{ color:'var(--muted)', margin:'8px 0 0', fontSize: 13 }}>💡 {c.reason}</p>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {analysis.prediction && (
          <div className="glass card" style={{ marginTop: 18 }}>
            <h3>🔮 Predictive Forecast — {analysis.prediction.target}</h3>
            <ChartRenderer chart={{ data: analysis.prediction.series }} type="line" palette={palette} />
          </div>
        )}

        <div className="glass card" style={{ marginTop: 18, overflow: 'auto' }}>
          <h3>Preview</h3>
          <table className="table">
            <thead><tr>{Object.keys(analysis.preview[0]||{}).map(k => <th key={k}>{k}</th>)}</tr></thead>
            <tbody>{analysis.preview.slice(0,10).map((r,i)=>(
              <tr key={i}>{Object.keys(analysis.preview[0]||{}).map(k => <td key={k}>{String(r[k])}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
