import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../useAuth'
import type { Rol } from '../types'
import rajaskiLogo from '../assets/rajaski-logo.svg'
import './Login.css'

function decodeRol(token: string): Rol {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.rol as Rol
  } catch {
    return 'OPERADOR'
  }
}

function decodeEmail(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email as string
  } catch {
    return ''
  }
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'admin' | 'operador'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = tab === 'admin' ? '/auth/login/admin' : '/auth/login/operador'
      const { data } = await api.post<{ access_token: string }>(endpoint, { email, password })
      const token = data.access_token
      login(token, decodeRol(token), decodeEmail(token))
      navigate('/equipos', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-logo-wrap">
        <img src={rajaskiLogo} alt="Rajaski" className="login-logo" />
      </div>
      <div className="login-card">
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
            type="button"
            onClick={() => { setTab('admin'); setError('') }}
          >
            Administrador
          </button>
          <button
            className={`login-tab ${tab === 'operador' ? 'active' : ''}`}
            type="button"
            onClick={() => { setTab('operador'); setError('') }}
          >
            Operador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <span className="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </span>
            <input
              id="login-email"
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="login-email" className="field-label">Ingresa tu usuario</label>
            <span className="field-line" aria-hidden="true" />
          </div>

          <div className="field">
            <span className="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            </span>
            <input
              id="login-password"
              className="field-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="login-password" className="field-label">Ingresa tu contrasena</label>
            <button
              type="button"
              className={`toggle-pass ${showPassword ? 'active' : ''}`}
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              onClick={() => setShowPassword(s => !s)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l16 16" />
                  <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                  <path d="M9.88 5.1A10.94 10.94 0 0 1 12 5c5.3 0 9.27 3.11 10.5 7-0.44 1.39-1.33 2.72-2.54 3.86" />
                  <path d="M6.1 6.1C3.88 7.37 2.22 9.53 1.5 12c1.23 3.89 5.2 7 10.5 7 1.7 0 3.3-.32 4.72-.9" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 12C2.73 8.11 6.7 5 12 5s9.27 3.11 10.5 7c-1.23 3.89-5.2 7-10.5 7S2.73 15.89 1.5 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <span className="field-line" aria-hidden="true" />
          </div>

          {error && <div className="error-box">{error}</div>}
          <button type="submit" disabled={loading} className="login-submit">
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>
      </div>
    </div>
  )
}
