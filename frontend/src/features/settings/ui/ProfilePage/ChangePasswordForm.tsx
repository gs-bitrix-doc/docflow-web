import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChangePasswordMutation } from '@/features/auth/api/authApi'
import { translateApiError } from '@/shared/lib/errorMessages'
import { Button } from '@/shared/ui/Button/Button'
import { Field } from '@/shared/ui/Field/Field'
import { InlineAlert } from '@/shared/ui/InlineAlert/InlineAlert'
import { Input } from '@/shared/ui/Input/Input'
import { toast } from '@/shared/ui/Toast/toast'
import styles from './ProfilePage.module.css'

export function ChangePasswordForm() {
  const { t } = useTranslation('settings')
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit =
    Boolean(currentPassword) && Boolean(newPassword) && Boolean(confirmPassword) && !mismatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(t('profile.password_mismatch'))
      return
    }
    setError(null)
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap()
      toast.success(t('profile.password_success'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(translateApiError(err))
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={styles.form}>
      <Field label={t('profile.current_password_label')} htmlFor="current-password">
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>
      <Field label={t('profile.new_password_label')} htmlFor="new-password">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>
      <Field
        label={t('profile.confirm_password_label')}
        htmlFor="confirm-password"
        error={mismatch ? t('profile.password_mismatch') : undefined}
      >
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatch}
        />
      </Field>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div className={styles.formFooter}>
        <Button type="submit" variant="primary" size="sm" loading={isLoading} disabled={!canSubmit}>
          {t('profile.save_password')}
        </Button>
      </div>
    </form>
  )
}
