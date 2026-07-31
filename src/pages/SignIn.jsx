import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'

const NEUTRAL_REQUEST_MSG =
  'If that address has been invited, a six-digit code is on its way. Enter it below.'

export default function SignIn() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) {
    navigate('/suppliers', { replace: true })
  }

  async function requestCode(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    // Invite-only: shouldCreateUser:false means an uninvited address gets no account.
    // We show the same neutral message either way so the screen never discloses whether
    // an address is registered.
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    setStep('code')
    setNotice(NEUTRAL_REQUEST_MSG)
  }

  async function verifyCode(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setBusy(false)
    if (verifyError) {
      setError('That code did not work. Check it and try again, or request a new one.')
      return
    }
    navigate('/suppliers', { replace: true })
  }

  async function resend() {
    setError('')
    setBusy(true)
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    setNotice('A new code has been sent if the address is invited.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Supplier ESG Register</h1>
          <p className="mt-1 text-sm text-slate-500">Invitation-only access</p>
        </div>

        <div className="card p-6">
          {step === 'email' && (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="label mb-1">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@company.com"
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Sending…' : 'Send me a code'}
              </button>
              <p className="text-xs text-slate-400">
                We email a six-digit code. There is no password and no clickable link.
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={verifyCode} className="space-y-4">
              {notice && (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{notice}</p>
              )}
              <div>
                <label htmlFor="code" className="label mb-1">
                  Six-digit code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-lg tracking-[0.5em]"
                  placeholder="000000"
                />
                <p className="mt-1 text-xs text-slate-400">Sent to {email}</p>
              </div>
              {error && <p className="text-sm text-lowscore">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={busy || code.length < 6}>
                {busy ? 'Verifying…' : 'Verify and sign in'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setCode('')
                    setError('')
                    setNotice('')
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ← Use a different email
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy}
                  className="font-medium text-primary hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
