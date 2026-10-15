import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarCheck, ChartNoAxesColumn, Clock, Dumbbell } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import SessionRow from '../components/SessionRow.jsx'
import { isRopeSession } from '../utils/summaries.js'
import { computeStats, groupByDay } from '../utils/stats.js'
import { formatDay, formatHours } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const FILTERS = [
  ['all', 'All'],
  ['strength', 'Strength'],
  ['rope', 'Jump rope'],
]

export default function History() {
  usePageTitle('History')
  const { sessions, prefs } = useStore()
  const [params, setParams] = useSearchParams()
  const type = params.get('type') ?? 'all'

  const filtered = useMemo(() => sessions.filter((s) => {
    if (type === 'rope') return isRopeSession(s)
    if (type === 'strength') return s.exercises.some((ex) => ex.measurement !== 'jumps_duration')
    return true
  }), [sessions, type])
  const groups = groupByDay(filtered)
  const stats = computeStats(sessions)

  if (sessions.length === 0) {
    return (
      <div>
        <PageHeader title="History" subtitle="Every session you finish is saved here." />
        <EmptyState icon={ChartNoAxesColumn} title="No workouts yet"
          body="Every journey starts somewhere. Log your first workout to see your progress take shape.">
          <Link to="/workouts" className="btn btn--primary">Explore workouts</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="History" subtitle="Every session adds to your story." />

      <div className="grid grid--3" style={{ marginBottom: 'var(--rx-space-6)' }}>
        <div className="stat">
          <Dumbbell size={20} className="stat__icon" aria-hidden="true" />
          <span className="stat__value">{stats.totalSessions}</span>
          <span className="stat__label">Workouts total</span>
        </div>
        <div className="stat">
          <CalendarCheck size={20} className="stat__icon" aria-hidden="true" />
          <span className="stat__value">{stats.weeksActive}</span>
          <span className="stat__label">Weeks active</span>
        </div>
        <div className="stat">
          <Clock size={20} className="stat__icon" aria-hidden="true" />
          <span className="stat__value">{formatHours(stats.secondsThisMonth)}</span>
          <span className="stat__label">Time this month</span>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter sessions" style={{ marginBottom: 'var(--rx-space-5)' }}>
        {FILTERS.map(([value, label]) => (
          <button key={value} type="button" className="chip" aria-pressed={type === value}
            onClick={() => setParams(value === 'all' ? {} : { type: value }, { replace: true })}>
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={ChartNoAxesColumn} title="Nothing here yet" body="No sessions match this filter.">
          <button type="button" className="btn btn--secondary" onClick={() => setParams({}, { replace: true })}>Show all sessions</button>
        </EmptyState>
      ) : (
        <div className="stack stack--lg">
          {groups.map((group) => (
            <section key={group.key} className="section" aria-label={formatDay(group.date)}>
              <h2 className="eyebrow">{formatDay(group.date)}</h2>
              <ul className="list">
                {group.sessions.map((s) => (
                  <li key={s.id}><SessionRow session={s} unit={prefs.unit} showDate={false} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
