import { ShieldCheck } from 'lucide-react'
import { getExercise } from '../data/exercises.js'
import { equipmentLabel, muscleLabel } from '../data/taxonomy.js'

// Accessible text explanation of a movement; never relies on images.
export default function ExerciseInfo({ exerciseId }) {
  const exercise = getExercise(exerciseId)
  if (!exercise) return null
  const alternatives = exercise.alternatives.map(getExercise).filter(Boolean)
  return (
    <div className="exercise-info">
      <p>{exercise.instructions}</p>
      {exercise.safetyNote && (
        <p className="exercise-info__safety">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>{exercise.safetyNote}</span>
        </p>
      )}
      <dl className="exercise-info__meta">
        <div>
          <dt>Works</dt>
          <dd>{[...exercise.primaryMuscles, ...exercise.secondaryMuscles].map(muscleLabel).join(', ')}</dd>
        </div>
        <div>
          <dt>Equipment</dt>
          <dd>{exercise.equipment.map(equipmentLabel).join(', ')}</dd>
        </div>
        {alternatives.length > 0 && (
          <div>
            <dt>Alternatives</dt>
            <dd>{alternatives.map((a) => a.name).join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
