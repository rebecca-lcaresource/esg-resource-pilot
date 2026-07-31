import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatDateTime } from '../lib/format.js'

export default function Archive() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: qErr } = await supabase
      .from('suppliers')
      .select('id, supplier_name, country, category, updated_at')
      .eq('is_archived', true)
      .order('supplier_name')
    if (qErr) {
      setError(qErr.message)
      setRows([])
      setLoading(false)
      return
    }

    // Derive who archived each supplier and when from the change_log (field is_archived → true).
    const ids = (data || []).map((r) => r.id)
    let archivedInfo = {}
    if (ids.length) {
      const { data: logs } = await supabase
        .from('change_log')
        .select('supplier_id, changed_at, profiles(full_name, email)')
        .in('supplier_id', ids)
        .eq('field_name', 'is_archived')
        .eq('new_value', 'true')
        .order('changed_at', { ascending: false })
      for (const l of logs || []) {
        if (!archivedInfo[l.supplier_id]) {
          archivedInfo[l.supplier_id] = {
            at: l.changed_at,
            by: l.profiles?.full_name || l.profiles?.email || 'unknown',
          }
        }
      }
    }

    setRows((data || []).map((r) => ({ ...r, archived: archivedInfo[r.id] })))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function restore(id) {
    setError('')
    setMsg('')
    const { error: rErr } = await supabase
      .from('suppliers')
      .update({ is_archived: false })
      .eq('id', id)
    if (rErr) {
      setError(rErr.message)
      return
    }
    setMsg('Supplier restored to the register.')
    load()
  }

  async function deleteForever(id, name) {
    const typed = prompt(
      `Permanent deletion cannot be undone.\n\nType the supplier name exactly to confirm:\n${name}`,
    )
    if (typed === null) return
    if (typed.trim() !== name) {
      setError('The name did not match. Deletion cancelled.')
      return
    }
    setError('')
    setMsg('')
    const { error: dErr } = await supabase.from('suppliers').delete().eq('id', id)
    if (dErr) {
      setError('Deletion was refused: ' + dErr.message)
      return
    }
    setMsg(`${name} was permanently deleted. Its change history has been retained.`)
    load()
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Archive</h1>
      <p className="mb-4 text-sm text-slate-500">
        Archived suppliers. Restore returns them to the register. Permanent deletion is
        irreversible and retains the supplier's change history.
      </p>

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
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Archived
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
                  Nothing archived.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.supplier_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.country}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.archived ? (
                      <>
                        {formatDateTime(r.archived.at)}
                        <span className="block text-xs text-slate-400">by {r.archived.by}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => restore(r.id)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => deleteForever(r.id, r.supplier_name)}
                        className="text-sm font-medium text-lowscore hover:underline"
                      >
                        Delete permanently
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
