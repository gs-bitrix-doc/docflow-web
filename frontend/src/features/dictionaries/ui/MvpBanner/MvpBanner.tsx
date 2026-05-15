import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionBanner } from '@/shared/ui/ActionBanner/ActionBanner'

export function MvpBanner() {
  const { t } = useTranslation('dictionaries')

  return <ActionBanner icon={<Info size={14} />}>{t('mvp_banner')}</ActionBanner>
}
