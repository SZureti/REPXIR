import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · REPXIR` : 'REPXIR — Movement is medicine'
  }, [title])
}
