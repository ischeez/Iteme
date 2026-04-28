import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) {
    return envUrl
  }

  // In development (including ngrok -> Vite), route through Vite proxy.
  if (import.meta.env.DEV) {
    return '/api'
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const { protocol, hostname } = window.location
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocalhost) {
    return 'http://localhost:3000'
  }

  // For non-local hosts (Telegram WebView/tunnels), prefer same-origin API.
  // Production/tunnel setups should set VITE_API_URL explicitly.
  return `${protocol}//${hostname}`
}

const baseURL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token ?? localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('ngrok')) {
    config.headers['ngrok-skip-browser-warning'] = 'true'
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)
