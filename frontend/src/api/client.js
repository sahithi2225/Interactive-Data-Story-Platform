import axios from 'axios'
const baseURL = import.meta.env.VITE_API_URL || '/api'
const client = axios.create({ baseURL })
client.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('idsp_token') || sessionStorage.getItem('idsp_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
client.interceptors.response.use(r => r, err => {
  const msg = err?.response?.data?.detail || err.message || 'Request failed'
  return Promise.reject(new Error(msg))
})
export default client
