import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './contexts.js'
import { X } from 'lucide-react'

let nextId = 1

// Status messages are announced through aria-live regions: polite for
// confirmations, assertive (role="alert") for errors.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((message, { tone = 'info', actions = [], duration } = {}) => {
    const id = nextId++
    setToasts((list) => [...list.slice(-2), { id, message, tone, actions }])
    const ms = duration ?? (tone === 'error' ? 10000 : 3500)
    if (ms > 0) timers.current.set(id, setTimeout(() => dismiss(id), ms))
    return id
  }, [dismiss])

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])
  const polite = toasts.filter((t) => t.tone !== 'error')
  const urgent = toasts.filter((t) => t.tone === 'error')

  const render = (t) => (
    <div key={t.id} className={`toast toast--${t.tone}`}>
      <p className="toast__message">{t.message}</p>
      {t.actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className="btn btn--small btn--ghost"
          onClick={() => {
            dismiss(t.id)
            a.onClick()
          }}
        >
          {a.label}
        </button>
      ))}
      <button type="button" className="icon-btn icon-btn--small" aria-label="Dismiss message" onClick={() => dismiss(t.id)}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        <div aria-live="polite" aria-atomic="false">{polite.map(render)}</div>
        <div role="alert" aria-atomic="false">{urgent.map(render)}</div>
      </div>
    </ToastContext.Provider>
  )
}
