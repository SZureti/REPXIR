import { describe, expect, it } from 'vitest'
import {
  parseBlockFields, parseClockInput, parseDecimal, parseRepsRange, parseWholeNumber, validateSetEntry, validateWorkoutMeta,
} from '../../src/utils/validators.js'
import { formatLoad, fromDisplayLoad, KG_PER_LB, toDisplayLoad } from '../../src/utils/units.js'
import { formatClock, formatTarget } from '../../src/utils/format.js'
import { computeStats, groupByDay, startOfWeek } from '../../src/utils/stats.js'
import { summarizeExercise } from '../../src/utils/summaries.js'

describe('validators', () => {
  it('distinguishes 0 from missing', () => {
    expect(parseWholeNumber('0')).toEqual({ value: 0, error: null })
    expect(parseWholeNumber('')).toEqual({ value: null, error: null })
    expect(parseWholeNumber('', { required: true, label: 'Sets' }).error).toMatch(/required/)
  })

  it('rejects negatives, decimals, NaN, and implausibly large values', () => {
    expect(parseWholeNumber('-3').error).toBeTruthy()
    expect(parseWholeNumber('2.5').error).toBeTruthy()
    expect(parseWholeNumber('abc').error).toBeTruthy()
    expect(parseWholeNumber('999', { max: 500 }).error).toMatch(/500 or less/)
    expect(parseDecimal('12.5').value).toBe(12.5)
    expect(parseDecimal('12,5').value).toBe(12.5)
    expect(parseDecimal('1e9').error).toBeTruthy()
  })

  it('parses rep ranges and clock times', () => {
    expect(parseRepsRange('8-12').value).toEqual({ min: 8, max: 12 })
    expect(parseRepsRange('8–12').value).toEqual({ min: 8, max: 12 })
    expect(parseRepsRange('10').value).toEqual({ min: 10, max: 10 })
    expect(parseRepsRange('12-8').error).toBeTruthy()
    expect(parseClockInput('1:30').value).toBe(90)
    expect(parseClockInput('45').value).toBe(45)
    expect(parseClockInput('1:75').error).toBeTruthy()
  })

  it('requires a meaningful actual metric to complete a set', () => {
    expect(validateSetEntry('reps_weight', { reps: 10, loadKg: null })).toBeNull()
    expect(validateSetEntry('reps_only', { reps: 0 })).toMatch(/reps/)
    expect(validateSetEntry('duration', { seconds: null })).toMatch(/seconds/)
    expect(validateSetEntry('jumps_duration', { jumps: 0, seconds: 0 })).toMatch(/jumps or your work time/)
    expect(validateSetEntry('jumps_duration', { jumps: null, seconds: 40 })).toBeNull()
    expect(validateSetEntry('reps_weight', { reps: 5, loadKg: 5000 })).toMatch(/too large/)
  })

  it('validates builder rows and workout meta', () => {
    const ok = parseBlockFields({ exerciseId: 'db-bench-press', sets: '3', reps: '8-12', restSeconds: '1:30', load: '50' }, 'reps_weight', 'lb')
    expect(ok.errors).toEqual({})
    expect(ok.block).toMatchObject({ sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 })
    expect(ok.block.loadKg).toBeCloseTo(50 * KG_PER_LB)

    const rope = parseBlockFields({ exerciseId: 'jump-rope', sets: '5', jumps: '', seconds: '', restSeconds: '' }, 'jumps_duration', 'lb')
    expect(rope.errors.jumps).toMatch(/jump target, a time target, or both/)

    const bad = parseBlockFields({ exerciseId: 'plank', sets: '0', seconds: '' }, 'duration', 'kg')
    expect(bad.errors.sets).toBeTruthy()
    expect(bad.errors.seconds).toBeTruthy()

    expect(validateWorkoutMeta({ name: '  ' }).name).toBeTruthy()
    expect(validateWorkoutMeta({ name: 'My Strength Mix' })).toEqual({})
  })
})

describe('units', () => {
  it('stores kilograms and converts only for display', () => {
    const kg = fromDisplayLoad(35, 'lb')
    expect(toDisplayLoad(kg, 'lb')).toBe(35)
    expect(toDisplayLoad(kg, 'kg')).toBe(15.9)
    expect(formatLoad(20, 'kg')).toBe('20 kg')
    expect(toDisplayLoad(null, 'lb')).toBeNull()
  })
})

describe('formatting', () => {
  it('formats clocks and targets', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(3725)).toBe('1:02:05')
    expect(formatTarget({ sets: 3, repsMin: 8, repsMax: 12 }, 'reps_weight')).toBe('3 sets × 8–12 reps')
    expect(formatTarget({ sets: 5, jumps: 100, seconds: 60 }, 'jumps_duration')).toBe('5 sets × 100 jumps · 1:00')
    expect(formatTarget({ sets: 3, seconds: 30, note: 'each side' }, 'duration')).toBe('3 sets × 30 sec (each side)')
  })
})

describe('summaries', () => {
  it('computes volume only from completed weighted sets', () => {
    const exercise = {
      measurement: 'reps_weight',
      sets: [
        { status: 'completed', reps: 10, loadKg: 20 },
        { status: 'completed', reps: 8, loadKg: null },
        { status: 'pending', reps: 10, loadKg: 20 },
      ],
    }
    expect(summarizeExercise(exercise)).toMatchObject({ completedSets: 2, reps: 18, volumeKg: 200, topLoadKg: 20 })
  })

  it('never counts jumps or timed work as lifting volume', () => {
    const rope = { measurement: 'jumps_duration', sets: [{ status: 'completed', jumps: 100, seconds: 60, loadKg: 99, reps: 9 }] }
    expect(summarizeExercise(rope)).toMatchObject({ volumeKg: 0, reps: 0, jumps: 100, seconds: 60 })
  })
})

describe('stats', () => {
  it('counts this week from Monday and groups by day', () => {
    const today = new Date('2026-10-15T12:00:00') // Thursday
    expect(startOfWeek(today).getDay()).toBe(1)
    const sessions = [
      { startedAt: new Date('2026-10-15T08:00:00').toISOString(), elapsedMs: 1_800_000 },
      { startedAt: new Date('2026-10-15T07:00:00').toISOString(), elapsedMs: 600_000 },
      { startedAt: new Date('2026-10-13T07:00:00').toISOString(), elapsedMs: 600_000 },
      { startedAt: new Date('2026-10-02T07:00:00').toISOString(), elapsedMs: 600_000 },
    ]
    const stats = computeStats(sessions, today)
    expect(stats).toMatchObject({ totalSessions: 4, sessionsThisWeek: 3, activeDaysThisWeek: 2, weeksActive: 2 })
    expect(groupByDay(sessions)).toHaveLength(3)
  })
})
