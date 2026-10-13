'use client'
import { useEffect, useState, type ReactNode } from 'react'
import type { Transaction } from '@/types/api'
import { Button, Icon, Money } from '@/components/ui'
import { isApiError } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { formatDateTime, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { directionOf } from '@/lib/transactions/direction'
import { useTransaction } from '@/lib/transactions/queries'
import { StatusBadge } from './StatusBadge'
import { TransactionIcon } from './TransactionIcon'
import styles from './TransactionDetails.module.css'

export interface TransactionDetailsProps {
  id: string
  onBack: () => void
}

/** Drawer body. Opened from a row the cache is already seeded, so content shows without a skeleton. */
export function TransactionDetails({ id, onBack }: TransactionDetailsProps) {
  const { data, error, isFetching, refetch } = useTransaction(id)

  // Prefer data we already have over a failed background refetch.
  if (data) return <DetailsContent transaction={data.data} />
  if (isApiError(error) && error.status === 404) {
    return (
      <Message
        icon="search"
        title="Transaction not found"
        text="It may have been removed, or the link is wrong."
      >
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to transactions
        </Button>
      </Message>
    )
  }
  if (error) {
    return (
      <Message
        icon="alert"
        tone="danger"
        role="alert"
        title="We couldn't load this transaction"
        text="Check your connection and try again."
      >
        <Button iconLeft="refresh" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 'Trying again…' : 'Try again'}
        </Button>
      </Message>
    )
  }
  return <DetailsSkeleton />
}

function DetailsContent({ transaction: tx }: { transaction: Transaction }) {
  const direction = directionOf(tx.type)
  return (
    <div className={styles.details}>
      <div className={styles.hero}>
        <TransactionIcon transaction={tx} size="lg" />
        <p className={styles.heroNarration}>{tx.narration}</p>
        <Money
          amount={tx.amount}
          currency={tx.currency}
          sign={direction}
          className={cx(styles.heroAmount, direction === 'credit' && styles.credit)}
        />
        <StatusBadge status={tx.status} />
      </div>

      <section aria-labelledby="details-heading">
        <h3 id="details-heading" className={styles.sectionTitle}>
          Details
        </h3>
        <dl className={styles.list}>
          <div className={styles.item}>
            <dt>Reference</dt>
            <dd className={styles.reference}>
              <span className={styles.mono}>{tx.reference}</span>
              <CopyButton value={tx.reference} />
            </dd>
          </div>
          <div className={styles.item}>
            <dt>Date</dt>
            <dd>{formatDateTime(tx.createdAt)}</dd>
          </div>
          <div className={styles.item}>
            <dt>Type</dt>
            <dd>{TRANSACTION_TYPE_LABELS[tx.type]}</dd>
          </div>
          {tx.counterparty && (
            <div className={styles.item}>
              <dt>Counterparty</dt>
              <dd>{tx.counterparty}</dd>
            </div>
          )}
          <div className={styles.item}>
            <dt>Narration</dt>
            <dd>{tx.narration}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="summary-heading">
        <h3 id="summary-heading" className={styles.sectionTitle}>
          Summary
        </h3>
        <dl className={styles.list}>
          <div className={styles.item}>
            <dt>Amount</dt>
            <dd>
              <Money amount={tx.amount} currency={tx.currency} />
            </dd>
          </div>
          <div className={styles.item}>
            <dt>Fee</dt>
            <dd>
              <Money amount={tx.fee} currency={tx.currency} />
            </dd>
          </div>
          <div className={cx(styles.item, styles.total)}>
            <dt>Total</dt>
            <dd>
              {/* Integer minor units, same currency: the fee is charged on top of the amount. */}
              <Money amount={tx.amount + tx.fee} currency={tx.currency} />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

type CopyState = 'idle' | 'copied' | 'failed'

function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  const copy = async () => {
    try {
      // Missing outside secure contexts and can be denied by permissions.
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <button type="button" className={styles.copy} onClick={copy} aria-label="Copy reference">
        <Icon name="copy" size={14} />
      </button>
      <span className={cx(styles.copyStatus, state === 'failed' && styles.copyFailed)} aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : ''}
      </span>
    </>
  )
}

interface MessageProps {
  icon: 'search' | 'alert'
  tone?: 'primary' | 'danger'
  title: string
  text: string
  role?: 'alert'
  children: ReactNode
}

function Message({ icon, tone = 'primary', title, text, role, children }: MessageProps) {
  return (
    <div className={styles.message}>
      <div role={role} className={styles.messageBody}>
        <span className={cx(styles.messageIcon, styles[tone])} aria-hidden>
          <Icon name={icon} size={20} />
        </span>
        <h3 className={styles.messageTitle}>{title}</h3>
        <p className={styles.messageText}>{text}</p>
      </div>
      {children}
    </div>
  )
}

function DetailsSkeleton() {
  return (
    <div aria-busy="true">
      <span className="visually-hidden">Loading transaction…</span>
      <div className={styles.skeleton} aria-hidden>
        <div className={styles.hero}>
          <span className={styles.skelCircle} />
          <span className={styles.skelBar} style={{ width: 160 }} />
          <span className={styles.skelBar} style={{ width: 200, height: 20 }} />
          <span className={styles.skelBar} style={{ width: 72 }} />
        </div>
        <div className={styles.list}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.skelBar} style={{ width: 80 }} />
              <span className={styles.skelBar} style={{ width: 120 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
