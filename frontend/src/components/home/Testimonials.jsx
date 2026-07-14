import { motion } from 'framer-motion'
import Card from '../ui/Card.jsx'
import Avatar from '../ui/Avatar.jsx'
import { testimonials } from '../../data/testimonials.js'

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="floating-node absolute left-[6%] top-28 h-16 w-16 rounded-full border border-node-task/30" />
      <div className="floating-node absolute right-[8%] top-20 h-10 w-10 rounded-full border border-accent-signal/40" />
      <div className="floating-node absolute bottom-20 left-[54%] h-3 w-3 rounded-full bg-node-goal/50" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">Loved by builders o--o</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">Trusted by people who ship.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -8 }}
            >
              <Card className="graph-card h-full min-h-64">
                <div className="relative z-10">
                  <motion.div
                    className="mb-6 h-1 w-16 rounded-full bg-accent-signal"
                    initial={{ width: 0 }}
                    whileInView={{ width: 64 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: index * 0.12 }}
                  />
                  <p className="text-base leading-7 text-text-primary">"{item.quote}"</p>
                  <div className="mt-8 flex items-center gap-3">
                    <Avatar name={item.name} />
                    <div>
                      <p className="font-semibold text-text-primary">{item.name}</p>
                      <p className="text-sm text-text-muted">{item.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
