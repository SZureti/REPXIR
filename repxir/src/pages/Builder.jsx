import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, CircleAlert, Dumbbell, Plus, Save, Trash2 } from 'lucide-react'
import { useConfirm, useStore, useToast } from '../store/hooks.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ExerciseIcon } from '../components/WorkoutIcon.jsx'
import NotFound from './NotFound.jsx'
import ExercisePicker from './builder/ExercisePicker.jsx'
import { getExercise } from '../data/exercises.js'
import { equipmentLabel, MEASUREMENTS, MUSCLES, muscleLabel } from '../data/taxonomy.js'
import { deriveEquipment, duplicateTemplate, findTemplate, newCustomWorkout } from '../services/workoutService.js'
import { createId } from '../utils/ids.js'
import { formatClock } from '../utils/format.js'
import { toDisplayLoad } from '../utils/units.js'
import { LIMITS, parseBlockFields, validateWorkoutMeta } from '../utils/validators.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const FOCUS_CHOICES = [['', 'Mixed / full body'], ...Object.entries(MUSCLES).filter(([id]) => id !== 'forearms')]

const DEFAULT_FIELDS = {
  reps_weight: { sets: '3', reps: '8-12', restSeconds: '1:00' },
  reps_only: { sets: '3', reps: '8-12', restSeconds: '1:00' },
  duration: { sets: '3', seconds: '30', restSeconds: '0:45' },
  jumps_duration: { sets: '5', jumps: '100', seconds: '1:00', restSeconds: '0:45' },
}

function rowFromBlock(block, unit) {
  const range = block.repsMin != null
    ? (block.repsMax != null && block.repsMax !== block.repsMin ? `${block.repsMin}-${block.repsMax}` : String(block.repsMin))
    : ''
  const measurement = getExercise(block.exerciseId)?.measurement
  return {
    uid: createId('row'),
    exerciseId: block.exerciseId,
    sets: String(block.sets ?? ''),
    reps: range,
    seconds: block.seconds != null ? (measurement === 'duration' ? String(block.seconds) : formatClock(block.seconds)) : '',
    jumps: block.jumps != null ? String(block.jumps) : '',
    restSeconds: formatClock(block.restSeconds ?? 0),
    load: block.loadKg != null ? String(toDisplayLoad(block.loadKg, unit)) : '',
    note: block.note ?? '',
  }
}

function initialDraft(base, unit) {
  return {
    name: base.name ?? '',
    description: base.description ?? '',
    focus: base.focus?.length === 1 ? base.focus[0] : '',
    notes: base.notes ?? '',
    rows: base.exercises.map((b) => rowFromBlock(b, unit)),
  }
}

function Field({ id, label, error, hint, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field__error" id={`${id}-error`}><CircleAlert size={14} aria-hidden="true" style={{ marginTop: 3 }} />{error}</span>}
    </div>
  )
}

function ExerciseRow({ row, index, count, unit, errors, onChange, onMove, onRemove }) {
  const exercise = getExercise(row.exerciseId)
  const m = exercise?.measurement ?? 'reps_only'
  const id = (field) => `row-${row.uid}-${field}`
  const input = (field, props = {}) => (
    <input
      id={id(field)}
      className="input input--num"
      value={row[field]}
      onChange={(e) => onChange({ [field]: e.target.value })}
      aria-invalid={Boolean(errors?.[field])}
      aria-describedby={errors?.[field] ? `${id(field)}-error` : props.hint ? `${id(field)}-hint` : undefined}
      {...props}
    />
  )

  return (
    <li className="card builder-row">
      <div className="row">
        <div className="builder-row__order">
          <button type="button" className="icon-btn icon-btn--small" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${exercise?.name} up`}>
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn icon-btn--small" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${exercise?.name} down`}>
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        </div>
        <ExerciseIcon exercise={exercise} />
        <div className="grow">
          <h3 className="builder-row__title">
            <span className="exercise-row__index num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            {exercise?.name ?? row.exerciseId}
          </h3>
          <p className="caption">{MEASUREMENTS[m]}</p>
        </div>
        <button type="button" className="icon-btn icon-btn--danger" onClick={onRemove} aria-label={`Remove ${exercise?.name}`}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>

      <div className={`builder-row__fields builder-row__fields--${m}`}>
        <Field id={id('sets')} label="Sets" error={errors?.sets}>{input('sets', { inputMode: 'numeric' })}</Field>
        {(m === 'reps_weight' || m === 'reps_only') && (
          <Field id={id('reps')} label="Reps" error={errors?.reps}>{input('reps', { inputMode: 'text', placeholder: '8-12' })}</Field>
        )}
        {m === 'jumps_duration' && (
          <Field id={id('jumps')} label="Jumps" error={errors?.jumps}>{input('jumps', { inputMode: 'numeric', placeholder: '100' })}</Field>
        )}
        {m === 'duration' && (
          <Field id={id('seconds')} label="Seconds" error={errors?.seconds}>{input('seconds', { inputMode: 'numeric', placeholder: '30' })}</Field>
        )}
        {m === 'jumps_duration' && (
          <Field id={id('seconds')} label="Time" error={errors?.seconds}>{input('seconds', { inputMode: 'text', placeholder: '1:00' })}</Field>
        )}
        <Field id={id('restSeconds')} label="Rest" error={errors?.restSeconds}>{input('restSeconds', { inputMode: 'text', placeholder: '1:00' })}</Field>
        {m === 'reps_weight' && (
          <Field id={id('load')} label={`Weight (${unit})`} error={errors?.load}>{input('load', { inputMode: 'decimal', placeholder: 'optional' })}</Field>
        )}
      </div>
      <Field id={id('note')} label="Note (optional)" className="builder-row__note">
        <input id={id('note')} className="input" value={row.note} maxLength={40} placeholder="e.g. each side"
          onChange={(e) => onChange({ note: e.target.value })} />
      </Field>
    </li>
  )
}

function BuilderForm({ base, isEdit }) {
  const { prefs, saveWorkout } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const unit = prefs.unit
  const [draft, setDraft] = useState(() => initialDraft(base, unit))
  const [errors, setErrors] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const initial = useRef(JSON.stringify(initialDraft(base, unit)))
  const dirty = JSON.stringify(draft) !== initial.current
  usePageTitle(isEdit ? `Edit ${base.name}` : 'Create workout')

  // Protect unsaved work from accidental navigation (in-app and tab close).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    // Only react to the transition into "blocked", not every re-render.
    confirm({
      title: 'Discard your changes?',
      body: "You have unsaved changes to this workout. If you leave now, they'll be lost.",
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
      tone: 'danger',
    }).then((ok) => (ok ? blocker.proceed?.() : blocker.reset?.()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state, confirm])
  useEffect(() => {
    if (!dirty) return undefined
    const handler = (e) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const equipment = useMemo(() => deriveEquipment(draft.rows), [draft.rows])

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const updateRow = (uid, patch) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }))
  const moveRow = (index, delta) => setDraft((d) => {
    const rows = [...d.rows]
    const [row] = rows.splice(index, 1)
    rows.splice(index + delta, 0, row)
    return { ...d, rows }
  })
  const removeRow = (uid) => setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.uid !== uid) }))
  const addExercise = (exerciseId) => {
    const m = getExercise(exerciseId)?.measurement ?? 'reps_only'
    setDraft((d) => ({
      ...d,
      rows: [...d.rows, { uid: createId('row'), exerciseId, sets: '', reps: '', seconds: '', jumps: '', restSeconds: '', load: '', note: '', ...DEFAULT_FIELDS[m] }],
    }))
  }

  const validate = () => {
    const meta = validateWorkoutMeta(draft)
    const rowErrors = {}
    const blocks = []
    draft.rows.forEach((row) => {
      const m = getExercise(row.exerciseId)?.measurement ?? 'reps_only'
      const { block, errors: e } = parseBlockFields(row, m, unit)
      if (Object.keys(e).length) rowErrors[row.uid] = e
      blocks.push(block)
    })
    const exercises = draft.rows.length === 0 ? 'Add at least one exercise.' : null
    const count = Object.keys(meta).length + Object.keys(rowErrors).length + (exercises ? 1 : 0)
    return { meta, rowErrors, exercises, count, blocks }
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    const result = validate()
    setErrors(result)
    if (result.count) {
      requestAnimationFrame(() => {
        const first = document.querySelector('.builder [aria-invalid="true"]') ?? document.getElementById('add-exercise')
        first?.focus()
      })
      return
    }
    const focus = draft.focus
      ? [draft.focus]
      : [...new Set(result.blocks.flatMap((b) => getExercise(b.exerciseId)?.primaryMuscles ?? []))].slice(0, 5)
    const workout = {
      ...base,
      name: draft.name.trim(),
      description: draft.description.trim(),
      notes: draft.notes.trim(),
      focus,
      equipment,
      exercises: result.blocks,
    }
    setSaving(true)
    const saved = await saveWorkout(workout)
    if (!saved) {
      setSaving(false)
      return
    }
    notify(isEdit ? 'Workout updated.' : 'Workout saved. Ready whenever you are.', { tone: 'success' })
    navigate(`/workouts/${saved.id}`, { replace: true })
  }

  const metaErrors = errors?.meta ?? {}

  return (
    <form className="builder" onSubmit={handleSave} noValidate>
      <PageHeader
        title={isEdit ? 'Edit workout' : 'Create workout'}
        subtitle={base.duplicatedFrom && !isEdit ? 'Your copy. The original stays unchanged.' : 'Build a routine around your equipment and goals.'}
        back={isEdit ? `/workouts/${base.id}` : '/workouts'}
        backLabel="Back"
        action={<button type="submit" className="btn btn--primary btn--small" style={{ marginTop: 4 }} disabled={saving}>Save</button>}
      />

      {errors?.count > 0 && (
        <div className="form-error" role="alert" style={{ marginBottom: 'var(--rx-space-5)' }}>
          <CircleAlert size={18} aria-hidden="true" style={{ flex: 'none' }} />
          <span>
            {errors.count === 1 ? 'One thing needs fixing' : `${errors.count} things need fixing`} before you can save.
            {errors.exercises ? ` ${errors.exercises}` : ''}
          </span>
        </div>
      )}

      <div className="split">
        <div className="stack stack--lg">
          <section className="card stack" aria-label="Workout details">
            <Field id="workout-name" label="Workout name" error={metaErrors.name}>
              <input id="workout-name" className="input" value={draft.name} maxLength={LIMITS.name.max + 10}
                placeholder="e.g. Upper Body Strength" onChange={(e) => update({ name: e.target.value })}
                aria-invalid={Boolean(metaErrors.name)} aria-describedby={metaErrors.name ? 'workout-name-error' : undefined}
                aria-required="true" />
            </Field>
            <Field id="workout-description" label="Description (optional)" error={metaErrors.description}>
              <textarea id="workout-description" className="textarea" value={draft.description} maxLength={LIMITS.description.max}
                placeholder="e.g. A strength-focused upper body workout" onChange={(e) => update({ description: e.target.value })}
                aria-invalid={Boolean(metaErrors.description)} />
            </Field>
            <div className="grid grid--2-md">
              <Field id="workout-focus" label="Focus">
                <select id="workout-focus" className="select" value={draft.focus} onChange={(e) => update({ focus: e.target.value })}>
                  {FOCUS_CHOICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <div className="field">
                <span className="field__label">Equipment</span>
                <p className="builder-equipment">
                  {equipment.length ? equipment.map(equipmentLabel).join(', ') : <span className="muted">Added from your exercises</span>}
                </p>
              </div>
            </div>
          </section>

          <section className="section" aria-labelledby="builder-exercises">
            <div className="section__head">
              <h2 id="builder-exercises">Exercises</h2>
              <span className="caption">{draft.rows.length} {draft.rows.length === 1 ? 'exercise' : 'exercises'}</span>
            </div>
            <button id="add-exercise" type="button" className={`btn btn--secondary btn--block btn--large${errors?.exercises ? ' btn--error' : ''}`}
              onClick={() => setPickerOpen(true)} aria-describedby={errors?.exercises ? 'exercises-error' : undefined}>
              <Plus size={18} aria-hidden="true" /> Add exercise
            </button>
            {errors?.exercises && <p id="exercises-error" className="field__error">{errors.exercises}</p>}
            {draft.rows.length > 0 && (
              <ol className="stack">
                {draft.rows.map((row, index) => (
                  <ExerciseRow key={row.uid} row={row} index={index} count={draft.rows.length} unit={unit}
                    errors={errors?.rowErrors?.[row.uid]}
                    onChange={(patch) => updateRow(row.uid, patch)}
                    onMove={(delta) => moveRow(index, delta)}
                    onRemove={() => removeRow(row.uid)} />
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="stack stack--lg sticky-col">
          <section className="card stack" aria-label="Notes">
            <Field id="workout-notes" label="Notes (optional)" hint="Shown on the workout page, e.g. cues or setup reminders.">
              <textarea id="workout-notes" className="textarea" value={draft.notes} maxLength={LIMITS.notes.max}
                onChange={(e) => update({ notes: e.target.value })} aria-describedby="workout-notes-hint" />
            </Field>
          </section>
          {draft.rows.length > 0 && (
            <p className="small muted">
              Works: {[...new Set(draft.rows.flatMap((r) => getExercise(r.exerciseId)?.primaryMuscles ?? []))].map(muscleLabel).join(', ')}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--large btn--block" disabled={saving}>
            <Save size={18} aria-hidden="true" /> {isEdit ? 'Save changes' : 'Save workout'}
          </button>
          <p className="caption">
            Changes apply to future sessions only. Workouts you&apos;ve already logged keep the targets they had.
          </p>
        </div>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={addExercise}
        selectedIds={draft.rows.map((r) => r.exerciseId)} />
    </form>
  )
}

function BuilderLoader({ id, fromId }) {
  const { customWorkouts } = useStore()

  // Computed once per route so typing never resets the form.
  const [base] = useState(() => {
    if (id) return findTemplate(id, customWorkouts)
    if (fromId) {
      const source = findTemplate(fromId, customWorkouts)
      return source ? duplicateTemplate(source) : newCustomWorkout()
    }
    return newCustomWorkout()
  })

  if (id && !base) {
    return <NotFound title="Workout not found" body="This custom workout doesn't exist or was deleted." />
  }
  if (base?.origin === 'system') {
    return (
      <EmptyState icon={Dumbbell} title="Built-in workouts are read-only" body="Duplicate this workout to make your own editable copy. The original stays the same.">
        <Link to={`/builder/new?from=${base.id}`} className="btn btn--primary">Duplicate &amp; customize</Link>
      </EmptyState>
    )
  }
  return <BuilderForm base={base} isEdit={Boolean(id)} />
}

// Keyed by route so moving between workouts starts a fresh form.
export default function Builder() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const fromId = params.get('from')
  return <BuilderLoader key={id ?? `new-${fromId ?? ''}`} id={id} fromId={fromId} />
}
