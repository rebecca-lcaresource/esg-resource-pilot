import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Demo Walkthrough — a presenter aid, not part of the product's permission model.
 * A slide-out sidebar that lists the steps for demonstrating the tool end to end,
 * from authentication (signing in with an emailed code) through authorization
 * (the same supplier rendered differently for each role). Available on every
 * screen, including sign-in. Progress is remembered per browser via localStorage.
 *
 * This is convenience only — it renders guidance and nothing else. It never reads
 * or writes supplier data and grants no access; the database remains the sole
 * enforcement of what each role can see and do.
 */

const STORAGE_KEY = 'esg-demo-walkthrough-progress'

// The four pilot role accounts. Codes for the plus-addresses all land in
// lcaresource.pilot@gmail.com (check the Promotions tab).
const ACCOUNTS = {
  admin: 'lcaresource.pilot@gmail.com',
  production: 'lcaresource.pilot+production@gmail.com',
  sustainability: 'lcaresource.pilot+sustainability@gmail.com',
  purchasing: 'lcaresource.pilot+purchasing@gmail.com',
}

const SECTIONS = [
  {
    phase: 'Authentication',
    caption: 'Prove who you are — invite-only, no password, no clickable link.',
    steps: [
      {
        id: 'auth-signin',
        title: 'Sign in with an emailed code',
        body: 'On the sign-in screen, enter the work email, request a code, then type the 8-digit code that arrives by email. There is no password and no magic link to click.',
        account: ACCOUNTS.admin,
        to: '/signin',
        linkLabel: 'Go to sign-in',
      },
      {
        id: 'auth-invite',
        title: 'Point out it is invite-only',
        body: 'An address that was never invited gets the same neutral message and no code — self-registration is disabled. The screen never reveals whether an address is registered.',
      },
    ],
  },
  {
    phase: 'Authorization',
    caption: 'Two people see different things — enforced by the database, not the interface.',
    steps: [
      {
        id: 'authz-admin',
        title: 'Admin — the full picture',
        body: 'Show the register: 14 suppliers, sortable and filterable. Unscored suppliers show an em dash "—", never a fake average, and sort to the bottom. Open a supplier — every field is visible and editable.',
        account: ACCOUNTS.admin,
        to: '/suppliers',
        linkLabel: 'Open the register',
      },
      {
        id: 'authz-pc',
        title: 'Production Control — fields are gone, not greyed',
        body: 'Same suppliers and scores, but open a supplier: score justification, internal notes, contract status, renewal date and annual spend are absent entirely. Read-only — no add / edit / archive. (For a technical audience: open the Network tab and show the restricted fields are not even in the response payload.)',
        account: ACCOUNTS.production,
      },
      {
        id: 'authz-sustainability',
        title: 'Sustainability — edits scores, logs the change',
        body: 'Can edit the E / S / G scores and justification; commercial fields are read-only, labelled "editable by purchasing." Edit a score, save, then scroll to the change history — the edit was logged automatically with who and when.',
        account: ACCOUNTS.sustainability,
      },
      {
        id: 'authz-purchasing',
        title: 'Purchasing — the mirror image',
        body: 'Can edit contract status, renewal date and annual spend; the scores are read-only, labelled "editable by sustainability." The exact inverse of the Sustainability role over the same record.',
        account: ACCOUNTS.purchasing,
      },
      {
        id: 'authz-export',
        title: 'CSV export reflects the same permissions',
        body: "Export as Admin — every column is present. Export as Production Control — the restricted columns are absent from the file, not blank. The export reads the same permission-filtered source as the screen.",
      },
      {
        id: 'authz-admin-power',
        title: 'Admin-only power & the tamper-proof log',
        body: 'Back as Admin: show User Management (assign roles) and the Archive (restore, or permanent-delete behind a type-the-name confirmation). Emphasise the change log is append-only — even the administrator cannot rewrite history.',
        account: ACCOUNTS.admin,
        to: '/users',
        linkLabel: 'Open User Management',
      },
    ],
  },
]

const ALL_STEP_IDS = SECTIONS.flatMap((s) => s.steps.map((step) => step.id))

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function DemoWalkthrough() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(loadProgress)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch {
      /* storage unavailable — progress simply won't persist */
    }
  }, [done])

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const completedCount = ALL_STEP_IDS.filter((id) => done[id]).length
  const total = ALL_STEP_IDS.length

  function toggleStep(id) {
    setDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function resetProgress() {
    setDone({})
  }

  function goTo(path) {
    setOpen(false)
    navigate(path)
  }

  let stepNumber = 0

  return (
    <>
      {/* Launcher — a fixed tab on the right edge, present on every screen. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the demo walkthrough"
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-md
            bg-primary py-3 pl-3 pr-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg
            hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ writingMode: 'vertical-rl' }}
        >
          Demo guide
          {completedCount > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
              {completedCount}/{total}
            </span>
          )}
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Demo walkthrough"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200
          bg-white shadow-2xl transition-transform duration-200 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-primary">Demo walkthrough</h2>
              <p className="mt-0.5 text-xs text-slate-500">Authentication → Authorization</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the demo walkthrough"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {completedCount} of {total} steps
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetProgress}
                  className="font-medium text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${total ? (completedCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {SECTIONS.map((section, si) => (
            <section key={section.phase} className={si > 0 ? 'mt-6' : ''}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-accent">
                  {si + 1}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  {section.phase}
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">{section.caption}</p>

              <ol className="mt-3 space-y-2.5">
                {section.steps.map((step) => {
                  stepNumber += 1
                  const isDone = !!done[step.id]
                  return (
                    <li
                      key={step.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isDone ? 'border-accent/40 bg-accent/5' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStep(step.id)}
                          aria-pressed={isDone}
                          aria-label={
                            isDone ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`
                          }
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border
                            text-[11px] font-bold transition-colors ${
                              isDone
                                ? 'border-accent bg-accent text-white'
                                : 'border-slate-300 bg-white text-slate-400 hover:border-accent'
                            }`}
                        >
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path
                                d="M2.5 6.5l2.5 2.5 4.5-5"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            stepNumber
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              isDone ? 'text-slate-500 line-through' : 'text-slate-800'
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.body}</p>

                          {step.account && (
                            <p className="mt-2 text-[11px] text-slate-500">
                              Sign in as{' '}
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                                {step.account}
                              </span>
                            </p>
                          )}

                          {step.to && (
                            <button
                              type="button"
                              onClick={() => goTo(step.to)}
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              {step.linkLabel || 'Go'} →
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}

          <p className="mt-6 rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            Login note: the four role accounts all deliver to{' '}
            <span className="font-mono">lcaresource.pilot@gmail.com</span> — check the{' '}
            <strong>Promotions</strong> tab. This panel is a presenter aid; it grants no access of
            its own.
          </p>
        </div>
      </aside>
    </>
  )
}
