import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISES_BY_ID } from '../../src/data/exercises.js'
import { SYSTEM_TEMPLATES } from '../../src/data/templates.js'
import { EQUIPMENT, MEASUREMENT_IDS, MUSCLES } from '../../src/data/taxonomy.js'

describe('seed data integrity', () => {
  it('ships exactly 15 built-in templates: 10 muscle, 4 full body, 1 jump rope', () => {
    expect(SYSTEM_TEMPLATES).toHaveLength(15)
    const byCategory = (c) => SYSTEM_TEMPLATES.filter((t) => t.category === c).map((t) => t.name)
    expect(byCategory('muscle')).toEqual([
      'Chest Focus', 'Back Focus', 'Shoulder Focus', 'Biceps Focus', 'Triceps Focus',
      'Core Focus', 'Quadriceps Focus', 'Hamstrings Focus', 'Glutes Focus', 'Calves Focus',
    ])
    expect(byCategory('full-body')).toEqual([
      'Full Body — Kettlebell', 'Full Body — Barbell', 'Full Body — Resistance Straps', 'Full Body — Bodyweight / Calisthenics',
    ])
    expect(byCategory('cardio')).toEqual(['Jump Rope — RX Rounds'])
  })

  it('has unique template ids and names', () => {
    expect(new Set(SYSTEM_TEMPLATES.map((t) => t.id)).size).toBe(15)
    expect(new Set(SYSTEM_TEMPLATES.map((t) => t.name)).size).toBe(15)
  })

  it('links every template block to a catalog exercise with valid targets', () => {
    SYSTEM_TEMPLATES.forEach((t) => {
      expect(t.origin).toBe('system')
      expect(t.exercises.length).toBeGreaterThan(0)
      t.focus.forEach((f) => expect(MUSCLES).toHaveProperty(f))
      t.equipment.forEach((e) => expect(EQUIPMENT).toHaveProperty(e))
      t.exercises.forEach((b) => {
        const exercise = EXERCISES_BY_ID[b.exerciseId]
        expect(exercise, `${t.name} → ${b.exerciseId}`).toBeTruthy()
        expect(Number.isInteger(b.sets) && b.sets > 0).toBe(true)
        if (exercise.measurement === 'reps_weight' || exercise.measurement === 'reps_only') {
          expect(b.repsMin).toBeGreaterThan(0)
          expect(b.repsMax).toBeGreaterThanOrEqual(b.repsMin)
        }
        if (exercise.measurement === 'duration') expect(b.seconds).toBeGreaterThan(0)
      })
    })
  })

  it('defaults jump rope to 5 sets × 100 jumps × 60 s with 45 s rest', () => {
    const rope = SYSTEM_TEMPLATES.find((t) => t.id === 'system-jump-rope')
    expect(rope.exercises).toHaveLength(1)
    expect(rope.exercises[0]).toMatchObject({ exerciseId: 'jump-rope', sets: 5, jumps: 100, seconds: 60, restSeconds: 45 })
    expect(EXERCISES_BY_ID['jump-rope'].measurement).toBe('jumps_duration')
  })

  it('gives every exercise a stable id, text instructions, and valid references', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
    EXERCISES.forEach((e) => {
      expect(MEASUREMENT_IDS).toContain(e.measurement)
      expect(e.instructions.length).toBeGreaterThan(20)
      expect(e.primaryMuscles.length).toBeGreaterThan(0)
      e.primaryMuscles.concat(e.secondaryMuscles).forEach((m) => expect(MUSCLES).toHaveProperty(m))
      e.equipment.forEach((q) => expect(EQUIPMENT).toHaveProperty(q))
      e.alternatives.forEach((a) => expect(EXERCISES_BY_ID, `${e.id} alt ${a}`).toHaveProperty(a))
    })
  })

  it('offers a no-anchor alternative for every strap/band move that needs an anchor', () => {
    EXERCISES.filter((e) => e.equipment.includes('bands') && /anchor/i.test(e.safetyNote ?? ''))
      .forEach((e) => expect(e.safetyNote).toMatch(/No anchor\?|under your feet|around your feet|under the band|Swap in/i))
  })
})
