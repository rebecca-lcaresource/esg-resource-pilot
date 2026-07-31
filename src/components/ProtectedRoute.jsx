import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { isAdmin } from '../lib/permissions.js'

/**
 * Route gating is convenience only. Even if someone bypasses this, the database RLS
 * refuses the data — a non-admin hitting /users gets an empty/denied response from
 * Supabase, not merely a redirect.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
    )
  }

  if (!session) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin(role)) {
    return <Navigate to="/suppliers" replace />
  }

  return children
}
