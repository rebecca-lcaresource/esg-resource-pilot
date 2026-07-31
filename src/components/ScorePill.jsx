import { EM_DASH } from '../lib/format.js'

/**
 * Restrained colour coding for a 1–5 pillar score or a derived overall score.
 * Low scores read as low without shouting; missing scores show an em dash, never 0.
 */
function toneFor(value) {
  if (value === null || value === undefined) return 'bg-slate-100 text-slate-400'
  const n = Number(value)
  if (n >= 4) return 'bg-emerald-50 text-accent'
  if (n >= 3) return 'bg-amber-50 text-warning'
  return 'bg-red-50 text-lowscore'
}

export default function ScorePill({ value, decimals = 0 }) {
  const display =
    value === null || value === undefined
      ? EM_DASH
      : decimals > 0
        ? Number(value).toFixed(decimals)
        : String(value)
  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded px-2 py-0.5 text-sm font-semibold tabular-nums ${toneFor(
        value,
      )}`}
    >
      {display}
    </span>
  )
}
