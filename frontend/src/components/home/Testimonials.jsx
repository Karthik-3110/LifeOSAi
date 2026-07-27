import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Avatar from '../ui/Avatar.jsx'
import { testimonials } from '../../data/testimonials.js'

const logos = ['Student', 'Developer', 'Startup', 'Creator', 'Research', 'University']

export function TestimonialCard({ item, index }) {
  return <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-70px' }} transition={{ duration: .45, delay: index * .06 }} whileHover={{ y: -7, scale: 1.01 }}>
    <Card className="h-full border-border-subtle transition-all hover:border-[#EC4E20]/45 hover:shadow-[0_20px_42px_rgba(236,78,32,.14)]">
      <div className="flex gap-0.5 text-[#FF9505] drop-shadow-[0_0_7px_rgba(255,149,5,.25)]">{Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill="currentColor" />)}</div>
      <p className="mt-5 text-sm leading-6 text-text-primary">“{item.quote}”</p>
      <div className="mt-7 flex items-center gap-3"><Avatar name={item.name} /><div><p className="text-sm font-bold text-text-primary">{item.name}</p><p className="mt-0.5 text-xs text-text-muted">{item.role}</p></div></div>
    </Card>
  </motion.div>
}

export default function CustomerSection() {
  return (
    <section id="customers" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="floating-node absolute left-[6%] top-28 h-16 w-16 rounded-full border border-node-task/30" />
      <div className="floating-node absolute right-[8%] top-20 h-10 w-10 rounded-full border border-accent-signal/40" />
      <div className="floating-node absolute bottom-20 left-[54%] h-3 w-3 rounded-full bg-node-goal/50" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-accent-signal">Trusted by builders</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">Loved by students, developers and ambitious builders.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-text-secondary">Thousands of ideas, projects and study plans organized with LifeOS AI.</p>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{logos.map((logo, index) => <motion.div key={logo} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} className="rounded-xl border border-border-subtle bg-bg-surface/55 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[.1em] text-text-muted opacity-60 transition hover:border-[#016FB9]/35 hover:bg-[#016FB9]/[.07] hover:text-[#016FB9] hover:opacity-100">{logo}</motion.div>)}</div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{testimonials.map((item, index) => <TestimonialCard key={item.name} item={item} index={index} />)}</div>
      </div>
    </section>
  )
}
