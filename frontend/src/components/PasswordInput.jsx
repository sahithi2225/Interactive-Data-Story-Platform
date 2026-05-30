import { useState } from 'react'
export default function PasswordInput({ value, onChange, placeholder = 'Password', ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" type={show ? 'text' : 'password'}
        value={value} onChange={onChange} placeholder={placeholder} {...rest} />
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
