import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionBanner } from '@/shared/ui/ActionBanner/ActionBanner'
import styles from './NewTasksBanner.module.css'

interface NewTasksBannerProps {
  count: number
  onRefresh: () => void
}

export function NewTasksBanner({ count, onRefresh }: NewTasksBannerProps) {
  const { t } = useTranslation('tasks')

  if (count === 0) return null

  return (
    <ActionBanner
      icon={<Bell size={16} />}
      action={
        <button type="button" className={styles.button} onClick={onRefresh}>
          {t('banner.refresh')}
        </button>
      }
    >
      {t('banner.new_tasks', { count })}
    </ActionBanner>
  )
}
