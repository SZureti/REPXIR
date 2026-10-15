import { useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { useStore } from '../store/hooks.js'

// Last-resort screen if a page crashes. Data is never lost here: it lives in
// browser storage, and the backup button exports it before anything else.
export default function RouteError() {
  const error = useRouteError()
  const { exportBackup } = useStore()
  if (import.meta.env.DEV) console.error(error)
  return (
    <div className="loading">
      <div className="empty" style={{ maxWidth: 440, margin: '0 16px' }}>
        <span className="empty__icon" aria-hidden="true"><TriangleAlert size={26} /></span>
        <h1>Something went wrong</h1>
        <p className="empty__body">Your saved workouts are safe in this browser. Reload to try again, or export a backup first.</p>
        <div className="row row--wrap" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--primary" onClick={() => window.location.assign('/')}>Reload app</button>
          <button type="button" className="btn btn--secondary" onClick={exportBackup}>Export backup</button>
        </div>
      </div>
    </div>
  )
}
