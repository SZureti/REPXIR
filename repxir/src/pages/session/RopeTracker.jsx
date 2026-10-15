import { useState } from 'react'
import { Check, Hourglass, Layers, Pause, Pencil, Play, Plus, RotateCcw, Timer } from 'lucide-react'
import Dialog from '../../components/Dialog.jsx'
import { JumpRopeIcon } from '../../components/WorkoutIcon.jsx'
import { useConfirm } from '../../store/hooks.js'
import { effectiveSeconds } from '../../services/sessionService.js'
import { formatClock } from '../../utils/format.js'
import { LIMITS, parseClockInput, parseWholeNumber } from '../../utils/validators.js'
import { WorkTime } from './Timers.jsx'

const STEPS = [1, 10, 25]

function TargetTiles({ target, onEdit, disabled }) {
  const tiles = [
    { icon: Layers, value: target.sets, label: 'Sets' },
    { icon: JumpRopeIcon, value: target.jumps ?? '—', label: 'Jumps per set' },
    { icon: Timer, value: target.seconds ? formatClock(target.seconds) : '—', label: 'Time per set' },
    { icon: Hourglass, value: formatClock(target.restSeconds ?? 0), label: 'Rest between sets' },
  ]
  return (
    <section className="card stack stack--sm" aria-labelledby="rope-target-title">
      <div className="row row--between">
        <h3 id="rope-target-title">Target setup</h3>
        <button type="button" className="btn btn--small btn--ghost" onClick={onEdit} disabled={disabled}>
          <Pencil size={14} aria-hidden="true" /> Edit
        </button>
      </div>
      <dl className="rope-targets">
        {tiles.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rope-targets__tile">
            <Icon size={18} aria-hidden="true" />
            <dd className="num">{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function EntryDialog({ open, title, description, fields, onSubmit, onClose, extraAction }) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const get = (f) => values[f.key] ?? f.initial ?? ''
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      actions={
        <>
          {extraAction}
          <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="entry-form" className="btn btn--primary">Save</button>
        </>
      }
    >
      <form
        id="entry-form"
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const parsed = {}
          const nextErrors = {}
          fields.forEach((f) => {
            const result = f.parse(get(f))
            if (result.error) nextErrors[f.key] = result.error
            parsed[f.key] = result.value
          })
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length) return
          const error = onSubmit(parsed)
          if (error) setErrors({ [fields[0].key]: error })
        }}
      >
        {fields.map((f, i) => (
          <div className="field" key={f.key}>
            <label className="field__label" htmlFor={`entry-${f.key}`}>{f.label}</label>
            <input
              id={`entry-${f.key}`}
              className="input input--num"
              inputMode={f.inputMode ?? 'numeric'}
              autoFocus={i === 0}
              value={get(f)}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              aria-invalid={Boolean(errors[f.key])}
              aria-describedby={errors[f.key] ? `entry-${f.key}-error` : f.hint ? `entry-${f.key}-hint` : undefined}
            />
            {f.hint && <span id={`entry-${f.key}-hint`} className="field__hint">{f.hint}</span>}
            {errors[f.key] && <span id={`entry-${f.key}-error`} className="field__error">{errors[f.key]}</span>}
          </div>
        ))}
      </form>
    </Dialog>
  )
}

const jumpsField = (initial) => ({
  key: 'jumps',
  label: 'Actual jumps',
  initial: initial != null ? String(initial) : '',
  parse: (v) => parseWholeNumber(v, { ...LIMITS.jumps, label: 'Jumps' }),
})

const timeField = (initial, label = 'Actual work time') => ({
  key: 'seconds',
  label,
  hint: 'm:ss or seconds, e.g. 0:57',
  inputMode: 'text',
  initial: initial != null ? formatClock(initial) : '',
  parse: (v) => parseClockInput(v, { label: 'Time' }),
})

export default function RopeTracker({ exercise, disabled, error, actions }) {
  const confirm = useConfirm()
  const [dialog, setDialog] = useState(null)
  const current = exercise.sets.find((s) => s.status === 'pending')
  const completed = exercise.sets.filter((s) => s.status === 'completed')
  const target = exercise.target
  const running = current?.workRunningSince != null
  const close = () => setDialog(null)

  const bump = (n) => {
    if (!current) return
    const next = Math.min(LIMITS.jumps.max, Math.max(0, (current.jumps ?? 0) + n))
    actions.draft(exercise.key, current.id, { jumps: next }, { immediate: true })
  }

  const dialogSet = dialog?.setId ? exercise.sets.find((s) => s.id === dialog.setId) : null

  return (
    <div className="stack">
      <TargetTiles target={target} disabled={disabled} onEdit={() => setDialog({ type: 'targets' })} />

      {current ? (
        <section className="card stack rope-current" aria-labelledby="rope-current-title">
          <div className="row row--between">
            <h3 id="rope-current-title">Current set</h3>
            <span className="tag tag--lime num">Set {current.order} of {exercise.sets.length}</span>
          </div>

          <div className="rope-current__grid">
            <div className="rope-meter">
              <span className="rope-meter__label">Work time</span>
              <WorkTime set={current} className="rope-meter__value" />
              <span className="caption num">{target.seconds ? `target ${formatClock(target.seconds)}` : 'no time target'}</span>
              <button type="button" className="btn btn--small btn--ghost" disabled={disabled}
                onClick={() => {
                  if (running) actions.pauseWork(exercise.key, current.id)
                  setDialog({ type: 'time', setId: current.id })
                }}>
                Enter time
              </button>
            </div>
            <div className="rope-meter">
              <span className="rope-meter__label">Actual jumps</span>
              <span className="rope-meter__value num" aria-live="polite" aria-label={`${current.jumps ?? 0} jumps`}>{current.jumps ?? 0}</span>
              <span className="caption num">{target.jumps ? `target ${target.jumps}` : 'no jump target'}</span>
              <button type="button" className="btn btn--small btn--ghost" disabled={disabled}
                onClick={() => setDialog({ type: 'jumps', setId: current.id })}>
                Enter count
              </button>
            </div>
          </div>

          <div className="rope-steps" role="group" aria-label="Add jumps">
            {STEPS.map((n) => (
              <button key={n} type="button" className="btn btn--secondary rope-steps__btn num" onClick={() => bump(n)} disabled={disabled} aria-label={`Add ${n} ${n === 1 ? 'jump' : 'jumps'}`}>
                +{n}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`btn btn--large btn--block ${running ? 'btn--secondary' : 'btn--primary'}`}
            onClick={() => (running ? actions.pauseWork(exercise.key, current.id) : actions.startWork(exercise.key, current.id))}
            disabled={disabled}
          >
            {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {running ? 'Pause timer' : effectiveSeconds(current, 0) ? 'Resume timer' : 'Start timer'}
          </button>
          <div className="grid rope-current__finish">
            <button type="button" className={`btn btn--large ${running ? 'btn--primary' : 'btn--secondary'}`} onClick={() => actions.complete(exercise.key, current.id)} disabled={disabled}>
              <Check size={18} aria-hidden="true" /> Complete set
            </button>
            <button type="button" className="btn btn--large btn--secondary" disabled={disabled}
              onClick={async () => {
                const ok = await confirm({
                  title: `Reset set ${current.order}?`,
                  body: 'This clears the jump count and work time for this set. Completed sets are not affected.',
                  confirmLabel: 'Reset set',
                  tone: 'danger',
                })
                if (ok) actions.resetWork(exercise.key, current.id)
              }}>
              <RotateCcw size={18} aria-hidden="true" /> Reset
            </button>
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <p className="caption">Jump counts come from you; REPXIR doesn&apos;t count jumps automatically.</p>
        </section>
      ) : (
        <section className="card stack" aria-label="All sets complete">
          <p className="row"><Check size={20} className="lime" aria-hidden="true" /> All {exercise.sets.length} sets are logged.</p>
          <button type="button" className="btn btn--secondary" onClick={() => actions.addSet(exercise.key)} disabled={disabled}>
            <Plus size={16} aria-hidden="true" /> Add another set
          </button>
        </section>
      )}

      <section className="stack stack--sm" aria-labelledby="rope-progress-title">
        <div className="row row--between">
          <h3 id="rope-progress-title">Set progress</h3>
          <span className="caption num">{completed.length} of {exercise.sets.length} completed</span>
        </div>
        <ol className="list">
          {exercise.sets.map((set) => {
            const done = set.status === 'completed'
            const content = (
              <>
                <span className={`set-badge${done ? ' set-badge--done' : ''}`} aria-hidden="true">
                  {done ? <Check size={14} /> : set.order}
                </span>
                <span className="list-row__body">
                  <span className="list-row__title">Set {set.order}{done ? '' : set.id === current?.id ? ' · in progress' : ''}</span>
                </span>
                <span className="rope-progress__stat num">
                  <JumpRopeIcon size={14} aria-hidden="true" /> {done && set.jumps != null ? `${set.jumps} jumps` : '—'}
                </span>
                <span className="rope-progress__stat num">
                  <Timer size={14} aria-hidden="true" /> {done && set.seconds != null ? formatClock(set.seconds) : '—'}
                </span>
              </>
            )
            return (
              <li key={set.id}>
                {done ? (
                  <button type="button" className="list-row rope-progress__row" onClick={() => setDialog({ type: 'edit', setId: set.id })} disabled={disabled}
                    aria-label={`Set ${set.order}: ${set.jumps ?? 'no'} jumps, ${formatClock(set.seconds ?? 0)}. Edit`}>
                    {content}
                  </button>
                ) : (
                  <div className="list-row rope-progress__row">{content}</div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {dialog?.type === 'jumps' && dialogSet && (
        <EntryDialog open title={`Set ${dialogSet.order} jumps`} description="Type the exact number of jumps you completed."
          fields={[jumpsField(dialogSet.jumps)]} onClose={close}
          onSubmit={({ jumps }) => {
            actions.draft(exercise.key, dialogSet.id, { jumps: jumps ?? 0 }, { immediate: true })
            close()
          }} />
      )}

      {dialog?.type === 'time' && dialogSet && (
        <EntryDialog open title={`Set ${dialogSet.order} time`} description="Didn't run the timer? Enter how long you worked."
          fields={[timeField(effectiveSeconds(dialogSet, 0))]} onClose={close}
          onSubmit={({ seconds }) => {
            actions.draft(exercise.key, dialogSet.id, { seconds, workMs: 0 }, { immediate: true })
            close()
          }} />
      )}

      {dialog?.type === 'edit' && dialogSet && (
        <EntryDialog open title={`Edit set ${dialogSet.order}`} description="Correct the jumps or time you logged for this set."
          fields={[jumpsField(dialogSet.jumps), timeField(dialogSet.seconds)]} onClose={close}
          extraAction={
            <button type="button" className="btn btn--danger-outline" onClick={() => {
              actions.undo(exercise.key, dialogSet.id)
              close()
            }}>Undo set</button>
          }
          onSubmit={(patch) => {
            const err = actions.editCompleted(exercise.key, dialogSet.id, patch)
            if (!err) close()
            return err
          }} />
      )}

      {dialog?.type === 'targets' && (
        <EntryDialog open title="Edit targets" description="Changes apply to sets you haven't completed yet."
          fields={[
            { key: 'sets', label: 'Sets', initial: String(target.sets), parse: (v) => parseWholeNumber(v, { ...LIMITS.sets, label: 'Sets', required: true }) },
            { key: 'jumps', label: 'Jumps per set', initial: target.jumps != null ? String(target.jumps) : '', parse: (v) => parseWholeNumber(v, { ...LIMITS.jumps, label: 'Jumps' }) },
            { ...timeField(target.seconds, 'Time per set'), parse: (v) => parseClockInput(v, { label: 'Time per set', max: 3600 }) },
            { ...timeField(target.restSeconds ?? 0, 'Rest between sets'), key: 'restSeconds', parse: (v) => parseClockInput(v, { label: 'Rest', max: LIMITS.restSeconds.max }) },
          ]}
          onClose={close}
          onSubmit={(values) => {
            if (!values.jumps && !values.seconds) return 'Set a jump target, a time target, or both.'
            actions.updateTarget(exercise.key, {
              sets: values.sets,
              jumps: values.jumps || null,
              seconds: values.seconds || null,
              restSeconds: values.restSeconds ?? 0,
            })
            close()
            return null
          }} />
      )}
    </div>
  )
}
