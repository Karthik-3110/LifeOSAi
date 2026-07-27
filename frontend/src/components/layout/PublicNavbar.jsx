import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import Logo from '../ui/Logo.jsx'

const navItems = [
  ['Features', 'features'],
  ['How it works', 'how-it-works'],
  ['Customers', 'customers'],
  ['Product', 'product'],
]

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = [...navItems.map(([, id]) => id), 'hero', 'footer']
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const neutralSection = entries.find((entry) => entry.isIntersecting && ['hero', 'footer'].includes(entry.target.id))
        if (neutralSection) {
          setActiveSection(null)
          return
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting && navItems.some(([, id]) => id === entry.target.id))
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.08, 0.25, 0.5] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (event, id) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className="fixed left-1/2 top-5 z-[1000] w-[calc(100%-48px)] max-w-[1600px] -translate-x-1/2">
      <nav className={`glass-navbar flex h-[72px] items-center justify-between rounded-[24px] px-5 transition duration-300 sm:px-7 ${scrolled ? 'glass-navbar-scrolled' : ''}`}>
        <Logo className="public-nav-logo rounded-2xl px-3 py-2 transition" />
        <div className="hidden items-center gap-9 text-sm font-semibold md:flex">
          {navItems.map(([label, id]) => <a key={id} href={`#${id}`} onClick={(event) => scrollToSection(event, id)} aria-current={activeSection === id ? 'page' : undefined} className={`nav-link ${activeSection === id ? 'nav-link-active font-bold' : ''}`}>{label}</a>)}
        </div>
        <div className="flex items-center gap-2">
          <Button to="/auth" variant="ghost" size="sm" className="navbar-signin hidden sm:inline-flex">Sign in</Button>
          <Button to="/dashboard" size="sm">Get started</Button>
        </div>
      </nav>
    </header>
  )
}
