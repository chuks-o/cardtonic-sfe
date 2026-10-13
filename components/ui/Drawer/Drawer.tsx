'use client'
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon'
import styles from './Drawer.module.css'

export interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const noopSubscribe = () => () => {}

/** Modal side panel; a bottom sheet under 640px. */
export function Drawer({ open, ...props }: DrawerProps) {
  // Portals need document, which only exists after hydration.
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  if (!open || !isClient) return null
  return createPortal(<DrawerPanel {...props} />, document.body)
}

function DrawerPanel({ title, onClose, children, footer }: Omit<DrawerProps, 'open'>) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Keep the latest onClose without re-running the mount effect when callers pass an inline function.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const panel = panelRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first) {
        event.preventDefault()
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span className={styles.handle} aria-hidden />
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>
  )
}
