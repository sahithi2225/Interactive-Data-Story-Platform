import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('idsp_user') || sessionStorage.getItem('idsp_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  const persist = (token, u, remember) => {
    const store = remember ? localStorage : sessionStorage
    store.setItem('idsp_token', token)
    store.setItem('idsp_user', JSON.stringify(u))
    setUser(u)
  }

  const signup = async (name, email, password, remember = true) => {
    setLoading(true)
    try {
      const { data } = await client.post('/auth/signup', { name, email, password })
      persist(data.access_token, data.user, remember)
      return data.user
    } finally { setLoading(false) }
  }

  const login = async (email, password, remember = true) => {
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', { email, password })
      persist(data.access_token, data.user, remember)
      return data.user
    } finally { setLoading(false) }
  }

  const logout = () => {
    ['idsp_token', 'idsp_user'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>
}
