import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-accent-signal text-text-primary surface-shadow hover:-translate-y-0.5 hover:bg-accent-signal-hi',
  secondary: 'border border-border-subtle bg-bg-elevated text-text-primary hover:-translate-y-0.5 hover:bg-bg-surface-hi',
  ghost: 'text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
