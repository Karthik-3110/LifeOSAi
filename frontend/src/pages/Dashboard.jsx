import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Brain, CalendarDays, CheckCircle2, Clock3, Edit3, Map, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { useAppData } from '../context/useAppData.js'
import { api } from '../lib/api.js'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import BillingPanel from '../components/settings/BillingPanel.jsx'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { setUser, user } = useAuth()
  const {
    cache,
    loading: dataLoading,
    ensureDashboard,
    createBrainDump,
    createGoal,
    updateGoal,
    deleteGoal: removeGoal,
    updateTask,
  } = useAppData()
  const navigate = useNavigate()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [coachAnswer, setCoachAnswer] = useState('')
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [brainDumpOpen, setBrainDumpOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [brainDumpInput, setBrainDumpInput] = useState('')
  const [brainDumpLoading, setBrainDumpLoading] = useState(false)
  const [error, setError] = useState('')
  const greeting = useMemo(() => getGreeting(), [])
  const dashboard = cache.dashboard
  const loading = !dashboard && (dataLoading.dashboard || dataLoading[`bootstrap:${user?._id}`])
  const hasBrainDumpAccess = (user?.brainDumpCredits ?? 0) > 0
    || (user?.unlimitedBrainDumpsUntil && new Date(user.unlimitedBrainDumpsUntil) > new Date())

  useEffect(() => {
    if (!dashboard) {
      ensureDashboard().catch((currentError) => setError(currentError.message))
    }
  }, [dashboard, ensureDashboard])

  const saveGoal = async (payload) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal._id, payload)
      } else {
        await createGoal(payload)
      }
      setGoalModalOpen(false)
      setEditingGoal(null)
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const openEditGoal = (goal) => {
    setEditingGoal(goal)
    setGoalModalOpen(true)
  }

  const completeGoal = async (goal) => {
    try {
      await updateGoal(goal._id, { status: 'done', progress: 100 })
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const deleteGoal = async (goal) => {
    try {
      await removeGoal(goal)
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const runBrainDump = async () => {
    if (!hasBrainDumpAccess) {
      setBillingOpen(true)
      return
    }

    const input = brainDumpInput.trim()
    if (!input) {
      setError('Add your thoughts before creating a Brain Dump.')
      return
    }

    setBrainDumpLoading(true)
    setError('')
    try {
      const result = await createBrainDump(input)
      setUser((current) => current ? { ...current, ...result.credits } : current)
      setBrainDumpInput('')
      setBrainDumpOpen(false)
      const buyCredits = (result.credits?.brainDumpCredits ?? 0) <= 0 && !result.credits?.unlimitedBrainDumpsUntil
      navigate(`/canvas?brainDump=${result.brainDump._id}${buyCredits ? '&buyCredits=1' : ''}`)
    } catch (currentError) {
      if (currentError.code === 'CREDITS_EXHAUSTED') {
        setBillingOpen(true)
      }
      setError(currentError.message)
    } finally {
      setBrainDumpLoading(false)
    }
  }

  const toggleTask = async (task) => {
    try {
      const scheduled = new Date(task.date || task.dueDate)
      scheduled.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (!task.completed && scheduled > today) {
        setError('This task is scheduled for a future date and cannot be completed yet.')
        return
      }
      await updateTask(task, { completed: !task.completed })
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const stats = dashboard?.stats || {}
  const recentGoals = dashboard?.recentGoals || []
  const upcoming = dashboard?.upcoming || dashboard?.upcomingTasks || []
  const brief = dashboard?.dailyBrief || {}

  const askGoalCoach = async (goal) => {
    setAssistantOpen(true)
    setCoachAnswer('Thinking through your next best study block...')
    try {
      const result = await api.studyCoach(`Help me make progress on this goal: ${goal.title}. Priority: ${goal.priority || 'medium'}. Current progress: ${goal.progress || 0}%.`)
      const nextSteps = (result.nextSteps || []).map((step) => `• ${step}`).join('\n')
      setCoachAnswer([result.answer, nextSteps].filter(Boolean).join('\n\n'))
    } catch (currentError) {
      setCoachAnswer(currentError.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">{greeting}, {user?.name || 'there'}.</h1>
          <p className="mt-2 text-text-secondary">Here&apos;s what&apos;s on your plate.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}><Plus size={17} /> New goal</Button>
          <Button variant="secondary" onClick={() => (hasBrainDumpAccess ? setBrainDumpOpen(true) : setBillingOpen(true))}><Brain size={17} /> {hasBrainDumpAccess ? 'Brain dump' : 'Buy credits'}</Button>
        </div>
      </div>

      {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active goals" value={stats.activeGoals ?? 0} delta={`${stats.doneGoals ?? 0} done`} />
        <StatCard label="Tasks completed" value={stats.completedTasks ?? 0} delta={`${stats.openTasks ?? 0} open`} />
        <StatCard label="Brain Dumps" value={stats.brainDumpsCreated ?? 0} delta="knowledge graph" />
        <StatCard label="Productivity Score" value={stats.productivityScore ?? stats.completionRate ?? 0} delta="AI estimate" />
      </div>

      <Card className="mt-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-accent-signal" size={20} />
              <h2 className="font-display text-2xl font-semibold text-text-primary">Daily AI Brief</h2>
            </div>
            {brief.greeting && <p className="mt-2 text-sm font-medium text-accent-signal">{brief.greeting}</p>}
            <p className="mt-2 text-text-secondary">{brief.studyRecommendation || 'Create a Brain Dump to generate your student briefing.'}</p>
            {brief.productivityNote && <p className="mt-2 text-sm text-text-muted">{brief.productivityNote}</p>}
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-sm font-semibold text-text-secondary">
            <Clock3 className="mr-2 inline text-accent-signal" size={16} />
            {Math.round((brief.estimatedWorkloadMinutes || 0) / 60 * 10) / 10}h planned
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <BriefList title="Today's Priorities" items={brief.priorities || []} empty="No priority tasks for today." />
          <BriefList title="Upcoming Deadlines" items={(brief.upcomingDeadlines || []).map((item) => item.title)} empty="No urgent deadlines." />
          <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
            <p className="text-sm font-semibold text-text-primary">Productivity Score</p>
            <p className="mt-4 font-display text-4xl font-bold text-accent-signal">{brief.productivityScore ?? stats.productivityScore ?? 0}%</p>
          </div>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Recent goals</h2>
            <Link to="/canvas" className="text-sm font-semibold text-accent-signal hover:text-accent-signal-hi">Open canvas</Link>
          </div>
          <div className="mt-6 divide-y divide-border-subtle">
            {recentGoals.length === 0 && <p className="py-5 text-text-secondary">No goals yet. Create one to begin.</p>}
            {recentGoals.map((goal) => (
              <div key={goal._id} className="grid gap-4 py-5 md:grid-cols-[1fr_180px_70px_180px] md:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <Badge color="goal">{goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : goal.status}</Badge>
                    <p className="font-semibold text-text-primary">{goal.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{goal.category || 'Personal'} · {goal.priority || 'medium'}</p>
                  <div className="mt-4 md:hidden"><ProgressBar value={goal.progress} /></div>
                </div>
                <div className="hidden md:block"><ProgressBar value={goal.progress} /></div>
                <p className="font-mono text-sm font-semibold text-text-secondary">{goal.progress}%</p>
                <div className="flex gap-2 md:justify-end">
                  <button onClick={() => openEditGoal(goal)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Edit goal"><Edit3 size={16} /></button>
                  <button onClick={() => askGoalCoach(goal)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-accent-signal" aria-label="Ask AI"><Sparkles size={16} /></button>
                  <button onClick={() => completeGoal(goal)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-node-resource" aria-label="Complete goal"><CheckCircle2 size={16} /></button>
                  <button onClick={() => deleteGoal(goal)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-node-deadline" aria-label="Delete goal"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-semibold text-text-primary">Upcoming</h2>
          <div className="mt-6 space-y-6">
            {upcoming.length === 0 && <p className="text-text-secondary">No upcoming tasks or goal deadlines.</p>}
            {upcoming.map((item) => (
              <label key={item._id} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-3 text-sm text-text-secondary">
                {item.itemType === 'goal' ? (
                  <CheckCircle2 className="text-node-goal" size={16} />
                ) : (
                  <input type="checkbox" checked={item.completed} onChange={() => toggleTask(item)} className="h-4 w-4 accent-accent-signal" />
                )}
                <span className="min-w-0 flex-1">{item.title}</span>
                <span className="font-mono text-xs text-text-muted">{new Date(item.date || item.dueDate).toLocaleDateString()}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickCard icon={Map} title="Open infinite canvas" to="/canvas" />
        <QuickCard icon={CalendarDays} title="Plan your week" to="/planner" />
        <button onClick={() => setAssistantOpen(true)} className="rounded-2xl border border-border-subtle bg-bg-surface p-6 text-left transition hover:bg-bg-surface-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal">
          <Sparkles className="text-accent-signal" size={24} />
          <p className="mt-5 font-display text-xl font-semibold text-text-primary">Ask LifeOS AI</p>
          <p className="mt-2 text-sm text-text-secondary">Open the assistant panel.</p>
        </button>
      </div>

      {assistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="w-full max-w-md">
            <h2 className="font-display text-2xl font-semibold text-text-primary">LifeOS Assistant</h2>
            <p className="mt-3 text-text-secondary">Ask me to explain a topic, create flashcards, generate quiz questions, or break a goal into milestones.</p>
            <div className="mt-6 rounded-xl border border-accent-signal/20 bg-accent-signal/10 p-4 text-sm text-accent-signal">
              {coachAnswer || 'Want me to turn your Brain Dump into a study plan, flashcards, and a quiz?'}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setAssistantOpen(false)}>Close</Button>
              <Button to="/canvas">Open canvas</Button>
            </div>
          </Card>
        </div>
      )}

      {goalModalOpen && (
        <GoalModal
          goal={editingGoal}
          onClose={() => { setGoalModalOpen(false); setEditingGoal(null) }}
          onSave={saveGoal}
        />
      )}

      {brainDumpOpen && (
        <Modal title="Brain Dump" onClose={() => setBrainDumpOpen(false)}>
          <textarea
            value={brainDumpInput}
            onChange={(event) => setBrainDumpInput(event.target.value)}
            placeholder="Write the messy version. LifeOS AI will organize the roadmap."
            className="mt-5 w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
            rows={7}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBrainDumpOpen(false)}>Cancel</Button>
            <Button onClick={runBrainDump} disabled={brainDumpLoading || !hasBrainDumpAccess}>{brainDumpLoading ? 'Creating...' : 'Create roadmap'}</Button>
          </div>
        </Modal>
      )}

      {billingOpen && (
        <Modal title="Buy Brain Dump Credits" onClose={() => setBillingOpen(false)}>
          <BillingPanel bare compact onPurchased={() => setBillingOpen(false)} />
        </Modal>
      )}
    </div>
  )
}

function QuickCard({ icon: Icon, title, to }) {
  return (
    <Link to={to} className="rounded-2xl border border-border-subtle bg-bg-surface p-6 transition hover:bg-bg-surface-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal">
      <Icon className="text-accent-signal" size={24} />
      <p className="mt-5 font-display text-xl font-semibold text-text-primary">{title}</p>
      <p className="mt-2 text-sm text-text-secondary">Jump back into focused work.</p>
    </Link>
  )
}

function BriefList({ empty, items, title }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-text-secondary">{empty}</p>}
        {items.slice(0, 4).map((item) => (
          <p key={item} className="rounded-lg bg-bg-surface px-3 py-2 text-sm text-text-secondary">{item}</p>
        ))}
      </div>
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Close">×</button>
        </div>
        {children}
      </Card>
    </div>
  )
}

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    dueDate: goal?.dueDate ? goal.dueDate.slice(0, 10) : '',
    priority: goal?.priority || 'medium',
    category: goal?.category || 'Personal',
    progress: goal?.progress ?? 0,
    status: goal?.status || 'active',
  })

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSave({
      title: form.title,
      description: form.description,
      dueDate: form.dueDate || null,
      priority: form.priority,
      category: form.category,
      progress: Number(form.progress),
      status: form.status,
    })
  }

  return (
    <Modal title={goal ? 'Edit Goal' : 'New Goal'} onClose={onClose}>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-text-secondary">
          Goal Name
          <input name="title" value={form.title} onChange={updateField} required className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text-secondary">
          Description
          <textarea name="description" value={form.description} onChange={updateField} rows={3} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Deadline
            <input name="dueDate" type="date" value={form.dueDate} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Priority
            <select name="priority" value={form.priority} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Category
            <input name="category" value={form.category} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Progress
            <input name="progress" type="number" min="0" max="100" value={form.progress} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{goal ? 'Save goal' : 'Create goal'}</Button>
        </div>
      </form>
    </Modal>
  )
}
