import axios from 'axios'

const defaultApiBaseUrl =
  'http://localhost:3000/api/v1'

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim()

export const apiBaseUrl = (
  configuredApiBaseUrl ||
  defaultApiBaseUrl
).replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})