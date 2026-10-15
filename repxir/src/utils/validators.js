// Input parsing and validation. Raw form values are strings; these helpers turn
// them into numbers (or null for "missing") and explain what is wrong.
// 0 is a real value and is never treated as missing.

import { fromDisplayLoad } from './units.js'

export const LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 0, max: 500 },
  jumps: { min: 0, max: 20000 },
  seconds: { min: 0, max: 6 * 3600 },
  restSeconds: { min: 0, max: 900 },
  loadKg: { min: 0, max: 1000 },
  name: { max: 60 },
  description: { max: 280 },
  notes: { max: 1000 },
}

const isBlank = (raw) => raw == null || String(raw).trim() === ''

export function parseWholeNumber(raw, { min = 0, max = Number.MAX_SAFE_INTEGER, label = 'Value', required = false } = {}) {
  if (isBlank(raw)) return { value: null, error: required ? `${label} is required.` : null }
  const text = String(raw).trim()
  if (!/^\d+$/.test(text)) return { value: null, error: `${label} must be a whole number.` }
  const value = Number(text)
  if (value < min) return { value: null, error: `${label} must be at least ${min}.` }
  if (value > max) return { value: null, error: `${label} must be ${max.toLocaleString()} or less.` }
  return { value, error: null }
}

export function parseDecimal(raw, { min = 0, max = Number.MAX_SAFE_INTEGER, label = 'Value', required = false } = {}) {
  if (isBlank(raw)) return { value: null, error: required ? `${label} is required.` : null }
  const text = String(raw).trim().replace(',', '.')
  if (!/^\d*\.?\d+$/.test(text)) return { value: null, error: `${label} must be a number.` }
  const value = Number(text)
  if (!Number.isFinite(value) || value < min) return { value: null, error: `${label} must be at least ${min}.` }
  if (value > max) return { value: null, error: `${label} must be ${max.toLocaleString()} or less.` }
  return { value, error: null }
}

// Accepts "90", "1:30", or "01:30" and returns seconds.
export function parseClockInput(raw, { max = LIMITS.seconds.max, label = 'Time', required = false } = {}) {
  if (isBlank(raw)) return { value: null, error: required ? `${label} is required.` : null }
  const text = String(raw).trim()
  let value
  if (/^\d+$/.test(text)) value = Number(text)
  else {
    const match = /^(\d{1,3}):([0-5]\d)$/.exec(text)
    if (!match) return { value: null, error: `${label} must look like 1:30 or a number of seconds.` }
    value = Number(match[1]) * 60 + Number(match[2])
  }
  if (value > max) return { value: null, error: `${label} must be ${Math.floor(max / 60)} minutes or less.` }
  return { value, error: null }
}

// "8-12", "8–12", "10" -> { min, max }
export function parseRepsRange(raw, { required = true } = {}) {
  if (isBlank(raw)) return { value: null, error: required ? 'Reps are required.' : null }
  const text = String(raw).trim().replace(/\s+/g, '')
  const match = /^(\d+)(?:[-–](\d+))?$/.exec(text)
  if (!match) return { value: null, error: 'Reps must be a number or a range like 8-12.' }
  const min = Number(match[1])
  const max = match[2] != null ? Number(match[2]) : min
  if (min < 1) return { value: null, error: 'Reps must be at least 1.' }
  if (max > LIMITS.reps.max) return { value: null, error: `Reps must be ${LIMITS.reps.max} or less.` }
  if (min > max) return { value: null, error: 'The first number in a range must be the smaller one.' }
  return { value: { min, max }, error: null }
}

// A completed set needs at least one meaningful actual metric (design.md §3).
export function validateSetEntry(measurement, entry) {
  const positive = (v) => v != null && Number.isFinite(v) && v > 0
  const tooBig = (v, max) => v != null && (!Number.isFinite(v) || v < 0 || v > max)
  if (tooBig(entry.reps, LIMITS.reps.max)) return `Reps must be between 0 and ${LIMITS.reps.max}.`
  if (tooBig(entry.jumps, LIMITS.jumps.max)) return `Jumps must be between 0 and ${LIMITS.jumps.max.toLocaleString()}.`
  if (tooBig(entry.seconds, LIMITS.seconds.max)) return 'Time must be 6 hours or less.'
  if (tooBig(entry.loadKg, LIMITS.loadKg.max)) return 'That weight looks too large. Check the number and unit.'
  switch (measurement) {
    case 'reps_weight':
    case 'reps_only':
      return positive(entry.reps) ? null : 'Enter the reps you completed.'
    case 'duration':
      return positive(entry.seconds) ? null : 'Enter or time how many seconds you held.'
    case 'jumps_duration':
      return positive(entry.jumps) || positive(entry.seconds) ? null : 'Log your jumps or your work time before completing the set.'
    default:
      return 'Unknown exercise type.'
  }
}

// Parse the string fields of one builder exercise row into a template block.
export function parseBlockFields(fields, measurement, unit) {
  const errors = {}
  const block = {
    exerciseId: fields.exerciseId,
    sets: null,
    repsMin: null,
    repsMax: null,
    seconds: null,
    jumps: null,
    restSeconds: null,
    loadKg: null,
    note: (fields.note ?? '').trim().slice(0, 40),
  }

  const sets = parseWholeNumber(fields.sets, { ...LIMITS.sets, label: 'Sets', required: true })
  if (sets.error) errors.sets = sets.error
  block.sets = sets.value

  if (measurement === 'reps_weight' || measurement === 'reps_only') {
    const range = parseRepsRange(fields.reps)
    if (range.error) errors.reps = range.error
    else {
      block.repsMin = range.value.min
      block.repsMax = range.value.max
    }
  }

  if (measurement === 'duration') {
    const secs = parseClockInput(fields.seconds, { label: 'Time', required: true })
    if (secs.error) errors.seconds = secs.error
    else if (secs.value === 0) errors.seconds = 'Time must be more than 0.'
    else block.seconds = secs.value
  }

  if (measurement === 'jumps_duration') {
    const jumps = parseWholeNumber(fields.jumps, { ...LIMITS.jumps, label: 'Jumps' })
    const secs = parseClockInput(fields.seconds, { label: 'Time per set' })
    if (jumps.error) errors.jumps = jumps.error
    if (secs.error) errors.seconds = secs.error
    if (!jumps.error && !secs.error && !jumps.value && !secs.value) {
      errors.jumps = 'Set a jump target, a time target, or both.'
    }
    block.jumps = jumps.value || null
    block.seconds = secs.value || null
  }

  const rest = parseClockInput(fields.restSeconds, { max: LIMITS.restSeconds.max, label: 'Rest' })
  if (rest.error) errors.restSeconds = rest.error
  block.restSeconds = rest.value ?? 0

  if (measurement === 'reps_weight') {
    const load = parseDecimal(fields.load, { min: 0, max: unit === 'lb' ? 2200 : LIMITS.loadKg.max, label: 'Weight' })
    if (load.error) errors.load = load.error
    block.loadKg = fromDisplayLoad(load.value, unit)
  }

  return { block, errors }
}

export function validateWorkoutMeta({ name, description }) {
  const errors = {}
  const trimmed = (name ?? '').trim()
  if (!trimmed) errors.name = 'Give your workout a name.'
  else if (trimmed.length > LIMITS.name.max) errors.name = `Keep the name to ${LIMITS.name.max} characters or fewer.`
  if ((description ?? '').length > LIMITS.description.max) errors.description = `Keep the description to ${LIMITS.description.max} characters or fewer.`
  return errors
}
