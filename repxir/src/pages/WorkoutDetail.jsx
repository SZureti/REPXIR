import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArchiveRestore, Clock, Copy, Hourglass, Layers, Pencil, Play, StickyNote, Timer, Trash2, Wrench } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { useConfirm } from '../store/hooks.js'
import { useToast } from '../store/hooks.js'
import { useStartWorkout } from '../components/StartWorkout.jsx'
import PageHeader from '../components/PageHeader.jsx'
import WorkoutIcon, { ExerciseIcon, JumpRopeIcon } from '../components/WorkoutIcon.jsx'
import ExerciseInfo from '../components/ExerciseInfo.jsx'
import NotFound from './NotFound.jsx'
import { getExercise } from '../data/exercises.js'
import { CATEGORIES, equipmentLabel, muscleLabel } from '../data/taxonomy.js'
import { estimateSeconds, findTemplate, measurementOf, templateEquipment } from '../services/workoutService.js'
import { formatClock, formatMinutes, formatTarget, pluralize } from '../utils/format.js'
import { formatLoad } from '../utils/units.js'
import { LIMITS, parseClockInput, parseWholeNumber } from '../utils/validators.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { deepClone } from '../utils/ids.js'

// Jump-rope targets are set before Start and copied into the session snapshot
// (journey 3, AC 1). The saved template itself is not changed.
function RopeSetup({ block, value, onChange, errors }) {
  const fields = [
    { key: 'sets', label: 'Sets', icon: Layers, hint: 'Number of rounds', inputMode: 'numeric' },
    { key: 'jumps', label: 'Jumps per set', icon: JumpRopeIcon, hint: 'Target jumps', inputMode: 'numeric' },
    { key: 'seconds', label: 'Time per set', icon: Timer, hint: 'm:ss', inputMode: 'text' },
    { key: 'restSeconds', label: 'Rest between sets', icon: Hourglass, hint: 'm:ss', inputMode: 'text' },
  ]
  return (
    <section className="section" aria-labelledby="rope-setup-title">
      <div className="section__head">
        <h2 id="rope-setup-title">Target setup</h2>
        <span className="caption">Defaults: {block.sets} × {block.jumps} jumps · {formatClock(block.seconds)}</span>
      </div>
      <div className="card">
        <div className="grid grid--2 rope-setup">
          {fields.map(({ key, label, icon: Icon, hint, inputMode }) => (
            <div className="field" key={key}>
              <label className="field__label rope-setup__label" htmlFor={`rope-${key}`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </label>
              <input
                id={`rope-${key}`}
                className="input input--num"
                inputMode={inputMode}
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={`rope-${key}-hint${errors[key] ? ` rope-${key}-error` : ''}`}
              />
              <span id={`rope-${key}-hint`} className="field__hint">{hint}</span>
              {errors[key] && <span id={`rope-${key}-error`} className="field__error">{errors[key]}</span>}
            </div>
          ))}
        </div>
        <p className="caption" style={{ marginTop: 'var(--rx-space-3)' }}>
          Set a jump target, a time target, or both. You&apos;ll log your actual jumps and time separately.
        </p>
      </div>
    </section>
  )
}

function parseRopeSetup(value) {
  const errors = {}
  const sets = parseWholeNumber(value.sets, { ...LIMITS.sets, label: 'Sets', required: true })
  const jumps = parseWholeNumber(value.jumps, { ...LIMITS.jumps, label: 'Jumps' })
  const seconds = parseClockInput(value.seconds, { label: 'Time per set', max: 3600 })
  const rest = parseClockInput(value.restSeconds, { label: 'Rest', max: LIMITS.restSeconds.max })
  if (sets.error) errors.sets = sets.error
  if (jumps.error) errors.jumps = jumps.error
  if (seconds.error) errors.seconds = seconds.error
  if (rest.error) errors.restSeconds = rest.error
  if (!jumps.error && !seconds.error && !jumps.value && !seconds.value) errors.jumps = 'Set a jump target, a time target, or both.'
  return {
    errors,
    target: { sets: sets.value, jumps: jumps.value || null, seconds: seconds.value || null, restSeconds: rest.value ?? 0 },
  }
}

function WorkoutDetail({ id }) {
  const navigate = useNavigate()
  const { customWorkouts, setWorkoutArchived, deleteWorkout, prefs } = useStore()
  const confirm = useConfirm()
  const { notify } = useToast()
  const { start, dialog } = useStartWorkout()
  const template = findTemplate(id, customWorkouts)
  usePageTitle(template?.name ?? 'Workout not found')

  const ropeBlock = template?.exercises.length === 1 && measurementOf(template.exercises[0]) === 'jumps_duration'
    ? template.exercises[0]
    : null
  const [rope, setRope] = useState(() => ropeBlock ? {
    sets: String(ropeBlock.sets),
    jumps: ropeBlock.jumps != null ? String(ropeBlock.jumps) : '',
    seconds: ropeBlock.seconds != null ? formatClock(ropeBlock.seconds) : '',
    restSeconds: formatClock(ropeBlock.restSeconds ?? 0),
  } : null)
  const [ropeErrors, setRopeErrors] = useState({})

  if (!template) {
    return <NotFound title="Workout not found" body="This workout doesn't exist or was deleted. Your past sessions are still in History." />
  }

  const isCustom = template.origin === 'custom'
  const equipment = templateEquipment(template)

  const handleStart = () => {
    if (!ropeBlock) return start(template)
    const { errors, target } = parseRopeSetup(rope)
    setRopeErrors(errors)
    if (Object.keys(errors).length) {
      document.getElementById(`rope-${Object.keys(errors)[0]}`)?.focus()
      return undefined
    }
    const configured = deepClone(template)
    configured.exercises[0] = { ...configured.exercises[0], ...target }
    return start(configured)
  }

  const handleArchive = async () => {
    const archiving = !template.archived
    if (archiving) {
      const ok = await confirm({
        title: 'Archive this workout?',
        body: 'It will be hidden from your library. Past sessions stay in History, and you can restore it any time.',
        confirmLabel: 'Archive',
      })
      if (!ok) return
    }
    const saved = await setWorkoutArchived(template.id, archiving)
    if (saved) notify(archiving ? 'Workout archived.' : 'Workout restored.', { tone: 'success' })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this workout?',
      body: 'This permanently removes the routine. Sessions you already logged with it stay in History.',
      confirmLabel: 'Delete workout',
      tone: 'danger',
    })
    if (!ok) return
    if (await deleteWorkout(template.id)) {
      notify('Workout deleted.', { tone: 'success' })
      navigate('/workouts?cat=custom', { replace: true })
    }
  }

  const actions = (
    <div className="detail-actions">
      <button type="button" className="btn btn--primary btn--large btn--block" onClick={handleStart} disabled={template.exercises.length === 0}>
        <Play size={18} aria-hidden="true" /> Start workout
      </button>
      {isCustom ? (
        <Link to={`/builder/${template.id}`} className="btn btn--secondary btn--block">
          <Pencil size={16} aria-hidden="true" /> Edit workout
        </Link>
      ) : (
        <Link to={`/builder/new?from=${template.id}`} className="btn btn--secondary btn--block">
          <Copy size={16} aria-hidden="true" /> Duplicate &amp; customize
        </Link>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader title={template.name} back="/workouts" backLabel="Back to workouts" />

      <div className="split">
        <div className="stack stack--lg">
          <section className="card card--hero detail-hero">
            <div className="row">
              <WorkoutIcon template={template} size="lg" />
              <div className="tags">
                <span className="tag tag--lime">{isCustom ? 'Custom' : CATEGORIES[template.category]}</span>
                {template.focus.slice(0, 2).map((f) => <span key={f} className="tag">{muscleLabel(f)}</span>)}
                <span className="tag">{template.difficulty}</span>
                {template.archived && <span className="tag">Archived</span>}
              </div>
            </div>
            <p className="row small muted">
              <Clock size={16} aria-hidden="true" />
              <span>~{formatMinutes(estimateSeconds(template))} estimated · {pluralize(template.exercises.length, 'exercise')}</span>
            </p>
            {template.description && <p>{template.description}</p>}

            {!ropeBlock && actions}
          </section>

          {ropeBlock && (
            <>
              <RopeSetup block={ropeBlock} value={rope} onChange={setRope} errors={ropeErrors} />
              {actions}
            </>
          )}

          <section className="section" aria-labelledby="exercises-title">
            <div className="section__head">
              <h2 id="exercises-title">Exercises</h2>
              <span className="caption">{pluralize(template.exercises.length, 'exercise')}</span>
            </div>
            {template.exercises.length === 0 ? (
              <p className="card muted">This workout has no exercises yet. Edit it to add some.</p>
            ) : (
              <ol className="list">
                {template.exercises.map((block, index) => {
                  const exercise = getExercise(block.exerciseId)
                  return (
                    <li key={`${block.exerciseId}-${index}`}>
                      <details className="exercise-row">
                        <summary className="list-row">
                          <ExerciseIcon exercise={exercise} />
                          <span className="list-row__body">
                            <span className="list-row__title" style={{ display: 'block' }}>
                              <span className="exercise-row__index num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                              {exercise?.name ?? block.exerciseId}
                            </span>
                            <span className="list-row__meta num" style={{ display: 'block' }}>
                              {formatTarget(block, exercise?.measurement)}
                              {block.loadKg ? ` @ ${formatLoad(block.loadKg, prefs.unit)}` : ''}
                              {block.restSeconds ? ` · rest ${formatClock(block.restSeconds)}` : ''}
                            </span>
                          </span>
                          <span className="exercise-row__toggle caption" aria-hidden="true">How to</span>
                        </summary>
                        <ExerciseInfo exerciseId={block.exerciseId} />
                      </details>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="section" aria-labelledby="equipment-title">
            <h2 id="equipment-title">Equipment needed</h2>
            <div className="card row" style={{ alignItems: 'flex-start' }}>
              <Wrench size={20} className="lime" aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
              <p>{equipment.length ? equipment.map(equipmentLabel).join(', ') : 'None'}</p>
            </div>
          </section>

          {template.notes && (
            <section className="section" aria-labelledby="notes-title">
              <h2 id="notes-title">Notes</h2>
              <div className="card row" style={{ alignItems: 'flex-start' }}>
                <StickyNote size={20} className="lime" aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                <p>{template.notes}</p>
              </div>
            </section>
          )}

          <p className="caption">
            Exercise examples are general references, not medical advice or a substitute for in-person instruction.
            Adjust or skip anything that doesn&apos;t feel right.
          </p>

          {isCustom && (
            <section className="section" aria-label="Manage workout">
              <div className="grid grid--2">
                <button type="button" className="btn btn--secondary" onClick={handleArchive}>
                  {template.archived
                    ? <><ArchiveRestore size={16} aria-hidden="true" /> Restore</>
                    : <><Archive size={16} aria-hidden="true" /> Archive</>}
                </button>
                <button type="button" className="btn btn--danger-outline" onClick={handleDelete}>
                  <Trash2 size={16} aria-hidden="true" /> Delete
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
      {dialog}
    </div>
  )
}

// Keyed by id so per-workout form state resets when moving between workouts.
export default function WorkoutDetailRoute() {
  const { id } = useParams()
  return <WorkoutDetail key={id} id={id} />
}
