import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useStore } from '../store/hooks.js'

const HOUR = 60 * 60 * 1000

// A new deploy installs in the background and waits for the user to reload.
// The prompt is held back while a workout is in progress so logging is never
// interrupted; it appears once the session is finished or discarded.
export default function UpdatePrompt() {
  const { active } = useStore()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // The app rarely does a full navigation, so look for new deploys while it stays open.
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => {})
      }, HOUR)
    },
  })

  const show = needRefresh && !active

  return (
    <div className="update-prompt" aria-live="polite">
      {show && (
        <div className="toast update-prompt__toast">
          <RefreshCw size={18} className="lime" aria-hidden="true" />
          <p className="toast__message">A new version of REPXIR is ready.</p>
          <button type="button" className="btn btn--small btn--secondary" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
          <button type="button" className="icon-btn icon-btn--small" aria-label="Dismiss update" onClick={() => setNeedRefresh(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
