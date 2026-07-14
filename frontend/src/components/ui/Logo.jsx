import { Link } from 'react-router-dom'
import logoImage from '../../assets/logo.png'

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal">
      <img
        src={logoImage}
        alt="LifeOS AI"
        className="h-11 w-11 rounded-2xl object-cover surface-shadow transition group-hover:scale-105"
      />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg font-bold tracking-normal text-text-primary">LifeOS AI</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Second brain</span>
        </span>
      )}
    </Link>
  )
}
