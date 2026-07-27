import { BarChart3, Brain, CalendarDays, GraduationCap, Sparkles, Target } from 'lucide-react'
import Card from './Card.jsx'
import { asText } from '../../lib/safe.js'

export default function StatCard({ label, value, delta }) {
  const labelText = asText(label).toLowerCase()
  const descriptor = labelText.includes('goal') ? { Icon: Target, tone: 'bg-accent-signal/10 text-accent-signal', line: 'bg-accent-signal' } : labelText.includes('brain') ? { Icon: Brain, tone: 'bg-node-milestone/10 text-node-milestone', line: 'bg-node-milestone' } : labelText.includes('semester') || labelText.includes('exam') || labelText.includes('assignment') ? { Icon: GraduationCap, tone: 'bg-node-task/10 text-node-task', line: 'bg-node-task' } : labelText.includes('task') || labelText.includes('revision') ? { Icon: CalendarDays, tone: 'bg-accent-signal-hi/15 text-accent-signal-hi', line: 'bg-accent-signal-hi' } : labelText.includes('score') ? { Icon: BarChart3, tone: 'bg-node-task/10 text-node-task', line: 'bg-node-task' } : { Icon: Sparkles, tone: 'bg-node-task/10 text-node-task', line: 'bg-node-task' }
  const { Icon } = descriptor
  return (
    <Card className="group min-h-36 overflow-hidden p-5 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_45px_rgba(30,35,42,0.12)]">
      <span className={`absolute left-0 top-5 h-9 w-1 rounded-r-full ${descriptor.line}`} />
      <div className="flex items-start justify-between gap-3"><p className="pl-2 text-sm font-medium text-text-secondary">{asText(label)}</p><span className={`grid h-10 w-10 place-items-center rounded-full ${descriptor.tone}`}><Icon size={18} /></span></div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="min-w-0 break-words font-mono text-3xl font-bold tracking-normal text-text-primary">{asText(value, '0')}</p>
        <span className="rounded-full border border-node-resource/20 bg-node-resource/10 px-3 py-1 text-xs font-semibold text-node-resource">
          {asText(delta)}
        </span>
      </div>
    </Card>
  )
}
