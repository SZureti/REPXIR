// Pure session state machine (README "Session state machine"):
//   ACTIVE <-> PAUSED -> COMPLETED; reload restores a draft as PAUSED.
//
// Every function returns a new session object. `now` is a monotonic timestamp
// (performance.now()) used only for active durations; wall-clock ISO strings
// are used only for history dates. Fields named *RunningSince and `rest` are
// memory-only and are folded/stripped by toPersisted().

import { getExercise } from '../data/exercises.js'
import { createId, deepClone } from '../utils/ids.js'
import { validateSetEntry } from '../utils/validators.js'
import { SCHEMA_VERSION } from './workoutService.js'

const TIMED = new Set(['duration', 'jumps_duration'])

function blankSet(order, draft = {}) {
  return {
    id: createId('set'),
    order,
    status: 'pending',
    reps: draft.reps ?? null,
    loadKg: draft.loadKg ?? null,
    seconds: null,
    jumps: null,
    workMs: 0,
    workRunningSince: null,
    completedAt: null,
  }
}

export function previousPerformance(history, exerciseId, excludeSessionId = null) {
  for (const session of history) {
    if (session.id === excludeSessionId || session.status !== 'completed') continue
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue
      const sets = exercise.sets.filter((s) => s.status === 'completed')
      if (sets.length) return { sessionId: session.id, date: session.startedAt, sets }
    }
  }
  return null
}

// history must be sorted newest first.
export function createSession(template, { now, nowIso, history = [] }) {
  const snapshot = deepClone(template)
  const exercises = snapshot.exercises.map((block) => {
    const exercise = getExercise(block.exerciseId)
    const measurement = exercise?.measurement ?? 'reps_only'
    const previous = measurement === 'reps_weight' || measurement === 'reps_only'
      ? previousPerformance(history, block.exerciseId)
      : null
    const sets = Array.from({ length: block.sets }, (_, i) => {
      const prev = previous?.sets[i] ?? previous?.sets.at(-1)
      return blankSet(i + 1, {
        reps: prev?.reps ?? null,
        loadKg: measurement === 'reps_weight' ? (prev?.loadKg ?? block.loadKg ?? null) : null,
      })
    })
    return {
      key: createId('ex'),
      exerciseId: block.exerciseId,
      name: exercise?.name ?? block.exerciseId,
      measurement,
      primaryMuscles: exercise?.primaryMuscles ?? [],
      equipment: exercise?.equipment ?? [],
      target: { ...block },
      skipped: false,
      sets,
    }
  })

  return {
    id: createId('session'),
    schemaVersion: SCHEMA_VERSION,
    sourceTemplateId: template.id,
    sourceOrigin: template.origin,
    name: template.name,
    category: template.origin === 'custom' ? 'custom' : template.category,
    templateSnapshot: snapshot,
    startedAt: nowIso,
    endedAt: null,
    updatedAt: nowIso,
    status: 'active',
    elapsedMs: 0,
    runningSince: now,
    currentIndex: 0,
    exercises,
    rest: null,
    notes: '',
  }
}

// ---- helpers --------------------------------------------------------------

const mapExercise = (session, key, fn) => ({
  ...session,
  exercises: session.exercises.map((ex) => (ex.key === key ? fn(ex) : ex)),
})

const mapSet = (session, key, setId, fn) =>
  mapExercise(session, key, (ex) => ({ ...ex, sets: ex.sets.map((s) => (s.id === setId ? fn(s, ex) : s)) }))

export const findExercise = (session, key) => session.exercises.find((ex) => ex.key === key) ?? null

export function sessionElapsedMs(session, now) {
  return session.elapsedMs + (session.runningSince != null ? Math.max(0, now - session.runningSince) : 0)
}

export function setWorkMs(set, now) {
  return set.workMs + (set.workRunningSince != null ? Math.max(0, now - set.workRunningSince) : 0)
}

// Seconds the user will be credited with: a manual entry wins, otherwise the timer.
export function effectiveSeconds(set, now) {
  if (set.seconds != null) return set.seconds
  const ms = setWorkMs(set, now)
  return ms > 0 ? Math.round(ms / 1000) : null
}

function foldWork(set, now) {
  if (set.workRunningSince == null) return set
  return { ...set, workMs: setWorkMs(set, now), workRunningSince: null }
}

function foldAllWork(session, now) {
  return {
    ...session,
    exercises: session.exercises.map((ex) => ({ ...ex, sets: ex.sets.map((s) => foldWork(s, now)) })),
  }
}

export function restRemainingMs(session, now) {
  const rest = session.rest
  if (!rest) return 0
  const running = rest.runningSince != null ? now - rest.runningSince : 0
  return Math.max(0, rest.remainingMs - running)
}

// ---- lifecycle ------------------------------------------------------------

export function pauseSession(session, now) {
  if (session.status !== 'active') return session
  const folded = foldAllWork(session, now)
  return {
    ...folded,
    status: 'paused',
    elapsedMs: sessionElapsedMs(session, now),
    runningSince: null,
    rest: session.rest ? { ...session.rest, remainingMs: restRemainingMs(session, now), runningSince: null } : null,
  }
}

export function resumeSession(session, now) {
  if (session.status !== 'paused') return session
  return {
    ...session,
    status: 'active',
    runningSince: now,
    rest: session.rest && session.rest.remainingMs > 0 ? { ...session.rest, runningSince: now } : null,
  }
}

export function finishSession(session, now, nowIso) {
  const paused = session.status === 'active' ? pauseSession(session, now) : foldAllWork(session, now)
  return {
    ...paused,
    status: 'completed',
    endedAt: nowIso,
    updatedAt: nowIso,
    runningSince: null,
    rest: null,
  }
}

// Strip memory-only fields so a reload restores a paused draft without adding
// unobserved off-page time (design.md §9 timer integrity).
export function toPersisted(session, now) {
  const folded = foldAllWork(session, now)
  return {
    ...folded,
    elapsedMs: sessionElapsedMs(session, now),
    runningSince: null,
    rest: null,
  }
}

export function fromPersisted(session) {
  if (!session) return null
  if (session.status === 'completed') return session
  return {
    ...session,
    status: 'paused',
    runningSince: null,
    rest: null,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, workRunningSince: null })),
    })),
  }
}

// ---- set logging ----------------------------------------------------------

export function updateSetDraft(session, key, setId, patch) {
  return mapSet(session, key, setId, (set) => (set.status === 'completed' ? set : { ...set, ...patch }))
}

function isLastSetOfSession(session, key, setId) {
  const lastEx = [...session.exercises].reverse().find((ex) => !ex.skipped)
  if (!lastEx || lastEx.key !== key) return false
  return lastEx.sets.filter((s) => s.status === 'pending' && s.id !== setId).length === 0
}

export function completeSet(session, key, setId, now) {
  const exercise = findExercise(session, key)
  const set = exercise?.sets.find((s) => s.id === setId)
  if (!exercise || !set) return { session, error: 'That set no longer exists.' }
  if (set.status === 'completed') return { session, error: null, duplicate: true }

  const folded = foldWork(set, now)
  const entry = {
    reps: folded.reps,
    loadKg: folded.loadKg,
    jumps: folded.jumps,
    seconds: TIMED.has(exercise.measurement) ? effectiveSeconds(folded, now) : null,
  }
  const error = validateSetEntry(exercise.measurement, entry)
  if (error) return { session, error }

  let next = mapSet(session, key, setId, () => ({
    ...folded,
    ...entry,
    loadKg: exercise.measurement === 'reps_weight' ? entry.loadKg : null,
    reps: exercise.measurement === 'reps_weight' || exercise.measurement === 'reps_only' ? entry.reps : null,
    jumps: exercise.measurement === 'jumps_duration' ? entry.jumps : null,
    status: 'completed',
    completedAt: new Date().toISOString(),
  }))

  const restSeconds = exercise.target.restSeconds ?? 0
  if (restSeconds > 0 && !isLastSetOfSession(session, key, setId)) {
    next = startRest(next, key, restSeconds, now)
  }
  return { session: next, error: null }
}

export function undoSet(session, key, setId) {
  const next = mapSet(session, key, setId, (set) => ({ ...set, status: 'pending', completedAt: null }))
  return next.rest?.exerciseKey === key ? { ...next, rest: null } : next
}

export function updateCompletedSet(session, key, setId, patch) {
  const exercise = findExercise(session, key)
  const set = exercise?.sets.find((s) => s.id === setId)
  if (!exercise || !set) return { session, error: 'That set no longer exists.' }
  const candidate = { ...set, ...patch }
  const error = validateSetEntry(exercise.measurement, candidate)
  if (error) return { session, error }
  return { session: mapSet(session, key, setId, () => candidate), error: null }
}

export function addSet(session, key) {
  return mapExercise(session, key, (ex) => {
    const last = ex.sets.at(-1)
    return {
      ...ex,
      skipped: false,
      sets: [...ex.sets, blankSet(ex.sets.length + 1, { reps: last?.reps, loadKg: last?.loadKg })],
    }
  })
}

export function removePendingSet(session, key, setId) {
  return mapExercise(session, key, (ex) => {
    const set = ex.sets.find((s) => s.id === setId)
    if (!set || set.status === 'completed' || ex.sets.length <= 1) return ex
    return {
      ...ex,
      sets: ex.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, order: i + 1 })),
    }
  })
}

export function setSkipped(session, key, skipped) {
  return mapExercise(session, key, (ex) => ({ ...ex, skipped }))
}

export function goToExercise(session, index) {
  const clamped = Math.max(0, Math.min(session.exercises.length - 1, index))
  return { ...session, currentIndex: clamped }
}

// Change targets for the remaining sets of one exercise (jump-rope "Edit").
export function updateExerciseTarget(session, key, target) {
  return mapExercise(session, key, (ex) => {
    const completed = ex.sets.filter((s) => s.status === 'completed').length
    const wanted = Math.max(target.sets, completed, 1)
    let sets = [...ex.sets]
    while (sets.length < wanted) sets.push(blankSet(sets.length + 1))
    while (sets.length > wanted) {
      const lastPending = sets.findLastIndex((s) => s.status === 'pending')
      if (lastPending === -1) break
      sets.splice(lastPending, 1)
    }
    sets = sets.map((s, i) => ({ ...s, order: i + 1 }))
    return { ...ex, target: { ...ex.target, ...target, sets: wanted }, sets }
  })
}

// ---- work timer (timed + jump-rope sets) ------------------------------------

export function startWork(session, key, setId, now) {
  const stopped = foldAllWork(session, now)
  // A manually entered time becomes the starting point so it isn't lost.
  return mapSet(stopped, key, setId, (set) =>
    set.status === 'completed'
      ? set
      : { ...set, workMs: set.seconds != null ? set.seconds * 1000 : set.workMs, seconds: null, workRunningSince: now })
}

export function pauseWork(session, key, setId, now) {
  return mapSet(session, key, setId, (set) => foldWork(set, now))
}

export function resetWork(session, key, setId) {
  return mapSet(session, key, setId, (set) =>
    set.status === 'completed' ? set : { ...set, workMs: 0, workRunningSince: null, seconds: null, jumps: null })
}

export function isWorkRunning(session) {
  return session.exercises.some((ex) => ex.sets.some((s) => s.workRunningSince != null))
}

// ---- rest timer -------------------------------------------------------------

export function startRest(session, exerciseKey, seconds, now) {
  const totalMs = seconds * 1000
  return {
    ...session,
    rest: { exerciseKey, totalMs, remainingMs: totalMs, runningSince: session.status === 'active' ? now : null },
  }
}

export function skipRest(session) {
  return { ...session, rest: null }
}

export function adjustRest(session, deltaSeconds, now) {
  if (!session.rest) return session
  const remaining = Math.max(0, restRemainingMs(session, now) + deltaSeconds * 1000)
  if (remaining === 0) return skipRest(session)
  return {
    ...session,
    rest: {
      ...session.rest,
      totalMs: Math.max(session.rest.totalMs, remaining),
      remainingMs: remaining,
      runningSince: session.status === 'active' ? now : null,
    },
  }
}

// ---- progress helpers -------------------------------------------------------

export function countSets(session) {
  let target = 0
  let completed = 0
  session.exercises.forEach((ex) => {
    if (ex.skipped) {
      completed += ex.sets.filter((s) => s.status === 'completed').length
      target += ex.sets.filter((s) => s.status === 'completed').length
      return
    }
    target += ex.sets.length
    completed += ex.sets.filter((s) => s.status === 'completed').length
  })
  return { target, completed }
}

export function isExerciseDone(exercise) {
  return exercise.skipped || exercise.sets.every((s) => s.status === 'completed')
}
