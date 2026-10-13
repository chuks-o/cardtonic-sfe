import { cx } from '@/lib/cx'
import styles from './Avatar.module.css'

export interface AvatarProps {
  src?: string | null
  /** Accessible label. Pass "" when the avatar is decorative. */
  alt: string
  /** Used for the initials fallback when there is no `src`. */
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** "Okonkwo-Adeyemi Logistics Ltd" -> "OA", "Kwame Mensah" -> "KM". */
export function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const classes = cx(styles.avatar, styles[size], className)
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary CDNs
    return <img src={src} alt={alt} className={classes} />
  }
  return (
    <span
      className={cx(classes, styles.initials)}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {name ? getInitials(name) : null}
    </span>
  )
}
