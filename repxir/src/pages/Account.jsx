import { useRef, useState } from 'react'
import { CalendarCheck, ChevronRight, Clock, Download, Dumbbell, Info, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react'
import { useConfirm, useStore, useToast } from '../store/hooks.js'
import PageHeader from '../components/PageHeader.jsx'
import Dialog from '../components/Dialog.jsx'
import { MAX_IMPORT_BYTES, parseBackup, previewImport } from '../services/backupService.js'
import { computeStats } from '../utils/stats.js'
import { formatDate, formatHours, pluralize } from '../utils/format.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

function ImportDialog({ pending, onClose }) {
  const { customWorkouts, sessions, importData } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  if (!pending) return null
  const preview = previewImport({ customWorkouts, sessions }, pending.data)

  const run = async (mode) => {
    if (mode === 'replace') {
      const ok = await confirm({
        title: 'Replace all data on this device?',
        body: `Your ${pluralize(customWorkouts.length, 'custom workout')} and ${pluralize(sessions.length, 'session')} here will be replaced by the backup. This cannot be undone.`,
        confirmLabel: 'Replace data',
        tone: 'danger',
      })
      if (!ok) return
    }
    setBusy(true)
    const done = await importData(pending.data, mode)
    setBusy(false)
    if (done) {
      notify(mode === 'replace' ? 'Backup restored.' : `Imported ${pluralize(preview.newWorkouts, 'workout')} and ${pluralize(preview.newSessions, 'session')}.`, { tone: 'success' })
      onClose()
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Import backup"
      description={`${pending.fileName}${pending.data.exportedAt ? ` · exported ${formatDate(pending.data.exportedAt)}` : ''}`}
      actions={
        <div className="stack stack--sm" style={{ width: '100%' }}>
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => run('merge')}>
            Merge into this device
          </button>
          <button type="button" className="btn btn--danger-outline btn--block" disabled={busy} onClick={() => run('replace')}>
            Replace everything
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onClose}>Cancel</button>
        </div>
      }
    >
      <dl className="import-preview">
        <div><dt>Custom workouts in file</dt><dd className="num">{preview.workouts}</dd></div>
        <div><dt>Sessions in file</dt><dd className="num">{preview.sessions}</dd></div>
        <div><dt>New to this device</dt><dd className="num">{preview.newWorkouts} workouts · {preview.newSessions} sessions</dd></div>
      </dl>
      <p className="small muted">
        Merge keeps everything already here and only adds what&apos;s missing. Replace swaps your workouts and history for the backup.
      </p>
    </Dialog>
  )
}

export default function Account() {
  usePageTitle('Account')
  const { prefs, setPrefs, sessions, customWorkouts, active, exportBackup, deleteAllData, storageKind } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const fileRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [name, setName] = useState(prefs.displayName)
  const stats = computeStats(sessions)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      notify('That file is too large to be a REPXIR backup.', { tone: 'error' })
      return
    }
    const result = parseBackup(await file.text())
    if (!result.ok) {
      notify(`Import failed: ${result.error} Nothing was changed.`, { tone: 'error' })
      return
    }
    setPendingImport({ fileName: file.name, data: result.data })
  }

  const handleDeleteAll = async () => {
    const ok = await confirm({
      title: 'Delete all data?',
      body: `This permanently deletes ${pluralize(customWorkouts.length, 'custom workout')}, ${pluralize(sessions.length, 'session')}${active ? ', your workout in progress,' : ''} and your preferences from this browser. Export a backup first if you might want it later.`,
      confirmLabel: 'Delete everything',
      tone: 'danger',
    })
    if (ok && (await deleteAllData())) {
      setName('')
      notify('All data deleted from this device.', { tone: 'success' })
    }
  }

  const initials = prefs.displayName.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div>
      <PageHeader title="Account" subtitle="Manage your profile, preferences, and data." />

      <div className="split">
        <div className="stack stack--lg">
          <section className="card profile-card" aria-label="Profile">
            <span className="profile-card__avatar" aria-hidden="true">
              {initials || <UserRound size={28} />}
            </span>
            <form className="grow field" onSubmit={(e) => {
              e.preventDefault()
              setPrefs({ displayName: name.trim().slice(0, 40) })
              notify('Name saved.', { tone: 'success' })
            }}>
              <label className="field__label" htmlFor="display-name">Display name</label>
              <div className="row">
                <input id="display-name" className="input" value={name} maxLength={40} placeholder="What should we call you?"
                  onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
                {name.trim() !== prefs.displayName && <button type="submit" className="btn btn--secondary">Save</button>}
              </div>
              <span className="field__hint">No account needed. Stored on this device only.</span>
            </form>
          </section>

          <section className="section" aria-labelledby="stats-heading">
            <h2 id="stats-heading">Personal stats</h2>
            <div className="grid grid--3">
              <div className="stat">
                <Dumbbell size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{stats.totalSessions}</span>
                <span className="stat__label">Workouts total</span>
              </div>
              <div className="stat">
                <CalendarCheck size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{stats.weeksActive}</span>
                <span className="stat__label">Weeks active</span>
              </div>
              <div className="stat">
                <Clock size={20} className="stat__icon" aria-hidden="true" />
                <span className="stat__value">{formatHours(stats.secondsThisMonth)}</span>
                <span className="stat__label">Time this month</span>
              </div>
            </div>
          </section>

          <section className="section" aria-labelledby="prefs-heading">
            <h2 id="prefs-heading">Preferences</h2>
            <div className="list">
              <div className="list-row">
                <span className="tile-icon tile-icon--sm" aria-hidden="true"><Dumbbell size={18} /></span>
                <div className="list-row__body">
                  <p className="list-row__title" id="units-label">Units</p>
                  <p className="list-row__meta">Weights are stored exactly; this only changes how they&apos;re shown.</p>
                </div>
                <div className="segmented" role="radiogroup" aria-labelledby="units-label">
                  {['lb', 'kg'].map((u) => (
                    <button key={u} type="button" role="radio" aria-checked={prefs.unit === u} className="segmented__option"
                      onClick={() => setPrefs({ unit: u })}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="section" aria-labelledby="data-heading">
            <h2 id="data-heading">Data &amp; privacy</h2>
            <div className="banner banner--info">
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                Your fitness history belongs to you. Everything stays in this browser{storageKind === 'memory' ? ' (temporarily: storage is blocked)' : ''}; nothing is uploaded.
                Clearing site data deletes it, so export a backup now and then.
              </p>
            </div>
            <ul className="list">
              <li>
                <button type="button" className="list-row" onClick={() => {
                  exportBackup()
                  notify('Backup downloaded.', { tone: 'success' })
                }}>
                  <span className="tile-icon tile-icon--sm" aria-hidden="true"><Download size={18} /></span>
                  <span className="list-row__body">
                    <span className="list-row__title" style={{ display: 'block' }}>Export data</span>
                    <span className="list-row__meta" style={{ display: 'block' }}>Download your workouts and history as a JSON file</span>
                  </span>
                  <ChevronRight size={18} className="list-row__chevron" aria-hidden="true" />
                </button>
              </li>
              <li>
                <button type="button" className="list-row" onClick={() => fileRef.current?.click()}>
                  <span className="tile-icon tile-icon--sm" aria-hidden="true"><Upload size={18} /></span>
                  <span className="list-row__body">
                    <span className="list-row__title" style={{ display: 'block' }}>Import data</span>
                    <span className="list-row__meta" style={{ display: 'block' }}>Restore from a REPXIR backup file</span>
                  </span>
                  <ChevronRight size={18} className="list-row__chevron" aria-hidden="true" />
                </button>
                <input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden" tabIndex={-1}
                  aria-hidden="true" onChange={handleFile} data-testid="import-input" />
              </li>
              <li>
                <button type="button" className="list-row list-row--danger" onClick={handleDeleteAll}>
                  <span className="tile-icon tile-icon--sm" aria-hidden="true"><Trash2 size={18} /></span>
                  <span className="list-row__body">
                    <span className="list-row__title" style={{ display: 'block' }}>Delete all data</span>
                    <span className="list-row__meta" style={{ display: 'block' }}>Permanently remove everything from this browser</span>
                  </span>
                  <ChevronRight size={18} className="list-row__chevron" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </section>

          <section className="section" aria-labelledby="about-heading">
            <h2 id="about-heading">About</h2>
            <div className="card stack stack--sm">
              <p className="row"><Info size={18} className="lime" aria-hidden="true" /> REPXIR v{__APP_VERSION__}</p>
              <p className="small muted">
                Movement is medicine is a motivating metaphor, not medical advice. REPXIR doesn&apos;t diagnose, treat, or
                prescribe. Exercise examples are general references; adjust or skip anything that doesn&apos;t feel right,
                and talk to a qualified professional about your health.
              </p>
            </div>
          </section>
        </div>
      </div>

      <ImportDialog pending={pendingImport} onClose={() => setPendingImport(null)} />
    </div>
  )
}
