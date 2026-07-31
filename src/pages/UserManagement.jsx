import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { ROLE_LABELS } from '../lib/permissions.js'
import RoleBadge from '../components/RoleBadge.jsx'

const ROLE_OPTIONS = ['admin', 'purchasing', 'sustainability', 'production_control']

export default function UserManagement() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: qErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: true })
    if (qErr) setError(qErr.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function changeRole(id, role) {
    setError('')
    setMsg('')
    const { error: upErr } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setMsg('Role updated.')
    load()
  }

  async function removeUser(id, name) {
    if (!confirm(`Remove access for ${name}? Their profile and role will be deleted.`)) return
    setError('')
    setMsg('')
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', id)
    if (delErr) {
      setError(delErr.message)
      return
    }
    setMsg('Access removed.')
    load()
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">User management</h1>
      <p className="mb-4 text-sm text-slate-500">Assign roles and manage access.</p>

      <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <strong className="font-semibold text-slate-700">Inviting new users:</strong> invitations
        are sent from the Supabase dashboard (Authentication → Users → Invite), which requires
        elevated privileges deliberately kept out of the browser. Once an invited person signs in
        for the first time, they appear here and you can assign their role below.
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-lowscore">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-accent">
          {msg}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No users yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isSelf = r.id === user?.id
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.full_name || '—'}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        // You cannot change your own role — the database blocks it too.
                        <RoleBadge role={r.role} />
                      ) : (
                        <select
                          value={r.role}
                          onChange={(e) => changeRole(r.id, e.target.value)}
                          className="input max-w-[12rem]"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => removeUser(r.id, r.full_name || r.email)}
                          className="text-sm font-medium text-lowscore hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
