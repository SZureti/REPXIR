import { ChevronLeft } from 'lucide-react'
import { useBack } from '../hooks/useBack.js'

export default function PageHeader({ title, subtitle, back, backLabel = 'Back', action, eyebrow }) {
  const goBack = useBack(typeof back === 'string' ? back : '/')
  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-btn page-header__back" onClick={goBack} aria-label={backLabel}>
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
      )}
      <div className="page-header__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
