import { useState } from 'react'
import { Check, Minus, Pause, Play, Plus, Undo2 } from 'lucide-react'
import { effectiveSeconds } from '../../services/sessionService.js'
import { formatRepsTarget } from '../../utils/format.js'
import { formatLoad, fromDisplayLoad, toDisplayLoad } from '../../utils/units.js'
import { WorkTime } from './Timers.jsx'

const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 5)
const toNumberOrNull = (value) => (value === '' ? null : Number(value))

function StatusCell({ set, isNext, disabled, onComplete, onUndo }) {
  if (set.status === 'completed') {
    return (
      <button type="button" className="set-done" onClick={onUndo} disabled={disabled} aria-label={`Set ${set.order} completed. Undo to edit`}>
        <Check size={18} aria-hidden="true" className="set-done__check" />
        <Undo2 size={16} aria-hidden="true" className="set-done__undo" />
      </button>
    )
  }
  return (
    <button
      type="button"
      className={`btn btn--small ${isNext ? 'btn--primary' : 'btn--secondary'} set-complete`}
      onClick={onComplete}
      disabled={disabled}
      aria-label={`Complete set ${set.order}`}
    >
      Complete
    </button>
  )
}

function RepsRow({ exercise, set, isNext, unit, disabled, error, onDraft, onComplete, onUndo }) {
  const weighted = exercise.measurement === 'reps_weight'
  const [load, setLoad] = useState(() => (set.loadKg != null ? String(toDisplayLoad(set.loadKg, unit)) : ''))
  const done = set.status === 'completed'
  const errorId = `set-error-${set.id}`
  const onEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onComplete()
    }
  }

  return (
    <li className={`set-row${done ? ' set-row--done' : ''}${isNext ? ' set-row--next' : ''}${weighted ? '' : ' set-row--no-load'}`}>
      <span className="set-row__index num" aria-hidden="true">{set.order}</span>
      {done ? (
        <>
          <span className="set-row__value num">{set.reps} <span className="caption">reps</span></span>
          {weighted && <span className="set-row__value num">{set.loadKg != null ? formatLoad(set.loadKg, unit) : <span className="caption">no load</span>}</span>}
        </>
      ) : (
        <>
          <input
            className="input input--num"
            inputMode="numeric"
            enterKeyHint="done"
            aria-label={`Set ${set.order} reps`}
            placeholder={formatRepsTarget(exercise.target) ?? 'Reps'}
            value={set.reps ?? ''}
            onChange={(e) => onDraft({ reps: toNumberOrNull(digitsOnly(e.target.value)) })}
            onKeyDown={onEnter}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          {weighted && (
            <input
              className="input input--num"
              inputMode="decimal"
              enterKeyHint="done"
              aria-label={`Set ${set.order} weight in ${unit} (optional)`}
              placeholder={unit}
              value={load}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.').slice(0, 7)
                setLoad(raw)
                const value = Number.parseFloat(raw)
                onDraft({ loadKg: Number.isFinite(value) ? fromDisplayLoad(value, unit) : null })
              }}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          )}
        </>
      )}
      <StatusCell set={set} isNext={isNext} disabled={disabled} onComplete={onComplete} onUndo={onUndo} />
      {error && <p id={errorId} className="field__error set-row__error" role="alert">{error}</p>}
    </li>
  )
}

function DurationRow({ exercise, set, isNext, disabled, error, onDraft, onComplete, onUndo, onStartWork, onPauseWork }) {
  const done = set.status === 'completed'
  const running = set.workRunningSince != null
  const shown = effectiveSeconds(set, 0)
  const errorId = `set-error-${set.id}`
  return (
    <li className={`set-row set-row--timed${done ? ' set-row--done' : ''}${isNext ? ' set-row--next' : ''}`}>
      <span className="set-row__index num" aria-hidden="true">{set.order}</span>
      {done ? (
        <span className="set-row__value num">{set.seconds} <span className="caption">sec</span></span>
      ) : running ? (
        <span className="set-row__live">
          <WorkTime set={set} className="set-row__clock" />
        </span>
      ) : (
        <input
          className="input input--num"
          inputMode="numeric"
          aria-label={`Set ${set.order} seconds`}
          placeholder={exercise.target.seconds ? `${exercise.target.seconds}s` : 'sec'}
          value={shown ?? ''}
          onChange={(e) => onDraft({ seconds: toNumberOrNull(digitsOnly(e.target.value)), workMs: 0 })}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      {!done ? (
        <button
          type="button"
          className="icon-btn set-row__timer"
          onClick={running ? onPauseWork : onStartWork}
          disabled={disabled}
          aria-label={running ? `Pause timer for set ${set.order}` : `Start timer for set ${set.order}`}
        >
          {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
      ) : <span />}
      <StatusCell set={set} isNext={isNext} disabled={disabled} onComplete={onComplete} onUndo={onUndo} />
      {error && <p id={errorId} className="field__error set-row__error" role="alert">{error}</p>}
    </li>
  )
}

export default function SetTable({ exercise, unit, disabled, errors, actions }) {
  const nextId = exercise.sets.find((s) => s.status === 'pending')?.id
  const timed = exercise.measurement === 'duration'
  const weighted = exercise.measurement === 'reps_weight'
  const lastPending = [...exercise.sets].reverse().find((s) => s.status === 'pending')

  return (
    <div className="set-table">
      <div className={`set-table__head${timed ? ' set-table__head--timed' : ''}${!timed && !weighted ? ' set-table__head--no-load' : ''}`} aria-hidden="true">
        <span>Set</span>
        {timed ? (
          <>
            <span>Time{exercise.target.seconds ? ` (target ${exercise.target.seconds}s)` : ''}</span>
            <span />
          </>
        ) : (
          <>
            <span>Reps{formatRepsTarget(exercise.target) ? ` (${formatRepsTarget(exercise.target)})` : ''}</span>
            {weighted && <span>Weight ({unit})</span>}
          </>
        )}
        <span>Status</span>
      </div>
      <ol className="set-table__rows" aria-label={`${exercise.name} sets`}>
        {exercise.sets.map((set) => {
          const common = {
            exercise,
            set,
            isNext: set.id === nextId,
            disabled,
            error: errors[set.id],
            onDraft: (patch) => actions.draft(exercise.key, set.id, patch),
            onComplete: () => actions.complete(exercise.key, set.id),
            onUndo: () => actions.undo(exercise.key, set.id),
          }
          return timed
            ? <DurationRow key={set.id} {...common}
                onStartWork={() => actions.startWork(exercise.key, set.id)}
                onPauseWork={() => actions.pauseWork(exercise.key, set.id)} />
            : <RepsRow key={`${set.id}-${unit}`} {...common} unit={unit} />
        })}
      </ol>
      <div className="row set-table__tools">
        <button type="button" className="btn btn--small btn--ghost" onClick={() => actions.addSet(exercise.key)} disabled={disabled}>
          <Plus size={16} aria-hidden="true" /> Add set
        </button>
        {lastPending && exercise.sets.length > 1 && (
          <button type="button" className="btn btn--small btn--ghost" onClick={() => actions.removeSet(exercise.key, lastPending.id)} disabled={disabled}>
            <Minus size={16} aria-hidden="true" /> Remove set
          </button>
        )}
      </div>
    </div>
  )
}
