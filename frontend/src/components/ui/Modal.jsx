import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

let openModalCount = 0
let previousBodyOverflow = ''
let previousHtmlOverflow = ''

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  children,
  title,
  onClose,
  initialFocusRef,
  className = '',
  closeOnOverlay = true,
  role = 'dialog',
}) {
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    openModalCount += 1
    if (openModalCount === 1) {
      previousBodyOverflow = document.body.style.overflow
      previousHtmlOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    const focusInitialElement = () => {
      const target = initialFocusRef?.current || panelRef.current?.querySelector('[data-autofocus]') || panelRef.current?.querySelector(focusableSelector) || panelRef.current
      target?.focus()
    }
    const frame = window.requestAnimationFrame(focusInitialElement)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll(focusableSelector)].filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow
        document.documentElement.style.overflow = previousHtmlOverflow
      }
      restoreFocusRef.current?.focus?.()
    }
  }, [initialFocusRef])

  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: .2, ease: 'easeOut' }}
      onMouseDown={(event) => { if (closeOnOverlay && event.target === event.currentTarget) onClose() }}
    >
      <motion.div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        initial={{ opacity: 0, scale: .95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: .23, ease: [0.16, 1, 0.3, 1] }}
        className={`max-h-[calc(100dvh-1.5rem)] w-[95vw] max-w-[680px] overflow-y-auto rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[90vw] sm:p-6 ${className}`}
      >
        {title && <div className="flex items-start justify-between gap-4"><h2 id={titleId} className="font-display text-xl font-semibold text-text-primary sm:text-2xl">{title}</h2><button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted transition hover:bg-bg-surface-hi hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-node-task" aria-label={`Close ${title}`}><X size={17} /></button></div>}
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  )
}
