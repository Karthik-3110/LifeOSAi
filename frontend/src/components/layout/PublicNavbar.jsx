import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition ${scrolled ? 'border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-medium text-text-secondary md:flex">
          <a href="#features" className="hover:text-text-primary">Features</a>
          <a href="#how" className="hover:text-text-primary">How it works</a>
          <a href="#testimonials" className="hover:text-text-primary">Customers</a>
          <Link to="/dashboard" className="hover:text-text-primary">Product</Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button to="/auth" variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          <Button to="/dashboard" size="sm">Get started</Button>
        </div>
      </nav>
    </header>
  )
}
