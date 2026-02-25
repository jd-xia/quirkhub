import axios from 'axios'

const TOKEN_KEY = 'kiddoquest.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

// Use Vite env for API base (optional). Default /api so nginx can proxy in production.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const http = axios.create({
  baseURL: apiBaseUrl,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

