import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  const { login, loading } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password, remember)
      toast.success('Welcome back!')
      nav('/upload')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <form className="glass card" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <label className="label">Email</label>
        <input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
        <div style={{ height: 12 }} />
        <label className="label">Password</label>
        <PasswordInput value={password} onChange={e=>setPassword(e.target.value)} />
        <label style={{ display:'flex', gap:6, alignItems:'center', marginTop: 12, color:'var(--muted)' }}>
          <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me
        </label>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
          {loading ? <span className="spinner"/> : 'Sign in'}
        </button>
        <p style={{ marginTop: 12, color:'var(--muted)' }}>No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  )
}
