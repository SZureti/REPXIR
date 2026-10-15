// Shared vocabulary for muscles, equipment, workout categories and measurements.
// Everything else references these ids, never raw display strings.

export const MUSCLES = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  forearms: 'Forearms',
  cardio: 'Cardio',
}

export const EQUIPMENT = {
  bodyweight: 'Bodyweight',
  dumbbell: 'Dumbbells',
  kettlebell: 'Kettlebell',
  barbell: 'Barbell',
  bands: 'Resistance straps / bands',
  'jump-rope': 'Jump rope',
}

export const CATEGORIES = {
  muscle: 'Muscle groups',
  'full-body': 'Full body',
  cardio: 'Jump rope',
  custom: 'My workouts',
}

// How an exercise is logged during a session.
export const MEASUREMENTS = {
  reps_weight: 'Reps + optional load',
  reps_only: 'Reps',
  duration: 'Time',
  jumps_duration: 'Jumps + time',
}

export const MEASUREMENT_IDS = Object.keys(MEASUREMENTS)

export const muscleLabel = (id) => MUSCLES[id] ?? id
export const equipmentLabel = (id) => EQUIPMENT[id] ?? id
