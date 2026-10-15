// Local-first persistence (README "Storage strategy"):
//   IndexedDB    -> custom workouts and completed sessions
//   localStorage -> the in-progress session draft and small preferences
// The draft lives in localStorage because its writes are synchronous: a tap
// followed instantly by a reload or tab close is never lost. If localStorage
// is blocked, the draft falls back to IndexedDB. When IndexedDB is unavailable
// everything uses an in-memory store and the UI warns that data won't persist.

import { openDB } from 'idb'

const DB_NAME = 'repxir'
const DB_VERSION = 1
const ACTIVE_KEY = 'activeSession'
const ACTIVE_LS_KEY = 'repxir:activeSession'

let dbPromise = null
let memory = null

// Returns undefined when localStorage can't be used, null when there's no draft.
function readActiveMirror() {
  try {
    const raw = localStorage.getItem(ACTIVE_LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return undefined
  }
}

function writeActiveMirror(session) {
  try {
    if (session) localStorage.setItem(ACTIVE_LS_KEY, JSON.stringify(session))
    else localStorage.removeItem(ACTIVE_LS_KEY)
    return true
  } catch {
    return false
  }
}

function createMemoryStore() {
  return { customWorkouts: new Map(), sessions: new Map(), meta: new Map() }
}

export async function openStorage() {
  if (dbPromise) return (await dbPromise) ? 'indexeddb' : 'memory'
  dbPromise = (async () => {
    if (typeof indexedDB === 'undefined') return null
    try {
      return await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('customWorkouts')) db.createObjectStore('customWorkouts', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('sessions')) {
            const store = db.createObjectStore('sessions', { keyPath: 'id' })
            store.createIndex('startedAt', 'startedAt')
          }
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
        },
      })
    } catch {
      return null
    }
  })()
  const db = await dbPromise
  if (!db) memory = createMemoryStore()
  return db ? 'indexeddb' : 'memory'
}

async function db() {
  await openStorage()
  return dbPromise
}

export async function loadAll() {
  const database = await db()
  let customWorkouts
  let sessions
  let fallbackActive
  if (!database) {
    customWorkouts = [...memory.customWorkouts.values()]
    sessions = [...memory.sessions.values()]
    fallbackActive = memory.meta.get(ACTIVE_KEY)?.value ?? null
  } else {
    const [w, s, active] = await Promise.all([
      database.getAll('customWorkouts'),
      database.getAll('sessions'),
      database.get('meta', ACTIVE_KEY),
    ])
    customWorkouts = w
    sessions = s
    fallbackActive = active?.value ?? null
  }
  const mirror = readActiveMirror()
  let activeSession = mirror === undefined ? fallbackActive : mirror ?? fallbackActive
  // A draft whose finished copy already reached history was finished just
  // before the page closed; drop the leftover draft.
  if (activeSession && sessions.some((x) => x.id === activeSession.id)) {
    activeSession = null
    await saveActiveSession(null)
  }
  return { customWorkouts, sessions, activeSession }
}

export async function putCustomWorkout(workout) {
  const database = await db()
  if (!database) return void memory.customWorkouts.set(workout.id, workout)
  await database.put('customWorkouts', workout)
}

export async function deleteCustomWorkout(id) {
  const database = await db()
  if (!database) return void memory.customWorkouts.delete(id)
  await database.delete('customWorkouts', id)
}

export async function putSession(session) {
  const database = await db()
  if (!database) return void memory.sessions.set(session.id, session)
  await database.put('sessions', session)
}

export async function deleteSession(id) {
  const database = await db()
  if (!database) return void memory.sessions.delete(id)
  await database.delete('sessions', id)
}

export async function saveActiveSession(session) {
  // Synchronous first, so the draft survives an immediate reload.
  const mirrored = writeActiveMirror(session)
  const database = await db()
  if (!database) {
    if (session && !mirrored) memory.meta.set(ACTIVE_KEY, { key: ACTIVE_KEY, value: session })
    else memory.meta.delete(ACTIVE_KEY)
    return
  }
  if (session && !mirrored) await database.put('meta', { key: ACTIVE_KEY, value: session })
  else await database.delete('meta', ACTIVE_KEY)
}

// The finished session is written to history first and the draft cleared
// afterwards. If the page dies in between, loadAll() sees the session already
// in history and discards the leftover draft, so nothing is lost or doubled.
export async function commitFinishedSession(session) {
  const database = await db()
  if (!database) memory.sessions.set(session.id, session)
  else await database.put('sessions', session)
  await saveActiveSession(null)
}

export async function replaceAll({ customWorkouts, sessions }) {
  const database = await db()
  if (!database) {
    memory.customWorkouts = new Map(customWorkouts.map((w) => [w.id, w]))
    memory.sessions = new Map(sessions.map((s) => [s.id, s]))
    return
  }
  const tx = database.transaction(['customWorkouts', 'sessions'], 'readwrite')
  const workoutsStore = tx.objectStore('customWorkouts')
  const sessionsStore = tx.objectStore('sessions')
  await Promise.all([workoutsStore.clear(), sessionsStore.clear()])
  await Promise.all([
    ...customWorkouts.map((w) => workoutsStore.put(w)),
    ...sessions.map((s) => sessionsStore.put(s)),
    tx.done,
  ])
}

export async function clearAll() {
  writeActiveMirror(null)
  const database = await db()
  if (!database) {
    memory = createMemoryStore()
    return
  }
  const tx = database.transaction(['customWorkouts', 'sessions', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('customWorkouts').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('meta').clear(),
    tx.done,
  ])
}

// Test helper: forget the cached connection.
export function resetStorageForTests() {
  dbPromise = null
  memory = null
}
