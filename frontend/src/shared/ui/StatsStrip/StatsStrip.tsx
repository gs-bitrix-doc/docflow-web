import { cn } from '@/shared/lib/cn'
import styles from './StatsStrip.module.css'

interface StatsStripItem {
  key: string
  value: string | number
  label: string
  pulse?: boolean
  highlight?: boolean
}

interface StatsStripProps {
  items: StatsStripItem[]
}

export function StatsStrip({ items }: StatsStripProps) {
  return (
    <div className={styles.chips}>
      {items.map((item) => (
        <div key={item.key} className={styles.chip}>
          <span className={cn(styles.number, item.highlight && styles.numberBright)}>
            {item.pulse ? <span className={styles.pulse} /> : null}
            {item.value}
          </span>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
