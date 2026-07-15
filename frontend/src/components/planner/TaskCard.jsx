import { memo } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { Check, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'

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
      <Badge color={task.color}>{task.meta}</Badge>
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
    </div>
  )
}

export default memo(TaskCard)
