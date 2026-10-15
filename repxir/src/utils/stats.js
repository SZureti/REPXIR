// Lightweight progress aggregates computed from completed sessions.
// Consistency is shown as active days, never as a breakable streak.

export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  return d
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const dayKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function weekDays(sessions, today = new Date()) {
  const start = startOfWeek(today)
  const active = new Set(
    sessions.filter((s) => new Date(s.startedAt) >= start).map((s) => (new Date(s.startedAt).getDay() + 6) % 7),
  )
  return Array.from({ length: 7 }, (_, i) => active.has(i))
}

export function computeStats(sessions, today = new Date()) {
  const weekStart = startOfWeek(today)
  const monthStart = startOfMonth(today)
  const thisWeek = sessions.filter((s) => new Date(s.startedAt) >= weekStart)
  const thisMonth = sessions.filter((s) => new Date(s.startedAt) >= monthStart)
  const weeks = new Set(sessions.map((s) => startOfWeek(new Date(s.startedAt)).getTime()))
  const seconds = (list) => list.reduce((sum, s) => sum + Math.round((s.elapsedMs ?? 0) / 1000), 0)

  return {
    totalSessions: sessions.length,
    sessionsThisWeek: thisWeek.length,
    activeDaysThisWeek: new Set(thisWeek.map((s) => dayKey(s.startedAt))).size,
    secondsThisWeek: seconds(thisWeek),
    secondsThisMonth: seconds(thisMonth),
    weeksActive: weeks.size,
  }
}

// Group sessions (newest first) by calendar day for the history timeline.
export function groupByDay(sessions) {
  const groups = []
  let current = null
  sessions.forEach((s) => {
    const key = dayKey(s.startedAt)
    if (!current || current.key !== key) {
      current = { key, date: s.startedAt, sessions: [] }
      groups.push(current)
    }
    current.sessions.push(s)
  })
  return groups
}
