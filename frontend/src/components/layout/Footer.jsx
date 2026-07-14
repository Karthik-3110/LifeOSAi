import { Globe2, Rss, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoImage from '../../assets/logo.png'

const columns = {
  Product: [
    ['Canvas', '/canvas'],
    ['Planner', '/planner'],
    ['Analytics', '/analytics'],
    ['AI assistant', '/assistant'],
  ],
  Company: [
    ['About', '/about'],
    ['Customers', '/customers'],
    ['Careers', '/careers'],
    ['Contact', '/contact'],
  ],
  Resources: [
    ['Docs', '/docs'],
    ['Roadmaps', '/roadmaps'],
    ['Templates', '/templates'],
    ['Blog', '/blog'],
  ],
  Legal: [
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Security', '/security'],
    ['Status', '/status'],
  ],
}

const socialLinks = [
  [Globe2, '/about'],
  [Rss, '/blog'],
  [Share2, '/contact'],
]

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-base">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <img src={logoImage} alt="LifeOS AI" className="h-14 w-14 rounded-2xl object-cover surface-shadow" />
            <p className="mt-3 max-w-sm text-sm leading-6 text-text-secondary">Made for builders who ship.</p>
            <div className="mt-6 flex gap-3 text-text-secondary">
              {socialLinks.map(([Icon, to]) => (
                <Link key={to} to={to} className="rounded-full border border-border-subtle bg-bg-elevated p-2 hover:text-text-primary" aria-label={Icon.name}>
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(columns).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="text-sm font-semibold text-text-primary">{heading}</h3>
                <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                  {links.map(([label, to]) => (
                    <li key={to}><Link to={to} className="hover:text-text-primary">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 text-xs text-text-muted">(c) 2026 LifeOS AI. All rights reserved.</p>
      </div>
    </footer>
  )
}
