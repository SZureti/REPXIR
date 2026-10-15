import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import PageHeader from '../components/PageHeader.jsx'
import TemplateCard from '../components/TemplateCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { CATEGORIES } from '../data/taxonomy.js'
import { categoryOf, filterTemplates, FOCUS_OPTIONS, GEAR_OPTIONS, listTemplates } from '../services/workoutService.js'
import { pluralize } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const CHIPS = [['all', 'All'], ...Object.entries(CATEGORIES)]

function Section({ id, title, children, count }) {
  return (
    <section className="section" aria-labelledby={id}>
      <div className="section__head">
        <h2 id={id}>{title}</h2>
        {count != null && <span className="caption">{pluralize(count, 'workout')}</span>}
      </div>
      {children}
    </section>
  )
}

export default function Library() {
  usePageTitle('Workouts')
  const { customWorkouts } = useStore()
  // Filters live in the URL so Back/Forward and reloads keep them (journey 1, AC 1).
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = params.get('cat') ?? 'all'
  const focus = params.get('focus') ?? ''
  const gear = params.get('gear') ?? ''
  const showArchived = params.get('archived') === '1'

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value == null || (key === 'cat' && value === 'all')) next.delete(key)
      else next.set(key, value)
    })
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const templates = useMemo(
    () => listTemplates(customWorkouts, { includeArchived: showArchived && category === 'custom' }),
    [customWorkouts, showArchived, category],
  )
  const results = useMemo(() => filterTemplates(templates, { q, category, focus, gear }), [templates, q, category, focus, gear])
  const filtering = Boolean(q || focus || gear)
  const byCategory = (cat) => results.filter((t) => categoryOf(t) === cat)
  const archivedCount = customWorkouts.filter((w) => w.archived).length

  return (
    <div>
      <PageHeader
        title="Workouts"
        subtitle="Browse workouts by muscle group, equipment, or build your own."
        action={
          <Link to="/builder/new" className="btn btn--secondary btn--small" style={{ marginTop: 4 }}>
            <Plus size={16} aria-hidden="true" /> New
          </Link>
        }
      />

      <div className="stack library-controls">
        <div className="search" role="search">
          <label htmlFor="workout-search" className="visually-hidden">Search workouts, muscle groups, or equipment</label>
          <Search size={18} className="search__icon" aria-hidden="true" />
          <input
            id="workout-search"
            type="search"
            className="input"
            placeholder="Search workouts, muscles, or equipment"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            autoComplete="off"
            enterKeyHint="search"
          />
          {q && (
            <button type="button" className="icon-btn search__clear" aria-label="Clear search text" onClick={() => update({ q: '' })}>
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="chips" role="group" aria-label="Workout type">
          {CHIPS.map(([value, label]) => (
            <button key={value} type="button" className="chip" aria-pressed={category === value} onClick={() => update({ cat: value })}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid--2 library-filters">
          <div className="field">
            <label className="field__label" htmlFor="filter-focus">Focus</label>
            <select id="filter-focus" className="select" value={focus} onChange={(e) => update({ focus: e.target.value })}>
              <option value="">Any muscle group</option>
              {FOCUS_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="filter-gear">Equipment</label>
            <select id="filter-gear" className="select" value={gear} onChange={(e) => update({ gear: e.target.value })}>
              <option value="">Any equipment</option>
              {GEAR_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {category === 'custom' && archivedCount > 0 && (
        <label className="checkbox-row small muted">
          <input type="checkbox" checked={showArchived} onChange={(e) => update({ archived: e.target.checked ? '1' : '' })} />
          Show {pluralize(archivedCount, 'archived workout')}
        </label>
      )}

      <p className="visually-hidden" aria-live="polite">{pluralize(results.length, 'workout')} found</p>

      <div className="library-results">
        {results.length === 0 ? (
          category === 'custom' && !filtering ? (
            <EmptyState icon={Plus} title="No custom workouts yet" body="Build a routine around your own equipment and goals, or duplicate a prebuilt workout to customize it.">
              <Link to="/builder/new" className="btn btn--primary">Create workout</Link>
            </EmptyState>
          ) : (
            <EmptyState icon={Search} title="No results" body="No workouts match your search. Try a different name, muscle group, or piece of equipment.">
              <button type="button" className="btn btn--secondary" onClick={() => update({ q: '', focus: '', gear: '' })}>Clear search</button>
              <button type="button" className="btn btn--primary" onClick={() => setParams({}, { replace: true })}>View all</button>
            </EmptyState>
          )
        ) : filtering ? (
          <Section id="results-title" title="Results" count={results.length}>
            <div className="grid grid--auto">
              {results.map((t) => <TemplateCard key={t.id} template={t} />)}
            </div>
          </Section>
        ) : (
          <>
            {byCategory('custom').length > 0 && (
              <Section id="custom-title" title="My workouts" count={byCategory('custom').length}>
                <div className="grid grid--auto">
                  {byCategory('custom').map((t) => <TemplateCard key={t.id} template={t} />)}
                </div>
              </Section>
            )}
            {byCategory('muscle').length > 0 && (
              <Section id="muscle-title" title="Muscle group workouts" count={byCategory('muscle').length}>
                <div className="grid grid--2 grid--muscle">
                  {byCategory('muscle').map((t) => <TemplateCard key={t.id} template={t} compact />)}
                </div>
              </Section>
            )}
            {byCategory('full-body').length > 0 && (
              <Section id="full-title" title="Full body workouts" count={byCategory('full-body').length}>
                <div className="grid grid--2 grid--fullbody">
                  {byCategory('full-body').map((t) => <TemplateCard key={t.id} template={t} compact />)}
                </div>
              </Section>
            )}
            {byCategory('cardio').length > 0 && (
              <Section id="rope-title" title="Jump rope">
                <div className="grid grid--auto">
                  {byCategory('cardio').map((t) => <TemplateCard key={t.id} template={t} />)}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
