import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { buildPlannerDays, getPlannerRange, getPlannerWeekKey } from '../lib/planner.js'
import { AppDataContext } from './app-data-context.js'
import { useAuth } from './useAuth.js'

const emptyCache = {
  userId: '',
  dashboard: null,
  goals: null,
  plannerWeeks: {},
  brainDumps: null,
  canvases: {},
  analytics: null,
  billing: null,
  bootstrapped: false,
}

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function sortRecentGoals(goals = []) {
  return goals
    .filter((goal) => goal.status !== 'archived')
    .slice()
    .sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aDate - bDate || String(b._id).localeCompare(String(a._id))
    })
    .slice(0, 6)
}

function syncGoalDashboard(dashboard, goals) {
  if (!dashboard || !Array.isArray(goals)) return dashboard

  const totalGoals = goals.length
  const activeGoals = goals.filter((goal) => goal.status === 'active').length
  const doneGoals = goals.filter((goal) => goal.status === 'done').length
  const archivedGoals = goals.filter((goal) => goal.status === 'archived').length

  return {
    ...dashboard,
    stats: {
      ...(dashboard.stats || {}),
      totalGoals,
      activeGoals,
      doneGoals,
      archivedGoals,
    },
    recentGoals: sortRecentGoals(goals),
  }
}

function syncUpcomingTask(dashboard, task, previousTask = null, mode = 'upsert') {
  if (!dashboard) return dashboard

  const today = startOfToday()
  const nextWeek = addDays(today, 7)
  const currentUpcoming = dashboard.upcoming || dashboard.upcomingTasks || []
  const withoutPrevious = currentUpcoming.filter((item) => item._id !== (previousTask?._id || task?._id))
  const taskDate = task?.date ? new Date(task.date) : null
  const shouldShow = mode !== 'delete'
    && task
    && !task.completed
    && taskDate
    && taskDate >= today
    && taskDate < nextWeek

  const upcoming = shouldShow
    ? [...withoutPrevious, { ...task, itemType: 'task' }]
    : withoutPrevious

  return {
    ...dashboard,
    upcoming: upcoming
      .sort((a, b) => new Date(a.date || a.dueDate) - new Date(b.date || b.dueDate))
      .slice(0, 12),
  }
}

function adjustTaskStats(dashboard, nextTask, previousTask = null, mode = 'upsert') {
  if (!dashboard?.stats) return dashboard

  const stats = { ...dashboard.stats }
  if (mode === 'create') {
    stats.totalTasks = (stats.totalTasks || 0) + 1
    if (nextTask.completed) stats.completedTasks = (stats.completedTasks || 0) + 1
    else stats.openTasks = (stats.openTasks || 0) + 1
  } else if (mode === 'delete') {
    stats.totalTasks = Math.max(0, (stats.totalTasks || 0) - 1)
    if (previousTask?.completed) stats.completedTasks = Math.max(0, (stats.completedTasks || 0) - 1)
    else stats.openTasks = Math.max(0, (stats.openTasks || 0) - 1)
  } else if (previousTask && nextTask && previousTask.completed !== nextTask.completed) {
    stats.completedTasks = Math.max(0, (stats.completedTasks || 0) + (nextTask.completed ? 1 : -1))
    stats.openTasks = Math.max(0, (stats.openTasks || 0) + (nextTask.completed ? -1 : 1))
  }

  stats.completionRate = stats.totalTasks ? Math.round(((stats.completedTasks || 0) / stats.totalTasks) * 100) : 0
  return { ...dashboard, stats }
}

function updateTaskInPlannerWeeks(plannerWeeks, task, mode = 'upsert') {
  const nextWeeks = {}

  Object.entries(plannerWeeks).forEach(([weekKey, week]) => {
    const range = week.range || {}
    const taskDate = task?.date ? new Date(task.date) : null
    const inWeek = taskDate && new Date(range.from) <= taskDate && taskDate <= new Date(range.to)
    const withoutTask = (week.items || []).filter((item) => item._id !== task._id)

    nextWeeks[weekKey] = {
      ...week,
      items: mode !== 'delete' && inWeek
        ? [...withoutTask, task].sort((a, b) => new Date(a.date) - new Date(b.date))
        : withoutTask,
    }
  })

  return nextWeeks
}

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const [cache, setCache] = useState(emptyCache)
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const inFlight = useRef(new Map())

  const runOnce = useCallback((key, loader) => {
    if (inFlight.current.has(key)) {
      return inFlight.current.get(key)
    }

    setLoading((current) => ({ ...current, [key]: true }))
    setErrors((current) => ({ ...current, [key]: '' }))

    const promise = loader()
      .catch((error) => {
        setErrors((current) => ({ ...current, [key]: error.message }))
        throw error
      })
      .finally(() => {
        inFlight.current.delete(key)
        setLoading((current) => ({ ...current, [key]: false }))
      })

    inFlight.current.set(key, promise)
    return promise
  }, [])

  const ensureDashboard = useCallback((force = false) => {
    if (!force && cache.dashboard) return Promise.resolve(cache.dashboard)
    return runOnce('dashboard', async () => {
      const dashboard = await api.dashboard()
      setCache((current) => ({ ...current, dashboard }))
      return dashboard
    })
  }, [cache.dashboard, runOnce])

  const ensureGoals = useCallback((force = false) => {
    if (!force && cache.goals) return Promise.resolve(cache.goals)
    return runOnce('goals', async () => {
      const data = await api.listGoals('?limit=50')
      const goals = data.items || []
      setCache((current) => ({
        ...current,
        goals,
        dashboard: syncGoalDashboard(current.dashboard, goals),
      }))
      return goals
    })
  }, [cache.goals, runOnce])

  const ensurePlannerWeek = useCallback((days = buildPlannerDays(), force = false) => {
    const weekKey = getPlannerWeekKey(days)
    if (!force && cache.plannerWeeks[weekKey]) return Promise.resolve(cache.plannerWeeks[weekKey])

    return runOnce(`planner:${weekKey}`, async () => {
      const range = getPlannerRange(days)
      const data = await api.listTasks(`?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&limit=200`)
      const week = { items: data.items || [], range, loadedAt: Date.now() }
      setCache((current) => ({
        ...current,
        plannerWeeks: { ...current.plannerWeeks, [weekKey]: week },
      }))
      return week
    })
  }, [cache.plannerWeeks, runOnce])

  const ensureBrainDumps = useCallback((force = false) => {
    if (!force && cache.brainDumps) return Promise.resolve(cache.brainDumps)
    return runOnce('brainDumps', async () => {
      const data = await api.listBrainDumps()
      const brainDumps = data.items || []
      setCache((current) => ({ ...current, brainDumps }))
      return brainDumps
    })
  }, [cache.brainDumps, runOnce])

  const ensureCanvas = useCallback((brainDumpId, force = false) => {
    if (!brainDumpId) return Promise.resolve({ brainDump: null, nodes: [], edges: [] })
    if (!force && cache.canvases[brainDumpId]) return Promise.resolve(cache.canvases[brainDumpId])

    return runOnce(`canvas:${brainDumpId}`, async () => {
      const canvas = await api.getCanvasByBrainDump(brainDumpId)
      setCache((current) => ({
        ...current,
        canvases: { ...current.canvases, [brainDumpId]: canvas },
      }))
      return canvas
    })
  }, [cache.canvases, runOnce])

  const ensureAnalytics = useCallback((force = false) => {
    if (!force && cache.analytics) return Promise.resolve(cache.analytics)
    return runOnce('analytics', async () => {
      const analytics = await api.analytics()
      setCache((current) => ({ ...current, analytics }))
      return analytics
    })
  }, [cache.analytics, runOnce])

  const ensureBilling = useCallback((force = false) => {
    if (!force && cache.billing) return Promise.resolve(cache.billing)
    return runOnce('billing', async () => {
      const billing = await api.billing()
      setCache((current) => ({ ...current, billing }))
      return billing
    })
  }, [cache.billing, runOnce])

  const createGoal = useCallback(async (payload) => {
    const tempId = `temp-goal-${Date.now()}`
    const optimisticGoal = {
      _id: tempId,
      createdAt: new Date().toISOString(),
      ...payload,
    }
    const previous = cache

    setCache((current) => {
      const goals = current.goals ? [optimisticGoal, ...current.goals] : current.goals
      return {
        ...current,
        goals,
        dashboard: syncGoalDashboard(current.dashboard, goals),
      }
    })

    try {
      const created = await api.createGoal(payload)
      setCache((current) => {
        const goals = current.goals
          ? current.goals.map((goal) => (goal._id === tempId ? created : goal))
          : current.goals
        return {
          ...current,
          goals,
          dashboard: syncGoalDashboard(current.dashboard, goals || [created]),
          analytics: null,
        }
      })
      return created
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const updateGoal = useCallback(async (id, payload) => {
    const previous = cache
    const existing = cache.goals?.find((goal) => goal._id === id) || cache.dashboard?.recentGoals?.find((goal) => goal._id === id)
    const optimisticGoal = existing ? { ...existing, ...payload } : null

    if (optimisticGoal) {
      setCache((current) => {
        const goals = current.goals?.map((goal) => (goal._id === id ? optimisticGoal : goal)) || current.goals
        return {
          ...current,
          goals,
          dashboard: syncGoalDashboard(current.dashboard, goals || current.dashboard?.recentGoals?.map((goal) => (goal._id === id ? optimisticGoal : goal))),
        }
      })
    }

    try {
      const updated = await api.updateGoal(id, payload)
      setCache((current) => {
        const goals = current.goals?.map((goal) => (goal._id === id ? updated : goal)) || current.goals
        return {
          ...current,
          goals,
          dashboard: syncGoalDashboard(current.dashboard, goals || current.dashboard?.recentGoals?.map((goal) => (goal._id === id ? updated : goal))),
          analytics: null,
        }
      })
      return updated
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const deleteGoal = useCallback(async (goal) => {
    const id = goal._id
    const previous = cache
    setCache((current) => {
      const goals = current.goals?.filter((item) => item._id !== id) || current.goals
      return {
        ...current,
        goals,
        dashboard: syncGoalDashboard(current.dashboard, goals || current.dashboard?.recentGoals?.filter((item) => item._id !== id)),
      }
    })

    try {
      await api.deleteGoal(id)
      setCache((current) => ({ ...current, analytics: null }))
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const createTask = useCallback(async (payload) => {
    const tempTask = {
      _id: `temp-task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: 'planner',
      completed: false,
      ...payload,
    }
    const previous = cache

    setCache((current) => ({
      ...current,
      plannerWeeks: updateTaskInPlannerWeeks(current.plannerWeeks, tempTask, 'upsert'),
      dashboard: syncUpcomingTask(adjustTaskStats(current.dashboard, tempTask, null, 'create'), tempTask),
    }))

    try {
      const created = await api.createTask(payload)
      setCache((current) => {
        const plannerWeeks = Object.fromEntries(
          Object.entries(current.plannerWeeks).map(([weekKey, week]) => [
            weekKey,
            { ...week, items: (week.items || []).map((item) => (item._id === tempTask._id ? created : item)) },
          ]),
        )
        return {
          ...current,
          plannerWeeks,
          dashboard: syncUpcomingTask(current.dashboard, created, tempTask),
          analytics: null,
        }
      })
      return created
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const updateTask = useCallback(async (task, payload) => {
    const previous = cache
    const optimisticTask = { ...task, ...payload }

    setCache((current) => ({
      ...current,
      plannerWeeks: updateTaskInPlannerWeeks(current.plannerWeeks, optimisticTask, 'upsert'),
      dashboard: syncUpcomingTask(adjustTaskStats(current.dashboard, optimisticTask, task), optimisticTask, task),
    }))

    try {
      const updated = await api.updateTask(task._id, payload)
      setCache((current) => ({
        ...current,
        plannerWeeks: updateTaskInPlannerWeeks(current.plannerWeeks, updated, 'upsert'),
        dashboard: syncUpcomingTask(current.dashboard, updated, optimisticTask),
        analytics: null,
      }))
      return updated
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const deleteTask = useCallback(async (task) => {
    const previous = cache
    setCache((current) => ({
      ...current,
      plannerWeeks: updateTaskInPlannerWeeks(current.plannerWeeks, task, 'delete'),
      dashboard: syncUpcomingTask(adjustTaskStats(current.dashboard, null, task, 'delete'), task, task, 'delete'),
    }))

    try {
      await api.deleteTask(task._id)
      setCache((current) => ({ ...current, analytics: null }))
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [cache])

  const setCanvasDraft = useCallback((brainDumpId, nodes, edges) => {
    if (!brainDumpId) return
    setCache((current) => ({
      ...current,
      canvases: {
        ...current.canvases,
        [brainDumpId]: {
          ...(current.canvases[brainDumpId] || { brainDumpId }),
          nodes,
          edges,
          dirty: true,
        },
      },
    }))
  }, [])

  const saveCanvas = useCallback(async (brainDumpId, nodes, edges) => {
    const saved = await api.saveBrainDumpCanvas(brainDumpId, { nodes, edges })
    setCache((current) => ({
      ...current,
      canvases: {
        ...current.canvases,
        [brainDumpId]: {
          ...(current.canvases[brainDumpId] || {}),
          ...saved,
          dirty: false,
        },
      },
    }))
    return saved
  }, [])

  const createBrainDump = useCallback(async (input) => {
    const result = await api.brainDump(input)
    setCache((current) => {
      const brainDumps = [result.brainDump, ...(current.brainDumps || [])]
      const createdGoals = result.created?.goals || []
      const goals = current.goals ? [...createdGoals, ...current.goals] : current.goals
      return {
        ...current,
        brainDumps,
        goals,
        dashboard: syncGoalDashboard(current.dashboard, goals),
        canvases: {
          ...current.canvases,
          [result.brainDump._id]: result.canvas,
        },
        analytics: null,
      }
    })
    return result
  }, [])

  const renameBrainDump = useCallback(async (id, title) => {
    const updated = await api.renameBrainDump(id, title)
    setCache((current) => ({
      ...current,
      brainDumps: current.brainDumps?.map((item) => (item._id === id ? { ...item, ...updated } : item)) || current.brainDumps,
      canvases: {
        ...current.canvases,
        [id]: current.canvases[id] ? { ...current.canvases[id], brainDump: { ...(current.canvases[id].brainDump || {}), ...updated } } : current.canvases[id],
      },
    }))
    return updated
  }, [])

  const deleteBrainDump = useCallback(async (id) => {
    await api.deleteBrainDump(id)
    setCache((current) => {
      const canvases = { ...current.canvases }
      delete canvases[id]
      return {
        ...current,
        brainDumps: current.brainDumps?.filter((item) => item._id !== id) || current.brainDumps,
        canvases,
      }
    })
  }, [])

  const duplicateBrainDump = useCallback(async (id) => {
    const result = await api.duplicateBrainDump(id)
    setCache((current) => ({
      ...current,
      brainDumps: [result.brainDump, ...(current.brainDumps || [])],
      canvases: {
        ...current.canvases,
        [result.brainDump._id]: result.canvas,
      },
    }))
    return result
  }, [])

  const restoreBrainDump = useCallback(async (id) => {
    const canvas = await api.restoreBrainDump(id)
    setCache((current) => ({
      ...current,
      canvases: {
        ...current.canvases,
        [id]: { ...(current.canvases[id] || {}), ...canvas, dirty: false },
      },
    }))
    return canvas
  }, [])

  const refreshBilling = useCallback(() => ensureBilling(true), [ensureBilling])

  useEffect(() => {
    if (!user?._id) {
      setCache(emptyCache)
      inFlight.current.clear()
      return
    }

    if (cache.userId === user._id && cache.bootstrapped) return

    const days = buildPlannerDays()
    const weekKey = getPlannerWeekKey(days)
    const range = getPlannerRange(days)

    setCache({ ...emptyCache, userId: user._id })

    runOnce(`bootstrap:${user._id}`, async () => {
      const [dashboard, goalsData, plannerData, brainDumpData] = await Promise.all([
        api.dashboard(),
        api.listGoals('?limit=50'),
        api.listTasks(`?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&limit=200`),
        api.listBrainDumps(),
      ])

      const goals = goalsData.items || []
      setCache((current) => ({
        ...current,
        userId: user._id,
        dashboard: syncGoalDashboard(dashboard, goals),
        goals,
        plannerWeeks: {
          ...current.plannerWeeks,
          [weekKey]: { items: plannerData.items || [], range, loadedAt: Date.now() },
        },
        brainDumps: brainDumpData.items || [],
        bootstrapped: true,
      }))
    }).catch(() => undefined)

    import('../pages/Dashboard.jsx')
    import('../pages/Planner.jsx')
    import('../pages/Canvas.jsx')
    import('../pages/Analytics.jsx')
    import('../pages/Settings.jsx')
  }, [cache.bootstrapped, cache.userId, runOnce, user?._id])

  const value = useMemo(() => ({
    cache,
    loading,
    errors,
    ensureDashboard,
    ensureGoals,
    ensurePlannerWeek,
    ensureBrainDumps,
    ensureCanvas,
    ensureAnalytics,
    ensureBilling,
    refreshBilling,
    createGoal,
    updateGoal,
    deleteGoal,
    createTask,
    updateTask,
    deleteTask,
    setCanvasDraft,
    saveCanvas,
    createBrainDump,
    renameBrainDump,
    deleteBrainDump,
    duplicateBrainDump,
    restoreBrainDump,
  }), [
    cache,
    createBrainDump,
    createGoal,
    createTask,
    deleteBrainDump,
    deleteGoal,
    deleteTask,
    duplicateBrainDump,
    ensureAnalytics,
    ensureBilling,
    ensureBrainDumps,
    ensureCanvas,
    ensureDashboard,
    ensureGoals,
    ensurePlannerWeek,
    errors,
    loading,
    refreshBilling,
    renameBrainDump,
    restoreBrainDump,
    saveCanvas,
    setCanvasDraft,
    updateGoal,
    updateTask,
  ])

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}
