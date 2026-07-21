export const asArray = (value) => Array.isArray(value) ? value : []

export const asRecord = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export const asText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return fallback
}

export const asNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const displayDate = (value, fallback = 'Not scheduled') => {
  if (!value || typeof value === 'object' && !(value instanceof Date)) return fallback
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? fallback : date.toLocaleDateString()
}
