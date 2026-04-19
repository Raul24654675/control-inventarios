import axios from 'axios'

const api = axios.create({ baseURL: '/' })
const isDev = import.meta.env.DEV

function nowStamp() {
  return new Date().toLocaleString('es-CO', { hour12: false })
}

function redactValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value

  const sensitive = new Set(['password', 'token', 'authorization', 'secret', 'refreshToken'])

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item))
  }

  const source = value as Record<string, unknown>
  const out: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(source)) {
    if (sensitive.has(key.toLowerCase())) {
      out[key] = '[REDACTED]'
      continue
    }
    out[key] = redactValue(val)
  }

  return out
}

api.interceptors.request.use((config) => {
  const startedAt = Date.now()
  config.headers['x-client-started-at'] = String(startedAt)

  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (isDev) {
    const stamp = nowStamp()
    const method = (config.method ?? 'GET').toUpperCase()
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`
    const params = config.params ? JSON.stringify(redactValue(config.params)) : '{}'
    const body = config.data ? JSON.stringify(redactValue(config.data)) : '{}'

    console.log(`[FRONTEND][${stamp}] -> ${method} ${url}`)
    console.log(`[FRONTEND][${stamp}]    params=${params}`)
    if (method !== 'GET') {
      console.log(`[FRONTEND][${stamp}]    body=${body}`)
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    if (isDev) {
      const stamp = nowStamp()
      const method = (response.config.method ?? 'GET').toUpperCase()
      const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`
      const startedAt = Number(response.config.headers['x-client-started-at'] ?? Date.now())
      const duration = Date.now() - startedAt

      console.log(
        `[FRONTEND][${stamp}] <- ${method} ${url} status=${response.status} duracionMs=${duration}`,
      )
    }
    return response
  },
  (error) => {
    if (isDev) {
      const stamp = nowStamp()
      const cfg = error?.config ?? {}
      const method = (cfg.method ?? 'GET').toUpperCase()
      const url = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`
      const startedAt = Number(cfg.headers?.['x-client-started-at'] ?? Date.now())
      const duration = Date.now() - startedAt
      const status = error?.response?.status ?? 'SIN_STATUS'

      console.error(
        `[FRONTEND][${stamp}] <- ${method} ${url} status=${status} duracionMs=${duration} ERROR=${error?.message ?? 'Desconocido'}`,
      )
    }
    return Promise.reject(error)
  },
)

export default api
