import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import WorkoutIcon from './WorkoutIcon.jsx'
import { estimateSeconds } from '../services/workoutService.js'
import { formatMinutes, pluralize } from '../utils/format.js'

export default function TemplateCard({ template, compact = false }) {
  const meta = `${pluralize(template.exercises.length, 'exercise')} · ~${formatMinutes(estimateSeconds(template))}`
  return (
    <Link to={`/workouts/${template.id}`} className={`card card--interactive template-card${compact ? ' template-card--compact' : ''}`}>
      <WorkoutIcon template={template} size={compact ? 'sm' : 'md'} />
      <span className="template-card__body">
        <span className="template-card__name">{template.name}</span>
        <span className="template-card__meta">{meta}</span>
        {(template.origin === 'custom' || template.archived) && (
          <span className="tags" style={{ marginTop: 6 }}>
            {template.archived ? <span className="tag">Archived</span> : <span className="tag tag--lime">Custom</span>}
          </span>
        )}
      </span>
      {!compact && <ChevronRight size={18} className="list-row__chevron" aria-hidden="true" />}
    </Link>
  )
}
