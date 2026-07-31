import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import {
  canEdit,
  canRead,
  canArchive,
  suppliersSource,
  CONTRACT_STATUSES,
  FIELD_OWNER_LABEL,
} from '../lib/permissions.js'
import { formatOverall, formatSpend, formatDate, displayValue } from '../lib/format.js'
import ScorePill from '../components/ScorePill.jsx'
import ChangeHistory from '../components/ChangeHistory.jsx'

// Field definitions grouped into sections. Rendering is driven by canRead / canEdit.
const SECTIONS = [
  {
    title: 'Identity',
    fields: [
      { key: 'supplier_name', label: 'Supplier name', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'esg_report_url', label: 'ESG report URL', type: 'url' },
    ],
  },
  {
    title: 'ESG scores',
    fields: [
      { key: 'score_e', label: 'Environmental (E)', type: 'score' },
      { key: 'score_s', label: 'Social (S)', type: 'score' },
      { key: 'score_g', label: 'Governance (G)', type: 'score' },
      { key: 'score_justification', label: 'Score justification', type: 'textarea' },
    ],
  },
  {
    title: 'Commercial',
    fields: [
      { key: 'contract_status', label: 'Contract status', type: 'select' },
      { key: 'contract_renewal_date', label: 'Renewal date', type: 'date' },
      { key: 'annual_spend', label: 'Annual spend (USD)', type: 'currency' },
    ],
  },
  {
    title: 'Notes',
    fields: [{ key: 'internal_notes', label: 'Internal notes', type: 'textarea' }],
  },
]

function readOnlyDisplay(field, value) {
  switch (field.type) {
    case 'currency':
      return formatSpend(value)
    case 'date':
      return formatDate(value)
    case 'url':
      return value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          {value}
        </a>
      ) : (
        '—'
      )
    default:
      return displayValue(value)
  }
}

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const [supplier, setSupplier] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [historyKey, setHistoryKey] = useState(0)

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: qErr } = await supabase
      .from(suppliersSource(role))
      .select('*')
      .eq('id', id)
      .single()
    if (qErr) {
      setError('Could not load this supplier. ' + qErr.message)
      setSupplier(null)
    } else {
      setSupplier(data)
      setForm(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (role) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role])

  const editableKeys = useMemo(() => {
    const keys = []
    for (const s of SECTIONS) for (const f of s.fields) if (canEdit(role, f.key)) keys.push(f.key)
    return keys
  }, [role])

  const dirty = useMemo(
    () => editableKeys.some((k) => (form[k] ?? '') !== (supplier?.[k] ?? '')),
    [editableKeys, form, supplier],
  )

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaveMsg('')
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaveMsg('')
    // Only send fields this role may edit — the database enforces this too, but we never
    // put fields the role can't touch into the payload.
    const payload = {}
    for (const key of editableKeys) {
      let v = form[key]
      if (v === '') v = null
      if (['score_e', 'score_s', 'score_g'].includes(key) && v !== null) v = parseInt(v, 10)
      payload[key] = v
    }
    const { error: upErr } = await supabase.from('suppliers').update(payload).eq('id', id)
    setSaving(false)
    if (upErr) {
      setError('Save was refused: ' + upErr.message)
      return
    }
    setSaveMsg('Saved.')
    await load()
    setHistoryKey((k) => k + 1)
  }

  async function archive() {
    if (!confirm(`Archive ${supplier.supplier_name}? It will move to the Archive.`)) return
    const { error: aErr } = await supabase
      .from('suppliers')
      .update({ is_archived: true })
      .eq('id', id)
    if (aErr) {
      setError('Archive was refused: ' + aErr.message)
      return
    }
    navigate('/suppliers')
  }

  if (loading) return <p className="text-slate-400">Loading…</p>
  if (error && !supplier)
    return (
      <div>
        <Link to="/suppliers" className="text-sm text-primary hover:underline">
          ← Back to register
        </Link>
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-lowscore">
          {error}
        </div>
      </div>
    )
  if (!supplier) return null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/suppliers" className="text-sm text-primary hover:underline">
            ← Back to register
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{supplier.supplier_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canArchive(role) && !supplier.is_archived && (
            <button onClick={archive} className="btn-secondary">
              Archive
            </button>
          )}
          {editableKeys.length > 0 && (
            <button onClick={save} className="btn-primary" disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-lowscore">
          {error}
        </div>
      )}
      {saveMsg && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-accent">
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Overall score banner */}
          <div className="card flex items-center justify-between p-4">
            <span className="label">Overall ESG score</span>
            <div className="flex items-center gap-3">
              <ScorePill value={supplier.overall_score} decimals={1} />
              <span className="text-xs text-slate-400">
                {supplier.overall_score === null
                  ? 'Not all pillars scored'
                  : 'Average of E, S and G'}
              </span>
            </div>
          </div>

          {SECTIONS.map((section) => {
            const readable = section.fields.filter((f) => canRead(role, f.key))
            if (readable.length === 0) return null // whole section hidden for this role
            return (
              <div key={section.title} className="card p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {readable.map((field) => {
                    const editable = canEdit(role, field.key)
                    const value = form[field.key]
                    const colSpan =
                      field.type === 'textarea' ? 'sm:col-span-2' : ''
                    return (
                      <div key={field.key} className={colSpan}>
                        <label className="label mb-1 flex items-center gap-2">
                          {field.label}
                          {!editable && FIELD_OWNER_LABEL[field.key] && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-500">
                              {FIELD_OWNER_LABEL[field.key]}
                            </span>
                          )}
                        </label>
                        {editable ? (
                          <FieldInput field={field} value={value} onChange={(v) => update(field.key, v)} />
                        ) : (
                          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {field.key === 'score_e' ||
                            field.key === 'score_s' ||
                            field.key === 'score_g' ? (
                              <ScorePill value={value} />
                            ) : (
                              readOnlyDisplay(field, value)
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <ChangeHistory supplierId={id} refreshKey={historyKey} />
        </div>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange }) {
  const v = value ?? ''
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="input resize-y"
        />
      )
    case 'score':
      return (
        <input
          type="number"
          min={1}
          max={5}
          step={1}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          placeholder="1–5"
        />
      )
    case 'date':
      return (
        <input type="date" value={v || ''} onChange={(e) => onChange(e.target.value)} className="input" />
      )
    case 'currency':
      return (
        <input
          type="number"
          min={0}
          step="1000"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        />
      )
    case 'url':
      return (
        <input type="url" value={v} onChange={(e) => onChange(e.target.value)} className="input" placeholder="https://…" />
      )
    case 'select':
      return (
        <select value={v} onChange={(e) => onChange(e.target.value)} className="input">
          <option value="">—</option>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )
    default:
      return <input type="text" value={v} onChange={(e) => onChange(e.target.value)} className="input" />
  }
}
