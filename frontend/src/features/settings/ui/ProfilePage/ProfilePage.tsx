import { useTranslation } from 'react-i18next'
import { selectUser } from '@/features/auth/model/authSlice'
import { useGetHealthQuery } from '@/shared/api/healthApi'
import { useAppSelector } from '@/shared/store/hooks'
import { SectionCard } from '@/shared/ui/SectionCard/SectionCard'
import { ChangePasswordForm } from './ChangePasswordForm'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { t } = useTranslation('settings')
  const user = useAppSelector(selectUser)
  const { data: health } = useGetHealthQuery()

  return (
    <>
      <SectionCard label={t('profile.account_section')}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('profile.email_label')}</span>
          <span className={styles.fieldValue}>{user?.email}</span>
        </div>
        {user?.display_name ? (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t('profile.display_name_label')}</span>
            <span className={styles.fieldValue}>{user.display_name}</span>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard label={t('profile.password_section')}>
        <ChangePasswordForm />
      </SectionCard>

      <SectionCard label={t('profile.pipeline_section')}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('profile.pipeline_version_label')}</span>
          <span className={styles.fieldValue}>{health?.pipeline_version ?? '—'}</span>
        </div>
      </SectionCard>
    </>
  )
}
