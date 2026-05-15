import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './SectionCard.module.css'

interface SectionCardProps {
  label: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string | undefined
  contentClassName?: string | undefined
  footerClassName?: string | undefined
}

export function SectionCard({
  label,
  description,
  footer,
  children,
  className,
  contentClassName,
  footerClassName,
}: SectionCardProps) {
  return (
    <section className={cn(styles.section, className)}>
      <div className={styles.sectionLabel}>{label}</div>
      {description ? <div className={styles.sectionDescription}>{description}</div> : null}
      <div className={cn(styles.content, contentClassName)}>{children}</div>
      {footer ? <div className={cn(styles.footer, footerClassName)}>{footer}</div> : null}
    </section>
  )
}
