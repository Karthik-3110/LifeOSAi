const tabs = ['Account', 'Appearance', 'Security', 'Brain Dump', 'Billing', 'Privacy', 'About']

export default function SettingsTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface p-2 lg:flex-col">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
            active === tab ? 'bg-accent-signal text-text-primary' : 'text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
