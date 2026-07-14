import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/useTheme.js'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-secondary transition hover:-translate-y-0.5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
