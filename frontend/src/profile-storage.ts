export type StoredUserProfile = {
  displayName: string
  fullName: string
  phone: string
  roleLabel: string
  avatar: string | null
}

export const PROFILE_UPDATED_EVENT = 'profile-updated'

function buildDefaultNames(email: string | null) {
  if (!email) {
    return {
      displayName: 'Usuario Rajaski',
      fullName: 'Usuario del sistema',
    }
  }

  const localPart = email.split('@')[0]
  const words = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())

  const fullName = words.length > 0 ? words.join(' ') : 'Usuario del sistema'

  return {
    displayName: words[0] ?? 'Usuario',
    fullName,
  }
}

export function getProfileStorageKey(email: string | null) {
  return `user-profile:${email ?? 'guest'}`
}

export function createDraftProfile(email: string | null, rol: string | null): StoredUserProfile {
  const names = buildDefaultNames(email)

  return {
    displayName: names.displayName,
    fullName: names.fullName,
    phone: '+57 300 000 0000',
    roleLabel: rol === 'ADMIN' ? 'Administrador' : 'Operador',
    avatar: null,
  }
}

export function readStoredProfile(email: string | null, rol: string | null) {
  const storageKey = getProfileStorageKey(email)
  const baseDraft = createDraftProfile(email, rol)
  const raw = localStorage.getItem(storageKey)

  if (!raw) {
    return baseDraft
  }

  try {
    const stored = JSON.parse(raw) as Partial<StoredUserProfile>
    return {
      ...baseDraft,
      ...stored,
      roleLabel: rol === 'ADMIN' ? 'Administrador' : 'Operador',
    }
  } catch {
    return baseDraft
  }
}

export function persistStoredProfile(email: string | null, profile: StoredUserProfile) {
  const storageKey = getProfileStorageKey(email)
  localStorage.setItem(storageKey, JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: { storageKey, profile } }))
}
