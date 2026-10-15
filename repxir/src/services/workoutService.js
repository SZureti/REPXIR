// Template lookup, search/filter, duration estimates, and duplication.

import { SYSTEM_TEMPLATES, SYSTEM_TEMPLATES_BY_ID } from '../data/templates.js'
import { getExercise } from '../data/exercises.js'
import { MUSCLES, EQUIPMENT, muscleLabel, equipmentLabel } from '../data/taxonomy.js'
import { createId, deepClone } from '../utils/ids.js'

export const SCHEMA_VERSION = 1

export function listTemplates(customWorkouts = [], { includeArchived = false } = {}) {
  const custom = customWorkouts.filter((w) => includeArchived || !w.archived)
  return [...SYSTEM_TEMPLATES, ...custom]
}

export function findTemplate(id, customWorkouts = []) {
  return SYSTEM_TEMPLATES_BY_ID[id] ?? customWorkouts.find((w) => w.id === id) ?? null
}

export function measurementOf(block) {
  return getExercise(block.exerciseId)?.measurement ?? 'reps_only'
}

export function isRopeTemplate(template) {
  return template.exercises.length > 0 && template.exercises.every((b) => measurementOf(b) === 'jumps_duration')
}

// Rough planning estimate (shown as "est."), never a promise.
export function estimateSeconds(template) {
  let total = 0
  template.exercises.forEach((block, index) => {
    const measurement = measurementOf(block)
    const sets = block.sets ?? 0
    let work
    if (measurement === 'duration' || measurement === 'jumps_duration') work = block.seconds ?? 60
    else work = ((block.repsMin ?? 10) + (block.repsMax ?? block.repsMin ?? 10)) / 2 * 3 + 10
    if (block.note?.includes('each')) work *= 2
    total += sets * work + Math.max(0, sets - 1) * (block.restSeconds ?? 0)
    if (index > 0) total += 60
  })
  return Math.max(5 * 60, Math.round(total / 300) * 300)
}

export function templateEquipment(template) {
  const set = new Set(template.equipment ?? [])
  template.exercises.forEach((b) => getExercise(b.exerciseId)?.equipment.forEach((e) => set.add(e)))
  return [...set]
}

function haystack(template) {
  const parts = [
    template.name,
    template.description,
    ...(template.focus ?? []).map(muscleLabel),
    ...templateEquipment(template).map(equipmentLabel),
  ]
  template.exercises.forEach((b) => {
    const exercise = getExercise(b.exerciseId)
    if (exercise) parts.push(exercise.name, ...exercise.primaryMuscles.map(muscleLabel))
  })
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function categoryOf(template) {
  return template.origin === 'custom' ? 'custom' : template.category
}

export function filterTemplates(templates, { q = '', category = 'all', focus = '', gear = '' } = {}) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  return templates.filter((t) => {
    if (category !== 'all' && categoryOf(t) !== category) return false
    if (focus && !(t.focus ?? []).includes(focus) && !t.exercises.some((b) => getExercise(b.exerciseId)?.primaryMuscles.includes(focus))) return false
    if (gear && !templateEquipment(t).includes(gear)) return false
    if (tokens.length) {
      const text = haystack(t)
      return tokens.every((token) => text.includes(token))
    }
    return true
  })
}

export const FOCUS_OPTIONS = Object.entries(MUSCLES).filter(([id]) => id !== 'forearms')
export const GEAR_OPTIONS = Object.entries(EQUIPMENT)

export function newCustomWorkout(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: createId('custom'),
    origin: 'custom',
    schemaVersion: SCHEMA_VERSION,
    name: '',
    description: '',
    category: 'custom',
    focus: [],
    equipment: [],
    difficulty: 'Custom',
    notes: '',
    exercises: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// Duplicating never touches the original (system templates stay read-only).
export function duplicateTemplate(template) {
  const copy = deepClone(template)
  return newCustomWorkout({
    name: `${template.name} (copy)`.slice(0, 60),
    description: copy.description ?? '',
    focus: copy.focus ?? [],
    equipment: copy.equipment ?? [],
    notes: copy.notes ?? '',
    exercises: copy.exercises,
    duplicatedFrom: template.id,
  })
}

// Derive equipment from the exercises chosen in the builder.
export function deriveEquipment(blocks) {
  const set = new Set()
  blocks.forEach((b) => getExercise(b.exerciseId)?.equipment.forEach((e) => set.add(e)))
  return [...set]
}
