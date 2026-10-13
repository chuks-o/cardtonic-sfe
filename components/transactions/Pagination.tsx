import { Button } from '@/components/ui'
import { cx } from '@/lib/cx'
import { pageItems } from '@/lib/transactions/pageItems'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className={styles.pagination}>
      <p className={styles.range}>
        Showing {first}–{last} of {total}
      </p>
      {totalPages > 1 && (
        <nav className={styles.nav} aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            iconLeft="chevron-left"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <span className={styles.prevLabel}>Previous</span>
            <span className={styles.prevShort}>Prev</span>
          </Button>
          <ol className={styles.pages}>
            {pageItems(page, totalPages).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <button
                    type="button"
                    className={cx(styles.page, item === page && styles.current)}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                    onClick={() => item !== page && onPageChange(item)}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li key={item} className={styles.ellipsis} aria-hidden>
                  …
                </li>
              )
            )}
          </ol>
          <p className={styles.pageOf}>
            Page {page} of {totalPages}
          </p>
          <Button
            variant="secondary"
            size="sm"
            iconRight="chevron-right"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
