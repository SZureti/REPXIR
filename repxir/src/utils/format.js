// Display formatting for durations, dates, and targets.

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export function formatMinutes(totalSeconds) {
  if ((totalSeconds ?? 0) < 60) return '<1 min'
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatHours(totalSeconds) {
  const hours = (totalSeconds ?? 0) / 3600
  if (hours < 1) return `${Math.round((totalSeconds ?? 0) / 60)}m`
  return `${Math.round(hours * 10) / 10}h`
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

export const formatDate = (iso) => dateFmt.format(new Date(iso))
export const formatDay = (iso) => dayFmt.format(new Date(iso))
export const formatTime = (iso) => timeFmt.format(new Date(iso))

export function formatRepsTarget(block) {
  const { repsMin, repsMax } = block
  if (repsMin == null && repsMax == null) return null
  if (repsMin != null && repsMax != null && repsMin !== repsMax) return `${repsMin}–${repsMax}`
  return String(repsMax ?? repsMin)
}

// "3 sets × 8–12 reps", "3 sets × 30 sec", "5 sets × 100 jumps · 1:00"
export function formatTarget(block, measurement) {
  const sets = `${block.sets} ${block.sets === 1 ? 'set' : 'sets'}`
  let work
  if (measurement === 'jumps_duration') {
    const parts = []
    if (block.jumps != null) parts.push(`${block.jumps} jumps`)
    if (block.seconds != null) parts.push(formatClock(block.seconds))
    work = parts.join(' · ') || 'open'
  } else if (measurement === 'duration') {
    work = block.seconds != null ? `${block.seconds} sec` : 'timed'
  } else {
    const r = formatRepsTarget(block)
    work = r ? `${r} reps` : 'reps'
  }
  const note = block.note ? ` (${block.note})` : ''
  return `${sets} × ${work}${note}`
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
