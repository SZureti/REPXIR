import { useEffect, useState } from 'react'

// Re-render only the component that shows a live timer, not the whole app.
// Returns performance.now() as of the latest tick.
export function useTick(enabled, intervalMs = 250) {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    if (!enabled) return undefined
    const tick = () => setNow(performance.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [enabled, intervalMs])
  return now
}
