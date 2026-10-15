import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

// Native <dialog> gives us focus trapping, Escape-to-close, and inert background.
export default function Dialog({ open, onClose, title, description, children, actions, size = 'md', dismissible = true }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        if (dismissible) onClose?.()
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose?.()
      }}
    >
      {open && (
        <div className="dialog__panel">
          <header className="dialog__header">
            <h2 id={titleId} className="dialog__title">{title}</h2>
            {dismissible && (
              <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </header>
          {description && <p id={descId} className="dialog__description">{description}</p>}
          {children && <div className="dialog__body">{children}</div>}
          {actions && <footer className="dialog__actions">{actions}</footer>}
        </div>
      )}
    </dialog>
  )
}
