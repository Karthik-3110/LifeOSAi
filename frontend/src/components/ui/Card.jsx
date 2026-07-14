export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-shadow ${className}`}>
      {children}
    </div>
  )
}
