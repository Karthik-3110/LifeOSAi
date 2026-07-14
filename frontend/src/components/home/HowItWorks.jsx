import Card from '../ui/Card.jsx'
import { motion } from 'framer-motion'

const steps = [
  ['01', 'Dump your mind', 'Capture raw ambition, anxieties, links, and loose tasks in one place.'],
  ['02', 'Let AI map it', 'LifeOS groups, connects, and sequences the work into a living graph.'],
  ['03', 'Execute weekly', 'Drag the right next actions into your week and keep momentum visible.'],
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden border-y border-border-subtle bg-bg-surface/40 px-4 py-24 sm:px-6 lg:px-8">
      <div className="floating-node absolute left-[8%] top-20 h-3 w-3 rounded-full bg-node-task/50" />
      <div className="floating-node absolute right-[14%] top-32 h-4 w-4 rounded-full bg-accent-signal/45" />
      <div className="floating-node absolute bottom-16 left-[46%] h-2.5 w-2.5 rounded-full bg-node-goal/45" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">How it works o--o</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">From chaos to clarity in three steps.</h2>
        <div className="relative mt-10">
          <svg className="pointer-events-none absolute left-[11%] right-[11%] top-1/2 z-0 hidden h-24 w-[78%] -translate-y-1/2 lg:block" viewBox="0 0 900 120" fill="none" aria-hidden="true">
            <motion.path
              d="M8 62 C160 8 285 112 450 62 C615 12 736 112 892 62"
              stroke="var(--accent-signal)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.42 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
          </svg>
          <div className="relative z-10 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, body], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -8, rotate: index === 1 ? 0 : index === 0 ? -0.5 : 0.5 }}
            >
              <Card className="graph-card min-h-64">
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <p className="font-mono text-4xl font-bold text-text-muted/30">{number}</p>
                    <span className="mt-2 h-3 w-3 rounded-full bg-accent-signal shadow-[0_0_24px_rgba(232,160,124,0.5)]" />
                  </div>
                  <h3 className="mt-8 font-display text-xl font-semibold text-text-primary">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{body}</p>
                </div>
              </Card>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
