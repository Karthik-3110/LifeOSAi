import { motion } from 'framer-motion'
import { BarChart3, Brain, CalendarDays, Gauge, GraduationCap, Map } from 'lucide-react'
import Card from '../ui/Card.jsx'

const featureCards = [
  ['AI Brain Dump', 'Capture every loose thought and turn it into a workable plan.', Brain],
  ['Knowledge Graph Canvas', 'See goals, notes and dependencies in one visual space.', Map],
  ['Smart Planner', 'Build a realistic week around the work that matters.', CalendarDays],
  ['Semester Copilot', 'Bring courses, revision and deadlines into focus.', GraduationCap],
  ['AI Productivity Analytics', 'Spot momentum, friction and patterns in your progress.', BarChart3],
  ['AI Study Coach', 'Create consistent routines for learning and recall.', Gauge],
]

export default function Features() {
  return (
    <section id="features" className="section-band px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">Features o--o</p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold text-text-primary sm:text-4xl">A calmer operating system for ambitious work.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map(([title, description, Icon], index) => {
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <Card className="h-full premium-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-accent-signal">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
                <div className="mt-5 h-10 rounded-xl border border-border-subtle bg-gradient-to-r from-accent-signal/10 via-node-task/10 to-transparent" />
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
