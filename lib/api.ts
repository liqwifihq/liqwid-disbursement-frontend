import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/backend',
  timeout: 30_000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== 'undefined') {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?returnTo=${returnTo}`)
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string') return message
    if (typeof error.response?.data?.error === 'string') return error.response.data.error
    if (!error.response) return 'Unable to reach the service. Check that the backend is running.'
  }
  return error instanceof Error ? error.message : fallback
}

export function formatMoney(amount: string | number, currency = 'NGN') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${currency} —`
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }
}

export function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

export function batchDisplayName(batch: { id: string; name?: string | null }) {
  const name = batch.name?.trim()
  return name || `Batch ${shortId(batch.id)}`
}
