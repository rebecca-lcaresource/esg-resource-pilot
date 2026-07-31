export const EM_DASH = '—'

// Overall score is derived in the database (null when any pillar is missing). We never
// recompute it for storage — this is display formatting only.
export function formatOverall(value) {
  if (value === null || value === undefined) return EM_DASH
  return Number(value).toFixed(1)
}

export function formatScore(value) {
  return value === null || value === undefined ? EM_DASH : String(value)
}

export function formatSpend(value) {
  if (value === null || value === undefined || value === '') return EM_DASH
  const n = Number(value)
  if (Number.isNaN(n)) return EM_DASH
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function formatDate(value) {
  if (!value) return EM_DASH
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return EM_DASH
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return EM_DASH
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return EM_DASH
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function displayValue(v) {
  return v === null || v === undefined || v === '' ? EM_DASH : String(v)
}
