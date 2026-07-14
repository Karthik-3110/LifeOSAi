export default function Avatar({ name, src = '', className = '' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    src ? (
      <img src={src} alt="" className={`h-10 w-10 rounded-full bg-bg-elevated object-cover ${className}`} />
    ) : (
      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-accent-signal font-mono text-sm font-bold text-text-primary ${className}`}>
        {initials}
      </div>
    )
  )
}
