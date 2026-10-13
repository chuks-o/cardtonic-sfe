import type { ReactNode } from 'react'
import { Button, Card, Icon, type IconName } from '@/components/ui'
import { cx } from '@/lib/cx'
import styles from './TransactionListStates.module.css'

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <span className="visually-hidden">Loading transactions…</span>
      <Card padding="none" as="div" className={styles.skeleton}>
        <div className={styles.skeletonHeader} aria-hidden>
          <span className={cx(styles.bar, styles.barXs)} />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={styles.skeletonRow} aria-hidden>
            <span className={styles.circle} />
            <span className={styles.lines}>
              <span className={cx(styles.bar, styles.barSm)} />
              <span className={cx(styles.bar, styles.barMd)} />
            </span>
            <span className={cx(styles.lines, styles.end)}>
              <span className={cx(styles.bar, styles.barSm)} />
              <span className={cx(styles.bar, styles.barXs)} />
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}

interface MessageProps {
  icon: IconName
  tone?: 'primary' | 'danger'
  title: string
  description: string
  action?: ReactNode
  role?: 'alert'
}

function StateMessage({ icon, tone = 'primary', title, description, action, role }: MessageProps) {
  return (
    <Card className={styles.message}>
      <div role={role} className={styles.messageBody}>
        <span className={cx(styles.messageIcon, styles[tone])} aria-hidden>
          <Icon name={icon} size={20} />
        </span>
        <h2 className={styles.messageTitle}>{title}</h2>
        <p className={styles.messageText}>{description}</p>
      </div>
      {action}
    </Card>
  )
}

export function EmptyState() {
  return (
    <StateMessage
      icon="inbox"
      title="No transactions yet"
      description="When you add money, send a transfer or pay with your card, it will show up here."
    />
  )
}

export function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <StateMessage
      icon="search"
      title="No transactions match your filters"
      description="Try a different search term or remove some filters."
      action={
        <Button variant="secondary" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      }
    />
  )
}

export function ErrorState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <StateMessage
      icon="alert"
      tone="danger"
      role="alert"
      title="We couldn't load your transactions"
      description="Check your connection and try again."
      action={
        <Button iconLeft="refresh" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? 'Trying again…' : 'Try again'}
        </Button>
      }
    />
  )
}

/** Shown above rows that are still on screen when a later request failed. */
export function InlineError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div role="alert" className={styles.inline}>
      <Icon name="alert" size={16} />
      <span className={styles.inlineText}>Couldn&apos;t update the list. Showing earlier results.</span>
      <Button variant="ghost" size="sm" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Retrying…' : 'Try again'}
      </Button>
    </div>
  )
}
