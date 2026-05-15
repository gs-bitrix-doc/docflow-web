import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import styles from './StickyActionBar.module.css'

interface StickyActionBarProps {
  visible: boolean
  summary: ReactNode
  actions: ReactNode
  align?: 'center' | 'end'
  separated?: boolean
  wrapSummary?: boolean
  onClose?: (() => void) | undefined
  closeLabel?: string | undefined
  className?: string | undefined
}

export function StickyActionBar({
  visible,
  summary,
  actions,
  align = 'center',
  separated = true,
  wrapSummary = true,
  onClose,
  closeLabel,
  className,
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        styles.bar,
        align === 'center' ? styles.barCentered : styles.barEnd,
        visible && styles.barVisible,
        className,
      )}
    >
      {wrapSummary ? <div className={styles.summary}>{summary}</div> : summary}
      {separated ? <span className={styles.divider} aria-hidden="true" /> : null}
      <div className={styles.actions}>{actions}</div>
      {onClose ? (
        <button
          type="button"
          className={styles.closeButton}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  )
}
