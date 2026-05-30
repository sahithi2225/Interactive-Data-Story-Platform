import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import toast from 'react-hot-toast'
import client from '../api/client.js'
import { useDataset } from '../context/DatasetContext.jsx'

const defaultSections = (analysis) => ([
  { id:'s1', title:'Executive Summary', body: analysis?.insights?.opportunity || '' },
  { id:'s2', title:'Key Findings', body: (analysis?.insights?.summary||[]).join('\n• ') },
  { id:'s3', title:'Recommendations', body: (analysis?.insights?.recommendations||[]).join('\n• ') },
  { id:'s4', title:'Risks & Anomalies', body: (analysis?.insights?.anomalies||['None identified']).join('\n• ') },
])

export default function StoryEditor() {
  const { dataset, analysis } = useDataset()
  const [sections, setSections] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ if (analysis) setSections(defaultSections(analysis)) }, [analysis])

  if (!dataset || !analysis)
    return <div className="container"><Link to="/upload"><button className="btn">Upload first</button></Link></div>

  const onDragEnd = (r) => {
    if (!r.destination) return
    const next = [...sections]
    const [m] = next.splice(r.source.index,1); next.splice(r.destination.index,0,m)
    setSections(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const story = sections.map(s => `## ${s.title}\n\n${s.body}`).join('\n\n---\n\n')
      await client.put(`/datasets/${dataset.id}/story`, { story })
      toast.success('Story saved')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Story Editor</h2>
        <button className="btn" onClick={save} disabled={saving}>{saving?<span className="spinner"/>:'Save story'}</button>
      </div>
      <p style={{ color:'var(--muted)' }}>Drag to reorder. Click any text to edit live.</p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="story">
          {(p)=>(<div ref={p.innerRef} {...p.droppableProps} className="grid" style={{gap:14}}>
            {sections.map((s,i)=>(
              <Draggable key={s.id} draggableId={s.id} index={i}>
                {(pp)=>(
                  <div ref={pp.innerRef} {...pp.draggableProps} className="glass card">
                    <div style={{ display:'flex', gap: 10, alignItems:'center' }}>
                      <span {...pp.dragHandleProps} className="section-handle">⋮⋮</span>
                      <input className="editable" value={s.title} style={{ fontWeight:700, fontSize:18, minHeight:0 }}
                        onChange={e=>{const n=[...sections]; n[i]={...s,title:e.target.value}; setSections(n)}} />
                    </div>
                    <textarea className="editable" rows={5} value={s.body}
                      onChange={e=>{const n=[...sections]; n[i]={...s,body:e.target.value}; setSections(n)}} />
                  </div>
                )}
              </Draggable>
            ))}
            {p.placeholder}
          </div>)}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
