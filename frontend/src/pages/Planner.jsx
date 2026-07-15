import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus, X } from 'lucide-react'
import { useAppData } from '../context/useAppData.js'
import { buildPlannerDays, getPlannerWeekKey, groupTasksByPlannerDay } from '../lib/planner.js'
import Button from '../components/ui/Button.jsx'
import DayColumn from '../components/planner/DayColumn.jsx'

function findContainerId(taskMap, itemId) {
  if (taskMap[itemId]) return itemId
  return Object.keys(taskMap).find((dayId) => taskMap[dayId].some((task) => task.id === itemId))
}

export default function Planner() {
  const { cache, loading: dataLoading, ensurePlannerWeek, createTask, updateTask, deleteTask: removeTask } = useAppData()
  const [tasksByDay, setTasksByDay] = useState({})
  const [error, setError] = useState('')
  const [taskBox, setTaskBox] = useState({ open: false, dayId: '', title: '' })
  const [savingTask, setSavingTask] = useState(false)
  const taskInputRef = useRef(null)
  const plannerDays = useMemo(() => buildPlannerDays(), [])
  const weekKey = useMemo(() => getPlannerWeekKey(plannerDays), [plannerDays])
  const week = cache.plannerWeeks[weekKey]
  const loading = !week && dataLoading[`planner:${weekKey}`]
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    ensurePlannerWeek(plannerDays).catch((currentError) => setError(currentError.message))
  }, [ensurePlannerWeek, plannerDays])

  useEffect(() => {
    if (week) {
      setTasksByDay(groupTasksByPlannerDay(week.items, plannerDays))
    }
  }, [plannerDays, week])

  useEffect(() => {
    if (taskBox.open) {
      taskInputRef.current?.focus()
    }
  }, [taskBox.open])

  const handleDragEnd = ({ active, over }) => {
    if (!over) return

    const activeContainer = findContainerId(tasksByDay, active.id)
    const overContainer = findContainerId(tasksByDay, over.id)
    if (!activeContainer || !overContainer) return

    setTasksByDay((current) => {
      const activeItems = current[activeContainer]
      const overItems = current[overContainer]
      const activeIndex = activeItems.findIndex((task) => task.id === active.id)
      const overIndex = overItems.findIndex((task) => task.id === over.id)

      if (activeContainer === overContainer) {
        const nextIndex = overIndex >= 0 ? overIndex : activeItems.length - 1
        return {
          ...current,
          [activeContainer]: arrayMove(activeItems, activeIndex, nextIndex),
        }
      }

      const movedTask = activeItems[activeIndex]
      const insertAt = overIndex >= 0 ? overIndex : overItems.length

      const nextDate = plannerDays.find((day) => day.id === overContainer).dateValue.toISOString()
      updateTask(movedTask.raw || movedTask, { date: nextDate })
        .catch((currentError) => setError(currentError.message))

      return {
        ...current,
        [activeContainer]: activeItems.filter((task) => task.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          movedTask,
          ...overItems.slice(insertAt),
        ],
      }
    })
  }

  const openTaskBox = useCallback((dayId = plannerDays[0].id) => {
    setTaskBox({ open: true, dayId, title: '' })
  }, [plannerDays])

  const closeTaskBox = useCallback(() => {
    setTaskBox({ open: false, dayId: '', title: '' })
  }, [])

  const submitTask = async (event) => {
    event.preventDefault()

    const title = taskBox.title.trim()
    if (!title) return

    try {
      setSavingTask(true)
      const dayId = taskBox.dayId || plannerDays[0].id
      const day = plannerDays.find((item) => item.id === dayId)
      await createTask({
        title,
        type: 'task',
        tag: 'Task',
        date: day.dateValue.toISOString(),
      })
      closeTaskBox()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingTask(false)
    }
  }

  const deleteTask = useCallback(async (task) => {
    try {
      await removeTask(task.raw || task)
      setTasksByDay((current) => Object.fromEntries(
        Object.entries(current).map(([dayId, tasks]) => [dayId, tasks.filter((item) => item.id !== task.id)]),
      ))
    } catch (currentError) {
      setError(currentError.message)
    }
  }, [removeTask])

  const toggleTask = useCallback(async (task) => {
    try {
      await updateTask(task.raw || task, { completed: !task.completed })
      setTasksByDay((current) => Object.fromEntries(
        Object.entries(current).map(([dayId, tasks]) => [
          dayId,
          tasks.map((item) => (item.id === task.id ? { ...item, completed: !task.completed, raw: { ...(item.raw || item), completed: !task.completed } } : item)),
        ]),
      ))
    } catch (currentError) {
      setError(currentError.message)
    }
  }, [updateTask])

  const selectedTaskDay = plannerDays.find((day) => day.id === taskBox.dayId) || plannerDays[0]

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Week of {plannerDays[0].date}</h1>
            <p className="mt-2 text-text-secondary">Drag tasks across the week. We&apos;ll re-balance the rest.</p>
          </div>
          <Button onClick={() => openTaskBox()}><Plus size={17} /> Add task</Button>
        </div>
        {taskBox.open && (
          <form
            onSubmit={submitTask}
            className="mt-6 rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-lg shadow-black/10"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="planner-task-title" className="text-sm font-semibold text-text-primary">
                    Add task for {selectedTaskDay.label}, {selectedTaskDay.date}
                  </label>
                  <button
                    type="button"
                    onClick={closeTaskBox}
                    className="rounded-full p-1 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
                    aria-label="Close task box"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  ref={taskInputRef}
                  id="planner-task-title"
                  value={taskBox.title}
                  onChange={(event) => setTaskBox((current) => ({ ...current, title: event.target.value }))}
                  className="mt-3 w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/30"
                  placeholder="Write a task..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={closeTaskBox} disabled={savingTask}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingTask || !taskBox.title.trim()}>
                  <Plus size={17} /> {savingTask ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </form>
        )}
        {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
        {loading && (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7" aria-label="Loading planner">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
            ))}
          </div>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-7">
          {plannerDays.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              tasks={tasksByDay[day.id] || []}
              onAdd={openTaskBox}
              onDelete={deleteTask}
              onToggle={toggleTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
