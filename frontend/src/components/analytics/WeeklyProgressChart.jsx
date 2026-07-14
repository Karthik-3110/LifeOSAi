import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function WeeklyProgressChart({ data = [] }) {
  const chartData = data.map((item) => ({
    week: `W${item.week}`,
    tasks: item.completed,
    goals: item.completionRate,
    focus: item.total,
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="goalGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-signal)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--accent-signal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="week" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Area type="monotone" dataKey="tasks" stroke="var(--accent-signal)" fill="url(#goalGradient)" strokeWidth={3} />
          <Area type="monotone" dataKey="goals" stroke="var(--node-resource)" fill="transparent" strokeWidth={2} />
          <Area type="monotone" dataKey="focus" stroke="var(--node-goal)" fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
