import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, Dumbbell, Flame, Play } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { useStartWorkout } from '../components/StartWorkout.jsx'
import WorkoutIcon from '../components/WorkoutIcon.jsx'
import { SYSTEM_TEMPLATES_BY_ID, SYSTEM_TEMPLATES } from '../data/templates.js'
import { estimateSeconds, findTemplate } from '../services/workoutService.js'
import { countSets } from '../services/sessionService.js'
import { computeStats, weekDays } from '../utils/stats.js'
import { formatDate, formatMinutes, pluralize } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import SessionRow from '../components/SessionRow.jsx'

const FEATURED = ['system-bodyweight', 'system-kettlebell', 'system-jump-rope', 'system-chest', 'system-glutes', 'system-barbell']

function TodayPlan() {
  const { active, sessions, customWorkouts } = useStore()
  const { start, dialog } = useStartWorkout()

  if (active) {
    const { completed, target } = countSets(active)
    return (
      <section className="card card--hero today-plan" aria-labelledby="plan-title">
        <p className="eyebrow">In progress</p>
        <h2 id="plan-title">{active.name}</h2>
        <p className="muted num">{completed} of {target} sets logged · {active.status === 'paused' ? 'paused' : 'running'}</p>
        <div className="progress" aria-hidden="true">
          <div className="progress__fill" style={{ width: `${target ? (completed / target) * 100 : 0}%` }} />
        </div>
        <Link to="/session" className="btn btn--primary btn--large btn--block">
          Return to workout <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    )
  }

  const last = sessions[0]
  const repeat = last ? findTemplate(last.sourceTemplateId, customWorkouts) : null
  const suggestion = repeat && !repeat.archived ? repeat : SYSTEM_TEMPLATES_BY_ID['system-bodyweight']
  const isRepeat = suggestion === repeat

  return (
    <section className="card card--hero today-plan" aria-labelledby="plan-title">
      <div className="row row--between">
        <p className="eyebrow">{isRepeat ? 'Go again' : "Today's plan"}</p>
        <WorkoutIcon template={suggestion} size="sm" />
      </div>
      <h2 id="plan-title">{suggestion.name}</h2>
      <p className="muted">
        {pluralize(suggestion.exercises.length, 'exercise')} · ~{formatMinutes(estimateSeconds(suggestion))} est.
        {isRepeat ? ` · last done ${formatDate(last.startedAt)}` : ' · no equipment needed'}
      </p>
      <div className="today-plan__actions">
        <button type="button" className="btn btn--primary btn--large" onClick={() => start(suggestion)}>
          <Play size={18} aria-hidden="true" /> Start workout
        </button>
        <Link to={`/workouts/${suggestion.id}`} className="btn btn--secondary btn--large">Details</Link>
      </div>
      {dialog}
    </section>
  )
}

export default function Home() {
  usePageTitle(null)
  const { sessions, prefs } = useStore()
  const stats = computeStats(sessions)
  const days = weekDays(sessions)
  const recent = sessions.slice(0, 3)
  const name = prefs.displayName?.trim()

  return (
    <div className="stack stack--lg">
      <header>
        <h1>{sessions.length ? `Welcome back${name ? `, ${name}` : ''}` : `Make movement count${name ? `, ${name}` : ''}.`}</h1>
        <p className="page-header__subtitle">
          {sessions.length ? 'Your daily dose of progress.' : 'Log your workouts, spot your progress, and build consistency at your own pace.'}
        </p>
      </header>

      <div className="split">
        <div className="stack stack--lg">
          <TodayPlan />

          <section className="section" aria-labelledby="stats-title">
            <div className="section__head">
              <h2 id="stats-title">This week</h2>
            </div>
            <div className="grid grid--3">
              <div className="stat">
                <Dumbbell size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{stats.sessionsThisWeek}</span>
                <span className="stat__label">{stats.sessionsThisWeek === 1 ? 'Workout' : 'Workouts'} this week</span>
              </div>
              <div className="stat">
                <CalendarDays size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{stats.totalSessions}</span>
                <span className="stat__label">Total sessions</span>
              </div>
              <div className="stat">
                <Flame size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{stats.activeDaysThisWeek}<small>/7</small></span>
                <span className="stat__label">Active days</span>
              </div>
            </div>
            <div className="card stack stack--sm">
              <div className="week-bars" role="img" aria-label={`Active on ${stats.activeDaysThisWeek} of 7 days this week`}>
                {days.map((on, i) => (
                  <span key={i} className={`week-bars__bar${on ? ' week-bars__bar--on' : ''}`} />
                ))}
              </div>
              <div className="row row--between caption" aria-hidden="true">
                <span>Mon</span><span>Sun</span>
              </div>
              <p className="small muted">
                {stats.secondsThisWeek > 0
                  ? `${formatMinutes(stats.secondsThisWeek)} of training logged this week. Every session counts.`
                  : 'No sessions yet this week. Your routine is ready whenever you are.'}
              </p>
            </div>
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="section" aria-labelledby="recent-title">
            <div className="section__head">
              <h2 id="recent-title">Recent workouts</h2>
              {sessions.length > 0 && (
                <Link to="/history" className="section__link">View all <ChevronRight size={16} aria-hidden="true" /></Link>
              )}
            </div>
            {recent.length ? (
              <ul className="list">
                {recent.map((s) => (
                  <li key={s.id}><SessionRow session={s} unit={prefs.unit} /></li>
                ))}
              </ul>
            ) : (
              <div className="card">
                <p className="muted">Every journey starts somewhere. Log your first workout to see your progress take shape.</p>
              </div>
            )}
          </section>

          <section className="section" aria-labelledby="prebuilt-title">
            <div className="section__head">
              <h2 id="prebuilt-title">Prebuilt workouts</h2>
              <Link to="/workouts" className="section__link">View all <ChevronRight size={16} aria-hidden="true" /></Link>
            </div>
            <ul className="rail-scroll">
              {FEATURED.map((id) => SYSTEM_TEMPLATES.find((t) => t.id === id)).map((t) => (
                <li key={t.id}>
                  <Link to={`/workouts/${t.id}`} className="card card--interactive feature-card">
                    <WorkoutIcon template={t} />
                    <span className="feature-card__name">{t.name}</span>
                    <span className="caption">{pluralize(t.exercises.length, 'exercise')} · {t.difficulty}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
