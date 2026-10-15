import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StoreContext } from './contexts.js'
import * as storage from '../services/storage.js'
import { loadPrefs, savePrefs, clearPrefs, DEFAULT_PREFS } from '../services/prefs.js'
import { buildBackup, backupFileName, mergeData } from '../services/backupService.js'
import { createSession, finishSession, fromPersisted, toPersisted } from '../services/sessionService.js'
import { useToast } from './hooks.js'
import { downloadJson } from '../utils/download.js'


const now = () => performance.now()
const nowIso = () => new Date().toISOString()
const byNewest = (a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? '')

export function StoreProvider({ children }) {
  const { notify } = useToast()
  const [status, setStatus] = useState('loading')
  const [storageKind, setStorageKind] = useState(null)
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [sessions, setSessions] = useState([])
  const [active, setActiveState] = useState(null)
  const [recoveredDraft, setRecoveredDraft] = useState(false)
  const [prefs, setPrefsState] = useState(DEFAULT_PREFS)

  // Refs mirror the latest values so async actions never act on stale state.
  const activeRef = useRef(null)
  const dataRef = useRef({ customWorkouts: [], sessions: [], prefs: DEFAULT_PREFS })
  const draftTimer = useRef(null)
  const retryRef = useRef({})

  const setActive = useCallback((next) => {
    activeRef.current = next
    setActiveState(next)
  }, [])

  useEffect(() => {
    dataRef.current = { customWorkouts, sessions, prefs }
  }, [customWorkouts, sessions, prefs])

  const exportBackup = useCallback(() => {
    const backup = buildBackup(dataRef.current)
    downloadJson(backup, backupFileName())
  }, [])

  const reportSaveError = useCallback((retry) => {
    notify("We couldn't save your latest change. It's still on screen.", {
      tone: 'error',
      duration: 0,
      actions: [
        { label: 'Try again', onClick: retry },
        { label: 'Export backup', onClick: exportBackup },
      ],
    })
  }, [notify, exportBackup])

  const persistActive = useCallback(async () => {
    clearTimeout(draftTimer.current)
    const current = activeRef.current
    try {
      await storage.saveActiveSession(current ? toPersisted(current, now()) : null)
      return true
    } catch {
      reportSaveError(() => retryRef.current.persistActive())
      return false
    }
  }, [reportSaveError])

  // ---- boot ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const kind = await storage.openStorage()
        const data = await storage.loadAll()
        if (cancelled) return
        const loadedPrefs = loadPrefs()
        setStorageKind(kind)
        setPrefsState(loadedPrefs)
        setCustomWorkouts(data.customWorkouts.filter((w) => w?.id && Array.isArray(w.exercises)))
        setSessions(data.sessions.filter((s) => s?.id && s.status === 'completed').sort(byNewest))
        const restored = fromPersisted(data.activeSession)
        if (restored) {
          setActive(restored)
          setRecoveredDraft(true)
        }
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setActive])

  // While a session is running, checkpoint it every 15 s so a crash or hard
  // reload loses at most a few seconds of observed time.
  const running = active?.status === 'active'
  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => persistActive(), 15000)
    return () => clearInterval(id)
  }, [running, persistActive])

  // Checkpoint the active session when the page is hidden or closed.
  useEffect(() => {
    const checkpoint = () => {
      if (document.visibilityState === 'hidden' && activeRef.current) persistActive()
    }
    const onPageHide = () => {
      if (activeRef.current) persistActive()
    }
    document.addEventListener('visibilitychange', checkpoint)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', checkpoint)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [persistActive])

  // ---- active session -------------------------------------------------------

  // fn receives (session, now) and returns the next session.
  // persist: 'now' for completed sets and lifecycle changes, 'debounce' for typing.
  const updateActive = useCallback((fn, { persist = 'now' } = {}) => {
    const current = activeRef.current
    if (!current) return null
    const next = fn(current, now())
    if (next === current) return current
    setActive({ ...next, updatedAt: nowIso() })
    clearTimeout(draftTimer.current)
    if (persist === 'now') persistActive()
    else if (persist === 'debounce') draftTimer.current = setTimeout(persistActive, 400)
    return next
  }, [persistActive, setActive])

  const startSession = useCallback(async (template, { replace = false } = {}) => {
    if (activeRef.current && !replace) return { conflict: true }
    const session = createSession(template, { now: now(), nowIso: nowIso(), history: dataRef.current.sessions })
    setActive(session)
    setRecoveredDraft(false)
    await persistActive()
    return { ok: true, session }
  }, [persistActive, setActive])

  const discardActive = useCallback(async () => {
    setActive(null)
    setRecoveredDraft(false)
    await persistActive()
  }, [persistActive, setActive])

  const finishActive = useCallback(async () => {
    const current = activeRef.current
    if (!current) return null
    const completed = finishSession(current, now(), nowIso())
    try {
      await storage.commitFinishedSession(completed)
    } catch {
      reportSaveError(() => retryRef.current.finishActive())
      return null
    }
    clearTimeout(draftTimer.current)
    setSessions((list) => [completed, ...list.filter((s) => s.id !== completed.id)].sort(byNewest))
    setActive(null)
    setRecoveredDraft(false)
    return completed.id
  }, [reportSaveError, setActive])

  const dismissRecovery = useCallback(() => setRecoveredDraft(false), [])

  useEffect(() => {
    retryRef.current = { persistActive, finishActive }
  }, [persistActive, finishActive])

  // ---- custom workouts ------------------------------------------------------

  const saveWorkout = useCallback(async (workout) => {
    const saved = { ...workout, updatedAt: nowIso() }
    try {
      await storage.putCustomWorkout(saved)
    } catch {
      notify("We couldn't save this workout. Your changes are still in the form.", { tone: 'error' })
      return null
    }
    setCustomWorkouts((list) => {
      const exists = list.some((w) => w.id === saved.id)
      return exists ? list.map((w) => (w.id === saved.id ? saved : w)) : [...list, saved]
    })
    return saved
  }, [notify])

  const setWorkoutArchived = useCallback(async (id, archived) => {
    const workout = dataRef.current.customWorkouts.find((w) => w.id === id)
    if (!workout) return null
    return saveWorkout({ ...workout, archived })
  }, [saveWorkout])

  const deleteWorkout = useCallback(async (id) => {
    try {
      await storage.deleteCustomWorkout(id)
    } catch {
      notify("We couldn't delete that workout. Try again.", { tone: 'error' })
      return false
    }
    setCustomWorkouts((list) => list.filter((w) => w.id !== id))
    return true
  }, [notify])

  // ---- history --------------------------------------------------------------

  const deleteSession = useCallback(async (id) => {
    try {
      await storage.deleteSession(id)
    } catch {
      notify("We couldn't delete that session. Try again.", { tone: 'error' })
      return false
    }
    setSessions((list) => list.filter((s) => s.id !== id))
    return true
  }, [notify])

  const updateSessionNotes = useCallback(async (id, notes) => {
    const session = dataRef.current.sessions.find((s) => s.id === id)
    if (!session) return false
    const next = { ...session, notes, updatedAt: nowIso() }
    try {
      await storage.putSession(next)
    } catch {
      notify("We couldn't save your note. Try again.", { tone: 'error' })
      return false
    }
    setSessions((list) => list.map((s) => (s.id === id ? next : s)))
    return true
  }, [notify])

  // ---- preferences & data ---------------------------------------------------

  const setPrefs = useCallback((patch) => {
    const next = { ...dataRef.current.prefs, ...patch }
    dataRef.current = { ...dataRef.current, prefs: next }
    setPrefsState(next)
    if (!savePrefs(next)) notify('Preferences will reset when you close this tab: browser storage is blocked.', { tone: 'error' })
  }, [notify])

  const importData = useCallback(async (incoming, mode) => {
    const current = dataRef.current
    const next = mode === 'replace'
      ? { customWorkouts: incoming.customWorkouts, sessions: incoming.sessions }
      : mergeData(current, incoming)
    try {
      await storage.replaceAll(next)
    } catch {
      notify('Import failed. Nothing on this device was changed.', { tone: 'error' })
      return false
    }
    setCustomWorkouts(next.customWorkouts)
    setSessions([...next.sessions].sort(byNewest))
    if (incoming.unit) setPrefs({ unit: incoming.unit })
    return true
  }, [notify, setPrefs])

  const deleteAllData = useCallback(async () => {
    try {
      await storage.clearAll()
    } catch {
      notify("We couldn't delete your data. Try again.", { tone: 'error' })
      return false
    }
    clearTimeout(draftTimer.current)
    clearPrefs()
    setCustomWorkouts([])
    setSessions([])
    setActive(null)
    setRecoveredDraft(false)
    setPrefsState({ ...DEFAULT_PREFS })
    return true
  }, [notify, setActive])

  const value = useMemo(() => ({
    status,
    storageKind,
    customWorkouts,
    sessions,
    active,
    recoveredDraft,
    prefs,
    updateActive,
    startSession,
    discardActive,
    finishActive,
    dismissRecovery,
    persistActive,
    saveWorkout,
    setWorkoutArchived,
    deleteWorkout,
    deleteSession,
    updateSessionNotes,
    setPrefs,
    importData,
    deleteAllData,
    exportBackup,
  }), [
    status, storageKind, customWorkouts, sessions, active, recoveredDraft, prefs,
    updateActive, startSession, discardActive, finishActive, dismissRecovery, persistActive,
    saveWorkout, setWorkoutArchived, deleteWorkout, deleteSession, updateSessionNotes,
    setPrefs, importData, deleteAllData, exportBackup,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
