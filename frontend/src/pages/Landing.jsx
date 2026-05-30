import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  { t: 'Smart Charts', d: 'Auto-recommended charts based on column types.' },
  { t: 'AI Insights', d: 'Trends, comparisons, anomalies, recommendations.' },
  { t: 'Story Editor', d: 'Edit AI narratives with drag-and-drop sections.' },
  { t: 'Predictive Forecast', d: '10-step trend prediction with linear regression.' },
  { t: 'PDF & HTML Export', d: 'Share polished reports with one click.' },
  { t: 'Chat with Data', d: 'Ask plain-English questions about your dataset.' },
]

export default function Landing() {
  return (
    <div className="container">
      <motion.section initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
        className="glass" style={{ padding: 48, marginTop: 24 }}>
        <span className="badge">v1.0 · Production-ready</span>
        <h1 style={{ fontSize: 44, margin: '14px 0', lineHeight: 1.1 }}>
          Turn raw data into <span style={{ background: 'linear-gradient(90deg,#1a73e8,#22c1c3)',
            WebkitBackgroundClip: 'text', color: 'transparent' }}>interactive stories.</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 720 }}>
          Upload CSV or Excel. We clean, profile, visualize, and write the executive narrative —
          end-to-end, no-code, in seconds.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
          <Link to="/signup"><button className="btn">Start free</button></Link>
          <Link to="/login"><button className="btn ghost">Sign in</button></Link>
        </div>
      </motion.section>

      <div className="grid cols-3" style={{ marginTop: 28 }}>
        {features.map((f,i) => (
          <motion.div key={f.t} className="glass card"
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay: i*0.05}}>
            <h3>{f.t}</h3>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{f.d}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
