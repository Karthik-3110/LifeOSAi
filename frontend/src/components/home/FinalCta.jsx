import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import Button from '../ui/Button.jsx'

const bullets = ['Free forever for personal', 'No credit card', 'Cancel anytime']

export default function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="cta-aura relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border-subtle p-8 text-center surface-shadow sm:p-12"
      >
        <div className="cta-ring absolute left-10 top-8 h-28 w-28 rounded-full border border-accent-signal/30" />
        <div className="cta-ring absolute bottom-8 right-16 h-40 w-40 rounded-full border border-node-task/25 [animation-delay:-2s]" />
        <div className="floating-node absolute right-[22%] top-14 h-3 w-3 rounded-full bg-node-goal/50" />
        <div className="floating-node absolute bottom-20 left-[24%] h-4 w-4 rounded-full bg-accent-signal/45" />
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-3xl font-display text-3xl font-bold text-text-primary sm:text-5xl"
          >
            Build the life you keep promising yourself.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-4 max-w-2xl text-text-secondary"
          >
            Start with a messy brain dump. End with a connected plan you can actually ship.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button to="/dashboard" size="lg">Start free</Button>
            <Button to="/auth" variant="secondary" size="lg">Sign in</Button>
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-text-secondary">
            {bullets.map((bullet, index) => (
              <motion.span
                key={bullet}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.34 + index * 0.06 }}
                className="inline-flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-node-resource" /> {bullet}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
