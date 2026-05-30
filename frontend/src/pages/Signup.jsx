import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Signup() {
  const { signup, loading } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account created!')
      nav('/upload')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <form className="glass card" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <label className="label">Name</label>
        <input className="input" required value={form.name} onChange={set('name')} />
        <div style={{ height: 12 }} />
        <label className="label">Email</label>
        <input className="input" type="email" required value={form.email} onChange={set('email')} />
        <div style={{ height: 12 }} />
        <label className="label">Password</label>
        <PasswordInput value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: 18 }}>
          {loading ? <span className="spinner"/> : 'Create account'}
        </button>
        <p style={{ marginTop: 12, color:'var(--muted)' }}>Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
