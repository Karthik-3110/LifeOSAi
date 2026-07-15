export default function PageLoader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-bg-surface-hi" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-bg-surface-hi" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
        ))}
      </div>
    </div>
  )
}
