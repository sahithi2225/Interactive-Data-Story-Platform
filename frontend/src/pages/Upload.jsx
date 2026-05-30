import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../api/client.js'
import { useDataset } from '../context/DatasetContext.jsx'

export default function Upload() {
  const fileRef = useRef()
  const nav = useNavigate()
  const { setDataset, setAnalysis } = useDataset()
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)

  const upload = async (file) => {
    if (!file) return
    setBusy(true); setProgress(0)
    const form = new FormData(); form.append('file', file)
    try {
      const { data } = await client.post('/datasets/upload', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      })
      setDataset(data)
      toast.success('Uploaded! Running analysis…')
      const { data: a } = await client.get(`/datasets/${data.id}/analyze`)
      setAnalysis(a)
      nav('/dashboard')
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  const loadSample = async () => {
    setBusy(true)
    try {
      const { data } = await client.post('/datasets/load-sample')
      setDataset(data)
      const { data: a } = await client.get(`/datasets/${data.id}/analyze`)
      setAnalysis(a)
      toast.success('Sample loaded!')
      nav('/dashboard')
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="container">
      <h2>Upload a dataset</h2>
      <div className="glass dropzone"
        onClick={()=>fileRef.current?.click()}
        onDragOver={(e)=>e.preventDefault()}
        onDrop={(e)=>{ e.preventDefault(); upload(e.dataTransfer.files[0]) }}>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden
          onChange={(e)=>upload(e.target.files[0])} />
        <h3 style={{ margin: 0 }}>📁 Drop CSV/XLSX here or click to browse</h3>
        <p style={{ color:'var(--muted)' }}>Up to 20 MB. We auto-clean nulls, duplicates, and detect types.</p>
        {busy && (
          <div style={{ maxWidth: 380, margin: '12px auto 0' }}>
            <div className="progress"><div style={{ width: `${progress || 50}%` }} /></div>
            <p style={{ color:'var(--muted)', marginTop: 8 }}>
              {progress < 100 ? `Uploading ${progress}%` : 'Analyzing…'}
            </p>
          </div>
        )}
      </div>
      <div style={{ marginTop: 18, display:'flex', gap: 12 }}>
        <button className="btn ghost" onClick={loadSample} disabled={busy}>⚡ Load sample dataset</button>
      </div>
    </div>
  )
}
