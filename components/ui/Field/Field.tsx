import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Field.module.css'

export interface FieldProps {
  /** id of the control the label points at. */
  htmlFor: string
  label: string
  hint?: ReactNode
  error?: string
  /** Visually hide the label (it is still rendered). */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

/** id of the hint/error text for a control, for aria-describedby. */
export const fieldMessageId = (htmlFor: string) => `${htmlFor}-message`

/** Label + control + hint/error. Used by Input and Select. */
export function Field({ htmlFor, label, hint, error, hideLabel, className, children }: FieldProps) {
  const messageId = fieldMessageId(htmlFor)
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={htmlFor} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={messageId} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
