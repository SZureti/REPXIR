import { beforeEach, describe, expect, it } from 'vitest'
import { SYSTEM_TEMPLATES, SYSTEM_TEMPLATES_BY_ID } from '../../src/data/templates.js'
import {
  duplicateTemplate, estimateSeconds, filterTemplates, findTemplate, listTemplates, newCustomWorkout,
} from '../../src/services/workoutService.js'
import { buildBackup, mergeData, parseBackup, previewImport } from '../../src/services/backupService.js'
import * as storage from '../../src/services/storage.js'
import * as S from '../../src/services/sessionService.js'

const custom = (overrides = {}) => newCustomWorkout({
  name: 'My Strength Mix',
  exercises: [{ exerciseId: 'squat', sets: 3, repsMin: 10, repsMax: 10, seconds: null, jumps: null, restSeconds: 60, loadKg: null, note: '' }],
  ...overrides,
})

describe('workout library', () => {
  it('finds Chest Focus when filtering by chest', () => {
    const results = filterTemplates(SYSTEM_TEMPLATES, { category: 'muscle', focus: 'chest' })
    expect(results.map((t) => t.name)).toContain('Chest Focus')
    expect(filterTemplates(SYSTEM_TEMPLATES, { q: 'chest' }).map((t) => t.name)).toContain('Chest Focus')
  })

  it('searches names, muscles, equipment, and exercise names', () => {
    expect(filterTemplates(SYSTEM_TEMPLATES, { q: 'goblet' }).map((t) => t.id)).toEqual(['system-kettlebell'])
    expect(filterTemplates(SYSTEM_TEMPLATES, { gear: 'barbell' }).map((t) => t.id)).toEqual(['system-barbell'])
    expect(filterTemplates(SYSTEM_TEMPLATES, { q: 'unicorn press' })).toEqual([])
    expect(filterTemplates(SYSTEM_TEMPLATES, { category: 'cardio' }).map((t) => t.id)).toEqual(['system-jump-rope'])
  })

  it('hides archived custom workouts unless asked', () => {
    const archived = custom({ archived: true })
    expect(listTemplates([archived])).toHaveLength(15)
    expect(listTemplates([archived], { includeArchived: true })).toHaveLength(16)
    expect(findTemplate(archived.id, [archived])).toBe(archived)
  })

  it('duplicates a built-in workout without touching the original', () => {
    const original = SYSTEM_TEMPLATES_BY_ID['system-chest']
    const before = JSON.stringify(original)
    const copy = duplicateTemplate(original)
    copy.exercises[0].sets = 10
    copy.name = 'Changed'
    expect(JSON.stringify(original)).toBe(before)
    expect(copy.origin).toBe('custom')
    expect(copy.id).not.toBe(original.id)
    expect(copy.duplicatedFrom).toBe('system-chest')
  })

  it('estimates a plausible duration in 5-minute steps', () => {
    SYSTEM_TEMPLATES.forEach((t) => {
      const sec = estimateSeconds(t)
      expect(sec % 300).toBe(0)
      expect(sec).toBeGreaterThanOrEqual(300)
      expect(sec).toBeLessThan(90 * 60)
    })
  })
})

describe('backup', () => {
  const finished = () => {
    let s = S.createSession(SYSTEM_TEMPLATES_BY_ID['system-chest'], { now: 0, nowIso: '2026-10-14T19:00:00.000Z' })
    const ex = s.exercises[0]
    s = S.updateSetDraft(s, ex.key, ex.sets[0].id, { reps: 10 })
    s = S.completeSet(s, ex.key, ex.sets[0].id, 1).session
    return S.finishSession(s, 1000, '2026-10-14T19:30:00.000Z')
  }

  it('round-trips an export', () => {
    const data = { customWorkouts: [custom()], sessions: [finished()], prefs: { unit: 'kg' } }
    const parsed = parseBackup(JSON.stringify(buildBackup(data)))
    expect(parsed.ok).toBe(true)
    expect(parsed.data.customWorkouts).toHaveLength(1)
    expect(parsed.data.sessions).toHaveLength(1)
    expect(parsed.data.unit).toBe('kg')
  })

  it('rejects malformed or foreign files with a clear reason', () => {
    expect(parseBackup('not json').error).toMatch(/not valid JSON/)
    expect(parseBackup(JSON.stringify({ hello: 1 })).error).toMatch(/REPXIR backup/)
    expect(parseBackup(JSON.stringify({ app: 'repxir', schemaVersion: 99, customWorkouts: [], sessions: [] })).error).toMatch(/newer version/)
    const badExercise = buildBackup({ customWorkouts: [custom({ exercises: [{ exerciseId: 'moon-jump', sets: 3 }] })], sessions: [], prefs: { unit: 'lb' } })
    expect(parseBackup(JSON.stringify(badExercise)).error).toMatch(/unknown exercise/)
    const badSession = buildBackup({ customWorkouts: [], sessions: [{ ...finished(), startedAt: 'yesterday' }], prefs: { unit: 'lb' } })
    expect(parseBackup(JSON.stringify(badSession)).error).toMatch(/start date/)
  })

  it('merges without overwriting existing records', () => {
    const mine = custom({ name: 'Mine' })
    const theirs = custom({ name: 'Theirs' })
    const conflicting = { ...mine, name: 'Imported copy' }
    const current = { customWorkouts: [mine], sessions: [] }
    const incoming = { customWorkouts: [conflicting, theirs], sessions: [] }
    expect(previewImport(current, incoming)).toMatchObject({ workouts: 2, newWorkouts: 1 })
    const merged = mergeData(current, incoming)
    expect(merged.customWorkouts.map((w) => w.name)).toEqual(['Mine', 'Theirs'])
  })
})

describe('IndexedDB storage', () => {
  beforeEach(async () => {
    await storage.openStorage()
    await storage.clearAll()
  })

  it('persists custom workouts and sessions', async () => {
    const workout = custom()
    await storage.putCustomWorkout(workout)
    const data = await storage.loadAll()
    expect(data.customWorkouts.map((w) => w.id)).toEqual([workout.id])
  })

  it('saves a finished session and clears the draft in one step', async () => {
    let s = S.createSession(SYSTEM_TEMPLATES_BY_ID['system-calves'], { now: 0, nowIso: '2026-10-14T19:00:00.000Z' })
    await storage.saveActiveSession(S.toPersisted(s, 10))
    expect((await storage.loadAll()).activeSession?.id).toBe(s.id)
    s = S.finishSession(s, 20, '2026-10-14T19:10:00.000Z')
    await storage.commitFinishedSession(s)
    const data = await storage.loadAll()
    expect(data.activeSession).toBeNull()
    expect(data.sessions.map((x) => x.id)).toEqual([s.id])
  })

  it('keeps the draft in localStorage so an instant reload never loses it', async () => {
    const s = S.createSession(SYSTEM_TEMPLATES_BY_ID['system-calves'], { now: 0, nowIso: '2026-10-14T19:00:00.000Z' })
    const pending = storage.saveActiveSession(S.toPersisted(s, 10))
    // Written synchronously, before the IndexedDB promise settles.
    expect(JSON.parse(localStorage.getItem('repxir:activeSession')).id).toBe(s.id)
    await pending
  })

  it('drops a leftover draft whose finished copy is already in history', async () => {
    const s = S.createSession(SYSTEM_TEMPLATES_BY_ID['system-calves'], { now: 0, nowIso: '2026-10-14T19:00:00.000Z' })
    await storage.putSession(S.finishSession(s, 20, '2026-10-14T19:10:00.000Z'))
    localStorage.setItem('repxir:activeSession', JSON.stringify(S.toPersisted(s, 10)))
    const data = await storage.loadAll()
    expect(data.activeSession).toBeNull()
    expect(data.sessions).toHaveLength(1)
    expect(localStorage.getItem('repxir:activeSession')).toBeNull()
  })

  it('replaces and clears everything', async () => {
    await storage.putCustomWorkout(custom())
    await storage.replaceAll({ customWorkouts: [custom({ name: 'B' })], sessions: [] })
    expect((await storage.loadAll()).customWorkouts.map((w) => w.name)).toEqual(['B'])
    await storage.clearAll()
    expect((await storage.loadAll()).customWorkouts).toEqual([])
  })
})
