/**
 * CSV export. Critically, this serialises exactly the rows/columns already fetched
 * from the permission-filtered source — for production control that is the suppliers_pc
 * view, so restricted columns are absent from the file, not blanked. No separate query.
 */

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.get ? c.get(row) : row[c.key])).join(','))
    .join('\n')
  return header + '\n' + body
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
