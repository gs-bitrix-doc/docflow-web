import { useTranslation } from 'react-i18next'
import { getPlural } from '@/shared/lib/plural'
import { Button } from '@/shared/ui/Button/Button'
import { StickyActionBar } from '@/shared/ui/StickyActionBar/StickyActionBar'
import styles from './DiffSaveBar.module.css'

interface DiffSaveBarProps {
  visible: boolean
  loading?: boolean
  count?: number
  onSave: () => void
  onDiscard: () => void
}

export function DiffSaveBar({
  visible,
  loading = false,
  count = 1,
  onSave,
  onDiscard,
}: DiffSaveBarProps) {
  const { t } = useTranslation('tasks')

  if (!visible) {
    return null
  }

  return (
    <StickyActionBar
      visible={visible}
      align="end"
      separated={false}
      summary={
        <div className={styles.saveMeta}>
          <strong>{count}</strong>{' '}
          {getPlural(
            count,
            'несохранённое изменение',
            'несохранённых изменения',
            'несохранённых изменений',
          )}
        </div>
      }
      actions={
        <div className={styles.saveActions}>
          <Button size="sm" variant="secondary" onClick={onDiscard}>
            {t('diff.discard')}
          </Button>
          <Button size="sm" loading={loading} onClick={onSave}>
            {t('diff.save')}
          </Button>
        </div>
      }
    />
  )
}
