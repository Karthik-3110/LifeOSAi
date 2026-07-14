import { X } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default function AssistantPanel({
  error,
  input,
  loading,
  onBrainDump,
  onClose,
  onConflicts,
  onGenerate,
  onInputChange,
  onScore,
}) {
  return (
    <aside className="absolute bottom-5 right-5 z-20 w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-border-subtle bg-bg-surface/95 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">LifeOS Assistant</h2>
          <p className="text-xs text-text-muted">Always on this canvas</p>
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Close assistant">
          <X size={17} />
        </button>
      </div>
      <div className="mt-5 rounded-2xl border border-accent-signal/20 bg-accent-signal/10 p-4 text-sm leading-6 text-accent-signal">
        Want me to break "Launch LifeOS v1" into milestones with deadlines?
      </div>
      <button onClick={onGenerate} className="mt-3 rounded-full border border-node-resource/30 bg-node-resource/10 px-3 py-2 text-xs font-semibold text-node-resource">
        Yes, optimize for Mar 28 launch.
      </button>
      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Brain dump thoughts, tasks, goals, or loose notes..."
        className="mt-5 w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
        rows={4}
      />
      {error && <div className="mt-3 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-3 py-2 text-xs text-node-deadline">{error}</div>}
      <div className="mt-4 grid gap-2">
        <Button onClick={onBrainDump} size="sm" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze brain dump'}</Button>
        <Button onClick={onGenerate} variant="secondary" size="sm">Generate roadmap</Button>
        <Button onClick={onConflicts} variant="secondary" size="sm">Find conflicts</Button>
        <Button onClick={onScore} variant="secondary" size="sm">Score readiness</Button>
      </div>
    </aside>
  )
}
