import { motion } from 'framer-motion'
import { AlertTriangle, Brain, CalendarDays, Gauge, Map } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { featureCards } from '../../data/testimonials.js'

const icons = [Brain, Map, CalendarDays, AlertTriangle, Gauge]

export default function Features() {
  return (
    <section id="features" className="section-band px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">Features o--o</p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold text-text-primary sm:text-4xl">A calmer operating system for ambitious work.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featureCards.map(([title, description], index) => {
            const Icon = icons[index]
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <Card className="h-full transition duration-300 hover:-translate-y-1 hover:bg-bg-surface-hi">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-accent-signal">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
