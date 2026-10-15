import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChartNoAxesColumn, ChevronRight, CircleUserRound, Dumbbell, House, TriangleAlert } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { useConfirm } from '../store/hooks.js'
import { useTick } from '../hooks/useTick.js'
import { sessionElapsedMs, countSets } from '../services/sessionService.js'
import { formatClock, formatTime } from '../utils/format.js'
import Dialog from './Dialog.jsx'
import UpdatePrompt from './UpdatePrompt.jsx'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/history', label: 'History', icon: ChartNoAxesColumn },
  { to: '/account', label: 'Account', icon: CircleUserRound },
]

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="REPXIR home">
      <span className="brand__mark" aria-hidden="true">RX</span>
      <span className="brand__word" aria-hidden="true">REPXIR</span>
    </Link>
  )
}

function SessionBar() {
  const { active } = useStore()
  const now = useTick(active?.status === 'active', 1000)
  if (!active) return null
  const { completed, target } = countSets(active)
  const paused = active.status !== 'active'
  return (
    <Link to="/session" className="session-bar" aria-label={`Return to workout: ${active.name}`}>
      <span className="session-bar__text">
        <span className="session-bar__name">{active.name}</span>
        <span className="session-bar__meta num">
          {paused ? 'Paused' : formatClock(sessionElapsedMs(active, now) / 1000)} · {completed}/{target} sets
        </span>
      </span>
      <span className="btn btn--small" aria-hidden="true">
        Return <ChevronRight size={16} />
      </span>
    </Link>
  )
}

function RecoveryDialog() {
  const { active, recoveredDraft, dismissRecovery, discardActive } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const confirm = useConfirm()
  const open = Boolean(active && recoveredDraft && location.pathname !== '/session')

  return (
    <Dialog
      open={open}
      onClose={dismissRecovery}
      title="You have an unfinished workout"
      description={active ? `${active.name} · last saved ${formatTime(active.updatedAt)}. It's paused, so time away wasn't counted.` : ''}
      size="sm"
      actions={
        <div className="stack stack--sm" style={{ width: '100%' }}>
          <button type="button" className="btn btn--primary btn--block" onClick={() => {
            dismissRecovery()
            navigate('/session')
          }}>
            Resume workout
          </button>
          <button type="button" className="btn btn--danger-outline btn--block" onClick={async () => {
            const ok = await confirm({
              title: 'Discard this workout?',
              body: 'Sets you logged in this unfinished session will be removed. Your history is not affected.',
              confirmLabel: 'Discard session',
              tone: 'danger',
            })
            if (ok) discardActive()
          }}>
            Discard session
          </button>
        </div>
      }
    />
  )
}

export default function AppShell() {
  const { active, storageKind } = useStore()
  const location = useLocation()
  const mainRef = useRef(null)
  const firstRender = useRef(true)

  // Move focus to the new page for keyboard and screen-reader users.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  const showSessionBar = Boolean(active) && location.pathname !== '/session'

  return (
    <div className={`app${showSessionBar ? ' app--has-session' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>

      <aside className="rail" aria-label="Primary">
        <Brand />
        <nav className="rail__nav" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="rail__link">
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="rail__footer caption">Movement is medicine.<br />Your daily dose of progress.</p>
      </aside>

      <div>
        <header className="topbar">
          <Brand />
          <NavLink to="/account" className="avatar-btn" aria-label="Account">
            <CircleUserRound size={28} aria-hidden="true" />
          </NavLink>
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="main">
          {storageKind === 'memory' && (
            <div className="banner banner--warning" role="status" style={{ marginBottom: 'var(--rx-space-5)' }}>
              <TriangleAlert size={18} aria-hidden="true" />
              <p>This browser is blocking local storage, so workouts will be lost when you close the tab. Export a backup before leaving.</p>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {showSessionBar && <SessionBar />}

      <nav className="tabbar" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tabbar__link">
            <Icon size={22} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <RecoveryDialog />
      <UpdatePrompt />
    </div>
  )
}
