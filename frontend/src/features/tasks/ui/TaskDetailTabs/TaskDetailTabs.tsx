import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TaskDetailTab } from '@/features/tasks/model/types'
import { CountTabs } from '@/shared/ui/CountTabs/CountTabs'

interface TaskDetailTabsProps {
  activeTab: TaskDetailTab
  tabs: TaskDetailTab[]
  meta?: Partial<Record<TaskDetailTab, string | null>>
  onChange: (tab: TaskDetailTab) => void
}

export function TaskDetailTabs({ activeTab, tabs, meta, onChange }: TaskDetailTabsProps) {
  const { t } = useTranslation('tasks')
  const items = tabs.map((tab) => ({
    key: tab,
    label: t(`detail_tabs.${tab}`),
    meta: meta?.[tab] ?? null,
    icon: tab === 'conflict' ? <AlertTriangle size={12} /> : null,
  }))

  return (
    <CountTabs
      items={items}
      activeKey={activeTab}
      variant="detail"
      role="tablist"
      ariaLabel="Task detail tabs"
      onChange={onChange}
    />
  )
}
