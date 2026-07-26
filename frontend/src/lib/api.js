const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

let authTokenGetter = null
let backendWarmup

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

  return payload?.data ?? payload
}

// Kept outside React so Strict Mode and remounts still produce one silent
// landing-page warmup request.
export function warmBackend() {
  if (!backendWarmup) {
    backendWarmup = apiRequest('/health').catch(() => undefined)
  }
  return backendWarmup
}

export const api = {
  health: () => apiRequest('/health'),
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
  updateSemester: (id, body) => apiRequest(`/semesters/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSemester: (id) => apiRequest(`/semesters/${id}`, { method: 'DELETE' }),
  addSubject: (semesterId, body) => apiRequest(`/semesters/${semesterId}/subjects`, { method: 'POST', body: JSON.stringify(body) }),
  updateSubject: (semesterId, subjectId, body) => apiRequest(`/semesters/${semesterId}/subjects/${subjectId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSubject: (semesterId, subjectId) => apiRequest(`/semesters/${semesterId}/subjects/${subjectId}`, { method: 'DELETE' }),
  addSemesterItem: (semesterId, type, body) => apiRequest(`/semesters/${semesterId}/items/${type}`, { method: 'POST', body: JSON.stringify(body) }),
  updateSemesterItem: (semesterId, type, itemId, body) => apiRequest(`/semesters/${semesterId}/items/${type}/${itemId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSemesterItem: (semesterId, type, itemId) => apiRequest(`/semesters/${semesterId}/items/${type}/${itemId}`, { method: 'DELETE' }),
  addTimetableLecture: (semesterId, body) => apiRequest(`/semesters/${semesterId}/timetable`, { method: 'POST', body: JSON.stringify(body) }),
  updateTimetableLecture: (semesterId, lectureId, body) => apiRequest(`/semesters/${semesterId}/timetable/${lectureId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTimetableLecture: (semesterId, lectureId) => apiRequest(`/semesters/${semesterId}/timetable/${lectureId}`, { method: 'DELETE' }),
  listNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
  clearNotifications: () => apiRequest('/notifications', { method: 'DELETE' }),
  billing: () => apiRequest('/billing'),
  createBillingOrder: (planId) => apiRequest('/billing/orders', { method: 'POST', body: JSON.stringify({ planId }) }),
  verifyBillingPayment: (body) => apiRequest('/billing/verify', { method: 'POST', body: JSON.stringify(body) }),
}
