import { useEffect, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import WeeklyProgressChart from '../components/analytics/WeeklyProgressChart.jsx'
import DeadlineHeatmap from '../components/analytics/DeadlineHeatmap.jsx'
import { useAppData } from '../context/useAppData.js'

export default function Analytics() {
  const { cache, loading: dataLoading, ensureAnalytics } = useAppData()
  const [error, setError] = useState('')
  const analytics = cache.analytics
  const loading = !analytics && dataLoading.analytics

  useEffect(() => {
    if (!analytics) {
      ensureAnalytics().catch((currentError) => setError(currentError.message))
    }
  }, [analytics, ensureAnalytics])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Your momentum, in numbers.</h1>
      <p className="mt-2 text-text-secondary">Last 6 months across goals, tasks, and focus.</p>
      {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
      {loading && (
        <div className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Loading analytics">
          <div className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
          <div className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
        </div>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <StatCard label="Goal completion" value={`${analytics?.completionRate ?? 0}%`} delta={`${analytics?.taskTotals?.completed ?? 0} completed`} />
        <StatCard label="Readiness score" value={`${analytics?.readinessScore ?? 0}/100`} delta={`${analytics?.goalTotals?.active ?? 0} active goals`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Study Hours" value={analytics?.studyHours ?? 0} delta={`${analytics?.focusHours ?? 0} focus hours`} />
        <StatCard label="Brain Dumps" value={analytics?.brainDumpsCreated ?? 0} delta="created" />
        <StatCard label="Study Streak" value={analytics?.studyStreak ?? 0} delta="active weeks" />
        <StatCard label="AI Usage" value={analytics?.aiUsage ?? 0} delta="assistant actions" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-display text-2xl font-semibold text-text-primary">Weekly progress</h2>
          <p className="mt-2 text-sm text-text-secondary">Tasks, goal progress, and focus hours trending upward.</p>
          <div className="mt-6"><WeeklyProgressChart data={analytics?.weeklyProgress || []} /></div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-semibold text-text-primary">Deadline heatmap</h2>
          <p className="mt-2 text-sm text-text-secondary">12 weeks - density of due items.</p>
          <div className="mt-8"><DeadlineHeatmap data={analytics?.deadlineHeatmap || []} /></div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="font-display text-2xl font-semibold text-text-primary">Most studied subjects</h2>
          <div className="mt-6 space-y-3">
            {(analytics?.mostStudiedSubjects || []).length === 0 && <p className="text-text-secondary">Brain Dump or schedule tasks by subject to unlock this view.</p>}
            {(analytics?.mostStudiedSubjects || []).map((item) => (
              <div key={item.category} className="rounded-xl border border-border-subtle bg-bg-base p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-text-primary">{item.category}</p>
                  <p className="font-mono text-sm text-text-secondary">{item.completionRate}%</p>
                </div>
                <p className="mt-2 text-sm text-text-muted">{item.completed}/{item.total} tasks · {item.studyHours}h</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-semibold text-text-primary">AI suggestions</h2>
          <div className="mt-6 space-y-3">
            {(analytics?.suggestions || []).map((suggestion) => (
              <p key={suggestion} className="rounded-xl border border-accent-signal/20 bg-accent-signal/10 px-4 py-3 text-sm text-accent-signal">{suggestion}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
