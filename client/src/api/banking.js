import axios from 'axios'

// En dev, Vite proxy redirige /api et /auth vers localhost:3000
// En prod, on pointe directement vers l'URL de l'API
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecte le token JWT sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('banking_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirige vers /login si 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('banking_token')
      localStorage.removeItem('banking_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Comptes ────────────────────────────────────────────────────────────────

export const comptesAPI = {
  lister: () => api.get('/api/comptes'),
  creer: (data) => api.post('/api/comptes', data),
  consulter: (id) => api.get(`/api/comptes/${id}`),
  supprimer: (id) => api.delete(`/api/comptes/${id}`),
}

// ─── Transactions ───────────────────────────────────────────────────────────

export const transactionsAPI = {
  depot: (id, montant) => api.post(`/api/comptes/${id}/depot`, { montant }),
  retrait: (id, montant) => api.post(`/api/comptes/${id}/retrait`, { montant }),
  historique: (id) => api.get(`/api/comptes/${id}/transactions`),
}

export default api
