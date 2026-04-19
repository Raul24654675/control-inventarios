import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../useAuth'
import { createDraftProfile, persistStoredProfile, readStoredProfile, type StoredUserProfile } from '../profile-storage'
import './Profile.css'

type CountryPhone = {
  iso2: string
  name: string
  flag: string
  dialCode: string
  minDigits: number
  maxDigits: number
  pattern: number[]
}

const COUNTRIES: CountryPhone[] = [
  { iso2: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'ES', name: 'Espana', flag: '🇪🇸', dialCode: '+34', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55', minDigits: 10, maxDigits: 11, pattern: [2, 4, 4, 1] },
  { iso2: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', minDigits: 9, maxDigits: 9, pattern: [1, 4, 4] },
  { iso2: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', minDigits: 8, maxDigits: 9, pattern: [4, 4, 1] },
  { iso2: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'DO', name: 'Republica Dominicana', flag: '🇩🇴', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'PR', name: 'Puerto Rico', flag: '🇵🇷', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'GB', name: 'Reino Unido', flag: '🇬🇧', dialCode: '+44', minDigits: 10, maxDigits: 10, pattern: [4, 3, 3] },
  { iso2: 'FR', name: 'Francia', flag: '🇫🇷', dialCode: '+33', minDigits: 9, maxDigits: 9, pattern: [1, 2, 2, 2, 2] },
  { iso2: 'DE', name: 'Alemania', flag: '🇩🇪', dialCode: '+49', minDigits: 10, maxDigits: 11, pattern: [3, 3, 4, 1] },
  { iso2: 'IT', name: 'Italia', flag: '🇮🇹', dialCode: '+39', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'NL', name: 'Paises Bajos', flag: '🇳🇱', dialCode: '+31', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'BE', name: 'Belgica', flag: '🇧🇪', dialCode: '+32', minDigits: 9, maxDigits: 9, pattern: [3, 2, 2, 2] },
  { iso2: 'CH', name: 'Suiza', flag: '🇨🇭', dialCode: '+41', minDigits: 9, maxDigits: 9, pattern: [2, 3, 2, 2] },
  { iso2: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', minDigits: 10, maxDigits: 11, pattern: [3, 3, 4, 1] },
  { iso2: 'SE', name: 'Suecia', flag: '🇸🇪', dialCode: '+46', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'NO', name: 'Noruega', flag: '🇳🇴', dialCode: '+47', minDigits: 8, maxDigits: 8, pattern: [3, 2, 3] },
  { iso2: 'DK', name: 'Dinamarca', flag: '🇩🇰', dialCode: '+45', minDigits: 8, maxDigits: 8, pattern: [2, 2, 2, 2] },
  { iso2: 'FI', name: 'Finlandia', flag: '🇫🇮', dialCode: '+358', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'IE', name: 'Irlanda', flag: '🇮🇪', dialCode: '+353', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'PL', name: 'Polonia', flag: '🇵🇱', dialCode: '+48', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'CZ', name: 'Chequia', flag: '🇨🇿', dialCode: '+420', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'HU', name: 'Hungria', flag: '🇭🇺', dialCode: '+36', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'RO', name: 'Rumania', flag: '🇷🇴', dialCode: '+40', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'GR', name: 'Grecia', flag: '🇬🇷', dialCode: '+30', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'TR', name: 'Turquia', flag: '🇹🇷', dialCode: '+90', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'RU', name: 'Rusia', flag: '🇷🇺', dialCode: '+7', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'UA', name: 'Ucrania', flag: '🇺🇦', dialCode: '+380', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', minDigits: 10, maxDigits: 10, pattern: [5, 5] },
  { iso2: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', minDigits: 10, maxDigits: 10, pattern: [4, 3, 3] },
  { iso2: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', minDigits: 11, maxDigits: 11, pattern: [3, 4, 4] },
  { iso2: 'JP', name: 'Japon', flag: '🇯🇵', dialCode: '+81', minDigits: 10, maxDigits: 10, pattern: [2, 4, 4] },
  { iso2: 'KR', name: 'Corea del Sur', flag: '🇰🇷', dialCode: '+82', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', minDigits: 9, maxDigits: 12, pattern: [3, 3, 3, 3] },
  { iso2: 'MY', name: 'Malasia', flag: '🇲🇾', dialCode: '+60', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'SG', name: 'Singapur', flag: '🇸🇬', dialCode: '+65', minDigits: 8, maxDigits: 8, pattern: [4, 4] },
  { iso2: 'TH', name: 'Tailandia', flag: '🇹🇭', dialCode: '+66', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', minDigits: 9, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'PH', name: 'Filipinas', flag: '🇵🇭', dialCode: '+63', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'NZ', name: 'Nueva Zelanda', flag: '🇳🇿', dialCode: '+64', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'ZA', name: 'Sudafrica', flag: '🇿🇦', dialCode: '+27', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'EG', name: 'Egipto', flag: '🇪🇬', dialCode: '+20', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'MA', name: 'Marruecos', flag: '🇲🇦', dialCode: '+212', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', minDigits: 10, maxDigits: 10, pattern: [3, 3, 4] },
  { iso2: 'KE', name: 'Kenia', flag: '🇰🇪', dialCode: '+254', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', minDigits: 9, maxDigits: 9, pattern: [3, 3, 3] },
  { iso2: 'AE', name: 'Emiratos Arabes Unidos', flag: '🇦🇪', dialCode: '+971', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'SA', name: 'Arabia Saudita', flag: '🇸🇦', dialCode: '+966', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
  { iso2: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', minDigits: 9, maxDigits: 9, pattern: [2, 3, 4] },
]

const COUNTRY_BY_ISO = new Map(COUNTRIES.map(country => [country.iso2, country]))
const COUNTRIES_BY_DIAL_LEN = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)

function detectDefaultCountry() {
  const fallback = COUNTRY_BY_ISO.get('CO') ?? COUNTRIES[0]

  try {
    const locale = navigator.language || ''
    const region = locale.includes('-') ? locale.split('-')[1].toUpperCase() : ''
    if (region && COUNTRY_BY_ISO.has(region)) {
      return COUNTRY_BY_ISO.get(region)!
    }
  } catch {
    // no-op
  }

  return fallback
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function parseStoredPhone(value: string) {
  const digits = digitsOnly(value)
  if (!digits) {
    const defaultCountry = detectDefaultCountry()
    return { country: defaultCountry, localDigits: '' }
  }

  for (const country of COUNTRIES_BY_DIAL_LEN) {
    const countryDigits = country.dialCode.replace('+', '')
    if (digits.startsWith(countryDigits)) {
      return { country, localDigits: digits.slice(countryDigits.length) }
    }
  }

  const defaultCountry = detectDefaultCountry()
  return { country: defaultCountry, localDigits: digits }
}

function formatLocalNumber(digits: string, pattern: number[]) {
  if (!digits) return ''
  const chunks: string[] = []
  let cursor = 0

  for (const size of pattern) {
    const part = digits.slice(cursor, cursor + size)
    if (!part) break
    chunks.push(part)
    cursor += size
    if (cursor >= digits.length) break
  }

  if (cursor < digits.length) {
    chunks.push(digits.slice(cursor))
  }

  return chunks.join(' ')
}

function buildPlaceholder(country: CountryPhone) {
  const raw = country.pattern.map(size => '0'.repeat(size)).join(' ')
  return `${country.dialCode} ${raw}`
}

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

function ProfilePhoneField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const parsed = parseStoredPhone(value)
  const [selectedCountry, setSelectedCountry] = useState<CountryPhone>(parsed.country)
  const [localDigits, setLocalDigits] = useState(parsed.localDigits.slice(0, parsed.country.maxDigits))
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [exceeded, setExceeded] = useState(false)

  useEffect(() => {
    const nextParsed = parseStoredPhone(value)
    setSelectedCountry(nextParsed.country)
    setLocalDigits(nextParsed.localDigits.slice(0, nextParsed.country.maxDigits))
  }, [value])

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-phone-country')) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    const formatted = formatLocalNumber(localDigits, selectedCountry.pattern)
    const full = formatted ? `${selectedCountry.dialCode} ${formatted}` : `${selectedCountry.dialCode}`
    onChange(full)
  }, [localDigits, onChange, selectedCountry])

  const filteredCountries = COUNTRIES.filter(country => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.iso2.toLowerCase().includes(query)
    )
  })

  const isInvalid = localDigits.length > 0 && (localDigits.length < selectedCountry.minDigits || exceeded)

  return (
    <label className="profile-info-card phone-info-card">
      <span className="profile-info-label">{label}</span>
      <span className={`profile-info-input-wrap phone-input-wrap ${isInvalid ? 'is-invalid' : ''}`}>
        <FieldIcon>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.2 18.8 19.5 19.5 0 0 1 5.2 12.8 19.8 19.8 0 0 1 2.08 4.11 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.24a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
          </svg>
        </FieldIcon>

        <div className="profile-phone-country" ref={dropdownRef}>
          <button
            type="button"
            className="profile-phone-country-button"
            onClick={() => setOpen(current => !current)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Seleccionar pais"
          >
            <span className="profile-phone-flag">{selectedCountry.flag}</span>
            <span className="profile-phone-prefix">{selectedCountry.dialCode}</span>
            <span className="profile-phone-caret" aria-hidden="true" />
          </button>

          {open && (
            <div className="profile-phone-dropdown" role="dialog" aria-label="Lista de paises">
              <input
                className="profile-phone-search"
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar pais o prefijo"
                autoFocus
              />
              <ul className="profile-phone-list" role="listbox" aria-label="Paises disponibles">
                {filteredCountries.map(country => (
                  <li key={`${country.iso2}-${country.dialCode}`}>
                    <button
                      type="button"
                      className={`profile-phone-option ${selectedCountry.iso2 === country.iso2 ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedCountry(country)
                        setLocalDigits(current => current.slice(0, country.maxDigits))
                        setExceeded(false)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <span className="profile-phone-flag">{country.flag}</span>
                      <span className="profile-phone-name">{country.name}</span>
                      <span className="profile-phone-code">{country.dialCode}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          className="profile-info-input profile-phone-input"
          type="tel"
          inputMode="numeric"
          pattern="[0-9 ]*"
          value={formatLocalNumber(localDigits, selectedCountry.pattern)}
          placeholder={buildPlaceholder(selectedCountry)}
          onChange={event => {
            const rawDigits = digitsOnly(event.target.value)
            setExceeded(rawDigits.length > selectedCountry.maxDigits)
            setLocalDigits(rawDigits.slice(0, selectedCountry.maxDigits))
          }}
          aria-invalid={isInvalid}
        />
      </span>

      {isInvalid && (
        <span className="profile-phone-error">Numero invalido para el pais seleccionado</span>
      )}
      <span className="profile-phone-hint">
        Formato esperado: {buildPlaceholder(selectedCountry)} ({selectedCountry.minDigits}-{selectedCountry.maxDigits} digitos)
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
            <ProfilePhoneField
              label="Numero de telefono"
              value={profile.phone}
              onChange={value => updateField('phone', value)}
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
