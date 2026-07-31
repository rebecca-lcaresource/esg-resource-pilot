import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { canAddSupplier, suppliersSource } from '../lib/permissions.js'
import { formatOverall, formatDate } from '../lib/format.js'
import { toCsv, downloadCsv } from '../lib/csv.js'
import ScorePill from '../components/ScorePill.jsx'
import AddSupplierModal from '../components/AddSupplierModal.jsx'

const COLUMNS = [
  { key: 'supplier_name', label: 'Supplier', sortable: true, align: 'left' },
  { key: 'country', label: 'Country', sortable: true, align: 'left' },
  { key: 'category', label: 'Category', sortable: true, align: 'left' },
  { key: 'score_e', label: 'E', sortable: true, align: 'center' },
  { key: 'score_s', label: 'S', sortable: true, align: 'center' },
  { key: 'score_g', label: 'G', sortable: true, align: 'center' },
  { key: 'overall_score', label: 'Overall', sortable: true, align: 'center' },
  { key: 'updated_at', label: 'Last updated', sortable: true, align: 'left' },
]

// Nulls always sort last, regardless of direction (never treated as zero).
function compareValues(a, b, key, dir) {
  const va = a[key]
  const vb = b[key]
  const aNull = va === null || va === undefined || va === ''
  const bNull = vb === null || vb === undefined || vb === ''
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1
  let cmp
  if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
  else if (key === 'updated_at') cmp = new Date(va) - new Date(vb)
  else cmp = String(va).localeCompare(String(vb))
  return dir === 'asc' ? cmp : -cmp
}

export default function SupplierList() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'supplier_name', dir: 'asc' })
  const [countryFilter, setCountryFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    const source = suppliersSource(role)
    // The base table needs an is_archived filter; the suppliers_pc view is already
    // scoped to active rows in the database.
    let query = supabase.from(source).select('*')
    if (source === 'suppliers') query = query.eq('is_archived', false)
    const { data, error: qErr } = await query
    if (qErr) {
      setError('Could not load suppliers. ' + qErr.message)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (role) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter(Boolean))].sort(),
    [rows],
  )
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows],
  )

  const visible = useMemo(() => {
    let out = rows
    if (countryFilter) out = out.filter((r) => r.country === countryFilter)
    if (categoryFilter) out = out.filter((r) => r.category === categoryFilter)
    return [...out].sort((a, b) => compareValues(a, b, sort.key, sort.dir))
  }, [rows, countryFilter, categoryFilter, sort])

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  function exportCsv() {
    // Serialises the already permission-filtered rows. For production control these come
    // from suppliers_pc, so restricted columns are absent from the file, not blank.
    const csvColumns = COLUMNS.map((c) => ({
      key: c.key,
      label: c.label,
      get: (r) =>
        c.key === 'overall_score'
          ? formatOverall(r.overall_score)
          : c.key === 'updated_at'
            ? formatDate(r.updated_at)
            : r[c.key],
    }))
    const csv = toCsv(csvColumns, visible)
    downloadCsv('supplier-esg-register.csv', csv)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Supplier register</h1>
          <p className="text-sm text-slate-500">
            {visible.length} active supplier{visible.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label mb-1">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="input min-w-[10rem]"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input min-w-[10rem]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button onClick={exportCsv} className="btn-secondary">
            Export CSV
          </button>
          {canAddSupplier(role) && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              Add supplier
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-lowscore">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-${c.align} text-xs font-semibold uppercase tracking-wide text-slate-500`}
                >
                  <button
                    onClick={() => toggleSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    {c.label}
                    {sort.key === c.key && <span>{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
                  No suppliers match.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/suppliers/${r.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{r.supplier_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.country}</td>
                  <td className="px-4 py-3 text-slate-600">{r.category}</td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={r.score_e} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={r.score_s} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={r.score_g} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={r.overall_score} decimals={1} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddSupplierModal
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false)
            navigate(`/suppliers/${id}`)
          }}
        />
      )}
    </div>
  )
}
