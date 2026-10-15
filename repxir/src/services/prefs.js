// Small per-device preferences in localStorage. Every access is guarded:
// storage can be blocked, full, or cleared at any time.

const KEY = 'repxir:prefs'

export const DEFAULT_PREFS = {
  unit: 'lb',
  displayName: '',
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PREFS,
      unit: parsed.unit === 'kg' ? 'kg' : 'lb',
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName.slice(0, 40) : '',
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ unit: prefs.unit, displayName: prefs.displayName }))
    return true
  } catch {
    return false
  }
}

export function clearPrefs() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
