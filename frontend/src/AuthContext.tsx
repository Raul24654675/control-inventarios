import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Rol } from './types'

interface AuthState {
  token: string | null
  rol: Rol | null
  email: string | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, rol: Rol, email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    rol: (localStorage.getItem('rol') as Rol | null),
    email: localStorage.getItem('email'),
  }))

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

  function login(token: string, rol: Rol, email: string) {
    setAuth({ token, rol, email })
  }

  function logout() {
    setAuth({ token: null, rol: null, email: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
