import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDateTime, displayValue } from '../lib/format.js'

const FIELD_LABELS = {
  supplier_name: 'Supplier name',
  country: 'Country',
  category: 'Category',
  esg_report_url: 'ESG report URL',
  score_e: 'Environmental score',
  score_s: 'Social score',
  score_g: 'Governance score',
  score_justification: 'Score justification',
  internal_notes: 'Internal notes',
  contract_status: 'Contract status',
  contract_renewal_date: 'Renewal date',
  annual_spend: 'Annual spend',
  is_archived: 'Archived',
}

/**
 * Supplier change history. The query is unfiltered by field on the client — the database
 * RLS on change_log returns only rows the viewer's role may see (production control gets
 * only permitted-field entries). We display whatever comes back.
 */
export default function ChangeHistory({ supplierId, refreshKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('change_log')
        .select('id, field_name, old_value, new_value, changed_at, changed_by, profiles(full_name, email)')
        .eq('supplier_id', supplierId)
        .order('changed_at', { ascending: false })
      if (active) {
        setRows(data || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [supplierId, refreshKey])

  return (
    <div className="card">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Change history</h2>
      </div>
      {loading ? (
        <p className="px-4 py-6 text-sm text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-400">No changes recorded.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-slate-800">
                  {FIELD_LABELS[r.field_name] || r.field_name}
                </span>
                <span className="text-xs text-slate-400">{formatDateTime(r.changed_at)}</span>
              </div>
              <div className="mt-1 text-slate-600">
                <span className="text-slate-400 line-through">{displayValue(r.old_value)}</span>
                <span className="mx-2 text-slate-300">→</span>
                <span className="text-slate-800">{displayValue(r.new_value)}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                by {r.profiles?.full_name || r.profiles?.email || 'unknown'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
