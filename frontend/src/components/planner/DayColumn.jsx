import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard.jsx'

export default function DayColumn({ day, tasks, onAdd, onDelete, onToggle }) {
  const { setNodeRef, isOver } = useDroppable({ id: day.id })

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[460px] rounded-2xl border bg-bg-surface p-4 transition ${
        isOver ? 'border-accent-signal/70' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">{day.label}</h2>
          <p className="font-mono text-xs text-text-muted">{day.date}</p>
        </div>
        <span className="rounded-full border border-border-subtle px-2 py-1 font-mono text-xs text-text-secondary">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-5 space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onToggle={onToggle} />
          ))}
        </div>
      </SortableContext>
      <button onClick={() => onAdd(day.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle px-3 py-3 text-sm font-semibold text-text-muted hover:border-accent-signal/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal">
        <Plus size={16} /> Add
      </button>
    </section>
  )
}
