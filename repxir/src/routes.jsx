import { Navigate } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import WorkoutDetail from './pages/WorkoutDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import RouteError from './pages/RouteError.jsx'

// Heavier, less-frequent screens load on demand (design.md §9 performance).
const lazyPage = (load) => () => load().then((m) => ({ Component: m.default }))

export const routes = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'workouts', element: <Library /> },
      { path: 'workouts/:id', element: <WorkoutDetail /> },
      { path: 'builder/new', lazy: lazyPage(() => import('./pages/Builder.jsx')) },
      { path: 'builder/:id', lazy: lazyPage(() => import('./pages/Builder.jsx')) },
      { path: 'session', lazy: lazyPage(() => import('./pages/Session.jsx')) },
      { path: 'history', lazy: lazyPage(() => import('./pages/History.jsx')) },
      { path: 'history/:id', lazy: lazyPage(() => import('./pages/SessionDetail.jsx')) },
      { path: 'account', lazy: lazyPage(() => import('./pages/Account.jsx')) },
      { path: 'settings', element: <Navigate to="/account" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
