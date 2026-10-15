import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import WorkoutIcon from './WorkoutIcon.jsx'
import { sessionHeadline, summarizeSession } from '../utils/summaries.js'
import { formatDate } from '../utils/format.js'

export default function SessionRow({ session, unit, showDate = true }) {
  const summary = summarizeSession(session)
  const iconTemplate = {
    origin: session.sourceOrigin,
    category: session.category,
    focus: session.templateSnapshot?.focus,
    equipment: session.templateSnapshot?.equipment,
  }
  return (
    <Link to={`/history/${session.id}`} className="list-row">
      <WorkoutIcon template={iconTemplate} size="sm" />
      <span className="list-row__body">
        <span className="list-row__title truncate" style={{ display: 'block' }}>{session.name}</span>
        <span className="list-row__meta num" style={{ display: 'block' }}>
          {showDate ? `${formatDate(session.startedAt)} · ` : ''}{sessionHeadline(session, summary, unit)}
        </span>
      </span>
      <ChevronRight size={18} className="list-row__chevron" aria-hidden="true" />
    </Link>
  )
}
