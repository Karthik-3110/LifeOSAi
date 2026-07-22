
import { motion } from 'framer-motion'
import { ArrowRight, Play, Plus } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import heroTexture from '../../assets/hero.png'

const chips = ['Ship MVP', 'Launch beta', 'User research', 'Series A prep', 'Hire designer']

const nodes = [
  { title: 'Goal - Q1', meta: 'Launch LifeOS', color: 'goal', className: 'left-[8%] top-[18%]' },
  { title: 'Design system v2', meta: 'Project', color: 'task', className: 'right-[8%] top-[18%]' },
  { title: 'Hire 2 engineers', meta: 'Milestone', color: 'milestone', className: 'left-[14%] bottom-[22%]' },
  { title: 'Weekly review', meta: 'Task - Friday', color: 'resource', className: 'right-[12%] bottom-[18%]' },
  { title: 'Pitch deck', meta: 'Deadline - Mar 12', color: 'deadline', className: 'left-[36%] top-[45%]' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1 text-xs font-semibold text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-node-resource" />
            Now in private beta - Backed by builders
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip, index) => (
              <span
                key={chip}
                className="animate-float-slow rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-xs text-text-secondary shadow-lg shadow-black/10"
                style={{ transform: `translateY(${index % 2 ? 6 : 0}px)` }}
              >
                {chip}
              </span>
            ))}
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-normal text-text-primary sm:text-6xl">
            Visualize your future. Execute your goals.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
            Transform your goals, projects, and learning roadmaps into an AI-powered visual second brain built on an infinite canvas that thinks alongside you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/dashboard" size="lg">
              Get started - it&apos;s free <ArrowRight size={18} />
            </Button>
            <Button to="/docs" variant="secondary" size="lg">
              <Play size={18} /> Watch demo
            </Button>
          </div>
          <p className="mt-5 text-sm text-text-muted">Free forever for personal use - No credit card required</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="animate-drift relative min-h-[420px] overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface p-4 surface-shadow"
        >
          <img src={heroTexture} alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen" />
          <div className="relative z-10 flex items-center justify-between rounded-xl border border-border-subtle bg-bg-base/80 px-4 py-3">
            <div>
              <p className="font-mono text-xs text-text-muted">app.lifeos.ai/canvas</p>
              <p className="font-display text-sm font-semibold text-text-primary">Launch LifeOS</p>
            </div>
            <Button to="/canvas" size="sm"><Plus size={16} /> Node</Button>
          </div>
          <div className="absolute left-[18%] top-[45%] h-px w-[58%] rotate-[-13deg] bg-border-subtle" />
          <div className="absolute left-[22%] top-[51%] h-px w-[45%] rotate-[24deg] bg-border-subtle" />
          <div className="absolute left-[48%] top-[33%] h-px w-[32%] rotate-[51deg] bg-border-subtle" />
          {nodes.map((node) => (
            <div key={node.title} className={`absolute z-10 w-40 rounded-2xl border border-border-subtle bg-bg-base/90 p-4 shadow-xl shadow-black/20 ${node.className}`}>
              <Badge color={node.color}>{node.meta}</Badge>
              <p className="mt-3 text-sm font-semibold text-text-primary">{node.title}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
