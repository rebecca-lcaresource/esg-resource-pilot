import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Add a supplier. Collects the identity fields only — every role permitted to add
 * (admin, purchasing, sustainability) may set these. Scores and commercial fields are
 * filled in afterwards on the detail page by whichever role owns them.
 */
export default function AddSupplierModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    supplier_name: '',
    country: '',
    category: '',
    esg_report_url: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      supplier_name: form.supplier_name.trim(),
      country: form.country.trim(),
      category: form.category.trim(),
      esg_report_url: form.esg_report_url.trim() || null,
    }
    const { data, error: insErr } = await supabase
      .from('suppliers')
      .insert(payload)
      .select('id')
      .single()
    setBusy(false)
    if (insErr) {
      setError(insErr.message)
      return
    }
    onCreated(data.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Add supplier</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label mb-1">Supplier name *</label>
            <input
              required
              autoFocus
              value={form.supplier_name}
              onChange={(e) => update('supplier_name', e.target.value)}
              className="input"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1">Country *</label>
              <input
                required
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1">Category *</label>
              <input
                required
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label mb-1">ESG report URL</label>
            <input
              type="url"
              value={form.esg_report_url}
              onChange={(e) => update('esg_report_url', e.target.value)}
              className="input"
              placeholder="https://…"
            />
          </div>
          {error && <p className="text-sm text-lowscore">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Adding…' : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
