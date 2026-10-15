// Deterministic session summaries. Only sets explicitly marked completed count
// (design.md §3). Lifting volume never includes jumps or timed work.

import { sessionElapsedMs } from '../services/sessionService.js'
import { formatMinutes, pluralize } from './format.js'
import { formatLoad } from './units.js'

export function summarizeExercise(exercise) {
  const done = exercise.sets.filter((s) => s.status === 'completed')
  const summary = {
    targetSets: exercise.sets.length,
    completedSets: done.length,
    reps: 0,
    volumeKg: 0,
    jumps: 0,
    seconds: 0,
    topLoadKg: null,
  }
  done.forEach((s) => {
    if (exercise.measurement === 'reps_weight' || exercise.measurement === 'reps_only') {
      summary.reps += s.reps ?? 0
      if (exercise.measurement === 'reps_weight' && s.loadKg > 0 && s.reps > 0) {
        summary.volumeKg += s.reps * s.loadKg
        summary.topLoadKg = Math.max(summary.topLoadKg ?? 0, s.loadKg)
      }
    }
    if (exercise.measurement === 'jumps_duration') summary.jumps += s.jumps ?? 0
    if (exercise.measurement === 'duration' || exercise.measurement === 'jumps_duration') summary.seconds += s.seconds ?? 0
  })
  return summary
}

export function summarizeSession(session, now = 0) {
  const totals = {
    targetSets: 0,
    completedSets: 0,
    totalReps: 0,
    volumeKg: 0,
    totalJumps: 0,
    ropeTargetSets: 0,
    ropeCompletedSets: 0,
    ropeWorkSeconds: 0,
    timedSeconds: 0,
    exercisesLogged: 0,
    hasRope: false,
    hasStrength: false,
    avgJumpsPerSet: null,
    jumpsPerMinute: null,
    elapsedSeconds: Math.round(sessionElapsedMs(session, now) / 1000),
  }

  session.exercises.forEach((exercise) => {
    const s = summarizeExercise(exercise)
    const counted = exercise.skipped ? s.completedSets : s.targetSets
    totals.targetSets += counted
    totals.completedSets += s.completedSets
    totals.totalReps += s.reps
    totals.volumeKg += s.volumeKg
    if (s.completedSets > 0) totals.exercisesLogged += 1
    if (exercise.measurement === 'jumps_duration') {
      totals.hasRope = true
      totals.totalJumps += s.jumps
      totals.ropeTargetSets += counted
      totals.ropeCompletedSets += s.completedSets
      totals.ropeWorkSeconds += s.seconds
    } else {
      totals.hasStrength = true
      if (exercise.measurement === 'duration') totals.timedSeconds += s.seconds
    }
  })

  if (totals.ropeCompletedSets > 0) {
    totals.avgJumpsPerSet = Math.round(totals.totalJumps / totals.ropeCompletedSets)
  }
  // Pace is derived from user-entered counts and time, and only when time exists.
  if (totals.ropeWorkSeconds > 0 && totals.totalJumps > 0) {
    totals.jumpsPerMinute = Math.round((totals.totalJumps / totals.ropeWorkSeconds) * 60)
  }
  totals.volumeKg = Math.round(totals.volumeKg * 1000) / 1000
  return totals
}

export const isRopeSession = (session) =>
  session.exercises.some((ex) => ex.measurement === 'jumps_duration')

// One-line description of what a completed session contained.
export function sessionHeadline(session, summary, unit) {
  const parts = [formatMinutes(summary.elapsedSeconds)]
  if (summary.hasRope && summary.totalJumps > 0) parts.push(`${summary.totalJumps.toLocaleString()} jumps`)
  if (summary.volumeKg > 0) parts.push(`${formatLoad(summary.volumeKg, unit)} volume`)
  else if (summary.totalReps > 0) parts.push(`${summary.totalReps} reps`)
  parts.push(pluralize(summary.completedSets, 'set'))
  return parts.join(' · ')
}
