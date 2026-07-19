const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

let authTokenGetter = null

export function setAuthTokenGetter(getter) {
  authTokenGetter = getter
}

export async function apiRequest(path, options = {}) {
  const token = authTokenGetter ? await authTokenGetter() : null
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    const message = payload?.message || `Request failed with ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = payload?.code
    error.details = payload?.details
    throw error
  }

  return payload?.data
}

export const api = {
  me: () => apiRequest('/auth/me'),
  updateMe: (body) => apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  deleteMe: () => apiRequest('/users/me', { method: 'DELETE' }),
  dashboard: () => apiRequest('/dashboard'),
  analytics: () => apiRequest('/analytics'),
  listGoals: (params = '') => apiRequest(`/goals${params}`),
  createGoal: (body) => apiRequest('/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id, body) => apiRequest(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal: (id) => apiRequest(`/goals/${id}`, { method: 'DELETE' }),
  listTasks: (params = '') => apiRequest(`/tasks${params}`),
  createTask: (body) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => apiRequest(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  getCanvas: () => apiRequest('/canvas'),
  getCanvasByBrainDump: (id) => apiRequest(`/canvas/${id}`),
  saveCanvas: (body) => apiRequest('/canvas', { method: 'PUT', body: JSON.stringify(body) }),
  saveBrainDumpCanvas: (id, body) => apiRequest(`/canvas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  brainDump: (input) => apiRequest('/canvas/brain-dump', { method: 'POST', body: JSON.stringify({ input }) }),
  listBrainDumps: () => apiRequest('/canvas/brain-dumps'),
  renameBrainDump: (id, title) => apiRequest(`/canvas/brain-dumps/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteBrainDump: (id) => apiRequest(`/canvas/brain-dumps/${id}`, { method: 'DELETE' }),
  duplicateBrainDump: (id) => apiRequest(`/canvas/brain-dumps/${id}/duplicate`, { method: 'POST' }),
  restoreBrainDump: (id) => apiRequest(`/canvas/brain-dumps/${id}/restore`, { method: 'POST' }),
  studyCoach: (prompt) => apiRequest('/ai/study-coach', { method: 'POST', body: JSON.stringify({ prompt }) }),
  listSemesters: () => apiRequest('/semesters'),
  getSemester: (id) => apiRequest(`/semesters/${id}`),
  generateSemester: (body) => apiRequest('/semesters/generate', { method: 'POST', body: JSON.stringify(body) }),
  updateSemesterAssignment: (semesterId, assignmentId, body) => apiRequest(`/semesters/${semesterId}/assignments/${assignmentId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  billing: () => apiRequest('/billing'),
  createBillingOrder: (planId) => apiRequest('/billing/orders', { method: 'POST', body: JSON.stringify({ planId }) }),
  verifyBillingPayment: (body) => apiRequest('/billing/verify', { method: 'POST', body: JSON.stringify(body) }),
}
