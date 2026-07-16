export function buildPlannerDays(anchor = new Date()) {
  const today = new Date(anchor)
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

export function getPlannerRange(days) {
  const from = days[0].dateValue.toISOString()
  const to = new Date(days[6].dateValue)
  to.setHours(23, 59, 59, 999)
  return { from, to: to.toISOString() }
}

export function getPlannerWeekKey(days) {
  return `${days[0].dateValue.toISOString().slice(0, 10)}:${days[6].dateValue.toISOString().slice(0, 10)}`
}

export function toPlannerTask(task) {
  const color = task.type === 'deadline' ? 'deadline' : task.type === 'milestone' ? 'milestone' : 'task'
  return {
    id: task._id,
    _id: task._id,
    title: task.title,
    completed: task.completed,
    meta: task.time || task.category || task.tag || task.type,
    color,
    date: task.date,
    priority: task.priority || 'medium',
    category: task.category || task.tag || 'General',
    estimatedTime: task.estimatedTime ?? 45,
    recurring: task.recurring || 'none',
    progress: task.progress ?? (task.completed ? 100 : 0),
    raw: task,
  }
}

export function groupTasksByPlannerDay(tasks = [], days) {
  const grouped = Object.fromEntries(days.map((day) => [day.id, []]))

  tasks.forEach((task) => {
    const dayId = days.find((day) => day.key === new Date(task.date).toDateString())?.id
    if (dayId) grouped[dayId].push(toPlannerTask(task))
  })

  return grouped
}
