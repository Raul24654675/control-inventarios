import { useState, useEffect, type ReactNode } from 'react'
import type { Rol } from './types'
import { AuthContext, type AuthState, type ThemeMode } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    rol: (localStorage.getItem('rol') as Rol | null),
    email: localStorage.getItem('email'),
  }))
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ui-theme')
    return saved === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem('token', auth.token)
      localStorage.setItem('rol', auth.rol ?? '')
      localStorage.setItem('email', auth.email ?? '')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('rol')
      localStorage.removeItem('email')
    }
  }, [auth])

  useEffect(() => {
    localStorage.setItem('ui-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function login(token: string, rol: Rol, email: string) {
    setAuth({ token, rol, email })
  }

  function logout() {
    setAuth({ token: null, rol: null, email: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

