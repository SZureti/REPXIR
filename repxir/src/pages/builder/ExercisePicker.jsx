import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import Dialog from '../../components/Dialog.jsx'
import { ExerciseIcon } from '../../components/WorkoutIcon.jsx'
import { EXERCISES } from '../../data/exercises.js'
import { MEASUREMENTS, MUSCLES, equipmentLabel, muscleLabel } from '../../data/taxonomy.js'

const MUSCLE_FILTERS = Object.entries(MUSCLES).filter(([id]) => id !== 'forearms')

export default function ExercisePicker({ open, onClose, onAdd, selectedIds }) {
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('')
  const [added, setAdded] = useState(0)

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    return EXERCISES.filter((e) => {
      if (muscle && !e.primaryMuscles.includes(muscle) && !e.secondaryMuscles.includes(muscle)) return false
      if (!tokens.length) return true
      const text = [e.name, ...e.primaryMuscles.map(muscleLabel), ...e.equipment.map(equipmentLabel)].join(' ').toLowerCase()
      return tokens.every((t) => text.includes(t))
    })
  }, [q, muscle])

  const close = () => {
    setQ('')
    setMuscle('')
    setAdded(0)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add exercises"
      description="Search the catalog and add as many as you like."
      size="lg"
      actions={
        <button type="button" className="btn btn--primary" onClick={close}>
          Done{added ? ` · ${added} added` : ''}
        </button>
      }
    >
      <div className="search">
        <label htmlFor="picker-search" className="visually-hidden">Search exercises</label>
        <Search size={18} className="search__icon" aria-hidden="true" />
        <input id="picker-search" type="search" className="input" placeholder="Search by name, muscle, or equipment"
          value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>
      <div className="chips" role="group" aria-label="Filter by muscle">
        <button type="button" className="chip" aria-pressed={muscle === ''} onClick={() => setMuscle('')}>All</button>
        {MUSCLE_FILTERS.map(([id, label]) => (
          <button key={id} type="button" className="chip" aria-pressed={muscle === id} onClick={() => setMuscle(id)}>{label}</button>
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">{results.length} exercises</p>
      {results.length === 0 ? (
        <p className="muted" style={{ padding: 'var(--rx-space-4) 0' }}>No exercises found. Try a different name or muscle group.</p>
      ) : (
        <ul className="list picker-list">
          {results.map((e) => {
            const count = selectedIds.filter((id) => id === e.id).length
            return (
              <li key={e.id}>
                <div className="list-row">
                  <ExerciseIcon exercise={e} />
                  <div className="list-row__body">
                    <p className="list-row__title">{e.name}</p>
                    <p className="list-row__meta">
                      {e.primaryMuscles.map(muscleLabel).join(', ')} · {e.equipment.map(equipmentLabel).join(', ')} · {MEASUREMENTS[e.measurement]}
                    </p>
                  </div>
                  <button type="button" className={`btn btn--small ${count ? 'btn--secondary' : 'btn--primary'}`}
                    onClick={() => {
                      onAdd(e.id)
                      setAdded((n) => n + 1)
                    }}
                    aria-label={`Add ${e.name}${count ? ` (already added ${count})` : ''}`}>
                    {count ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                    {count ? 'Add again' : 'Add'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
