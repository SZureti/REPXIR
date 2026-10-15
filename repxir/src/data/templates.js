// The 15 first-party workout templates (design.md §4). Read-only seed data:
// users customize them by duplicating into a custom workout.
//
// Each exercise block holds editable targets:
//   sets, repsMin/repsMax (reps measures), seconds (timed + rope), jumps (rope),
//   restSeconds, loadKg (optional target load), note (e.g. "each side").

const reps = (exerciseId, sets, repsMin, repsMax, restSeconds, note = '') => ({
  exerciseId, sets, repsMin, repsMax, seconds: null, jumps: null, restSeconds, loadKg: null, note,
})

const timed = (exerciseId, sets, seconds, restSeconds, note = '') => ({
  exerciseId, sets, repsMin: null, repsMax: null, seconds, jumps: null, restSeconds, loadKg: null, note,
})

const rope = (sets, jumps, seconds, restSeconds) => ({
  exerciseId: 'jump-rope', sets, repsMin: null, repsMax: null, seconds, jumps, restSeconds, loadKg: null, note: '',
})

const system = (id, name, category, focus, equipment, difficulty, description, notes, exercises) => ({
  id: `system-${id}`,
  origin: 'system',
  name,
  category,
  focus,
  equipment,
  difficulty,
  description,
  notes,
  exercises,
})

const STRENGTH_NOTE = 'Targets are suggestions. Lower the reps, sets, or load whenever you need to, and skip any movement that does not feel right today.'

export const SYSTEM_TEMPLATES = [
  system('chest', 'Chest Focus', 'muscle', ['chest'], ['bodyweight', 'dumbbell'], 'All levels',
    'Pressing and fly patterns for the chest using bodyweight and dumbbells.',
    STRENGTH_NOTE, [
      reps('push-up', 3, 8, 12, 60),
      reps('db-bench-press', 3, 8, 12, 90),
      reps('incline-push-up', 3, 8, 12, 60),
      reps('db-chest-fly', 3, 8, 12, 60),
    ]),
  system('back', 'Back Focus', 'muscle', ['back'], ['dumbbell', 'bands'], 'All levels',
    'Rows and rear-shoulder work to strengthen your upper back.',
    STRENGTH_NOTE, [
      reps('db-bent-over-row', 3, 8, 12, 90),
      reps('band-row', 3, 8, 12, 60),
      reps('one-arm-db-row', 3, 8, 12, 60, 'each side'),
      reps('db-reverse-fly', 3, 8, 12, 60),
    ]),
  system('shoulders', 'Shoulder Focus', 'muscle', ['shoulders'], ['dumbbell', 'bands'], 'All levels',
    'Pressing and raises for strong, stable shoulders.',
    STRENGTH_NOTE, [
      reps('db-overhead-press', 3, 8, 12, 90),
      reps('db-lateral-raise', 3, 8, 12, 60),
      reps('db-front-raise', 3, 8, 12, 60),
      reps('band-pull-apart', 3, 8, 12, 45),
    ]),
  system('biceps', 'Biceps Focus', 'muscle', ['biceps'], ['dumbbell', 'bands'], 'All levels',
    'Three curl variations for the front of the arms.',
    STRENGTH_NOTE, [
      reps('db-alternating-curl', 3, 10, 12, 60),
      reps('db-hammer-curl', 3, 10, 12, 60),
      reps('band-curl', 3, 10, 12, 45),
    ]),
  system('triceps', 'Triceps Focus', 'muscle', ['triceps'], ['bodyweight', 'dumbbell', 'bands'], 'All levels',
    'Pressing and extension work for the back of the arms.',
    STRENGTH_NOTE, [
      reps('close-grip-push-up', 3, 8, 12, 60),
      reps('db-overhead-triceps-extension', 3, 8, 12, 60),
      reps('band-pushdown', 3, 8, 12, 45),
    ]),
  system('core', 'Core Focus', 'muscle', ['core'], ['bodyweight'], 'Beginner',
    'Anti-extension and control drills for a steady trunk. Hold the plank for 20–45 seconds.',
    STRENGTH_NOTE, [
      reps('dead-bug', 3, 6, 10, 45, 'each side'),
      timed('plank', 3, 30, 45),
      reps('bird-dog', 3, 6, 10, 45, 'each side'),
      reps('crunch', 3, 10, 15, 45),
    ]),
  system('quads', 'Quadriceps Focus', 'muscle', ['quads'], ['bodyweight'], 'All levels',
    'Squat and single-leg patterns for the front of the thighs, finishing with a timed wall sit.',
    STRENGTH_NOTE, [
      reps('squat', 3, 8, 12, 90),
      reps('split-squat', 3, 8, 12, 60, 'each side'),
      reps('step-up', 3, 8, 12, 60, 'each side'),
      timed('wall-sit', 3, 30, 60),
    ]),
  system('hamstrings', 'Hamstrings Focus', 'muscle', ['hamstrings'], ['dumbbell', 'bands', 'bodyweight'], 'All levels',
    'Hip hinges and curls for the back of the thighs.',
    STRENGTH_NOTE, [
      reps('db-romanian-deadlift', 3, 8, 12, 90),
      reps('band-leg-curl', 3, 8, 12, 60),
      reps('good-morning', 3, 8, 12, 60),
      reps('bridge-walkout', 3, 8, 12, 60),
    ]),
  system('glutes', 'Glutes Focus', 'muscle', ['glutes'], ['bodyweight', 'bands'], 'All levels',
    'Bridges, thrusts, and lunges to build strong glutes.',
    STRENGTH_NOTE, [
      reps('glute-bridge', 3, 10, 15, 60),
      reps('hip-thrust', 3, 10, 15, 75),
      reps('reverse-lunge', 3, 10, 15, 60, 'each side'),
      reps('lateral-band-walk', 3, 10, 15, 45, 'steps each way'),
    ]),
  system('calves', 'Calves Focus', 'muscle', ['calves'], ['bodyweight', 'dumbbell'], 'Beginner',
    'Raises from standing and seated positions for the lower legs.',
    STRENGTH_NOTE, [
      reps('standing-calf-raise', 3, 12, 15, 45),
      reps('single-leg-calf-raise', 3, 12, 15, 45, 'each side'),
      reps('seated-calf-raise', 3, 12, 15, 45),
    ]),

  system('kettlebell', 'Full Body — Kettlebell', 'full-body', ['quads', 'hamstrings', 'back', 'shoulders', 'core'], ['kettlebell'], 'Beginner',
    'A balanced full-body workout with one kettlebell: squat, hinge, row, press, and carry. Swings are left out on purpose; add them later with coaching.',
    'Focus on good form and controlled movements. Rest 45–60 seconds between sets.', [
      reps('goblet-squat', 3, 8, 12, 60),
      reps('kb-deadlift', 3, 8, 12, 60),
      reps('kb-row', 3, 8, 12, 60, 'each side'),
      reps('kb-overhead-press', 3, 8, 12, 60, 'each side'),
      timed('suitcase-carry', 3, 30, 60, 'each side'),
    ]),
  system('barbell', 'Full Body — Barbell', 'full-body', ['quads', 'hamstrings', 'back', 'shoulders', 'chest'], ['barbell'], 'Intermediate',
    'Five classic barbell lifts. Choose a load you can move with clean form for every rep.',
    'Use a rack with safety arms for squats. Rest 2 minutes between heavy sets.', [
      reps('barbell-back-squat', 3, 6, 10, 120),
      reps('barbell-romanian-deadlift', 3, 6, 10, 120),
      reps('barbell-row', 3, 6, 10, 90),
      reps('barbell-overhead-press', 3, 6, 10, 90),
      reps('barbell-floor-press', 3, 6, 10, 90),
    ]),
  system('straps', 'Full Body — Resistance Straps', 'full-body', ['quads', 'back', 'chest', 'shoulders', 'core'], ['bands'], 'All levels',
    'Suspension straps or resistance bands for a full-body session. Control the tension in both directions.',
    'Most moves need a secure door or overhead anchor. Every exercise lists a no-anchor alternative.', [
      reps('strap-squat', 3, 10, 15, 60),
      reps('strap-row', 3, 10, 15, 60),
      reps('strap-chest-press', 3, 10, 15, 60),
      reps('strap-shoulder-press', 3, 10, 15, 60),
      reps('strap-pallof-press', 3, 10, 15, 45, 'each side'),
    ]),
  system('bodyweight', 'Full Body — Bodyweight / Calisthenics', 'full-body', ['quads', 'chest', 'glutes', 'back', 'core'], ['bodyweight'], 'Beginner',
    'No equipment needed. Squat, push, lunge, pull, and brace.',
    'Make any move easier by reducing range or reps. The inverted row needs a sturdy table or low bar.', [
      reps('squat', 3, 8, 15, 60),
      reps('push-up', 3, 8, 15, 60),
      reps('reverse-lunge', 3, 8, 15, 60, 'each side'),
      reps('inverted-row', 3, 8, 15, 60),
      timed('plank', 3, 30, 45),
    ]),

  system('jump-rope', 'Jump Rope — RX Rounds', 'cardio', ['cardio'], ['jump-rope'], 'All levels',
    'Rounds of jump rope with a jump target and a time target for each set. Log your actual jumps and work time separately.',
    'Jump counts are entered by you; REPXIR does not count jumps automatically. Hitting one target does not complete the other.', [
      rope(5, 100, 60, 45),
    ]),
]

export const SYSTEM_TEMPLATES_BY_ID = Object.fromEntries(SYSTEM_TEMPLATES.map((t) => [t.id, t]))
