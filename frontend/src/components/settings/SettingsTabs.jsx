const tabs = ['Account', 'Appearance', 'Security', 'Brain Dump', 'Billing', 'Privacy', 'About']

export default function SettingsTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface p-2 lg:flex-col">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
            active === tab ? 'bg-gradient-to-r from-accent-signal to-accent-signal-hi text-white shadow-[0_8px_20px_rgba(236,78,32,0.18)]' : 'text-text-secondary hover:bg-accent-signal/10 hover:text-accent-signal'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
