import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './CountTabs.module.css'

export interface CountTabItem<TKey extends string = string> {
  key: TKey
  label: ReactNode
  meta?: ReactNode
  icon?: ReactNode
}

interface CountTabsProps<TKey extends string = string> {
  items: CountTabItem<TKey>[]
  activeKey: TKey
  onChange: (key: TKey) => void
  variant?: 'default' | 'detail'
  ariaLabel?: string | undefined
  role?: 'tablist' | 'toolbar' | undefined
}

export function CountTabs<TKey extends string = string>({
  items,
  activeKey,
  onChange,
  variant = 'default',
  ariaLabel,
  role,
}: CountTabsProps<TKey>) {
  const isTablist = role === 'tablist'

  return (
    <div
      className={cn(styles.tabs, variant === 'detail' && styles.detail)}
      role={role}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role={isTablist ? 'tab' : undefined}
          aria-selected={isTablist ? activeKey === item.key : undefined}
          className={cn(styles.tab, activeKey === item.key && styles.tabActive)}
          onClick={() => onChange(item.key)}
        >
          {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
          <span>{item.label}</span>
          {item.meta ? <span className={styles.count}>{item.meta}</span> : null}
        </button>
      ))}
    </div>
  )
}
