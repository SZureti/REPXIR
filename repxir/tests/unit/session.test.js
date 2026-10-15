import { describe, expect, it } from 'vitest'
import { SYSTEM_TEMPLATES_BY_ID } from '../../src/data/templates.js'
import * as S from '../../src/services/sessionService.js'
import { summarizeSession } from '../../src/utils/summaries.js'

const NOW_ISO = '2026-10-14T19:00:00.000Z'
const chest = SYSTEM_TEMPLATES_BY_ID['system-chest']
const rope = SYSTEM_TEMPLATES_BY_ID['system-jump-rope']

const start = (template, now = 0, history = []) => S.createSession(template, { now, nowIso: NOW_ISO, history })

function logRope(session, setIndex, jumps, seconds, now) {
  const ex = session.exercises[0]
  const set = ex.sets[setIndex]
  let s = S.updateSetDraft(session, ex.key, set.id, { jumps, seconds })
  const r = S.completeSet(s, ex.key, set.id, now)
  expect(r.error).toBeNull()
  return r.session
}

describe('session lifecycle', () => {
  it('snapshots the template so later template edits never change the session', () => {
    const template = structuredClone(chest)
    const session = start(template)
    template.exercises[0].sets = 9
    template.name = 'Renamed'
    expect(session.templateSnapshot.exercises[0].sets).toBe(3)
    expect(session.name).toBe('Chest Focus')
    expect(session.exercises[0].sets).toHaveLength(3)
  })

  it('counts a completed set exactly once, even if Complete is tapped twice', () => {
    let s = start(chest)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { reps: 10 })
    const first = S.completeSet(s, ex.key, ex.sets[0].id, 1000)
    const second = S.completeSet(first.session, ex.key, ex.sets[0].id, 1001)
    expect(second.duplicate).toBe(true)
    expect(second.session).toBe(first.session)
    expect(summarizeSession(second.session).completedSets).toBe(1)
    expect(summarizeSession(second.session).totalReps).toBe(10)
  })

  it('refuses to complete a set without a meaningful actual metric', () => {
    const s = start(chest)
    const ex = s.exercises[0]
    const r = S.completeSet(s, ex.key, ex.sets[0].id, 0)
    expect(r.error).toMatch(/reps/i)
    expect(r.session.exercises[0].sets[0].status).toBe('pending')
  })

  it('does not count draft input until the set is marked complete', () => {
    let s = start(chest)
    const ex = s.exercises[1]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { reps: 12, loadKg: 20 })
    expect(summarizeSession(s).totalReps).toBe(0)
    expect(summarizeSession(s).volumeKg).toBe(0)
  })

  it('stops counting elapsed time while paused', () => {
    let s = start(chest, 0)
    s = S.pauseSession(s, 60_000)
    expect(S.sessionElapsedMs(s, 600_000)).toBe(60_000)
    s = S.resumeSession(s, 600_000)
    expect(S.sessionElapsedMs(s, 630_000)).toBe(90_000)
  })

  it('restores a reloaded draft as paused without adding time spent away', () => {
    let s = start(chest, 0)
    const persisted = S.toPersisted(s, 45_000)
    expect(persisted.elapsedMs).toBe(45_000)
    expect(persisted.runningSince).toBeNull()
    const restored = S.fromPersisted(JSON.parse(JSON.stringify(persisted)))
    expect(restored.status).toBe('paused')
    // A new page has a fresh monotonic clock; no off-page seconds are added.
    expect(S.sessionElapsedMs(restored, 5)).toBe(45_000)
  })

  it('finishes into an immutable completed snapshot with timers folded', () => {
    let s = start(chest, 0)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { reps: 8 })
    s = S.completeSet(s, ex.key, ex.sets[0].id, 30_000).session
    const done = S.finishSession(s, 120_000, '2026-10-14T19:02:00.000Z')
    expect(done.status).toBe('completed')
    expect(done.elapsedMs).toBe(120_000)
    expect(done.runningSince).toBeNull()
    expect(done.rest).toBeNull()
    expect(summarizeSession(done).completedSets).toBe(1)
  })

  it('starts the rest timer after a set and pauses it with the session', () => {
    let s = start(chest, 0)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { reps: 10 })
    s = S.completeSet(s, ex.key, ex.sets[0].id, 1000).session
    expect(S.restRemainingMs(s, 11_000)).toBe(50_000)
    s = S.pauseSession(s, 11_000)
    expect(S.restRemainingMs(s, 99_000)).toBe(50_000)
  })

  it('prefills drafts from previous performance without counting them', () => {
    let first = start(chest, 0)
    const ex = first.exercises[1]
    first = S.updateSetDraft(first, ex.key, ex.sets[0].id, { reps: 10, loadKg: 15 })
    first = S.completeSet(first, ex.key, ex.sets[0].id, 1).session
    const history = [S.finishSession(first, 10, NOW_ISO)]
    const second = start(chest, 0, history)
    expect(second.exercises[1].sets[0]).toMatchObject({ reps: 10, loadKg: 15, status: 'pending' })
    expect(S.previousPerformance(history, 'db-bench-press').sets).toHaveLength(1)
  })
})

describe('jump rope tracking', () => {
  it('keeps the actual jump count instead of the target (92 stays 92)', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, 92, 60, 1000)
    const set = s.exercises[0].sets[0]
    expect(set.jumps).toBe(92)
    expect(set.seconds).toBe(60)
    expect(s.exercises[0].target.jumps).toBe(100)
  })

  it('accumulates work time only while the timer runs', () => {
    let s = start(rope, 0)
    const ex = s.exercises[0]
    const id = ex.sets[0].id
    s = S.startWork(s, ex.key, id, 0)
    s = S.pauseWork(s, ex.key, id, 20_000)
    // 30 s paused: nothing accrues
    s = S.startWork(s, ex.key, id, 50_000)
    s = S.updateSetDraft(s, ex.key, id, { jumps: 50 })
    const r = S.completeSet(s, ex.key, id, 60_000)
    expect(r.session.exercises[0].sets[0].seconds).toBe(30)
    expect(r.session.exercises[0].sets[0].jumps).toBe(50)
  })

  it('totals only completed sets: 90 + 100 + 110 = 300 jumps', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, 90, 60, 1)
    s = logRope(s, 1, 100, 60, 2)
    s = logRope(s, 2, 110, 60, 3)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[3].id, { jumps: 40 }) // draft only
    const summary = summarizeSession(s, 3)
    expect(summary.totalJumps).toBe(300)
    expect(summary.ropeCompletedSets).toBe(3)
    expect(summary.ropeTargetSets).toBe(5)
    expect(summary.ropeWorkSeconds).toBe(180)
    expect(summary.avgJumpsPerSet).toBe(100)
    expect(summary.jumpsPerMinute).toBe(100)
  })

  it('reports pace as unavailable when no duration was recorded', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, 100, null, 1)
    const summary = summarizeSession(s, 1)
    expect(summary.totalJumps).toBe(100)
    expect(summary.jumpsPerMinute).toBeNull()
  })

  it('never infers jumps from time', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, null, 45, 1)
    expect(s.exercises[0].sets[0].jumps).toBeNull()
    expect(summarizeSession(s, 1).totalJumps).toBe(0)
  })

  it('reset clears the draft count and timer but not completed sets', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, 100, 60, 1)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[1].id, { jumps: 30 })
    s = S.startWork(s, ex.key, ex.sets[1].id, 10)
    s = S.resetWork(s, ex.key, ex.sets[1].id)
    expect(s.exercises[0].sets[1]).toMatchObject({ jumps: null, workMs: 0, workRunningSince: null })
    expect(s.exercises[0].sets[0].jumps).toBe(100)
  })

  it('editing targets only changes pending sets', () => {
    let s = start(rope, 0)
    s = logRope(s, 0, 100, 60, 1)
    s = S.updateExerciseTarget(s, s.exercises[0].key, { sets: 3, jumps: 120, seconds: 90, restSeconds: 30 })
    expect(s.exercises[0].sets).toHaveLength(3)
    expect(s.exercises[0].sets[0]).toMatchObject({ status: 'completed', jumps: 100 })
    expect(s.exercises[0].target).toMatchObject({ sets: 3, jumps: 120, seconds: 90 })
  })

  it('persists draft jump counts across a reload', () => {
    let s = start(rope, 0)
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { jumps: 37 })
    s = S.startWork(s, ex.key, ex.sets[0].id, 0)
    const restored = S.fromPersisted(JSON.parse(JSON.stringify(S.toPersisted(s, 25_000))))
    expect(restored.exercises[0].sets[0]).toMatchObject({ jumps: 37, workMs: 25_000, workRunningSince: null })
  })
})
