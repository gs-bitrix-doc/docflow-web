import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import styles from './ValuePair.module.css'

interface ValuePairProps {
  source: ReactNode
  target: ReactNode
  variant?: 'plain' | 'mono' | 'chip'
  className?: string | undefined
}

export function ValuePair({ source, target, variant = 'plain', className }: ValuePairProps) {
  const sourceNode =
    variant === 'chip' ? <span className={styles.chip}>{source}</span> : <span>{source}</span>
  const targetNode =
    variant === 'chip' ? <span className={styles.chip}>{target}</span> : <span>{target}</span>

  return (
    <div
      className={cn(
        styles.root,
        variant === 'mono' && styles.mono,
        variant === 'plain' && styles.plain,
        className,
      )}
    >
      {sourceNode}
      <ArrowRight className={styles.arrow} aria-hidden />
      {targetNode}
    </div>
  )
}
