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
    <aside className="ai-surface absolute bottom-5 right-5 z-20 w-[calc(100%-2.5rem)] max-w-sm rounded-[22px] border bg-bg-surface/95 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">AI Study Coach</h2>
          <p className="text-xs text-text-muted">Organize, explain, quiz, revise</p>
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Close assistant">
          <X size={17} />
        </button>
      </div>
      <div className="mt-5 rounded-2xl border border-node-task/20 bg-node-task/10 p-4 text-sm leading-6 text-node-task">
        Ask for summaries, flashcards, MCQs, interview questions, step-by-step explanations, or a revision schedule.
      </div>
      <button onClick={onGenerate} className="mt-3 rounded-full border border-node-task/30 bg-node-task/10 px-3 py-2 text-xs font-semibold text-node-task">
        Create a focused study roadmap.
      </button>
      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="What's on your mind?"
        className="mt-5 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none focus:border-node-task focus:ring-2 focus:ring-node-task/20"
        rows={4}
      />
      {error && <div className="mt-3 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-3 py-2 text-xs text-node-deadline">{error}</div>}
      <div className="mt-4 grid gap-2">
        <Button onClick={onBrainDump} size="sm" disabled={loading}>{loading ? 'Analyzing...' : 'Brain Dump'}</Button>
        <Button onClick={onGenerate} variant="secondary" size="sm">Generate study plan</Button>
        <Button onClick={onConflicts} variant="secondary" size="sm">Find conflicts</Button>
        <Button onClick={onScore} variant="secondary" size="sm">Score readiness</Button>
      </div>
    </aside>
  )
}
