import { createContext } from 'react'
import type { Rol } from './types'

export interface AuthState {
  token: string | null
  rol: Rol | null
  email: string | null
}

export type ThemeMode = 'dark' | 'light'

export interface AuthContextValue extends AuthState {
  login: (token: string, rol: Rol, email: string) => void
  logout: () => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
