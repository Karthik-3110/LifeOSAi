const colors = {
  goal: 'border-node-goal/30 bg-node-goal/10 text-node-goal',
  task: 'border-node-task/30 bg-node-task/10 text-node-task',
  deadline: 'border-node-deadline/30 bg-node-deadline/10 text-node-deadline',
  resource: 'border-node-resource/30 bg-node-resource/10 text-node-resource',
  milestone: 'border-node-milestone/30 bg-node-milestone/10 text-node-milestone',
}

export default function Badge({ children, color = 'goal', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
