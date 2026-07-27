export default function Card({ children, className = '' }) {
  return (
    <div className={`premium-card rounded-[22px] border border-border-subtle bg-bg-surface p-6 surface-shadow transition duration-300 ${className}`}>
      {children}
    </div>
  )
}
