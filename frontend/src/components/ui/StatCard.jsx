import Card from './Card.jsx'

export default function StatCard({ label, value, delta }) {
  return (
    <Card className="min-h-32">
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="font-mono text-3xl font-bold tracking-normal text-text-primary">{value}</p>
        <span className="rounded-full border border-node-resource/20 bg-node-resource/10 px-3 py-1 text-xs font-semibold text-node-resource">
          {delta}
        </span>
      </div>
    </Card>
  )
}
