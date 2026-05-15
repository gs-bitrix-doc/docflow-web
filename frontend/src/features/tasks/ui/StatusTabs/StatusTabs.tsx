import { useTranslation } from 'react-i18next'
import type { TaskStatus, TaskSummary } from '@/features/tasks/model/types'
import { CountTabs } from '@/shared/ui/CountTabs/CountTabs'

type TabKey = 'all' | 'queued' | 'running' | 'done' | 'failed' | 'conflict' | 'published'

interface TabConfig {
  key: TabKey
  status: TaskStatus | null
  labelKey: string
}

const TAB_ORDER: TabConfig[] = [
  { key: 'all', status: null, labelKey: 'tabs.all' },
  { key: 'queued', status: 'queued', labelKey: 'tabs.queued' },
  { key: 'running', status: 'running', labelKey: 'tabs.running' },
  { key: 'done', status: 'done', labelKey: 'tabs.ready_to_publish' },
  { key: 'failed', status: 'failed', labelKey: 'tabs.failed' },
  { key: 'conflict', status: 'conflict', labelKey: 'tabs.conflict' },
  { key: 'published', status: 'published', labelKey: 'tabs.published' },
]

interface StatusTabsProps {
  activeTab: TabKey
  tasks: TaskSummary[]
  counts?: Partial<Record<TaskStatus, number>> | undefined
  onTabChange: (status: TaskStatus | null) => void
}

function getCount(
  tasks: TaskSummary[],
  counts: Partial<Record<TaskStatus, number>> | undefined,
  status: TaskStatus | null,
) {
  if (counts) {
    if (status) {
      return counts[status] ?? 0
    }

    return Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0)
  }

  return status ? tasks.filter((task) => task.status === status).length : tasks.length
}

export function StatusTabs({ activeTab, tasks, counts, onTabChange }: StatusTabsProps) {
  const { t } = useTranslation('tasks')
  const items = TAB_ORDER.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey),
    meta: getCount(tasks, counts, tab.status),
  }))

  return (
    <CountTabs
      items={items}
      activeKey={activeTab}
      ariaLabel={t('title')}
      onChange={(key) => {
        const tab = TAB_ORDER.find((item) => item.key === key)
        onTabChange(tab?.status ?? null)
      }}
    />
  )
}
