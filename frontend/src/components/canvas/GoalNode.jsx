import { Handle, Position } from '@xyflow/react'
import { CheckCircle2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'

export default function GoalNode({ data, selected }) {
  const completed = Boolean(data.completed)

  return (
    <div className={`min-w-52 rounded-2xl border bg-bg-surface p-4 shadow-xl transition ${completed ? 'opacity-80 ring-2 ring-node-resource/25' : ''} ${selected ? 'border-node-goal' : 'border-node-goal/40'}`}>
      <Handle type="target" position={Position.Top} className="!bg-node-goal" />
      <div className="flex items-center justify-between gap-3">
        <Badge color="goal">Goal</Badge>
        {completed && <CheckCircle2 size={17} className="text-node-resource" aria-label="Done" />}
      </div>
      <p className={`mt-3 font-display text-base font-semibold text-text-primary ${completed ? 'line-through decoration-node-resource/70' : ''}`}>{data.label}</p>
      <p className="mt-2 text-xs text-text-secondary">{data.meta}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-node-goal" />
    </div>
  )
}
