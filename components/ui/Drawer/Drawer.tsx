'use client'
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
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

/** Upper bound on the exit animation, in case animationend never fires (reduced motion, background tab). */
const EXIT_FALLBACK_MS = 400

const noopSubscribe = () => () => {}

/** Modal side panel; a bottom sheet under 640px. Animates in and out. */
export function Drawer({ open, title, onClose, children, footer }: DrawerProps) {
  // Portals need document, which only exists after hydration.
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  // Stay mounted after `open` turns false until the exit animation has played.
  const [isRendered, setIsRendered] = useState(open)
  if (open && !isRendered) setIsRendered(true)
  const isClosing = isRendered && !open

  // Callers usually render `{selected && …}`, which is empty once closed; keep showing the last content
  // while the panel slides out.
  const [content, setContent] = useState({ children, footer })
  if (open && (content.children !== children || content.footer !== footer)) setContent({ children, footer })

  useEffect(() => {
    if (!isClosing) return
    const timer = setTimeout(() => setIsRendered(false), EXIT_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [isClosing])

  if (!isRendered || !isClient) return null
  return createPortal(
    <DrawerPanel
      title={title}
      onClose={onClose}
      isClosing={isClosing}
      onExited={() => setIsRendered(false)}
      footer={content.footer}
    >
      {content.children}
    </DrawerPanel>,
    document.body
  )
}

interface DrawerPanelProps extends Omit<DrawerProps, 'open'> {
  isClosing: boolean
  onExited: () => void
}

function DrawerPanel({ title, onClose, isClosing, onExited, children, footer }: DrawerPanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Keep the latest onClose without re-running the effect when callers pass an inline function.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Scroll lock spans the whole time the panel is on screen, exit animation included: unlocking earlier
  // brings the page scrollbar back mid-animation and shifts the fixed panel sideways. Padding by the
  // scrollbar's width stops the page behind from jumping when the scrollbar disappears.
  useEffect(() => {
    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [])

  // Modal behaviour applies while open. It is torn down as soon as closing starts, not after the exit
  // animation, so focus returns to the trigger immediately.
  useEffect(() => {
    if (isClosing) return
    const panel = panelRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
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
      previouslyFocused?.focus()
    }
  }, [isClosing])

  const state = isClosing ? 'closed' : 'open'

  return (
    <>
      <div
        className={styles.overlay}
        data-state={state}
        onClick={isClosing ? undefined : onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={styles.panel}
        data-state={state}
        // While sliding out it is no longer a dialog: hidden from assistive tech and not interactive.
        role={isClosing ? undefined : 'dialog'}
        aria-modal={isClosing ? undefined : true}
        aria-labelledby={titleId}
        aria-hidden={isClosing || undefined}
        inert={isClosing}
        tabIndex={-1}
        onAnimationEnd={(event) => {
          // Ignore animations bubbling up from content (e.g. skeleton pulses).
          if (isClosing && event.target === event.currentTarget) onExited()
        }}
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
