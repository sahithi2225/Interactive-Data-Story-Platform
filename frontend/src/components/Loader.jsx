export default function Loader({ label = 'Loading…', progress }) {
  return (
    <div className="glass card" style={{ textAlign: 'center', padding: 30 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 4, margin: '0 auto 14px' }} />
      <div style={{ color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
      {typeof progress === 'number' && (
        <div className="progress"><div style={{ width: `${progress}%` }} /></div>
      )}
    </div>
  )
}
