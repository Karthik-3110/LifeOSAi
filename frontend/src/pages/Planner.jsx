import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus, X } from 'lucide-react'
import { api } from '../lib/api.js'
import Button from '../components/ui/Button.jsx'
import DayColumn from '../components/planner/DayColumn.jsx'

function findContainerId(taskMap, itemId) {
  if (taskMap[itemId]) return itemId
  return Object.keys(taskMap).find((dayId) => taskMap[dayId].some((task) => task.id === itemId))
}

export default function Planner() {
  const [tasksByDay, setTasksByDay] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskBox, setTaskBox] = useState({ open: false, dayId: '', title: '' })
  const [savingTask, setSavingTask] = useState(false)
  const taskInputRef = useRef(null)
  const plannerDays = useMemo(() => buildPlannerDays(), [])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const from = plannerDays[0].dateValue.toISOString()
      const to = new Date(plannerDays[6].dateValue)
      to.setHours(23, 59, 59, 999)
      const data = await api.listTasks(`?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.toISOString())}&limit=200`)
      const grouped = Object.fromEntries(plannerDays.map((day) => [day.id, []]))

      data.items.forEach((task) => {
        const dayId = plannerDays.find((day) => day.key === new Date(task.date).toDateString())?.id
        if (dayId) grouped[dayId].push(toPlannerTask(task))
      })

      setTasksByDay(grouped)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [plannerDays])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

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

      api.updateTask(movedTask._id, { date: plannerDays.find((day) => day.id === overContainer).dateValue.toISOString() })
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

  const openTaskBox = (dayId = plannerDays[0].id) => {
    setTaskBox({ open: true, dayId, title: '' })
  }

  const closeTaskBox = () => {
    setTaskBox({ open: false, dayId: '', title: '' })
  }

  const submitTask = async (event) => {
    event.preventDefault()

    const title = taskBox.title.trim()
    if (!title) return

    try {
      setSavingTask(true)
      const dayId = taskBox.dayId || plannerDays[0].id
      const day = plannerDays.find((item) => item.id === dayId)
      const task = await api.createTask({
        title,
        type: 'task',
        tag: 'Task',
        date: day.dateValue.toISOString(),
      })
      setTasksByDay((current) => ({
        ...current,
        [dayId]: [...(current[dayId] || []), toPlannerTask(task)],
      }))
      closeTaskBox()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingTask(false)
    }
  }

  const deleteTask = async (task) => {
    try {
      await api.deleteTask(task._id)
      setTasksByDay((current) => Object.fromEntries(
        Object.entries(current).map(([dayId, tasks]) => [dayId, tasks.filter((item) => item.id !== task.id)]),
      ))
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const toggleTask = async (task) => {
    try {
      const updated = await api.updateTask(task._id, { completed: !task.completed })
      setTasksByDay((current) => Object.fromEntries(
        Object.entries(current).map(([dayId, tasks]) => [
          dayId,
          tasks.map((item) => (item.id === task.id ? toPlannerTask(updated) : item)),
        ]),
      ))
    } catch (currentError) {
      setError(currentError.message)
    }
  }

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
        {loading && <p className="mt-6 text-text-secondary">Loading planner...</p>}
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

function buildPlannerDays() {
  const today = new Date()
  const monday = new Date(today)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const dateValue = new Date(monday)
    dateValue.setDate(monday.getDate() + index)
    return {
      id: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][index],
      label: dateValue.toLocaleDateString(undefined, { weekday: 'short' }),
      date: dateValue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dateValue,
      key: dateValue.toDateString(),
    }
  })
}

function toPlannerTask(task) {
  const color = task.type === 'deadline' ? 'deadline' : task.type === 'milestone' ? 'milestone' : 'task'
  return {
    id: task._id,
    _id: task._id,
    title: task.title,
    completed: task.completed,
    meta: task.time || task.tag || task.type,
    color,
  }
}
