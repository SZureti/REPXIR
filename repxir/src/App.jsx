import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes.jsx'
import { useStore } from './store/hooks.js'

const router = createBrowserRouter(routes)

function Loading() {
  return (
    <div className="loading" role="status">
      <span className="loading__mark" aria-hidden="true">RX</span>
      <span>Loading your workouts…</span>
    </div>
  )
}

function StorageError() {
  return (
    <div className="loading">
      <div className="empty" style={{ maxWidth: 420 }}>
        <h1>We couldn&apos;t open your workouts</h1>
        <p className="empty__body">Your browser blocked access to local storage. Reload the page, or check that site data is allowed for this site.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  )
}

export default function App() {
  const { status } = useStore()
  if (status === 'loading') return <Loading />
  if (status === 'error') return <StorageError />
  return <RouterProvider router={router} />
}
