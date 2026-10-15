// JSON export/import. Imports are validated for version and shape, previewed,
// and never silently erase existing data (README "Storage strategy").

import { EXERCISES_BY_ID } from '../data/exercises.js'
import { MEASUREMENT_IDS } from '../data/taxonomy.js'
import { SCHEMA_VERSION } from './workoutService.js'

export const BACKUP_APP_ID = 'repxir'
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024

export function buildBackup({ customWorkouts, sessions, prefs }, nowIso = new Date().toISOString()) {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso,
    preferences: { unit: prefs.unit },
    customWorkouts,
    sessions,
  }
}

export function backupFileName(nowIso = new Date().toISOString()) {
  return `repxir-backup-${nowIso.slice(0, 10)}.json`
}

const isString = (v, max = 500) => typeof v === 'string' && v.length <= max
const isNonEmptyString = (v, max) => isString(v, max) && v.trim().length > 0
const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isNullableNumber = (v) => v == null || (typeof v === 'number' && Number.isFinite(v) && v >= 0)

function checkBlock(block, where) {
  if (!block || typeof block !== 'object') return `${where}: exercise entry is not an object.`
  if (!EXERCISES_BY_ID[block.exerciseId]) return `${where}: unknown exercise "${String(block.exerciseId).slice(0, 40)}".`
  if (!Number.isInteger(block.sets) || block.sets < 1 || block.sets > 50) return `${where}: sets must be a whole number from 1 to 50.`
  for (const field of ['repsMin', 'repsMax', 'seconds', 'jumps', 'restSeconds', 'loadKg']) {
    if (!isNullableNumber(block[field])) return `${where}: ${field} must be a positive number or empty.`
  }
  return null
}

function checkWorkout(w, i) {
  const where = `Workout ${i + 1}`
  if (!w || typeof w !== 'object') return `${where} is not an object.`
  if (!isNonEmptyString(w.id, 100)) return `${where} is missing an id.`
  if (w.origin !== 'custom') return `${where} is not a custom workout.`
  if (!isNonEmptyString(w.name, 120)) return `${where} is missing a name.`
  if (!Array.isArray(w.exercises)) return `${where} has no exercise list.`
  for (let j = 0; j < w.exercises.length; j++) {
    const error = checkBlock(w.exercises[j], `${where}, exercise ${j + 1}`)
    if (error) return error
  }
  return null
}

function checkSession(s, i) {
  const where = `Session ${i + 1}`
  if (!s || typeof s !== 'object') return `${where} is not an object.`
  if (!isNonEmptyString(s.id, 100)) return `${where} is missing an id.`
  if (s.status !== 'completed') return `${where} is not a completed session.`
  if (!isNonEmptyString(s.name, 120)) return `${where} is missing a name.`
  if (!isIso(s.startedAt)) return `${where} has an invalid start date.`
  if (s.endedAt != null && !isIso(s.endedAt)) return `${where} has an invalid end date.`
  if (!isNullableNumber(s.elapsedMs)) return `${where} has an invalid duration.`
  if (!Array.isArray(s.exercises)) return `${where} has no exercise list.`
  for (const ex of s.exercises) {
    if (!ex || !isNonEmptyString(ex.name, 120) || !MEASUREMENT_IDS.includes(ex.measurement) || !Array.isArray(ex.sets)) {
      return `${where} has a malformed exercise.`
    }
    for (const set of ex.sets) {
      if (!set || !['pending', 'completed'].includes(set.status)) return `${where} has a malformed set.`
      for (const field of ['reps', 'loadKg', 'seconds', 'jumps']) {
        if (!isNullableNumber(set[field])) return `${where} has a set with an invalid ${field}.`
      }
    }
  }
  return null
}

// Returns { ok: true, data } or { ok: false, error }.
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length === 0) return { ok: false, error: 'The file is empty.' }
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'The file is too large to be a REPXIR backup.' }
  let json
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  if (!json || typeof json !== 'object' || json.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'This does not look like a REPXIR backup file.' }
  }
  if (!Number.isInteger(json.schemaVersion) || json.schemaVersion < 1) {
    return { ok: false, error: 'The backup is missing a schema version.' }
  }
  if (json.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of REPXIR. Update the app and try again.' }
  }
  if (!Array.isArray(json.customWorkouts) || !Array.isArray(json.sessions)) {
    return { ok: false, error: 'The backup is missing workouts or sessions.' }
  }
  for (let i = 0; i < json.customWorkouts.length; i++) {
    const error = checkWorkout(json.customWorkouts[i], i)
    if (error) return { ok: false, error }
  }
  for (let i = 0; i < json.sessions.length; i++) {
    const error = checkSession(json.sessions[i], i)
    if (error) return { ok: false, error }
  }
  const unit = json.preferences?.unit === 'kg' ? 'kg' : json.preferences?.unit === 'lb' ? 'lb' : null
  return {
    ok: true,
    data: {
      exportedAt: isIso(json.exportedAt) ? json.exportedAt : null,
      unit,
      customWorkouts: json.customWorkouts.map((w) => ({ ...w, archived: Boolean(w.archived) })),
      sessions: json.sessions,
    },
  }
}

export function previewImport(current, incoming) {
  const workoutIds = new Set(current.customWorkouts.map((w) => w.id))
  const sessionIds = new Set(current.sessions.map((s) => s.id))
  return {
    workouts: incoming.customWorkouts.length,
    sessions: incoming.sessions.length,
    newWorkouts: incoming.customWorkouts.filter((w) => !workoutIds.has(w.id)).length,
    newSessions: incoming.sessions.filter((s) => !sessionIds.has(s.id)).length,
  }
}

// Merge keeps everything already on this device and adds records it does not have.
export function mergeData(current, incoming) {
  const workoutIds = new Set(current.customWorkouts.map((w) => w.id))
  const sessionIds = new Set(current.sessions.map((s) => s.id))
  return {
    customWorkouts: [...current.customWorkouts, ...incoming.customWorkouts.filter((w) => !workoutIds.has(w.id))],
    sessions: [...current.sessions, ...incoming.sessions.filter((s) => !sessionIds.has(s.id))],
  }
}
