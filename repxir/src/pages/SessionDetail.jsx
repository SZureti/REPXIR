import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CircleCheck, Play, Trash2 } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { useConfirm } from '../store/hooks.js'
import { useToast } from '../store/hooks.js'
import { useStartWorkout } from '../components/StartWorkout.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { ExerciseIcon } from '../components/WorkoutIcon.jsx'
import NotFound from './NotFound.jsx'
import { getExercise } from '../data/exercises.js'
import { findTemplate } from '../services/workoutService.js'
import { summarizeExercise, summarizeSession } from '../utils/summaries.js'
import { formatClock, formatDate, formatMinutes, formatTime, pluralize } from '../utils/format.js'
import { formatLoad, formatNumber, toDisplayLoad } from '../utils/units.js'
import { LIMITS } from '../utils/validators.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
      {hint && <span className="caption">{hint}</span>}
    </div>
  )
}

function ExerciseLog({ exercise, unit }) {
  const summary = summarizeExercise(exercise)
  const info = getExercise(exercise.exerciseId)
  const m = exercise.measurement
  return (
    <li className="card stack stack--sm">
      <div className="row">
        <ExerciseIcon exercise={info ?? { measurement: m, equipment: exercise.equipment }} />
        <div className="grow">
          <h3>{exercise.name}</h3>
          <p className="caption num">
            {summary.completedSets} of {summary.targetSets} sets completed
            {summary.volumeKg > 0 ? ` · ${formatLoad(summary.volumeKg, unit)} volume` : ''}
          </p>
        </div>
        {exercise.skipped && <span className="tag">Skipped</span>}
      </div>
      <table className="log-table">
        <thead>
          <tr>
            <th scope="col">Set</th>
            {(m === 'reps_weight' || m === 'reps_only') && <th scope="col">Reps</th>}
            {m === 'reps_weight' && <th scope="col">Weight</th>}
            {m === 'jumps_duration' && <th scope="col">Jumps</th>}
            {(m === 'duration' || m === 'jumps_duration') && <th scope="col">Time</th>}
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((set) => {
            const done = set.status === 'completed'
            const dash = <span className="muted">—</span>
            return (
              <tr key={set.id} className={done ? '' : 'log-table__pending'}>
                <td className="num">{set.order}</td>
                {(m === 'reps_weight' || m === 'reps_only') && <td className="num">{done ? set.reps : dash}</td>}
                {m === 'reps_weight' && <td className="num">{done && set.loadKg != null ? formatLoad(set.loadKg, unit) : dash}</td>}
                {m === 'jumps_duration' && <td className="num">{done && set.jumps != null ? set.jumps : dash}</td>}
                {(m === 'duration' || m === 'jumps_duration') && <td className="num">{done && set.seconds != null ? formatClock(set.seconds) : dash}</td>}
                <td>{done ? <span className="tag tag--success">Done</span> : <span className="caption">Not logged</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </li>
  )
}

function NotesEditor({ session }) {
  const { updateSessionNotes } = useStore()
  const { notify } = useToast()
  const [notes, setNotes] = useState(session.notes ?? '')
  const dirty = notes !== (session.notes ?? '')
  return (
    <section className="section" aria-labelledby="notes-title">
      <h2 id="notes-title">Notes</h2>
      <div className="field">
        <label htmlFor="history-notes" className="visually-hidden">Session notes</label>
        <textarea id="history-notes" className="textarea" maxLength={LIMITS.notes.max} value={notes}
          placeholder="Add a note about this session" onChange={(e) => setNotes(e.target.value)} />
      </div>
      {dirty && (
        <div className="row">
          <button type="button" className="btn btn--primary btn--small" onClick={async () => {
            if (await updateSessionNotes(session.id, notes.trim())) notify('Note saved.', { tone: 'success' })
          }}>Save note</button>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setNotes(session.notes ?? '')}>Cancel</button>
        </div>
      )}
    </section>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { sessions, prefs, customWorkouts, deleteSession } = useStore()
  const confirm = useConfirm()
  const { notify } = useToast()
  const { start, dialog } = useStartWorkout()
  const session = sessions.find((s) => s.id === id)
  usePageTitle(session ? session.name : 'Session not found')

  if (!session) {
    return <NotFound title="Session not found" body="This session doesn't exist on this device. It may have been deleted." />
  }

  const summary = summarizeSession(session)
  const unit = prefs.unit
  const justFinished = params.get('done') === '1'
  const current = findTemplate(session.sourceTemplateId, customWorkouts)
  const repeatTemplate = current && !current.archived ? current : session.templateSnapshot

  const stats = [
    { label: 'Sets completed', value: `${summary.completedSets}/${summary.targetSets}` },
    { label: 'Session time', value: formatClock(summary.elapsedSeconds) },
  ]
  if (summary.hasStrength && summary.totalReps > 0) stats.push({ label: 'Total reps', value: summary.totalReps.toLocaleString() })
  if (summary.volumeKg > 0) {
    stats.push({ label: `Volume (${unit})`, value: formatNumber(Math.round(toDisplayLoad(summary.volumeKg, unit))), hint: 'reps × load' })
  }
  if (summary.timedSeconds > 0) stats.push({ label: 'Timed holds', value: formatClock(summary.timedSeconds) })
  if (summary.hasRope) {
    stats.push(
      { label: 'Total jumps', value: summary.totalJumps.toLocaleString() },
      { label: 'Active work time', value: formatClock(summary.ropeWorkSeconds) },
      { label: 'Avg jumps per set', value: summary.avgJumpsPerSet ?? '—' },
      {
        label: 'Pace (jumps/min)',
        value: summary.jumpsPerMinute ?? 'n/a',
        hint: summary.jumpsPerMinute != null ? 'From your logged jumps and time' : 'Unavailable: no work time logged',
      },
    )
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this session?',
      body: 'This permanently removes the session and its sets from your history. This cannot be undone.',
      confirmLabel: 'Delete session',
      tone: 'danger',
    })
    if (ok && (await deleteSession(session.id))) {
      notify('Session deleted.', { tone: 'success' })
      navigate('/history', { replace: true })
    }
  }

  return (
    <div>
      {justFinished && (
        <div className="complete-banner" role="status">
          <CircleCheck size={28} aria-hidden="true" />
          <div>
            <p className="complete-banner__title">Workout complete</p>
            <p className="small">Session saved. Another step forward.</p>
          </div>
        </div>
      )}

      <PageHeader
        title={session.name}
        subtitle={`${formatDate(session.startedAt)} · ${formatTime(session.startedAt)} · ${formatMinutes(summary.elapsedSeconds)}`}
        back="/history"
        backLabel="Back to history"
      />

      <div className="split">
        <div className="stack stack--lg">
          <section aria-label="Summary" className="grid grid--2 grid--stats">
            {stats.map((s) => <Stat key={s.label} {...s} />)}
          </section>

          <section className="section" aria-labelledby="log-title">
            <div className="section__head">
              <h2 id="log-title">Exercises</h2>
              <span className="caption">{pluralize(summary.exercisesLogged, 'exercise')} logged</span>
            </div>
            <ol className="stack">
              {session.exercises.map((ex) => <ExerciseLog key={ex.key} exercise={ex} unit={unit} />)}
            </ol>
          </section>
        </div>

        <div className="stack stack--lg">
          <NotesEditor key={session.id} session={session} />
          <div className="stack stack--sm">
            <button type="button" className="btn btn--primary btn--block" onClick={() => start(repeatTemplate)}>
              <Play size={18} aria-hidden="true" /> Do this workout again
            </button>
            {justFinished && <Link to="/" className="btn btn--secondary btn--block">Done</Link>}
            <button type="button" className="btn btn--ghost btn--block session-discard" onClick={handleDelete}>
              <Trash2 size={16} aria-hidden="true" /> Delete session
            </button>
          </div>
          <p className="caption">
            History is a snapshot of what you logged. Editing a workout later never changes past sessions.
          </p>
        </div>
      </div>
      {dialog}
    </div>
  )
}
