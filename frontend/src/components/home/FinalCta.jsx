import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FinalCta() {
  return (
    <section id="product" className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
      <div className="pointer-events-none absolute left-[-12rem] top-0 h-80 w-80 rounded-full bg-[#EC4E20]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-12rem] h-80 w-80 rounded-full bg-[#016FB9]/10 blur-3xl" />
      <motion.div id="cta"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(118deg,#353531_0%,#1F1F1F_52%,#000000_100%)] px-6 py-20 text-center shadow-[0_28px_75px_rgba(0,0,0,.24)] sm:px-12 sm:py-24"
      >
        <motion.div animate={{ x: [-20, 24, -20], y: [0, 16, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute -left-24 top-[-5rem] h-72 w-72 rounded-full bg-[#EC4E20]/25 blur-3xl" />
        <motion.div animate={{ x: [22, -26, 22], y: [0, -14, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute -bottom-28 -right-12 h-80 w-80 rounded-full bg-[#016FB9]/22 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.16]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.7) .65px, transparent .65px)', backgroundSize: '18px 18px', maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' }} />
        {[['18%', '28%', 0], ['82%', '24%', .8], ['12%', '75%', 1.4], ['74%', '78%', 2.1], ['57%', '17%', 2.7]].map(([left, top, delay], index) => (
          <motion.i key={index} animate={{ y: [0, -11, 0], opacity: [.18, .72, .18] }} transition={{ duration: 5 + index, delay, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-[#FF9505]" style={{ left, top }} />
        ))}
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#FF9505]"><Sparkles size={13} /> Your life, in focus</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold tracking-[-.045em] text-white sm:text-6xl">Ready to build your Second Brain?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">Organize your learning, projects and goals with an AI-powered operating system.</p>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: .98 }} className="mt-9 inline-flex">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-[#EC4E20] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_26px_rgba(236,78,32,.38)] transition hover:bg-[#FF9505] hover:shadow-[0_14px_34px_rgba(255,149,5,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F1F1F]">Get Started Free <ArrowRight size={16} /></Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
