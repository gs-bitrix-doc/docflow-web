import { useTranslation } from 'react-i18next'
import { useGetAnalyticsStatsQuery } from '@/shared/api/analyticsApi'
import { StatsStrip } from '@/shared/ui/StatsStrip/StatsStrip'

export function StatChips() {
  const { t } = useTranslation('tasks')
  const { data } = useGetAnalyticsStatsQuery(undefined, { pollingInterval: 60000 })

  return (
    <StatsStrip
      items={[
        {
          key: 'running',
          value: data?.tasks_by_status?.['running'] ?? 0,
          label: t('stats.running'),
          pulse: true,
        },
        {
          key: 'done',
          value: data?.tasks_by_status?.['done'] ?? 0,
          label: t('stats.ready'),
        },
        {
          key: 'failed',
          value: data?.tasks_by_status?.['failed'] ?? 0,
          label: t('stats.failed'),
          highlight: true,
        },
        {
          key: 'published',
          value: data?.tasks_by_status?.['published'] ?? 0,
          label: t('stats.published'),
        },
      ]}
    />
  )
}
