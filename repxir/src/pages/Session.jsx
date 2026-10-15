import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Flag, History as HistoryIcon, Info, Pause, SkipForward, Timer, Trash2, Undo2 } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { useConfirm } from '../store/hooks.js'
import { useBack } from '../hooks/useBack.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import Dialog from '../components/Dialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ExerciseInfo from '../components/ExerciseInfo.jsx'
import { ExerciseIcon } from '../components/WorkoutIcon.jsx'
import { getExercise } from '../data/exercises.js'
import { equipmentLabel, muscleLabel } from '../data/taxonomy.js'
import * as S from '../services/sessionService.js'
import { formatClock, formatDate, formatTarget, pluralize } from '../utils/format.js'
import { formatLoad } from '../utils/units.js'
import { LIMITS } from '../utils/validators.js'
import { RestLabel, RestTimer, SessionClock } from './session/Timers.jsx'
import SetTable from './session/SetTable.jsx'
import RopeTracker from './session/RopeTracker.jsx'

function PreviousPerformance({ exercise, sessions, unit }) {
  if (exercise.measurement === 'jumps_duration') return null
  const previous = S.previousPerformance(sessions, exercise.exerciseId)
  if (!previous) return null
  const values = previous.sets.map((s) => (exercise.measurement === 'duration' ? `${s.seconds}s` : s.reps)).join(', ')
  const top = previous.sets.reduce((max, s) => Math.max(max, s.loadKg ?? 0), 0)
  return (
    <div className="card row previous">
      <HistoryIcon size={20} className="lime" aria-hidden="true" style={{ flex: 'none' }} />
      <div className="grow">
        <p className="small" style={{ fontWeight: 600 }}>Previous performance</p>
        <p className="small muted num">
          {formatDate(previous.date)} · {pluralize(previous.sets.length, 'set')} × {values}
          {top > 0 ? ` @ ${formatLoad(top, unit)}` : ''}
        </p>
      </div>
    </div>
  )
}

function FinishDialog({ open, session, onClose, onFinish, onDiscard }) {
  const [notes, setNotes] = useState(session.notes ?? '')
  const [busy, setBusy] = useState(false)
  const { completed, target } = S.countSets(session)
  const incomplete = target - completed
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={completed === 0 ? 'No sets logged yet' : incomplete > 0 ? 'Finish with sets left?' : 'Finish workout?'}
      description={
        completed === 0
          ? "You haven't completed any sets. You can keep training, or discard this session instead of saving an empty one."
          : incomplete > 0
            ? `You've completed ${completed} of ${target} sets. Only completed sets are saved to your history.`
            : `All ${target} sets are logged. Nice work.`
      }
      actions={
        <div className="stack stack--sm" style={{ width: '100%' }}>
          {completed > 0 && (
            <button type="button" className="btn btn--primary btn--block btn--large" disabled={busy} onClick={async () => {
              setBusy(true)
              await onFinish(notes.trim().slice(0, LIMITS.notes.max))
              setBusy(false)
            }}>
              <Flag size={18} aria-hidden="true" /> {incomplete > 0 ? 'Finish anyway' : 'Finish & save'}
            </button>
          )}
          <button type="button" className={`btn btn--block ${completed > 0 ? 'btn--secondary' : 'btn--primary'}`} onClick={onClose}>
            Keep training
          </button>
          {completed === 0 && (
            <button type="button" className="btn btn--danger-outline btn--block" onClick={onDiscard}>Discard session</button>
          )}
        </div>
      }
    >
      {completed > 0 && (
        <div className="field">
          <label className="field__label" htmlFor="session-notes">Notes (optional)</label>
          <textarea id="session-notes" className="textarea" maxLength={LIMITS.notes.max} value={notes}
            placeholder="How did it feel? Anything to remember next time?"
            onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}
    </Dialog>
  )
}

export default function Session() {
  const { active, updateActive, finishActive, discardActive, sessions, prefs, dismissRecovery } = useStore()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const goBack = useBack('/')
  const [errors, setErrors] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  usePageTitle(active ? active.name : 'Workout')

  // Being on this page answers the "resume?" question.
  useEffect(() => {
    dismissRecovery()
  }, [dismissRecovery])

  if (!active) {
    return (
      <EmptyState icon={Timer} title="No workout in progress" body="Pick a workout to start a session. Your sets save as you go, even if you close the page.">
        <Link to="/workouts" className="btn btn--primary">Browse workouts</Link>
      </EmptyState>
    )
  }

  const session = active
  const paused = session.status !== 'active'
  const index = Math.min(session.currentIndex, session.exercises.length - 1)
  const exercise = session.exercises[index]
  const isLast = index === session.exercises.length - 1
  const { completed, target } = S.countSets(session)
  const exerciseDone = S.isExerciseDone(exercise)

  const clearError = (setId) => setErrors((e) => {
    if (!e[setId]) return e
    const next = { ...e }
    delete next[setId]
    return next
  })

  const actions = {
    // Typing is debounced; discrete taps (jump counter, entered values) save immediately.
    draft: (key, setId, patch, { immediate = false } = {}) => {
      clearError(setId)
      updateActive((s) => S.updateSetDraft(s, key, setId, patch), { persist: immediate ? 'now' : 'debounce' })
    },
    complete: (key, setId) => {
      let result = null
      updateActive((s, now) => {
        result = S.completeSet(s, key, setId, now)
        return result.session
      })
      if (!result) return
      if (result.error) {
        setErrors((e) => ({ ...e, [setId]: result.error }))
        return
      }
      clearError(setId)
      if (!result.duplicate) {
        const ex = S.findExercise(result.session, key)
        const set = ex?.sets.find((x) => x.id === setId)
        setAnnouncement(`${ex?.name} set ${set?.order} saved.`)
      }
    },
    undo: (key, setId) => updateActive((s) => S.undoSet(s, key, setId)),
    editCompleted: (key, setId, patch) => {
      let error = null
      updateActive((s) => {
        const r = S.updateCompletedSet(s, key, setId, patch)
        error = r.error
        return r.session
      })
      return error
    },
    addSet: (key) => updateActive((s) => S.addSet(s, key)),
    removeSet: (key, setId) => updateActive((s) => S.removePendingSet(s, key, setId)),
    startWork: (key, setId) => updateActive((s, now) => S.startWork(s, key, setId, now)),
    pauseWork: (key, setId) => updateActive((s, now) => S.pauseWork(s, key, setId, now)),
    resetWork: (key, setId) => updateActive((s) => S.resetWork(s, key, setId)),
    updateTarget: (key, targetPatch) => updateActive((s) => S.updateExerciseTarget(s, key, targetPatch)),
  }

  const togglePause = () => updateActive((s, now) => (s.status === 'active' ? S.pauseSession(s, now) : S.resumeSession(s, now)))
  const goTo = (i) => updateActive((s) => S.goToExercise(s, i))

  const handleFinish = async (notes) => {
    updateActive((s) => ({ ...s, notes }), { persist: 'none' })
    const id = await finishActive()
    if (id) navigate(`/history/${id}?done=1`, { replace: true })
  }

  const handleDiscard = async () => {
    setFinishOpen(false)
    const ok = await confirm({
      title: 'Discard this workout?',
      body: 'Sets you logged in this session will be removed. Your history and saved workouts are not affected.',
      confirmLabel: 'Discard session',
      tone: 'danger',
    })
    if (ok) {
      await discardActive()
      navigate('/', { replace: true })
    }
  }

  const info = getExercise(exercise.exerciseId)
  const restSeconds = exercise.target.restSeconds || 60

  return (
    <div className="session">
      <header className="session-header">
        <button type="button" className="icon-btn page-header__back" onClick={goBack} aria-label="Leave workout screen (your session stays open)">
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
        <div className="grow">
          <h1 className="session-header__title">{session.name}</h1>
          <p className="muted small">{paused ? 'Paused' : 'Workout in progress'}</p>
        </div>
        <SessionClock session={session} onToggle={togglePause} />
      </header>

      <div className="session-progress">
        <div className="progress" role="progressbar" aria-label="Sets completed" aria-valuemin={0} aria-valuemax={target} aria-valuenow={completed}>
          <div className="progress__fill" style={{ width: `${target ? (completed / target) * 100 : 0}%` }} />
        </div>
        <div className="row row--between caption num">
          <span>{completed} of {target} sets</span>
          <span>Exercise {index + 1} of {session.exercises.length}</span>
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">{announcement}</p>

      {paused && (
        <div className="banner banner--info paused-banner" role="status">
          <Pause size={18} aria-hidden="true" />
          <p className="grow">Workout paused. Time isn&apos;t counting, and your logged sets are saved.</p>
          <button type="button" className="btn btn--small btn--primary" onClick={togglePause}>Resume</button>
        </div>
      )}

      {session.exercises.length > 1 && (
        <nav className="exercise-strip" aria-label="Exercises in this workout">
          {session.exercises.map((ex, i) => {
            const done = S.isExerciseDone(ex)
            return (
              <button key={ex.key} type="button" className={`exercise-chip${done ? ' exercise-chip--done' : ''}`}
                aria-current={i === index ? 'step' : undefined} onClick={() => goTo(i)}>
                <span className="exercise-chip__num num" aria-hidden="true">{done ? <Check size={12} /> : i + 1}</span>
                <span className="truncate">{ex.name}</span>
                {ex.skipped && <span className="visually-hidden">(skipped)</span>}
              </button>
            )
          })}
        </nav>
      )}

      <div className="split session-body">
        <div className="stack">
          <section className="card exercise-card" aria-labelledby="exercise-title">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <ExerciseIcon exercise={info} />
              <div className="grow">
                <h2 id="exercise-title" className="exercise-card__title">{exercise.name}</h2>
                <p className="small muted num">Target: {formatTarget(exercise.target, exercise.measurement)}</p>
                <p className="caption">
                  {exercise.primaryMuscles.map(muscleLabel).join(', ')} · {exercise.equipment.map(equipmentLabel).join(', ')}
                </p>
              </div>
              <button type="button" className="icon-btn" aria-label={`How to do ${exercise.name}`} onClick={() => setInfoOpen(true)}>
                <Info size={20} aria-hidden="true" />
              </button>
            </div>

            {exercise.skipped ? (
              <div className="banner" style={{ marginTop: 'var(--rx-space-4)' }}>
                <SkipForward size={18} aria-hidden="true" />
                <p className="grow">You skipped this exercise. Any sets you completed still count.</p>
                <button type="button" className="btn btn--small btn--secondary" onClick={() => updateActive((s) => S.setSkipped(s, exercise.key, false))}>
                  <Undo2 size={14} aria-hidden="true" /> Unskip
                </button>
              </div>
            ) : exercise.measurement === 'jumps_duration' ? null : (
              <SetTable exercise={exercise} unit={prefs.unit} disabled={paused} errors={errors} actions={actions} />
            )}
          </section>

          {!exercise.skipped && exercise.measurement === 'jumps_duration' && (
            <RopeTracker exercise={exercise} disabled={paused} error={errors[exercise.sets.find((s) => s.status === 'pending')?.id]} actions={actions} />
          )}
        </div>

        <div className="stack sticky-col">
          <RestTimer
            session={session}
            onAdjust={(delta) => updateActive((s, now) => S.adjustRest(s, delta, now), { persist: 'none' })}
            onSkip={() => updateActive((s) => S.skipRest(s), { persist: 'none' })}
          />

          <PreviousPerformance exercise={exercise} sessions={sessions} unit={prefs.unit} />

          <div className="grid grid--2">
            <button type="button" className="tool-tile" disabled={paused || Boolean(session.rest)}
              onClick={() => updateActive((s, now) => S.startRest(s, exercise.key, restSeconds, now), { persist: 'none' })}>
              <Timer size={20} aria-hidden="true" />
              <span>Rest timer</span>
              <span className="caption num">{formatClock(restSeconds)}</span>
            </button>
            {exercise.skipped ? (
              <button type="button" className="tool-tile" onClick={() => updateActive((s) => S.setSkipped(s, exercise.key, false))}>
                <Undo2 size={20} aria-hidden="true" />
                <span>Unskip</span>
                <span className="caption">Bring it back</span>
              </button>
            ) : (
              <button type="button" className="tool-tile" disabled={exerciseDone}
                onClick={() => updateActive((s) => {
                  const skipped = S.setSkipped(s, exercise.key, true)
                  return isLast ? skipped : S.goToExercise(skipped, index + 1)
                })}>
                <SkipForward size={20} aria-hidden="true" />
                <span>Skip exercise</span>
                <span className="caption">{isLast ? 'Mark as skipped' : 'Go to next'}</span>
              </button>
            )}
          </div>

          <div className="stack stack--sm session-finish">
            <button type="button" className="btn btn--primary btn--large btn--block" onClick={() => setFinishOpen(true)}>
              <Flag size={18} aria-hidden="true" /> Finish workout
            </button>
            <button type="button" className="btn btn--ghost btn--block session-discard" onClick={handleDiscard}>
              <Trash2 size={16} aria-hidden="true" /> Discard session
            </button>
          </div>
        </div>
      </div>

      <div className="session-dock" role="group" aria-label="Exercise navigation">
        <button type="button" className="btn btn--secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ChevronLeft size={18} aria-hidden="true" /> <span className="session-dock__label">Previous</span>
        </button>
        <span className="session-dock__center num">
          <RestLabel session={session} fallback={exercise.name} />
        </span>
        {isLast ? (
          <button type="button" className={`btn ${exerciseDone ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setFinishOpen(true)}>
            <span className="session-dock__label">Finish</span> <Flag size={18} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className={`btn ${exerciseDone ? 'btn--primary' : 'btn--secondary'}`} onClick={() => goTo(index + 1)}>
            <span className="session-dock__label">Next</span> <ChevronRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} title={exercise.name}>
        <ExerciseInfo exerciseId={exercise.exerciseId} />
      </Dialog>

      {finishOpen && (
        <FinishDialog open session={session} onClose={() => setFinishOpen(false)} onFinish={handleFinish} onDiscard={handleDiscard} />
      )}
    </div>
  )
}
