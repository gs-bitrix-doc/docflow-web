import { Square } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '@/features/projects/model/types'
import type { TaskSummary } from '@/features/tasks/model/types'
import type { HealthResponse } from '@/shared/api/healthApi'
import { cn } from '@/shared/lib/cn'
import { ProjectFilterPopover } from './ProjectFilterPopover'
import styles from './TaskListToolbar.module.css'

interface TaskListToolbarProps {
  batchMode: boolean
  health: HealthResponse | undefined
  tasks: TaskSummary[]
  projects: Project[]
  selectedProjectId: string | null
  onToggleBatchMode: () => void
  onProjectChange: (projectId: string | null) => void
}

export function TaskListToolbar({
  batchMode,
  health,
  tasks,
  projects,
  selectedProjectId,
  onToggleBatchMode,
  onProjectChange,
}: TaskListToolbarProps) {
  const { t } = useTranslation('tasks')
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const task of tasks) {
      if (task.project_id) {
        counts[task.project_id] = (counts[task.project_id] ?? 0) + 1
      }
    }
    return counts
  }, [tasks])

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={cn(styles.chip, styles.selectChip, batchMode && styles.selectChipActive)}
          onClick={onToggleBatchMode}
        >
          <Square size={12} />
          <span>{batchMode ? t('toolbar.clear_selection') : t('toolbar.select')}</span>
        </button>

        <div className={cn(styles.webhook, !health?.last_webhook_at && styles.webhookInactive)}>
          <span className={styles.webhookDot} />
          <span>
            {health?.last_webhook_at ? t('toolbar.webhook_active') : t('toolbar.webhook_waiting')}
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <ProjectFilterPopover
          projects={projects}
          selectedId={selectedProjectId}
          totalCount={tasks.length}
          projectCounts={projectCounts}
          onChange={onProjectChange}
        />
      </div>
    </div>
  )
}
