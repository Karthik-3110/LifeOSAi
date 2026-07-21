import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('LifeOS UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <div className="flex min-h-screen items-center justify-center bg-bg-base p-6 text-text-primary"><div className="max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-6 text-center surface-shadow"><h1 className="font-display text-2xl font-semibold">Something needs a refresh</h1><p className="mt-3 text-sm text-text-secondary">Your workspace data is safe. Please refresh the page and try again.</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-accent-signal px-4 py-2 text-sm font-semibold text-bg-base">Refresh LifeOS</button></div></div>
    }
    return this.props.children
  }
}
