import { AtSign, BriefcaseBusiness, Code2, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoImage from '../../assets/logo.png'

const columns = {
  Product: [
    ['Canvas', '/canvas'],
    ['Planner', '/planner'],
    ['Semester Copilot', '/semester-copilot'],
    ['Analytics', '/analytics'],
    ['AI Assistant', '/assistant'],
  ],
  Company: [
    ['About', '/about'],
    ['Features', '/customers'],
    ['Roadmap', '/roadmaps'],
    ['Careers', '/careers'],
    ['Contact', '/contact'],
  ],
  Legal: [
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Security', '/security'],
    ['Status', '/status'],
  ],
}

const socialLinks = [
  [Code2, '/about', 'GitHub'],
  [BriefcaseBusiness, '/about', 'LinkedIn'],
  [AtSign, '/contact', 'X'],
  [MessageCircle, '/docs', 'Discord'],
]

export default function Footer() {
  return (
    <footer id="footer" className="landing-footer">
      <div className="landing-footer-grid" aria-hidden="true" />
      <div className="landing-footer-noise" aria-hidden="true" />
      <div className="landing-footer-orb landing-footer-orb-orange" aria-hidden="true" />
      <div className="landing-footer-orb landing-footer-orb-blue" aria-hidden="true" />

      <div className="landing-footer-content">
        <div className="landing-footer-columns">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo-lockup">
              <img src={logoImage} alt="LifeOS AI" />
              <span>
                <strong>LifeOS AI</strong>
                <small>SECOND BRAIN</small>
              </span>
            </div>
            <p>Your AI operating system for planning, learning and execution.</p>
            <div className="landing-footer-socials">
              {socialLinks.map(([Icon, to, label]) => (
                <Link key={label} to={to} className="landing-footer-social" aria-label={label}>
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {Object.entries(columns).map(([heading, links]) => (
            <nav className="landing-footer-nav" key={heading} aria-label={heading}>
              <h3>{heading}</h3>
              <ul>
                {links.map(([label, to]) => (
                  <li key={`${label}-${to}`}><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="landing-footer-bottom">
          <div>
            <span>© 2026 LifeOS AI</span>
            <span>Made for students, developers and creators.</span>
          </div>
          <div className="landing-footer-bottom-links">
            <span>Version 1.0</span>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/status">Status</Link>
            <Link to="/about">GitHub</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
