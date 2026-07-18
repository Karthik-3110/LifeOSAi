import { Link, Navigate, useParams } from 'react-router-dom'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'

const pages = {
  about: ['About LifeOS AI', 'LifeOS AI helps builders turn messy goals, projects, and ideas into connected plans they can execute.'],
  customers: ['Customers', 'LifeOS AI is built for founders, students, creators, and operators who need one calm place for plans, tasks, and roadmaps.'],
  careers: ['Careers', 'We are not listing open roles yet, but this page will host future product, engineering, and design opportunities.'],
  contact: ['Contact', 'For support, billing, partnerships, or product feedback, reach the LifeOS AI team from this app page.'],
  docs: ['Docs', 'Documentation will cover Brain Dumps, canvases, planner workflows, analytics, account settings, and billing.'],
  roadmaps: ['Roadmaps', 'Roadmaps in LifeOS AI connect goals, tasks, deadlines, and resources so each Brain Dump becomes an actionable canvas.'],
  templates: ['Templates', 'Templates for launches, study plans, career moves, content calendars, and personal systems are coming into the app.'],
  blog: ['Blog', 'Product notes, workflow ideas, and LifeOS AI updates will live here.'],
  privacy: ['Privacy', 'Your workspace data is tied to your authenticated account and stored in MongoDB for your LifeOS AI experience.'],
  terms: ['Terms', 'Use LifeOS AI responsibly, keep your account secure, and follow the policies shown in the app as they evolve.'],
  security: ['Security', 'LifeOS AI uses Firebase authentication and backend-only API keys for protected services such as OpenAI.'],
  status: ['Status', 'Core app status: frontend routes, backend API, MongoDB data, Firebase auth, and Brain Dump AI integrations.'],
}

export default function InfoPage() {
  const { slug = '' } = useParams()
  const page = pages[slug]

  if (!page) return <Navigate to="/" replace />

  const [title, body] = page

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <PublicNavbar />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">LifeOS AI</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-text-primary">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/dashboard">Open app</Button>
            <Button to="/contact" variant="secondary">Contact</Button>
          </div>
        </Card>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link to="/canvas" className="rounded-2xl border border-border-subtle bg-bg-surface p-5 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Canvas</Link>
          <Link to="/planner" className="rounded-2xl border border-border-subtle bg-bg-surface p-5 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Planner</Link>
          <Link to="/analytics" className="rounded-2xl border border-border-subtle bg-bg-surface p-5 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Analytics</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
