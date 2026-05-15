import { Download, FilterX } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '@/features/projects/model/types'
import { Button } from '@/shared/ui/Button/Button'
import { DateRangePicker } from '@/shared/ui/DateRangePicker/DateRangePicker'
import { Select } from '@/shared/ui/Select/Select'
import { StatsStrip } from '@/shared/ui/StatsStrip/StatsStrip'
import styles from './AnalyticsToolbar.module.css'

interface AnalyticsToolbarStat {
  key: string
  value: string | number
  label: string
  pulse?: boolean
  highlight?: boolean
}

interface AnalyticsToolbarProps {
  projects: Project[]
  stats: AnalyticsToolbarStat[]
  selectedProjectId: string | null
  from: string | null
  to: string | null
  totalTasks: number
  exportDisabled: boolean
  exportLoading?: boolean
  onProjectChange: (projectId: string | null) => void
  onDateRangeChange: (value: { from: string | null; to: string | null }) => void
  onReset: () => void
  onExport: () => void
}

export function AnalyticsToolbar({
  projects,
  stats,
  selectedProjectId,
  from,
  to,
  totalTasks,
  exportDisabled,
  exportLoading = false,
  onProjectChange,
  onDateRangeChange,
  onReset,
  onExport,
}: AnalyticsToolbarProps) {
  const { t } = useTranslation('analytics')
  const hasFilters = Boolean(selectedProjectId || from || to)
  const projectOptions = useMemo(
    () => [...projects].sort((l, r) => l.name.localeCompare(r.name)),
    [projects],
  )

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{t('title')}</h1>
      </div>

      <StatsStrip items={stats} />

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select
            aria-label={t('toolbar.project')}
            value={selectedProjectId ?? ''}
            wrapperClassName={styles.selectWrap}
            onChange={(e) => onProjectChange(e.target.value || null)}
          >
            <option value="">{t('toolbar.all_projects')}</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <DateRangePicker
            from={from}
            to={to}
            labels={{
              placeholder: t('toolbar.all_dates'),
              title: t('toolbar.date_range'),
              clear: t('datepicker.clear'),
              close: t('datepicker.close'),
              hint: t('datepicker.hint'),
            }}
            onChange={onDateRangeChange}
          />

          {hasFilters && (
            <button type="button" className={styles.reset} onClick={onReset}>
              <FilterX size={13} />
              {t('toolbar.reset')}
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <span className={styles.summary}>{t('toolbar.total', { count: totalTasks })}</span>
          <Button
            size="sm"
            variant="secondary"
            loading={exportLoading}
            disabled={exportDisabled}
            iconLeft={<Download size={13} />}
            onClick={onExport}
          >
            {t('toolbar.export_excel', { defaultValue: 'Экспорт Excel' })}
          </Button>
        </div>
      </div>
    </header>
  )
}
