import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionBanner } from '@/shared/ui/ActionBanner/ActionBanner'

export function NotificationsPage() {
  const { t } = useTranslation('settings')

  return <ActionBanner icon={<Bell size={16} />}>{t('notifications.coming_soon')}</ActionBanner>
}
