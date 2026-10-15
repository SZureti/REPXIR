export default function EmptyState({ icon: Icon, title, body, children }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty__icon" aria-hidden="true">
          <Icon size={26} />
        </span>
      )}
      <h2>{title}</h2>
      {body && <p className="empty__body">{body}</p>}
      {children && <div className="row row--wrap" style={{ justifyContent: 'center' }}>{children}</div>}
    </div>
  )
}
