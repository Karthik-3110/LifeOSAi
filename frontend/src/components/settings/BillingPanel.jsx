import { useCallback, useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/useAuth.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingPanel({ bare = false, compact = false, onPurchased }) {
  const { setUser, user } = useAuth()
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState('')
  const [error, setError] = useState('')

  const loadBilling = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setBilling(await api.billing())
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBilling()
  }, [loadBilling])

  const buyPlan = async (planId) => {
    setBuying(planId)
    setError('')
    try {
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Unable to load Razorpay Checkout.')

      const { order, plan, razorpayKeyId } = await api.createBillingOrder(planId)

      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: 'LifeOS AI',
          description: plan.label,
          order_id: order.id,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phoneNumber || '',
          },
          handler: async (response) => {
            try {
              const verified = await api.verifyBillingPayment({ planId, ...response })
              setUser(verified.user)
              await loadBilling()
              onPurchased?.(verified.user)
              resolve()
            } catch (verifyError) {
              reject(verifyError)
            }
          },
          modal: {
            ondismiss: () => resolve(),
          },
        })
        checkout.open()
      })
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setBuying('')
    }
  }

  const plans = billing?.plans || []
  const unlimitedUntil = billing?.unlimitedBrainDumpsUntil || user?.unlimitedBrainDumpsUntil

  const content = (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-primary">Billing</h2>
          <p className="mt-2 text-text-secondary">
            Brain Dump credits: <span className="font-semibold text-text-primary">{billing?.credits ?? user?.brainDumpCredits ?? 0}</span>
          </p>
          {unlimitedUntil && <p className="mt-1 text-sm text-text-muted">Unlimited until {new Date(unlimitedUntil).toLocaleDateString()}</p>}
        </div>
        <div className="rounded-full border border-border-subtle bg-bg-base p-3 text-accent-signal">
          <CreditCard size={22} />
        </div>
      </div>

      {loading && <p className="mt-6 text-text-secondary">Loading plans...</p>}
      {error && <div className="mt-5 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border-subtle bg-bg-base p-4">
            <p className="font-semibold text-text-primary">{plan.label}</p>
            <p className="mt-1 font-mono text-sm text-text-secondary">₹{plan.displayAmount}</p>
            <Button className="mt-4 w-full" size="sm" onClick={() => buyPlan(plan.id)} disabled={Boolean(buying)}>
              {buying === plan.id ? 'Opening...' : 'Buy'}
            </Button>
          </div>
        ))}
      </div>
    </>
  )

  if (bare) return content

  return <Card className={compact ? 'p-5' : ''}>{content}</Card>
}
