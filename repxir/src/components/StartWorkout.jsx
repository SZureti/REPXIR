import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/hooks.js'
import Dialog from './Dialog.jsx'

// Only one active session may exist. Starting another asks:
// Resume / Discard & start new / Cancel (design.md §3).
export function useStartWorkout() {
  const { startSession, active } = useStore()
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)

  const start = async (template) => {
    const result = await startSession(template)
    if (result.conflict) setPending(template)
    else navigate('/session')
  }

  const dialog = (
    <Dialog
      open={Boolean(pending)}
      onClose={() => setPending(null)}
      title="You have a workout in progress"
      description={active ? `${active.name} is still open. Resume it, or discard it to start ${pending?.name ?? 'this workout'}.` : ''}
      size="sm"
      actions={
        <div className="stack stack--sm" style={{ width: '100%' }}>
          <button type="button" className="btn btn--primary btn--block" onClick={() => {
            setPending(null)
            navigate('/session')
          }}>
            Resume {active?.name ?? 'workout'}
          </button>
          <button type="button" className="btn btn--danger-outline btn--block" onClick={async () => {
            const template = pending
            setPending(null)
            await startSession(template, { replace: true })
            navigate('/session')
          }}>
            Discard &amp; start new
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      }
    />
  )

  return { start, dialog }
}
