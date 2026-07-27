import { asNumber } from '../../lib/safe.js'

export default function ProgressBar({ value }) {
  const progress = Math.max(0, Math.min(100, asNumber(value)))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface-hi" aria-label={`${progress}% complete`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-signal to-accent-signal-hi transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
