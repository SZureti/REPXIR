import { Pause, Play, SkipForward } from 'lucide-react'
import { useTick } from '../../hooks/useTick.js'
import { restRemainingMs, sessionElapsedMs, setWorkMs } from '../../services/sessionService.js'
import { formatClock } from '../../utils/format.js'

export function SessionClock({ session, onToggle }) {
  const running = session.status === 'active'
  const now = useTick(running, 1000)
  const seconds = sessionElapsedMs(session, now) / 1000
  return (
    <div className="session-clock">
      <div className="session-clock__time">
        <span className="session-clock__value num" aria-hidden="true">{formatClock(seconds)}</span>
        <span className="caption">{running ? 'Elapsed' : 'Paused'}</span>
        <span className="visually-hidden">{running ? 'Session time running' : 'Session paused'}</span>
      </div>
      <button
        type="button"
        className={`btn btn--small ${running ? 'btn--secondary' : 'btn--primary'}`}
        onClick={onToggle}
        aria-label={running ? 'Pause workout' : 'Resume workout'}
      >
        {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {running ? 'Pause' : 'Resume'}
      </button>
    </div>
  )
}

export function RestTimer({ session, onAdjust, onSkip }) {
  const running = session.rest?.runningSince != null
  const now = useTick(running, 250)
  if (!session.rest) return null
  const remaining = restRemainingMs(session, now)
  const done = remaining <= 0
  const pct = session.rest.totalMs ? (remaining / session.rest.totalMs) * 100 : 0
  return (
    <section className={`card rest-timer${done ? ' rest-timer--done' : ''}`} aria-label="Rest timer">
      <div className="rest-timer__top">
        <div>
          <p className="eyebrow">{done ? 'Rest complete' : running ? 'Resting' : 'Rest paused'}</p>
          <p className="rest-timer__value num" aria-hidden="true">{formatClock(Math.ceil(remaining / 1000))}</p>
          <p className="small muted">{done ? 'Ready when you are.' : 'Recover for your next set.'}</p>
        </div>
        <div className="rest-timer__actions">
          {!done && (
            <>
              <button type="button" className="btn btn--small btn--secondary" onClick={() => onAdjust(-15)} aria-label="Subtract 15 seconds of rest">−15s</button>
              <button type="button" className="btn btn--small btn--secondary" onClick={() => onAdjust(15)} aria-label="Add 15 seconds of rest">+15s</button>
            </>
          )}
          <button type="button" className="btn btn--small btn--primary" onClick={onSkip}>
            <SkipForward size={16} aria-hidden="true" /> {done ? 'Dismiss' : 'Skip'}
          </button>
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress__fill" style={{ width: `${pct}%`, transition: 'none' }} />
      </div>
      <p className="visually-hidden" aria-live="polite">{done ? 'Rest complete.' : ''}</p>
    </section>
  )
}

// Live work time for one timed or jump-rope set.
export function WorkTime({ set, className = '' }) {
  const running = set.workRunningSince != null
  const now = useTick(running, 200)
  const seconds = set.status === 'completed' || (set.seconds != null && !running)
    ? set.seconds ?? 0
    : setWorkMs(set, now) / 1000
  return <span className={`num ${className}`}>{formatClock(seconds)}</span>
}

// Compact countdown for the bottom dock so rest is visible without scrolling.
export function RestLabel({ session, fallback }) {
  const running = session.rest?.runningSince != null
  const now = useTick(running, 500)
  if (!session.rest) return fallback
  const remaining = restRemainingMs(session, now)
  if (remaining <= 0) return <span className="session-dock__rest">Rest done</span>
  return <span className="session-dock__rest">Rest {formatClock(Math.ceil(remaining / 1000))}</span>
}
