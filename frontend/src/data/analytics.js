export const weeklyProgress = [
  { week: 'W1', goals: 24, tasks: 32, focus: 18 },
  { week: 'W2', goals: 30, tasks: 40, focus: 21 },
  { week: 'W3', goals: 34, tasks: 47, focus: 24 },
  { week: 'W4', goals: 42, tasks: 55, focus: 26 },
  { week: 'W5', goals: 51, tasks: 68, focus: 28 },
  { week: 'W6', goals: 58, tasks: 75, focus: 31 },
]

export const heatmapValues = Array.from({ length: 84 }, (_, index) => {
  const wave = Math.sin(index / 5) + Math.cos(index / 9)
  const intensity = Math.max(0, Math.min(4, Math.round((wave + 2) * 1.1)))
  return { id: `cell-${index}`, intensity }
})
