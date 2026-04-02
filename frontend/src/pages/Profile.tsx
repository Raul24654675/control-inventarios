import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../useAuth'
import { createDraftProfile, persistStoredProfile, readStoredProfile, type StoredUserProfile } from '../profile-storage'
import './Profile.css'

type PasswordNotice = {
  tone: 'success' | 'error'
  message: string
}

const EMPTY_PASSWORD = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return <span className="profile-field-icon" aria-hidden="true">{children}</span>
}

function ProfileInfoCard({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  icon,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  readOnly?: boolean
  icon: ReactNode
}) {
  return (
    <label className="profile-info-card">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-input-wrap">
        <FieldIcon>{icon}</FieldIcon>
        <input
          className="profile-info-input"
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={event => onChange?.(event.target.value)}
        />
      </span>
    </label>
  )
}

export default function Profile() {
  const { email, rol } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<StoredUserProfile>(() => readStoredProfile(email, rol))
  const [savedMessage, setSavedMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD)
  const [passwordNotice, setPasswordNotice] = useState<PasswordNotice | null>(null)

  useEffect(() => {
    if (!savedMessage) return undefined

    const timeoutId = window.setTimeout(() => setSavedMessage(''), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [savedMessage])

  const heroName = profile.displayName || profile.fullName || 'Usuario Rajaski'
  const fullName = profile.fullName || 'Usuario del sistema'
  const initials = heroName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'RK'

  function updateField<K extends keyof StoredUserProfile>(field: K, value: StoredUserProfile[K]) {
    setProfile(current => ({ ...current, [field]: value }))
  }

  function saveProfile(nextProfile: StoredUserProfile, message = 'Perfil actualizado localmente en este navegador.') {
    persistStoredProfile(email, nextProfile)
    setProfile(nextProfile)
    setSavedMessage(message)
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const nextProfile = { ...profile, avatar: reader.result }
        saveProfile(nextProfile, 'Foto de perfil guardada correctamente.')
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveProfile(profile)
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordNotice({ tone: 'error', message: 'Completa los tres campos para continuar.' })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordNotice({ tone: 'error', message: 'La nueva contrasena debe tener al menos 8 caracteres.' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordNotice({ tone: 'error', message: 'La confirmacion no coincide con la nueva contrasena.' })
      return
    }

    setPasswordNotice({
      tone: 'success',
      message: 'Flujo visual listo. La conexion real con backend puede integrarse despues sin cambiar esta UI.',
    })
    setPasswordForm(EMPTY_PASSWORD)
  }

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-copy">
          <span className="profile-kicker">Perfil de usuario</span>
          <h1 className="profile-title">Gestiona tu identidad dentro del sistema</h1>
          <p className="profile-subtitle">
            Revisa tus datos principales, personaliza tu avatar y deja listo el flujo de seguridad desde una interfaz alineada con el dashboard.
          </p>
        </div>

        <div className="profile-summary-card">
          <div className="profile-avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={fullName} className="profile-avatar-image" />
            ) : (
              <span className="profile-avatar-fallback">{initials}</span>
            )}
          </div>
          <div className="profile-summary-text">
            <h2>{heroName}</h2>
            <p>{fullName}</p>
            <span className="profile-role-pill">{profile.roleLabel}</span>
          </div>
          <div className="profile-summary-actions">
            <button type="button" className="btn-outline" onClick={() => fileInputRef.current?.click()}>
              Cambiar foto
            </button>
            <button type="submit" form="profile-form" className="btn-ghost">
              Guardar cambio
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <form id="profile-form" className="profile-panel profile-form-panel" onSubmit={handleSaveProfile}>
          <div className="profile-section-head">
            <div>
              <span className="profile-section-kicker">Informacion</span>
              <h3>Datos personales</h3>
            </div>
            {savedMessage && <span className="profile-save-badge">{savedMessage}</span>}
          </div>

          <div className="profile-info-grid">
            <ProfileInfoCard
              label="Nombre de usuario"
              value={profile.displayName}
              onChange={value => updateField('displayName', value)}
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              }
            />
            <ProfileInfoCard
              label="Nombre completo"
              value={profile.fullName}
              onChange={value => updateField('fullName', value)}
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <ProfileInfoCard
              label="Correo electronico"
              value={email ?? ''}
              type="email"
              readOnly
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              }
            />
            <ProfileInfoCard
              label="Numero de telefono"
              value={profile.phone}
              type="tel"
              onChange={value => updateField('phone', value)}
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.2 18.8 19.5 19.5 0 0 1 5.2 12.8 19.8 19.8 0 0 1 2.08 4.11 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.24a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
                </svg>
              }
            />
            <ProfileInfoCard
              label="Rol dentro de la organizacion"
              value={profile.roleLabel}
              readOnly
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.1 6.3L22 9.3l-5 4.8 1.2 6.9L12 17.7 5.8 21l1.2-6.9-5-4.8 6.9-1z" />
                </svg>
              }
            />
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary">Guardar cambios</button>
            <button type="button" className="btn-ghost" onClick={() => setProfile(createDraftProfile(email, rol))}>
              Restablecer
            </button>
          </div>
        </form>

        <aside className="profile-panel profile-side-panel">
          <div className="profile-section-head">
            <div>
              <span className="profile-section-kicker">Seguridad</span>
              <h3>Acciones recomendadas</h3>
            </div>
          </div>

          <div className="security-card highlight">
            <span className="security-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div>
              <strong>Protege tu acceso</strong>
              <p>Actualiza tu contrasena periodicamente y evita compartir sesiones activas.</p>
            </div>
          </div>

          <div className="security-card compact">
            <span className="security-label">Sesion activa</span>
            <strong>{profile.roleLabel}</strong>
            <p>{email ?? 'Sin correo disponible'}</p>
          </div>

          <button type="button" className="btn-outline profile-password-button" onClick={() => setShowPasswordModal(true)}>
            Cambiar contrasena
          </button>
        </aside>
      </div>

      {showPasswordModal && (
        <div className="profile-modal-backdrop" role="presentation" onClick={() => setShowPasswordModal(false)}>
          <div className="profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="password-modal-title" onClick={event => event.stopPropagation()}>
            <div className="profile-modal-head">
              <div>
                <span className="profile-section-kicker">Seguridad</span>
                <h3 id="password-modal-title">Cambiar contrasena</h3>
              </div>
              <button type="button" className="profile-close-button" onClick={() => setShowPasswordModal(false)}>
                Cerrar
              </button>
            </div>

            <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
              <label className="profile-modal-field">
                <span>Contrasena actual</span>
                <input
                  type="password"
                  className="profile-info-input"
                  value={passwordForm.currentPassword}
                  onChange={event => setPasswordForm(current => ({ ...current, currentPassword: event.target.value }))}
                />
              </label>
              <label className="profile-modal-field">
                <span>Nueva contrasena</span>
                <input
                  type="password"
                  className="profile-info-input"
                  value={passwordForm.newPassword}
                  onChange={event => setPasswordForm(current => ({ ...current, newPassword: event.target.value }))}
                />
              </label>
              <label className="profile-modal-field">
                <span>Confirmar nueva contrasena</span>
                <input
                  type="password"
                  className="profile-info-input"
                  value={passwordForm.confirmPassword}
                  onChange={event => setPasswordForm(current => ({ ...current, confirmPassword: event.target.value }))}
                />
              </label>

              {passwordNotice && (
                <div className={`profile-password-notice ${passwordNotice.tone}`}>
                  {passwordNotice.message}
                </div>
              )}

              <div className="profile-modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Validar cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
