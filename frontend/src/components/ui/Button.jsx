import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-gradient-to-r from-accent-signal to-accent-signal-hi text-white shadow-[0_10px_24px_rgba(236,78,32,0.24)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_30px_rgba(255,149,5,0.3)]',
  secondary: 'border border-node-task/40 bg-bg-surface text-node-task hover:-translate-y-0.5 hover:bg-node-task/10',
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
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-node-task focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-60',
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
