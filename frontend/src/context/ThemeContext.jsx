import { createContext, useContext, useEffect, useState } from 'react'
const Ctx = createContext(null)
export const useTheme = () => useContext(Ctx)
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('idsp_theme') || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('idsp_theme', theme)
  }, [theme])
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
    {children}
  </Ctx.Provider>
}
