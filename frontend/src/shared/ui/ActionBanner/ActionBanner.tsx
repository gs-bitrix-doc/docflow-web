import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './ActionBanner.module.css'

interface ActionBannerProps {
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
  className?: string | undefined
}

export function ActionBanner({ icon, children, action, className }: ActionBannerProps) {
  return (
    <div className={cn(styles.banner, className)}>
      <div className={styles.content}>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
        <span>{children}</span>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
