import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function NotFound({ title = 'Page not found', body = "That page doesn't exist. It may have moved, or the link may be incomplete." }) {
  usePageTitle(title)
  return (
    <EmptyState icon={Search} title={title} body={body}>
      <Link to="/" className="btn btn--primary">Go home</Link>
      <Link to="/workouts" className="btn btn--secondary">Browse workouts</Link>
    </EmptyState>
  )
}
