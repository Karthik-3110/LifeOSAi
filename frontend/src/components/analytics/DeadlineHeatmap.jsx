const shades = [
  'bg-bg-elevated',
  'bg-node-resource/20',
  'bg-node-resource/35',
  'bg-accent-signal/55',
  'bg-node-deadline',
]

export default function DeadlineHeatmap({ data = [] }) {
  const heatmapValues = Array.from({ length: 84 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + index)
    const isoDate = date.toISOString().slice(0, 10)
    const match = data.find((item) => item.date === isoDate)
    const intensity = Math.max(0, Math.min(4, match?.count || 0))
    return { id: isoDate, intensity }
  })

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-2 overflow-x-auto pb-2">
        {heatmapValues.map((cell) => (
          <div
            key={cell.id}
            className={`h-4 w-4 rounded-[4px] ${shades[cell.intensity]}`}
            title={`${cell.intensity} due items`}
          />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 text-xs text-text-muted">
        Less
        {shades.map((shade) => (
          <span key={shade} className={`h-3 w-3 rounded-[3px] ${shade}`} />
        ))}
        More
      </div>
    </div>
  )
}
