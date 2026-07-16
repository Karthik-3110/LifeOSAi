import { memo } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { Check, Clock3, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'

const priorityClass = {
  high: 'border-node-deadline/40 bg-node-deadline/10 text-node-deadline',
  medium: 'border-accent-signal/35 bg-accent-signal/10 text-accent-signal',
  low: 'border-node-resource/35 bg-node-resource/10 text-node-resource',
}

function TaskCard({ task, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onToggle(task)
      }}
      className={`cursor-grab rounded-xl border border-border-subtle bg-bg-base p-4 shadow-lg shadow-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={task.color}>{task.meta}</Badge>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${priorityClass[task.priority] || priorityClass.medium}`}>{task.priority}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-1 text-[11px] font-semibold text-text-secondary">
          <Clock3 size={12} /> {task.estimatedTime}m
        </span>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <p className={`min-w-0 flex-1 text-sm font-semibold leading-5 text-text-primary ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</p>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(task)
          }}
          className="rounded-full p-1 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary"
          aria-label="Toggle task"
        >
          <Check size={15} />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(task)
          }}
          className="rounded-full p-1 text-text-muted hover:bg-bg-surface-hi hover:text-node-deadline"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-surface-hi">
        <span className="block h-full rounded-full bg-accent-signal transition-all" style={{ width: `${task.progress || 0}%` }} />
      </div>
    </div>
  )
}

export default memo(TaskCard)
