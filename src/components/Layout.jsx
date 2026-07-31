import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { isAdmin } from '../lib/permissions.js'
import RoleBadge from './RoleBadge.jsx'

function navClass({ isActive }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
  }`
}

export default function Layout() {
  const { profile, role, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">Supplier ESG Register</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/suppliers" className={navClass}>
                Suppliers
              </NavLink>
              {isAdmin(role) && (
                <>
                  <NavLink to="/users" className={navClass}>
                    Users
                  </NavLink>
                  <NavLink to="/archive" className={navClass}>
                    Archive
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Signed-in identity is persistent on every screen — a functional requirement. */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-800">
                {profile?.full_name || profile?.email || 'Signed in'}
              </div>
              <div className="text-xs text-slate-500">{profile?.email}</div>
            </div>
            <RoleBadge role={role} />
            <button onClick={signOut} className="btn-secondary text-xs">
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
          <NavLink to="/suppliers" className={navClass}>
            Suppliers
          </NavLink>
          {isAdmin(role) && (
            <>
              <NavLink to="/users" className={navClass}>
                Users
              </NavLink>
              <NavLink to="/archive" className={navClass}>
                Archive
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
