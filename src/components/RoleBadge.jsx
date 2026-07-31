import { ROLE_LABELS } from '../lib/permissions.js'

const STYLES = {
  admin: 'bg-primary text-white',
  purchasing: 'bg-accent text-white',
  sustainability: 'bg-emerald-700 text-white',
  production_control: 'bg-slate-600 text-white',
}

export default function RoleBadge({ role }) {
  if (!role) return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[role] || 'bg-slate-500 text-white'
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  )
}
