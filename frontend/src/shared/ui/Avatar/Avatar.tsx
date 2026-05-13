import type { CSSProperties } from 'react'
import { getInitials } from '@/shared/lib/getInitials'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string | null | undefined
  size?: 18 | 22 | 26
}

export function Avatar({ name, size = 26 }: AvatarProps) {
  const fontSize = size === 18 ? 9 : size === 22 ? 10 : 11

  return (
    <span
      className={styles.root}
      style={{ width: size, height: size, '--avatar-font-size': `${fontSize}px` } as CSSProperties}
      aria-label={name ?? 'User avatar'}
      title={name ?? undefined}
    >
      {getInitials(name)}
    </span>
  )
}
