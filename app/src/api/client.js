import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Add JWT to headers
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  console.log("JWT sent:", token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, log out
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (email, password) =>
  client.post('/auth/register', { email, password })

export const login = (email, password) =>
  client.post('/auth/login', { email, password })

export const getMe = () =>
  client.get('/auth/me')

// Analyze (unauthenticated)
export const quickRead = (idea) =>
  client.post('/quick-read', { idea })

export const fullAnalysis = (payload) =>
  client.post('/full-analysis', payload)

// Ideas (authenticated)
export const listIdeas = () =>
  client.get('/ideas/')

export const getIdea = (id) =>
  client.get(`/ideas/${id}`)

export const saveIdea = (original_prompt, analysis) =>
  client.post('/ideas/', { original_prompt, analysis })

export const deleteIdea = (id) =>
  client.delete(`/ideas/${id}`)

// Chat
export const sendChat = (ideaId, message) =>
  client.post(`/ideas/${ideaId}/chat/`, { message })
