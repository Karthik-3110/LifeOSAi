export default function Avatar({ name, src = '', className = '' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    src ? (
      <img src={src} alt="" className={`h-10 w-10 rounded-full border-2 border-node-task/30 bg-bg-elevated object-cover shadow-[0_0_18px_rgba(1,111,185,0.18)] ${className}`} />
    ) : (
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-gradient-to-br from-accent-signal to-accent-signal-hi font-mono text-sm font-bold text-white shadow-[0_0_18px_rgba(236,78,32,0.25)] ${className}`}>
        {initials}
      </div>
    )
  )
}
