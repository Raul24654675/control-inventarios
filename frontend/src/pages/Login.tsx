import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../useAuth'
import type { Rol } from '../types'
import rajaskiLogoDark from '../assets/rajaski-logo-dark.svg'
import rajaskiLogoLight from '../assets/rajaski-logo-light.svg'
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
  const { login, theme, setTheme } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'admin' | 'operador'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [capsEmailOn, setCapsEmailOn] = useState(false)
  const [capsPasswordOn, setCapsPasswordOn] = useState(false)

  function updateCapsState(setter: (value: boolean) => void, capsOn: boolean) {
    setter(capsOn)
  }

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
    <div className={`login-page theme-${theme}`}>
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-bg-wave" aria-hidden="true" />

      <div className="login-brand-panel">
        <label className="theme-switch" aria-label="Cambiar tema claro u oscuro">
          <input
            type="checkbox"
            checked={theme === 'light'}
            onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <span className="theme-track" aria-hidden="true">
            <span className="theme-icon theme-icon-moon">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 1 0 21 12.8Z" />
              </svg>
            </span>
            <span className="theme-icon theme-icon-sun">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
              </svg>
            </span>
            <span className="theme-thumb">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 1 0 21 12.8Z" />
                </svg>
              )}
            </span>
          </span>
        </label>

        <img src={theme === 'dark' ? rajaskiLogoDark : rajaskiLogoLight} alt="Rajaski" className="login-logo" />
        <div className="brand-divider" />
        <div className="brand-pills" aria-hidden="true">
          <span className="brand-pill"><i className="dot" />Sistema Activo</span>
          <span className="brand-pill"><i className="dot" />Seguro y Confiable</span>
          <span className="brand-pill"><i className="dot" />Monitoreo en Tiempo Real</span>
        </div>
      </div>

      <div className="login-card">
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
            type="button"
            onClick={() => { setTab('admin'); setError('') }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Administrador
          </button>
          <button
            className={`login-tab ${tab === 'operador' ? 'active' : ''}`}
            type="button"
            onClick={() => { setTab('operador'); setError('') }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
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
              onKeyDown={e => updateCapsState(setCapsEmailOn, e.getModifierState('CapsLock'))}
              onKeyUp={e => updateCapsState(setCapsEmailOn, e.getModifierState('CapsLock'))}
              onBlur={() => setCapsEmailOn(false)}
              placeholder=" "
              required
            />
            <label htmlFor="login-email" className="field-label">Ingresa tu usuario</label>
            <span className="field-line" aria-hidden="true" />
            {capsEmailOn && (
              <span className="caps-indicator caps-indicator-email" title="Mayusculas activadas" aria-label="Mayusculas activadas">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V6" />
                  <path d="m7 11 5-5 5 5" />
                </svg>
              </span>
            )}
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
              onKeyDown={e => updateCapsState(setCapsPasswordOn, e.getModifierState('CapsLock'))}
              onKeyUp={e => updateCapsState(setCapsPasswordOn, e.getModifierState('CapsLock'))}
              onBlur={() => setCapsPasswordOn(false)}
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
            {capsPasswordOn && (
              <span className="caps-indicator caps-indicator-password" title="Mayusculas activadas" aria-label="Mayusculas activadas">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V6" />
                  <path d="m7 11 5-5 5 5" />
                </svg>
              </span>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}
          <button type="submit" disabled={loading} className="login-submit">
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="login-footnote">
          <span className="footnote-ok">Acceso autorizado</span>
          <span className="footnote-sep">•</span>
          <span>Conexion cifrada</span>
        </div>
      </div>
    </div>
  )
}
