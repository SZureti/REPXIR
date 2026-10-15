import { useNavigate } from 'react-router-dom'

// Go back in history when there is somewhere to go back to (keeps filters
// and scroll), otherwise to a sensible parent for deep links.
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
