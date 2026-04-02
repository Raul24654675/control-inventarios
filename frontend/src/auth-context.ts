import { createContext } from 'react'
import type { Rol } from './types'

export interface AuthState {
  token: string | null
  rol: Rol | null
  email: string | null
}

export interface AuthContextValue extends AuthState {
  login: (token: string, rol: Rol, email: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
