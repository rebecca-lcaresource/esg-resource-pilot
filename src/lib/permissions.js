/**
 * UI permission model — a convenience mirror of the database RLS policies.
 * The database is the real enforcement; this only decides what to render and
 * which source to query. Never treat this file as a security control.
 */

export const ROLES = {
  admin: 'admin',
  purchasing: 'purchasing',
  sustainability: 'sustainability',
  production_control: 'production_control',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  purchasing: 'Purchasing',
  sustainability: 'Sustainability',
  production_control: 'Production Control',
}

export const CONTRACT_STATUSES = ['Active', 'In renewal', 'Under review', 'Expired']

// Columns production control is permitted to read. Must match the suppliers_pc view
// and the change_log RLS filter in the database.
export const PC_READABLE_FIELDS = [
  'supplier_name',
  'country',
  'category',
  'esg_report_url',
  'score_e',
  'score_s',
  'score_g',
  'overall_score',
  'updated_at',
]

const IDENTITY_FIELDS = ['supplier_name', 'country', 'category', 'esg_report_url']
const SCORE_FIELDS = ['score_e', 'score_s', 'score_g', 'score_justification']
const COMMERCIAL_FIELDS = ['contract_status', 'contract_renewal_date', 'annual_spend']

// Which fields each role may edit (mirrors the enforce_supplier_column_permissions trigger).
const EDITABLE_BY_ROLE = {
  admin: [...IDENTITY_FIELDS, ...SCORE_FIELDS, 'internal_notes', ...COMMERCIAL_FIELDS, 'is_archived'],
  sustainability: [...IDENTITY_FIELDS, ...SCORE_FIELDS, 'internal_notes', 'is_archived'],
  purchasing: [...IDENTITY_FIELDS, ...COMMERCIAL_FIELDS, 'internal_notes', 'is_archived'],
  production_control: [],
}

// Human label for who owns a read-only field, shown next to it in the detail view.
export const FIELD_OWNER_LABEL = {
  score_e: 'editable by sustainability',
  score_s: 'editable by sustainability',
  score_g: 'editable by sustainability',
  score_justification: 'editable by sustainability',
  contract_status: 'editable by purchasing',
  contract_renewal_date: 'editable by purchasing',
  annual_spend: 'editable by purchasing',
}

export function canRead(role, field) {
  if (role === ROLES.production_control) return PC_READABLE_FIELDS.includes(field)
  return true // admin, purchasing, sustainability read all columns
}

export function canEdit(role, field) {
  return (EDITABLE_BY_ROLE[role] || []).includes(field)
}

export function canAddSupplier(role) {
  return [ROLES.admin, ROLES.purchasing, ROLES.sustainability].includes(role)
}

export function canArchive(role) {
  return [ROLES.admin, ROLES.purchasing, ROLES.sustainability].includes(role)
}

export function isAdmin(role) {
  return role === ROLES.admin
}

// Production control reads the restricted view; everyone else reads the base table.
export function suppliersSource(role) {
  return role === ROLES.production_control ? 'suppliers_pc' : 'suppliers'
}
