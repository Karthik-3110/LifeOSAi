export default function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface-hi" aria-label={`${value}% complete`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-signal to-node-resource transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
