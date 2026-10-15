import { useCallback, useRef, useState } from 'react'
import { ConfirmContext } from './contexts.js'
import Dialog from '../components/Dialog.jsx'

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve
    setRequest(options)
  }), [])

  const settle = (value) => {
    resolver.current?.(value)
    resolver.current = null
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(request)}
        onClose={() => settle(false)}
        title={request?.title ?? ''}
        description={request?.body}
        size="sm"
        actions={request && (
          <>
            <button type="button" className="btn btn--secondary" onClick={() => settle(false)}>
              {request.cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="button"
              className={`btn ${request.tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
              onClick={() => settle(true)}
            >
              {request.confirmLabel ?? 'Confirm'}
            </button>
          </>
        )}
      />
    </ConfirmContext.Provider>
  )
}
