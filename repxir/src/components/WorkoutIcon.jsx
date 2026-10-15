import { BicepsFlexed, Cable, Dumbbell, Footprints, ListChecks, PersonStanding, Target, Weight } from 'lucide-react'

// Line icons in the same 24px stroke style as lucide for gear lucide lacks.
function SvgIcon({ size = 24, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export function BarbellIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M2 12h20" />
      <rect x="4" y="7" width="3" height="10" rx="1" />
      <rect x="17" y="7" width="3" height="10" rx="1" />
      <path d="M8 9.5v5M16 9.5v5" />
    </SvgIcon>
  )
}

export function JumpRopeIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="2" width="4" height="8" rx="1.5" />
      <rect x="17" y="2" width="4" height="8" rx="1.5" />
      <path d="M5 10c0 6 3 11 7 11s7-5 7-11" />
    </SvgIcon>
  )
}

const MUSCLE_ICONS = {
  chest: Dumbbell,
  back: Dumbbell,
  shoulders: Dumbbell,
  biceps: BicepsFlexed,
  triceps: BicepsFlexed,
  core: Target,
  quads: Footprints,
  hamstrings: Footprints,
  glutes: Footprints,
  calves: Footprints,
}

const GEAR_ICONS = {
  kettlebell: Weight,
  barbell: BarbellIcon,
  bands: Cable,
  bodyweight: PersonStanding,
  'jump-rope': JumpRopeIcon,
  dumbbell: Dumbbell,
}

function TemplateGlyph({ template, size }) {
  const props = { size, 'aria-hidden': true }
  if (template.origin === 'custom') return <ListChecks {...props} />
  if (template.category === 'cardio') return <JumpRopeIcon {...props} />
  if (template.category === 'full-body') {
    const Gear = GEAR_ICONS[template.equipment?.[0]] ?? PersonStanding
    return <Gear {...props} />
  }
  const Muscle = MUSCLE_ICONS[template.focus?.[0]] ?? Dumbbell
  return <Muscle {...props} />
}

export function ExerciseGlyph({ exercise, size = 18 }) {
  const props = { size, 'aria-hidden': true }
  if (exercise?.measurement === 'jumps_duration') return <JumpRopeIcon {...props} />
  const Gear = GEAR_ICONS[exercise?.equipment?.[0]] ?? Dumbbell
  return <Gear {...props} />
}

export function ExerciseIcon({ exercise }) {
  return (
    <span className="tile-icon tile-icon--sm" aria-hidden="true">
      <ExerciseGlyph exercise={exercise} />
    </span>
  )
}

export default function WorkoutIcon({ template, size = 'md' }) {
  const px = size === 'lg' ? 30 : size === 'sm' ? 18 : 24
  return (
    <span className={`tile-icon${size === 'md' ? '' : ` tile-icon--${size}`}`} aria-hidden="true">
      <TemplateGlyph template={template} size={px} />
    </span>
  )
}
